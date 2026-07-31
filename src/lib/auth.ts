import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AdminUserRow } from "@/lib/types/database";

export class ForbiddenError extends Error {
  constructor(message = "権限がありません。") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * 現在ログイン中の管理者情報を取得する（未ログイン/無効な場合はnull）。
 * Server Component / Server Action の両方から呼び出し可能。
 */
export async function getCurrentAdmin(): Promise<AdminUserRow | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // admin_users参照はService Role経由（RLSのadmin自己参照ポリシーでも取得可だが、
  // ここでは確実性を優先しService Roleで取得し、is_activeも厳密にチェックする）。
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** 管理者（スーパー管理者 or 受付担当）であることを要求。未ログインならログイン画面へ。 */
export async function requireAdmin(): Promise<AdminUserRow> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** スーパー管理者であることを要求。権限不足時はForbiddenErrorを投げる。 */
export async function requireSuperAdmin(): Promise<AdminUserRow> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new ForbiddenError("この操作にはスーパー管理者権限が必要です。");
  }
  return admin;
}
