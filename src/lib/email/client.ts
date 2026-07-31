import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

/** Resendクライアントを取得する（APIキー未設定時はnullを返し、呼び出し側でハンドリングする） */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = new Resend(apiKey);
  return cached;
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "i-GIP 入館管理 <no-reply@example.jp>";
}
