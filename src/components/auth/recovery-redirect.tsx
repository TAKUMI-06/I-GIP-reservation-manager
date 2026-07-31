"use client";

import * as React from "react";

/**
 * Supabaseのパスワードリセット/招待メールのリンクは、Site URL（=トップページ）に
 * `#access_token=...&type=recovery` をURLハッシュとして付けてリダイレクトしてくる。
 * ハッシュはサーバーに送られないため、クライアント側でこれを検知し、
 * 実際にパスワードを設定できる /admin/reset-password へ転送する。
 */
export function RecoveryRedirect() {
  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const type = params.get("type");

    if ((type === "recovery" || type === "invite") && params.get("access_token")) {
      window.location.replace(`/admin/reset-password${hash}`);
    }
  }, []);

  return null;
}
