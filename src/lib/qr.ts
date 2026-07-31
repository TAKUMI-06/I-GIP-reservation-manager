import "server-only";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { QR_TOKEN_BYTES, getAppUrl } from "@/lib/constants";

/**
 * 推測困難なランダムQRトークンを生成する。
 * 個人情報は一切含まない（予約IDとも別採番のランダム文字列）。
 */
export function generateQrToken(): string {
  return crypto.randomBytes(QR_TOKEN_BYTES).toString("base64url");
}

/** チェックインURLを組み立てる */
export function buildCheckinUrl(token: string): string {
  return `${getAppUrl()}/checkin/${token}`;
}

/** チェックインURLからQRコードのPNG Data URLを生成する */
export async function generateQrDataUrl(token: string): Promise<string> {
  const url = buildCheckinUrl(token);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
