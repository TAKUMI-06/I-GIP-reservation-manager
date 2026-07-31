import type { Metadata } from "next";
import Link from "next/link";
import { Users, UserCheck, UserX, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationStatusBadge } from "@/components/admin/reservation-status-badge";
import { Button } from "@/components/ui/button";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatJst, todayJstDateString } from "@/lib/date";

export const metadata: Metadata = { title: "ダッシュボード" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminSupabaseClient();
  const today = todayJstDateString();

  const [{ data: todayReservations }, { data: recentLogs }] = await Promise.all([
    supabase
      .from("reservations")
      .select("*")
      .eq("visit_date", today)
      .order("created_at", { ascending: true }),
    supabase
      .from("checkin_logs")
      .select("*, reservations(name, team_name)")
      .order("checked_in_at", { ascending: false })
      .limit(10),
  ]);

  const list = todayReservations ?? [];
  const checkedInCount = list.filter((r) => r.status === "checked_in").length;
  const notCheckedInCount = list.length - checkedInCount;

  const stats = [
    { label: "本日の予約人数", value: list.length, icon: Users, color: "text-primary bg-primary/10" },
    { label: "入館済人数", value: checkedInCount, icon: UserCheck, color: "text-success bg-success/10" },
    { label: "未入館人数", value: notCheckedInCount, icon: UserX, color: "text-danger bg-danger/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">{formatJst(new Date(), "yyyy年M月d日(E)")} の状況</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">本日の予約一覧</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/reservations">
              すべて見る <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">本日の予約はありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>チーム名</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>入館時刻</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.team_name}</TableCell>
                    <TableCell>
                      <ReservationStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{r.checked_in_at ? formatJst(r.checked_in_at, "HH:mm") : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">最近の入館履歴</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/history">
              すべて見る <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recentLogs || recentLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">履歴はまだありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>チーム名</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead>時刻</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => {
                  const r = log.reservations as unknown as { name: string; team_name: string } | null;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{r?.name ?? "-"}</TableCell>
                      <TableCell>{r?.team_name ?? "-"}</TableCell>
                      <TableCell>{log.method === "qr" ? "QR読み取り" : "手動"}</TableCell>
                      <TableCell>{formatJst(log.checked_in_at, "M/d HH:mm")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
