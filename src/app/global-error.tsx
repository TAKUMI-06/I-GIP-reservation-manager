"use client";

import { useEffect } from "react";

/**
 * ルートレイアウト自体で発生したエラーなど、通常の error.tsx では捕捉できない
 * エラーの最終防衛ライン。Next.jsの仕様上、独自に <html>/<body> を描画する必要がある。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 本番では外部監視サービス（Sentry等）への送信に置き換える
    console.error("[global_error]", error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: "sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>エラーが発生しました</h1>
          <p style={{ maxWidth: "420px", color: "#64748b", fontSize: "14px" }}>
            通信エラーまたはシステムエラーが発生しました。時間をおいて再度お試しください。
            問題が解決しない場合は施設窓口までお問い合わせください。
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              backgroundColor: "#0f7ae5",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            再試行する
          </button>
        </div>
      </body>
    </html>
  );
}
