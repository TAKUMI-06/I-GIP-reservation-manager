import { format } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { ja } from "date-fns/locale";

export const JST_TIMEZONE = "Asia/Tokyo";

/** ISO日時文字列 / Dateを日本時間の指定フォーマットへ変換する */
export function formatJst(input: string | Date, pattern: string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return formatInTimeZone(date, JST_TIMEZONE, pattern, { locale: ja });
}

/** 現在時刻を日本時間のDateとして取得する（日付計算用） */
export function nowInJst(): Date {
  return toZonedTime(new Date(), JST_TIMEZONE);
}

/** YYYY-MM-DD 形式に整形する（<input type="date"> やDB保存用） */
export function toDateOnlyString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** 日本時間における「今日」の日付文字列（YYYY-MM-DD）を取得する */
export function todayJstDateString(): string {
  return formatInTimeZone(new Date(), JST_TIMEZONE, "yyyy-MM-dd");
}
