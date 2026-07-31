"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT } from "@/lib/constants";
import { manualCheckinSchema, qrCheckinSchema, searchReservationSchema } from "@/lib/validations/reservation";
import { sanitizeSearchTerm } from "@/lib/search";
import type { ReservationRow, CheckinMethod } from "@/lib/types/database";

export interface CheckinResult {
  success: boolean;
  error?: string;
  reservation?: ReservationRow;
}

/**
 * 予約に対して入館登録を行う共通処理。
 * QR読み取り経由・手動入館経由の両方からこの関数を通す。
 */
async function performCheckin(
  reservationId: string,
  method: CheckinMethod,
  note: string | undefined,
): Promise<CheckinResult> {
  const admin = await requireAdmin();
  const ip = await getClientIp();

  const limited = rateLimit(`checkin:${ip}`, RATE_LIMIT.CHECKIN);
  if (!limited.success) {
    return { success: false, error: "処理回数が多すぎます。しばらく時間をおいて再度お試しください。" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .maybeSingle();

  if (fetchError || !reservation) {
    return { success: false, error: "予約が見つかりませんでした。削除済みの可能性があります。" };
  }

  if (reservation.status === "checked_in") {
    return { success: false, error: "この予約は既に入館済みです。", reservation };
  }

  const checkedInAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update({
      status: "checked_in",
      checked_in_at: checkedInAt,
      checked_in_method: method,
      checked_in_by: admin.id,
    })
    .eq("id", reservationId)
    .eq("status", "not_checked_in") // 二重入館防止のための楽観ロック
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    return { success: false, error: "入館登録に失敗しました。すでに処理済みの可能性があります。" };
  }

  await supabase.from("checkin_logs").insert({
    reservation_id: reservationId,
    checked_in_at: checkedInAt,
    method,
    performed_by: admin.id,
    note: note ?? null,
  });

  await writeAuditLog({
    actorAdminId: admin.id,
    actorEmail: admin.email,
    action: method === "qr" ? "reservation.checkin_qr" : "reservation.checkin_manual",
    targetTable: "reservations",
    targetId: reservationId,
    detail: { name: updated.name, teamName: updated.team_name, note },
    ipAddress: ip === "unknown" ? undefined : ip,
  });

  return { success: true, reservation: updated };
}

/** QRコードのトークンから予約を取得する（受付表示画面用） */
export async function getReservationByToken(tokenInput: unknown): Promise<
  { success: true; reservation: ReservationRow } | { success: false; error: string }
> {
  await requireAdmin();

  const parsed = qrCheckinSchema.safeParse({ token: tokenInput });
  if (!parsed.success) {
    return { success: false, error: "QRコードの形式が正しくありません。" };
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("qr_token", parsed.data.token)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "存在しないQRコードです。予約情報が見つかりませんでした。" };
  }

  return { success: true, reservation: data };
}

/** QRコード読み取りによる入館登録 */
export async function checkInByToken(token: string): Promise<CheckinResult> {
  // DBアクセスの前に必ず権限チェックを行う（多層防御）
  await requireAdmin();

  const parsed = qrCheckinSchema.safeParse({ token });
  if (!parsed.success) {
    return { success: false, error: "QRコードの形式が正しくありません。" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, status")
    .eq("qr_token", parsed.data.token)
    .maybeSingle();

  if (error || !reservation) {
    return { success: false, error: "存在しないQRコードです。予約情報が見つかりませんでした。" };
  }

  return performCheckin(reservation.id, "qr", undefined);
}

/** 検索結果からの手動入館 */
export async function manualCheckIn(input: unknown): Promise<CheckinResult> {
  const parsed = manualCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "入力内容が正しくありません。" };
  }
  return performCheckin(parsed.data.reservationId, "manual", parsed.data.note);
}

export type SearchResultItem = ReservationRow;

/** 氏名・チーム名・メール・電話番号での検索（受付担当がQRを忘れた来場者を探す） */
export async function searchReservations(input: unknown): Promise<
  { success: true; results: SearchResultItem[] } | { success: false; error: string }
> {
  await requireAdmin();
  const ip = await getClientIp();
  const limited = rateLimit(`search:${ip}`, RATE_LIMIT.SEARCH);
  if (!limited.success) {
    return { success: false, error: "検索回数が多すぎます。しばらく時間をおいて再度お試しください。" };
  }

  const parsed = searchReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "検索条件が正しくありません。" };
  }

  const query = parsed.data.query.trim();
  if (query.length === 0) {
    return { success: true, results: [] };
  }

  const supabase = createAdminSupabaseClient();
  // 本日を含む直近の予約を優先して表示（該当日を絞らず全期間から検索）
  const escaped = sanitizeSearchTerm(query);
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .or(
      `name.ilike.%${escaped}%,team_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    )
    .order("visit_date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[searchReservations]", error);
    return { success: false, error: "検索中にエラーが発生しました。" };
  }

  return { success: true, results: data ?? [] };
}
