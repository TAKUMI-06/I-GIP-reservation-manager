"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { updateNotificationSettingsSchema } from "@/lib/validations/admin";
import { getClientIp } from "@/lib/rate-limit";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** 通知先設定を更新する（スーパー管理者のみ） */
export async function updateNotificationSettings(input: unknown): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  const parsed = updateNotificationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません。" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: existing } = await supabase.from("notification_settings").select("id").limit(1).maybeSingle();

  const payload = {
    admin_notification_emails: parsed.data.adminNotificationEmails,
    reminder_enabled: parsed.data.reminderEnabled,
    updated_at: new Date().toISOString(),
    updated_by: actor.id,
  };

  const { error } = existing
    ? await supabase.from("notification_settings").update(payload).eq("id", existing.id)
    : await supabase.from("notification_settings").insert(payload);

  if (error) {
    console.error("[updateNotificationSettings]", error);
    return { success: false, error: "設定の更新に失敗しました。" };
  }

  await writeAuditLog({
    actorAdminId: actor.id,
    actorEmail: actor.email,
    action: "notification_settings.update",
    detail: payload,
    ipAddress: await getClientIp(),
  });

  return { success: true };
}
