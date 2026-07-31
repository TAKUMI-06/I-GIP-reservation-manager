import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface AuditLogInput {
  actorAdminId: string | null;
  actorEmail: string | null;
  action: string;
  targetTable?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * 監査ログを記録する。失敗しても本処理は止めず、コンソールにエラーを出す
 * （監査ログの失敗で本来の業務処理まで止めるのは望ましくないため）。
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const admin = createAdminSupabaseClient();
    await admin.from("audit_logs").insert({
      actor_admin_id: input.actorAdminId,
      actor_email: input.actorEmail,
      action: input.action,
      target_table: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      detail: input.detail ?? null,
      ip_address: input.ipAddress ?? null,
    });
  } catch (err) {
    console.error("[audit_log] 監査ログの書き込みに失敗しました:", err);
  }
}
