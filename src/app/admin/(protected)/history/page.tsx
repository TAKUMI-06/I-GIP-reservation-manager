import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatJst } from "@/lib/date";

export const metadata: Metadata = { title: "入館履歴" };
export const dynamic = "force-dynamic";

interface LogWithRelations {
  id: string;
  checked_in_at: string;
  method: "qr" | "manual";
  note: string | null;
  reservations: { name: string; team_name: string; visit_date: string } | null;
  admin_users: { name: string } | null;
}

export default async function HistoryPage() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("checkin_logs")
    .select("id, checked_in_at, method, note, reservations(name, team_name, visit_date), admin_users:performed_by(name)")
    .order("checked_in_at", { ascending: false })
    .limit(200);

  const logs = (data ?? []) as unknown as LogWithRelations[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">入館履歴</h1>
        <p className="text-sm text-muted-foreground">
          過去の入館処理の履歴です（QR読み取り・手動入館の両方を含みます）。直近200件を表示しています。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">履歴一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">履歴はまだありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入館時刻</TableHead>
                  <TableHead>利用日</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>チーム名</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead>受付担当</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatJst(log.checked_in_at, "M/d HH:mm")}</TableCell>
                    <TableCell>{log.reservations ? formatJst(log.reservations.visit_date, "M/d(E)") : "-"}</TableCell>
                    <TableCell className="font-medium">{log.reservations?.name ?? "-"}</TableCell>
                    <TableCell>{log.reservations?.team_name ?? "-"}</TableCell>
                    <TableCell>
                      {log.method === "qr" ? (
                        <Badge variant="outline">QR読み取り</Badge>
                      ) : (
                        <Badge variant="outline">手動</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.admin_users?.name ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
