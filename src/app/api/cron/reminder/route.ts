import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email/send";
import { writeAuditLog } from "@/lib/audit";
import { toZonedTime } from "date-fns-tz";
import { addDays, format } from "date-fns";
import { JST_TIMEZONE } from "@/lib/date";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 前日リマインドメール送信バッチ。
 * Vercel Cron (vercel.json) から毎日 21:00 UTC (=翌6:00 JST) 前後に呼び出す想定。
 * 「明日」が利用日の予約のうち、まだリマインドを送っていないものに送信する。
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("reminder_enabled")
    .limit(1)
    .maybeSingle();

  if (settings && settings.reminder_enabled === false) {
    return NextResponse.json({ skipped: true, reason: "reminder_disabled" });
  }

  const tomorrowJst = format(addDays(toZonedTime(new Date(), JST_TIMEZONE), 1), "yyyy-MM-dd");

  const { data: targets, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("visit_date", tomorrowJst)
    .is("reminder_sent_at", null);

  if (error) {
    console.error("[cron/reminder] 対象予約の取得に失敗しました:", error);
    return NextResponse.json({ error: "failed to fetch targets" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const reservation of targets ?? []) {
    const result = await sendReminderEmail({
      to: reservation.email,
      reservationId: reservation.id,
      name: reservation.name,
      teamName: reservation.team_name,
      visitDate: reservation.visit_date,
      qrToken: reservation.qr_token,
    });

    await supabase
      .from("reservations")
      .update({
        reminder_sent_at: result.success ? new Date().toISOString() : null,
        reminder_email_error: result.success ? null : result.error ?? "unknown error",
      })
      .eq("id", reservation.id);

    if (result.success) sent += 1;
    else failed += 1;
  }

  await writeAuditLog({
    actorAdminId: null,
    actorEmail: "system:cron",
    action: "reminder.batch_send",
    detail: { targetDate: tomorrowJst, sent, failed, total: targets?.length ?? 0 },
  });

  return NextResponse.json({ targetDate: tomorrowJst, sent, failed, total: targets?.length ?? 0 });
}
