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
  reservationId?: string;
}

/**
 * 予約作成 Server Action。
 * 未ログインの利用者から呼ばれるため、入力値はサーバー側で必ず再検証する（クライアント側のZod検証を信用しない）。
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

  // 選択された日程が「有効な予約可能日」であることをサーバー側で確認する（自由入力対策）
  const { data: availableDate, error: dateError } = await admin
    .from("available_dates")
    .select("id, date, is_active")
    .eq("id", values.availableDateId)
    .maybeSingle();

  if (dateError || !availableDate || !availableDate.is_active) {
    return { success: false, error: "選択された利用可能日は無効です。ページを再読み込みして選び直してください。" };
  }

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
    return { success: false, error: "予約の登録に失敗しました。時間をおいて再度お試しください。" };
  }

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

  // 管理者への新規予約通知（ベストエフォート）
  const { data: settings } = await admin
    .from("notification_settings")
    .select("admin_notification_emails")
    .limit(1)
    .maybeSingle();

  const adminEmails = settings?.admin_notification_emails ?? [];
  if (adminEmails.length > 0) {
    await sendAdminNotificationEmail({
      to: adminEmails,
      name: values.name,
      teamName: values.teamName,
      visitDate: availableDate.date,
      email: values.email,
      phone: values.phone,
      reservedAt: reservation.created_at,
    });
  }

  return { success: true, reservationId: reservation.id };
}
