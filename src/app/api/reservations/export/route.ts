import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin, ForbiddenError } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { formatJst } from "@/lib/date";
import type { AdminUserRow } from "@/lib/types/database";

/**
 * 予約一覧をCSVでエクスポートするAPI（スーパー管理者専用）。
 * UTF-8 BOM付きで出力し、Excelでも文字化けしないようにする。
 */
export async function GET(request: NextRequest) {
  let admin: AdminUserRow;
  try {
    admin = await requireSuperAdmin();
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
    }
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("reservations")
    .select("*, admin_users:checked_in_by(name)")
    .order("visit_date", { ascending: true });

  if (from) query = query.gte("visit_date", from);
  if (to) query = query.lte("visit_date", to);

  const { data, error } = await query;

  if (error) {
    console.error("[export] CSV出力に失敗しました:", error);
    return NextResponse.json({ error: "CSV出力に失敗しました。" }, { status: 500 });
  }

  const header = [
    "予約ID",
    "利用日",
    "氏名",
    "チーム名",
    "メール",
    "電話番号",
    "予約日時",
    "入館状況",
    "入館時刻",
    "入館方法",
    "受付担当",
  ];

  const rows = (data ?? []).map((r) => {
    const staffName = (r as unknown as { admin_users: { name: string } | null }).admin_users?.name ?? "";
    return [
      r.id,
      r.visit_date,
      r.name,
      r.team_name,
      r.email,
      r.phone,
      formatJst(r.created_at, "yyyy-MM-dd HH:mm:ss"),
      r.status === "checked_in" ? "入館済み" : "未入館",
      r.checked_in_at ? formatJst(r.checked_in_at, "yyyy-MM-dd HH:mm:ss") : "",
      r.checked_in_method === "qr" ? "QR" : r.checked_in_method === "manual" ? "手動" : "",
      staffName,
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
  // UTF-8 BOMを付与（Excelでの文字化け防止）
  const bom = "﻿";
  const body = bom + csv;

  await writeAuditLog({
    actorAdminId: admin.id,
    actorEmail: admin.email,
    action: "reservations.csv_export",
    detail: { count: rows.length, from, to },
    ipAddress: await getClientIp(),
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations_${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeCsvField(value: string): string {
  let str = String(value ?? "");
  // Excel等でのCSVインジェクション（数式実行）対策。
  // =, +, -, @ で始まる値は数式と解釈される可能性があるため、先頭にシングルクォートを付与し無害化する。
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
