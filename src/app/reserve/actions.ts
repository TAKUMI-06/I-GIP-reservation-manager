"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { reservationFormSchema } from "@/lib/validations/reservation";
import { generateQrToken } from "@/lib/qr";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT } from "@/lib/constants";
import { writeAuditLog } from "@/lib/audit";
import { sendReservationConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email/send";

export interface CreateReservationState {
  success: boolean;
  error?: string;
  /** 作成された予約ID（1件でも複数日程選択でも常に配列で返す） */
  reservationIds?: string[];
}

/**
 * 予約作成 Server Action。
 * 未ログインの利用者から呼ばれるため、入力値はサーバー側で必ず再検証する（クライアント側のZod検証を信用しない）。
 *
 * 複数日程が選択された場合は、日程ごとに個別の予約レコード（＝個別のQRコード）を作成する。
 * 1予約＝1人×1日 という設計を維持することで、入館ログや「誰がいつ来場したか」の追跡を一意に保つ。
 */
export async function createReservation(
  input: unknown,
): Promise<CreateReservationState> {
  const ip = await getClientIp();

  // レート制限: 同一IPからの連続送信を抑止
  const limited = rateLimit(`reserve:${ip}`, RATE_LIMIT.RESERVE);
  if (!limited.success) {
    return { success: false, error: "送信回数が多すぎます。しばらく時間をおいて再度お試しください。" };
  }

  const parsed = reservationFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "入力内容を確認してください。";
    return { success: false, error: firstError };
  }
  const values = parsed.data;

  const admin = createAdminSupabaseClient();

  // 選択された日程が全て「有効な予約可能日」であることをサーバー側で確認する（自由入力対策）
  const uniqueDateIds = Array.from(new Set(values.availableDateIds));
  const { data: availableDates, error: dateError } = await admin
    .from("available_dates")
    .select("id, date, is_active")
    .in("id", uniqueDateIds);

  const validDates = (availableDates ?? []).filter((d) => d.is_active);
  if (dateError || validDates.length !== uniqueDateIds.length) {
    return { success: false, error: "選択された利用可能日の一部が無効です。ページを再読み込みして選び直してください。" };
  }

  const createdReservations: { id: string; visitDate: string }[] = [];

  for (const availableDate of validDates) {
    const qrToken = generateQrToken();

    const { data: reservation, error: insertError } = await admin
      .from("reservations")
      .insert({
        qr_token: qrToken,
        available_date_id: availableDate.id,
        visit_date: availableDate.date,
        name: values.name,
        team_name: values.teamName,
        email: values.email,
        phone: values.phone,
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString(),
        created_ip: ip === "unknown" ? null : ip,
      })
      .select("*")
      .single();

    if (insertError || !reservation) {
      console.error("[createReservation] insert failed:", insertError);
      // 一部の日程が既に作成済みの場合でも、エラーを返して利用者に再試行を促す
      // （作成済み分は予約として残るが、確認メールで案内される）
      return {
        success: false,
        error:
          createdReservations.length > 0
            ? "一部の日程の登録に失敗しました。お手数ですが、管理者へお問い合わせください。"
            : "予約の登録に失敗しました。時間をおいて再度お試しください。",
      };
    }

    createdReservations.push({ id: reservation.id, visitDate: availableDate.date });

    await writeAuditLog({
      actorAdminId: null,
      actorEmail: null,
      action: "reservation.create",
      targetTable: "reservations",
      targetId: reservation.id,
      detail: { name: values.name, teamName: values.teamName, visitDate: availableDate.date },
      ipAddress: ip === "unknown" ? undefined : ip,
    });

    // 予約確認メール（ベストエフォート。失敗しても予約自体は成立させる）
    const confirmationResult = await sendReservationConfirmationEmail({
      to: values.email,
      reservationId: reservation.id,
      name: values.name,
      teamName: values.teamName,
      visitDate: availableDate.date,
      qrToken,
    });

    await admin
      .from("reservations")
      .update({
        confirmation_email_sent_at: confirmationResult.success ? new Date().toISOString() : null,
        confirmation_email_error: confirmationResult.success ? null : confirmationResult.error ?? "unknown error",
      })
      .eq("id", reservation.id);
  }

  // 管理者への新規予約通知（ベストエフォート、まとめて1通）
  const { data: settings } = await admin
    .from("notification_settings")
    .select("admin_notification_emails")
    .limit(1)
    .maybeSingle();

  const adminEmails = settings?.admin_notification_emails ?? [];
  if (adminEmails.length > 0) {
    for (const created of createdReservations) {
      await sendAdminNotificationEmail({
        to: adminEmails,
        name: values.name,
        teamName: values.teamName,
        visitDate: created.visitDate,
        email: values.email,
        phone: values.phone,
        reservedAt: new Date().toISOString(),
      });
    }
  }

  return { success: true, reservationIds: createdReservations.map((r) => r.id) };
}
