import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service Roleキーを使った特権Supabaseクライアント。
 *
 * 【重要】このクライアントはRLSを完全にバイパスする。
 * 必ずサーバー専用コード（Server Actions / Route Handlers）からのみ使用し、
 * 呼び出し側で requireAdmin() / requireSuperAdmin() 等による権限チェックを
 * 事前に必ず行うこと。クライアントに絶対に公開しない。
 */
let cachedClient: SupabaseClient<Database> | null = null;

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Service Roleの設定が不足しています（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）。",
    );
  }

  cachedClient = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
}
