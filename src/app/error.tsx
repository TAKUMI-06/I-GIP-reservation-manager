"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 本番では外部監視サービス（Sentry等）への送信に置き換える
    console.error("[app_error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-danger" />
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="max-w-md text-muted-foreground">
        通信エラーまたはシステムエラーが発生しました。時間をおいて再度お試しください。
        問題が解決しない場合は施設窓口までお問い合わせください。
      </p>
      <Button onClick={() => reset()}>再試行する</Button>
    </div>
  );
}
