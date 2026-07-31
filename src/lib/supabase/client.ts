"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

/**
 * ブラウザ（Client Component）用 Supabase クライアント。
 * anonキーのみ使用し、RLSの制約を全面的に受ける（管理者ログイン等に利用）。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
