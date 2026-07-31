import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Vercel Cron からのリクエストであることを検証する。
 * Authorization: Bearer <CRON_SECRET> ヘッダーを要求する。
 * タイミング攻撃対策として crypto.timingSafeEqual で比較する。
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET が設定されていません。");
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
