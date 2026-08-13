/**
 * アプリ全体で利用する定数。
 */

// 予約データ・入館ログの保持期間（日数）＝ 3か月
export const DATA_RETENTION_DAYS = 92;

// QRトークンのバイト長（crypto.randomBytesの引数）。十分な長さで推測を防止する。
export const QR_TOKEN_BYTES = 32;

// 管理者ロール
export const ADMIN_ROLES = ["super_admin", "staff", "sub_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// 予約ステータス
export const RESERVATION_STATUS = ["not_checked_in", "checked_in"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUS)[number];

// 入館方法
export const CHECKIN_METHODS = ["qr", "manual"] as const;
export type CheckinMethod = (typeof CHECKIN_METHODS)[number];

// レート制限（簡易・インメモリ。本番では Upstash Redis 等への置き換えを推奨）
export const RATE_LIMIT = {
  RESERVE: { windowMs: 60_000, max: 5 }, // 予約フォーム送信: 1分間に5回まで/IP
  LOGIN: { windowMs: 60_000, max: 8 }, // 管理者ログイン試行: 1分間に8回まで/IP
  CHECKIN: { windowMs: 60_000, max: 30 }, // 入館処理: 1分間に30回まで/IP
  SEARCH: { windowMs: 60_000, max: 60 }, // 検索: 1分間に60回まで/IP
} as const;

export const APP_NAME = "i-GIP 入館管理";

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
