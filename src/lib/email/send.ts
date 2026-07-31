import "server-only";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import {
  buildReservationConfirmationEmail,
  buildReminderEmail,
  buildAdminNotificationEmail,
} from "@/lib/email/templates";

export interface EmailSendResult {
  success: boolean;
  error?: string;
}

async function send(to: string | string[], subject: string, html: string): Promise<EmailSendResult> {
  const resend = getResendClient();
  if (!resend) {
    const message = "RESEND_API_KEY が設定されていないため、メール送信をスキップしました。";
    console.warn(`[email] ${message}`, { to, subject });
    return { success: false, error: message };
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend送信エラー:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    console.error("[email] メール送信中に例外が発生しました:", err);
    return { success: false, error: message };
  }
}

export async function sendReservationConfirmationEmail(params: {
  to: string;
  reservationId: string;
  name: string;
  teamName: string;
  visitDate: string;
  qrToken: string;
}): Promise<EmailSendResult> {
  const { subject, html } = buildReservationConfirmationEmail(params);
  return send(params.to, subject, html);
}

export async function sendReminderEmail(params: {
  to: string;
  reservationId: string;
  name: string;
  teamName: string;
  visitDate: string;
  qrToken: string;
}): Promise<EmailSendResult> {
  const { subject, html } = buildReminderEmail(params);
  return send(params.to, subject, html);
}

export async function sendAdminNotificationEmail(params: {
  to: string[];
  name: string;
  teamName: string;
  visitDate: string;
  email: string;
  phone: string;
  reservedAt: string;
}): Promise<EmailSendResult> {
  if (params.to.length === 0) {
    return { success: false, error: "通知先メールアドレスが設定されていません。" };
  }
  const { subject, html } = buildAdminNotificationEmail(params);
  return send(params.to, subject, html);
}
