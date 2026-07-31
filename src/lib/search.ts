/**
 * PostgREST の `.or()` フィルタ文字列に安全に埋め込むための検索語サニタイズ。
 *
 * `.or("name.ilike.%X%,...")` のように文字列を組み立てる際、
 * PostgRESTの or= 構文はカンマ(,)を条件の区切り、丸括弧()をグルーピング/否定に
 * 使用するため、検索語にこれらの文字が含まれると意図しないフィルタ条件を
 * 注入される恐れがある（例: "x,status.eq.checked_in" のような追加条件の注入）。
 *
 * 氏名・チーム名・メール・電話番号の検索において , ( ) . といった文字が
 * 本来の検索意図に必要になることは通常ないため、除去した上で
 * ILIKE のワイルドカード文字 % _ をエスケープする。
 */
export function sanitizeSearchTerm(input: string): string {
  const withoutFilterMetaChars = input.replace(/[,()]/g, "");
  return withoutFilterMetaChars.replace(/[%_\\]/g, (c) => `\\${c}`);
}
