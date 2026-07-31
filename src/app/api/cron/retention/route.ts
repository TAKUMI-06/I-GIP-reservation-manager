import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { DATA_RETENTION_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * データ保持ポリシー（3か月）に基づく自動削除バッチ。
 * Vercel Cron (vercel.json) から毎月1回呼び出す想定。
 * スーパー管理者は /admin/settings からいつでも手動削除も可能。
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: candidates, error } = await supabase
    .from("retention_candidates")
    .select("id, name, team_name, email, visit_date");

  if (error) {
    console.error("[cron/retention] 削除対象の取得に失敗しました:", error);
    return NextResponse.json({ error: "failed to fetch candidates" }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ deletedCount: 0 });
  }

  const ids = candidates.map((c) => c.id);
  const { error: deleteError } = await supabase.from("reservations").delete().in("id", ids);

  if (deleteError) {
    console.error("[cron/retention] 削除に失敗しました:", deleteError);
    return NextResponse.json({ error: "failed to delete" }, { status: 500 });
  }

  await writeAuditLog({
    actorAdminId: null,
    actorEmail: "system:cron",
    action: "reservations.retention_auto_delete",
    detail: { count: candidates.length, retentionDays: DATA_RETENTION_DAYS, snapshot: candidates },
  });

  return NextResponse.json({ deletedCount: candidates.length });
}
