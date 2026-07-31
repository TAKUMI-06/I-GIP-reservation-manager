import { formatJst } from "@/lib/date";
import { APP_NAME, getAppUrl } from "@/lib/constants";
import { buildCheckinUrl } from "@/lib/qr";

interface ReservationEmailData {
  reservationId: string;
  name: string;
  teamName: string;
  visitDate: string; // YYYY-MM-DD
  qrToken: string;
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#0f7ae5;padding:20px 24px;color:#ffffff;font-size:16px;font-weight:700;">
                ${APP_NAME}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;color:#0f172a;font-size:14px;line-height:1.8;">
                <h1 style="font-size:18px;margin:0 0 16px;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background-color:#f1f5f9;color:#64748b;font-size:11px;">
                本メールは ${APP_NAME} から自動送信されています。心当たりのない場合は破棄してください。
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** 予約直後に利用者へ送る「予約完了」メール */
export function buildReservationConfirmationEmail(data: ReservationEmailData): {
  subject: string;
  html: string;
} {
  const confirmUrl = `${getAppUrl()}/reservation/${data.reservationId}`;
  const checkinUrl = buildCheckinUrl(data.qrToken);

  const body = `
    <p>${escapeHtml(data.name)} 様</p>
    <p>ご予約ありがとうございます。以下の内容で予約が確定しました。</p>
    <table role="presentation" width="100%" cellpadding="8" style="background:#f8fafc;border-radius:8px;margin:16px 0;">
      <tr><td style="color:#64748b;width:100px;">予約ID</td><td style="font-weight:600;">${escapeHtml(data.reservationId)}</td></tr>
      <tr><td style="color:#64748b;">利用日</td><td style="font-weight:600;">${escapeHtml(formatJst(data.visitDate, "yyyy年M月d日(E)"))}</td></tr>
      <tr><td style="color:#64748b;">氏名</td><td>${escapeHtml(data.name)}</td></tr>
      <tr><td style="color:#64748b;">チーム名</td><td>${escapeHtml(data.teamName)}</td></tr>
    </table>
    <p>当日は下記URLからQRコードを表示し、受付でご提示ください。</p>
    <p style="margin:20px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#0f7ae5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">予約内容・QRコードを確認する</a>
    </p>
    <p style="font-size:12px;color:#94a3b8;word-break:break-all;">QRコードURL: ${checkinUrl}</p>
    <p style="font-size:12px;color:#94a3b8;">※ QRコードは第三者と共有しないようお願いします。</p>
  `;

  return { subject: "【i-GIP 入館管理】予約完了", html: wrapHtml("予約完了のお知らせ", body) };
}

/** 前日リマインドメール */
export function buildReminderEmail(data: ReservationEmailData): { subject: string; html: string } {
  const checkinUrl = buildCheckinUrl(data.qrToken);
  const confirmUrl = `${getAppUrl()}/reservation/${data.reservationId}`;

  const body = `
    <p>${escapeHtml(data.name)} 様</p>
    <p>明日は下記日程でのご来場予定です。準備をお願いいたします。</p>
    <table role="presentation" width="100%" cellpadding="8" style="background:#f8fafc;border-radius:8px;margin:16px 0;">
      <tr><td style="color:#64748b;width:100px;">利用日</td><td style="font-weight:600;">${escapeHtml(formatJst(data.visitDate, "yyyy年M月d日(E)"))}</td></tr>
      <tr><td style="color:#64748b;">チーム名</td><td>${escapeHtml(data.teamName)}</td></tr>
    </table>
    <p>当日は受付でQRコードをご提示ください。</p>
    <p style="margin:20px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#0f7ae5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">QRコードを表示する</a>
    </p>
    <p style="font-size:12px;color:#94a3b8;word-break:break-all;">QRコードURL: ${checkinUrl}</p>
  `;

  return { subject: "【i-GIP 入館管理】明日の利用について", html: wrapHtml("明日のご利用について", body) };
}

/** 管理者への新規予約通知メール */
export function buildAdminNotificationEmail(data: {
  name: string;
  teamName: string;
  visitDate: string;
  email: string;
  phone: string;
  reservedAt: string;
}): { subject: string; html: string } {
  const body = `
    <p>新しい予約が登録されました。</p>
    <table role="presentation" width="100%" cellpadding="8" style="background:#f8fafc;border-radius:8px;margin:16px 0;">
      <tr><td style="color:#64748b;width:110px;">氏名</td><td>${escapeHtml(data.name)}</td></tr>
      <tr><td style="color:#64748b;">チーム名</td><td>${escapeHtml(data.teamName)}</td></tr>
      <tr><td style="color:#64748b;">利用日</td><td>${escapeHtml(formatJst(data.visitDate, "yyyy年M月d日(E)"))}</td></tr>
      <tr><td style="color:#64748b;">メール</td><td>${escapeHtml(data.email)}</td></tr>
      <tr><td style="color:#64748b;">電話番号</td><td>${escapeHtml(data.phone)}</td></tr>
      <tr><td style="color:#64748b;">予約時刻</td><td>${escapeHtml(formatJst(data.reservedAt, "yyyy年M月d日 HH:mm"))}</td></tr>
    </table>
  `;
  return { subject: "新しい予約が登録されました", html: wrapHtml("新規予約のお知らせ", body) };
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
