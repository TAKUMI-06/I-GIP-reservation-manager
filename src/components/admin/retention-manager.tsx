"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, ShieldCheck } from "lucide-react";
import { deleteRetentionCandidates } from "@/lib/actions/retention";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatJst } from "@/lib/date";
import type { RetentionCandidateRow } from "@/lib/types/database";

export function RetentionManager({ candidates }: { candidates: RetentionCandidateRow[] }) {
  const router = useRouter();
  const [processing, setProcessing] = React.useState(false);

  async function handleDeleteAll() {
    setProcessing(true);
    try {
      const result = await deleteRetentionCandidates();
      if (!result.success) {
        toast.error(result.error ?? "削除に失敗しました。");
        return;
      }
      toast.success(`${result.deletedCount ?? 0}件のデータを削除しました。`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeleteOne(id: string) {
    setProcessing(true);
    try {
      const result = await deleteRetentionCandidates([id]);
      if (!result.success) {
        toast.error(result.error ?? "削除に失敗しました。");
        return;
      }
      toast.success("削除しました。");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
    } finally {
      setProcessing(false);
    }
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <ShieldCheck className="h-8 w-8 text-success" />
        現在、保持期間（3か月）を超過したデータはありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{candidates.length}件のデータが削除対象です。</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={processing}>
              <Trash2 className="h-4 w-4" />
              すべて削除する
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{candidates.length}件のデータを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。削除前の内容は監査ログに記録されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll}>削除する</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>チーム名</TableHead>
            <TableHead>利用日</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.team_name}</TableCell>
              <TableCell>{formatJst(c.visit_date, "yyyy/M/d")}</TableCell>
              <TableCell>{formatJst(c.created_at, "yyyy/M/d")}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  disabled={processing}
                  onClick={() => handleDeleteOne(c.id)}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
