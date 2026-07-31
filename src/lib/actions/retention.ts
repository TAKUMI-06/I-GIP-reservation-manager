"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { DATA_RETENTION_DAYS } from "@/lib/constants";

export interface ActionResult {
  success: boolean;
  error?: string;
  deletedCount?: number;
}

/**
 * データ保持期間（3か月）を超過した予約データを削除する（スーパー管理者のみ）。
 * 削除前に監査ログへスナップショットを記録する。
 * ids を指定した場合はその予約のみ削除する（管理画面からの個別削除にも利用）。
 */
export async function deleteRetentionCandidates(ids?: string[]): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  const supabase = createAdminSupabaseClient();

  let targets: { id: string; name: string; team_name: string; email: string; visit_date: string }[];

  if (ids && ids.length > 0) {
    const { data, error } = await supabase
      .from("reservations")
      .select("id, name, team_name, email, visit_date")
      .in("id", ids);
    if (error) {
      return { success: false, error: "対象データの取得に失敗しました。" };
    }
    targets = data ?? [];
  } else {
    const { data, error } = await supabase
      .from("retention_candidates")
      .select("id, name, team_name, email, visit_date");
    if (error) {
      console.error("[deleteRetentionCandidates] view取得失敗:", error);
      return { success: false, error: "削除対象の取得に失敗しました。" };
    }
    targets = data ?? [];
  }

  if (targets.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const targetIds = targets.map((t) => t.id);
  const { error: deleteError } = await supabase.from("reservations").delete().in("id", targetIds);

  if (deleteError) {
    console.error("[deleteRetentionCandidates]", deleteError);
    return { success: false, error: "削除処理に失敗しました。" };
  }

  await writeAuditLog({
    actorAdminId: actor.id,
    actorEmail: actor.email,
    action: "reservations.retention_delete",
    detail: { count: targets.length, retentionDays: DATA_RETENTION_DAYS, snapshot: targets },
    ipAddress: await getClientIp(),
  });

  return { success: true, deletedCount: targets.length };
}
