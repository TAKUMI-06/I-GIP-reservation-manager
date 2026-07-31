"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationStatusBadge } from "@/components/admin/reservation-status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { searchReservations, manualCheckIn } from "@/lib/actions/checkin";
import { formatJst } from "@/lib/date";
import type { ReservationRow } from "@/lib/types/database";

/**
 * 受付担当がQRコードを提示できない来場者を氏名・チーム名・メール・電話番号で検索し、
 * 手動で入館登録できるようにするコンポーネント。
 */
export function ReservationSearch() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ReservationRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [target, setTarget] = React.useState<ReservationRow | null>(null);
  const [processing, setProcessing] = React.useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length === 0) return;
    setLoading(true);
    try {
      const result = await searchReservations({ query });
      if (!result.success) {
        toast.error(result.error);
        setResults([]);
        return;
      }
      setResults(result.results);
    } catch (err) {
      console.error(err);
      toast.error("検索中に通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCheckin() {
    if (!target) return;
    setProcessing(true);
    try {
      const result = await manualCheckIn({ reservationId: target.id, note: "検索からの手動入館" });
      if (!result.success) {
        toast.error(result.error ?? "入館登録に失敗しました。");
        return;
      }
      toast.success(`${target.name} 様の手動入館を登録しました。`);
      setResults((prev) => prev?.map((r) => (r.id === target.id ? result.reservation! : r)) ?? null);
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
    } finally {
      setProcessing(false);
      setTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="氏名・チーム名・メール・電話番号で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          検索
        </Button>
      </form>

      {results !== null && (
        <>
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <SearchX className="h-8 w-8" />
              検索結果がありません。氏名やチーム名の一部でも検索できます。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>チーム名</TableHead>
                  <TableHead>利用日</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.team_name}</TableCell>
                    <TableCell>{formatJst(r.visit_date, "M/d(E)")}</TableCell>
                    <TableCell>
                      <ReservationStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "not_checked_in" ? (
                        <Button size="sm" variant="outline" onClick={() => setTarget(r)}>
                          <UserPlus className="h-4 w-4" />
                          手動入館
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">対応済み</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>手動入館の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.name} 様（{target?.team_name}）を手動で入館登録します。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualCheckin} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              入館登録する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
