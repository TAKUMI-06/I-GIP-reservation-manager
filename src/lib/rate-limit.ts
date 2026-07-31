import "server-only";
import { headers } from "next/headers";

/**
 * 簡易レート制限（インメモリ・単一サーバーレスインスタンス内で有効）。
 *
 * 【本番運用上の注意】
 * Vercelのサーバーレス関数はインスタンスが複数起動されるため、本実装は
 * 「同一インスタンス内での連打防止」という補助的な役割に留まる。
 * 本格的なレート制限を行う場合は Upstash Redis + @upstash/ratelimit 等、
 * 永続ストアを使った実装に置き換えることを強く推奨する（README参照）。
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  opts: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: opts.max - 1, resetAt };
  }

  if (bucket.count >= opts.max) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: opts.max - bucket.count, resetAt: bucket.resetAt };
}

// 古いバケットの定期掃除（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();

/** Server Action / Route Handler から呼び出し元IPを取得する */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return h.get("x-real-ip") ?? "unknown";
}
