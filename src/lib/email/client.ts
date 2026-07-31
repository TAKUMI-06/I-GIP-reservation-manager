import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

/**
 * Gmail SMTP経由のメール送信クライアントを取得する。
 * GMAIL_USER / GMAIL_APP_PASSWORD 未設定時はnullを返し、呼び出し側でハンドリングする。
 * GMAIL_APP_PASSWORD は Google アカウントの「アプリ パスワード」（2段階認証必須）。
 */
export function getMailTransport(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!cached) {
    cached = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return cached;
}

export function getFromAddress(): string {
  const user = process.env.GMAIL_USER ?? "no-reply@example.com";
  return process.env.MAIL_FROM_NAME
    ? `${process.env.MAIL_FROM_NAME} <${user}>`
    : `i-GIP 入館管理 <${user}>`;
}
