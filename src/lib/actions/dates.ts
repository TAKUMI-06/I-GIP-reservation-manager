"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { addAvailableDateSchema } from "@/lib/validations/admin";
import { getClientIp } from "@/lib/rate-limit";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** 予約可能日を追加する（スーパー管理者のみ） */
export async function addAvailableDate(input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = addAvailableDateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません。" };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("available_dates").insert({
    date: parsed.data.date,
    note: parsed.data.note || null,
    created_by: admin.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "この日付はすでに登録されています。" };
    }
    console.error("[addAvailableDate]", error);
    return { success: false, error: "追加に失敗しました。" };
  }

  await writeAuditLog({
    actorAdminId: admin.id,
    actorEmail: admin.email,
    action: "available_date.create",
    targetTable: "available_dates",
    detail: { date: parsed.data.date },
    ipAddress: await getClientIp(),
  });

  return { success: true };
}

/** 予約可能日の有効/無効を切り替える（スーパー管理者のみ） */
export async function toggleAvailableDate(id: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("available_dates").update({ is_active: isActive }).eq("id", id);
  if (error) {
    console.error("[toggleAvailableDate]", error);
    return { success: false, error: "更新に失敗しました。" };
  }

  await writeAuditLog({
    actorAdminId: admin.id,
    actorEmail: admin.email,
    action: isActive ? "available_date.activate" : "available_date.deactivate",
    targetTable: "available_dates",
    targetId: id,
  });

  return { success: true };
}

/** 予約可能日を削除する（スーパー管理者のみ） */
export async function deleteAvailableDate(id: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("available_dates").delete().eq("id", id);
  if (error) {
    console.error("[deleteAvailableDate]", error);
    return { success: false, error: "削除に失敗しました。" };
  }

  await writeAuditLog({
    actorAdminId: admin.id,
    actorEmail: admin.email,
    action: "available_date.delete",
    targetTable: "available_dates",
    targetId: id,
  });

  return { success: true };
}
