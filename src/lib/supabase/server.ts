import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Server Component / Server Action / Route Handler 用 Supabase クライアント。
 * ログイン中の管理者のセッションCookieを使ってRLSを評価する（anonキー + JWT）。
 * 管理系画面のセッション確認・自身の権限相当の操作にはこちらを使う。
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Componentから呼ばれた場合はCookie書き込みができないため無視する。
            // ミドルウェアでセッションのリフレッシュを行っているため実害はない。
          }
        },
      },
    },
  );
}
