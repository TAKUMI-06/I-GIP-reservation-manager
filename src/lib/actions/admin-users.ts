"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { addAdminUserSchema } from "@/lib/validations/admin";
import { getClientIp } from "@/lib/rate-limit";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** 管理者（スーパー管理者・受付担当）を新規作成する（スーパー管理者のみ） */
export async function addAdminUser(input: unknown): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  const parsed = addAdminUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません。" };
  }
  const { name, email, role, password } = parsed.data;

  const supabase = createAdminSupabaseClient();

  // Supabase Authにユーザーを作成（メール確認済み扱いとし、即ログイン可能にする）
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    if (authError?.message.includes("already registered")) {
      return { success: false, error: "このメールアドレスは既に登録されています。" };
    }
    console.error("[addAdminUser] auth作成失敗:", authError);
    return { success: false, error: "アカウントの作成に失敗しました。" };
  }

  const { error: insertError } = await supabase.from("admin_users").insert({
    auth_user_id: authUser.user.id,
    name,
    email,
    role,
    created_by: actor.id,
  });

  if (insertError) {
    // admin_usersへの登録に失敗した場合はAuthユーザーをロールバック
    await supabase.auth.admin.deleteUser(authUser.user.id);
    console.error("[addAdminUser] admin_users作成失敗:", insertError);
    return { success: false, error: "管理者情報の登録に失敗しました。" };
  }

  await writeAuditLog({
    actorAdminId: actor.id,
    actorEmail: actor.email,
    action: "admin_user.create",
    targetTable: "admin_users",
    detail: { name, email, role },
    ipAddress: await getClientIp(),
  });

  return { success: true };
}

/** 管理者を削除する（スーパー管理者のみ。自分自身・最後のスーパー管理者は削除不可） */
export async function deleteAdminUser(id: string): Promise<ActionResult> {
  const actor = await requireSuperAdmin();

  if (id === actor.id) {
    return { success: false, error: "自分自身のアカウントは削除できません。" };
  }

  const supabase = createAdminSupabaseClient();

  const { data: target } = await supabase.from("admin_users").select("*").eq("id", id).maybeSingle();
  if (!target) {
    return { success: false, error: "対象の管理者が見つかりません。" };
  }

  if (target.role === "super_admin") {
    const { count } = await supabase
      .from("admin_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) {
      return { success: false, error: "最後のスーパー管理者は削除できません。" };
    }
  }

  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) {
    console.error("[deleteAdminUser]", error);
    return { success: false, error: "削除に失敗しました。" };
  }

  if (target.auth_user_id) {
    await supabase.auth.admin.deleteUser(target.auth_user_id).catch((err) => {
      console.error("[deleteAdminUser] auth削除失敗:", err);
    });
  }

  await writeAuditLog({
    actorAdminId: actor.id,
    actorEmail: actor.email,
    action: "admin_user.delete",
    targetTable: "admin_users",
    targetId: id,
    detail: { name: target.name, email: target.email, role: target.role },
    ipAddress: await getClientIp(),
  });

  return { success: true };
}
