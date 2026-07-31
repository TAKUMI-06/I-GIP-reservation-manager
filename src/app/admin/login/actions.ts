"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validations/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT } from "@/lib/constants";
import { writeAuditLog } from "@/lib/audit";

export interface LoginState {
  success: boolean;
  error?: string;
}

export async function loginAdmin(input: unknown): Promise<LoginState> {
  const ip = await getClientIp();

  const limited = rateLimit(`login:${ip}`, RATE_LIMIT.LOGIN);
  if (!limited.success) {
    return { success: false, error: "ログイン試行回数が多すぎます。しばらく時間をおいて再度お試しください。" };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }
  const { email, password } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    await writeAuditLog({
      actorAdminId: null,
      actorEmail: email,
      action: "admin.login_failed",
      detail: { reason: authError?.message },
      ipAddress: ip === "unknown" ? undefined : ip,
    });
    return { success: false, error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  // Supabase Authでの認証に成功しても、admin_usersに有効なレコードがなければ管理者として認めない
  const admin = createAdminSupabaseClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("id, role, is_active")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (!adminUser || !adminUser.is_active) {
    await supabase.auth.signOut();
    await writeAuditLog({
      actorAdminId: null,
      actorEmail: email,
      action: "admin.login_rejected_not_admin",
      ipAddress: ip === "unknown" ? undefined : ip,
    });
    return { success: false, error: "この操作を行う権限がありません。" };
  }

  await writeAuditLog({
    actorAdminId: adminUser.id,
    actorEmail: email,
    action: "admin.login_success",
    ipAddress: ip === "unknown" ? undefined : ip,
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminSupabaseClient();
    const { data: adminUser } = await admin
      .from("admin_users")
      .select("id, email")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (adminUser) {
      await writeAuditLog({
        actorAdminId: adminUser.id,
        actorEmail: adminUser.email,
        action: "admin.logout",
      });
    }
  }

  await supabase.auth.signOut();
}
