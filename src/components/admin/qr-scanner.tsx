"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CameraOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const READER_ELEMENT_ID = "qr-reader";

/**
 * カメラでQRコードを読み取り、読み取れたURLから /checkin/[token] へ遷移する。
 * html5-qrcode を利用し、iOS Safari / Android Chrome いずれのカメラにも対応する。
 */
export function QrScanner() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"loading" | "ready" | "denied" | "error">("loading");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const scannerRef = React.useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const handledRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (handledRef.current) return;
            const token = extractToken(decodedText);
            if (!token) {
              setErrorMessage("認識したQRコードは i-GIP のものではありません。");
              return;
            }
            handledRef.current = true;
            setErrorMessage(null);
            scanner.stop().catch(() => undefined);
            router.push(`/checkin/${token}`);
          },
          () => {
            // フレームごとの読み取り失敗は無視する（連続スキャン中の正常な挙動）
          },
        );

        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("[QrScanner] カメラの起動に失敗しました:", err);
        if (!cancelled) {
          setStatus("denied");
          setErrorMessage(
            "カメラを起動できませんでした。ブラウザのカメラ利用を許可するか、下記の検索機能をご利用ください。",
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().catch(() => undefined).finally(() => {
          scanner.clear();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="qr-reader-viewport overflow-hidden rounded-xl border border-border bg-black/5">
        <div id={READER_ELEMENT_ID} className="mx-auto w-full max-w-sm" />
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          カメラを起動しています…
        </div>
      )}

      {(status === "denied" || errorMessage) && (
        <Alert variant={status === "denied" ? "danger" : "default"}>
          <CameraOff className="h-4 w-4" />
          <AlertTitle>{status === "denied" ? "カメラが利用できません" : "読み取りエラー"}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {status === "denied" && (
        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
          再読み込みする
        </Button>
      )}
    </div>
  );
}

function extractToken(decodedText: string): string | null {
  try {
    const url = new URL(decodedText);
    const match = url.pathname.match(/\/checkin\/([^/]+)/);
    const token = match?.[1];
    return token ? decodeURIComponent(token) : null;
  } catch {
    // URLではなくトークン単体が読み取られた場合のフォールバック
    if (/^[A-Za-z0-9_-]{10,}$/.test(decodedText)) return decodedText;
    return null;
  }
}
