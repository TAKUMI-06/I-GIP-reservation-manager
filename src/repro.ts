/**
 * assertNever
 * switch文の網羅性チェック用ヘルパー。到達しないはずの分岐に到達した場合、
 * ここでコンパイルエラー（型チェック）と実行時エラーの両方を検知できる。
 *
 * 使用例:
 *   switch (status) {
 *     case "checked_in": ...
 *     case "not_checked_in": ...
 *     default: return assertNever(status);
 *   }
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
