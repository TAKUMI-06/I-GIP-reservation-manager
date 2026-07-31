"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
import { toggleAvailableDate, deleteAvailableDate } from "@/lib/actions/dates";
import { formatJst } from "@/lib/date";
import type { AvailableDateRow } from "@/lib/types/database";

export function AvailableDatesTable({ dates }: { dates: AvailableDateRow[] }) {
  const router = useRouter();

  async function handleToggle(id: string, next: boolean) {
    const result = await toggleAvailableDate(id, next);
    if (!result.success) {
      toast.error(result.error ?? "更新に失敗しました。");
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteAvailableDate(id);
    if (!result.success) {
      toast.error(result.error ?? "削除に失敗しました。");
      return;
    }
    toast.success("削除しました。");
    router.refresh();
  }

  if (dates.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">登録された日程はありません。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>日付</TableHead>
          <TableHead>メモ</TableHead>
          <TableHead>公開状態</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dates.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{formatJst(d.date, "yyyy年M月d日(E)")}</TableCell>
            <TableCell className="text-muted-foreground">{d.note || "-"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={d.is_active} onCheckedChange={(v) => handleToggle(d.id, v)} />
                {d.is_active ? <Badge variant="success">公開中</Badge> : <Badge variant="secondary">非公開</Badge>}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-danger hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>日程を削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      {formatJst(d.date, "yyyy年M月d日")} を削除します。既存の予約には影響しません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(d.id)}>削除する</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
