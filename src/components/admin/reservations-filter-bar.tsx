"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  isSuperAdmin: boolean;
  defaultValues: { from?: string; to?: string; status?: string; q?: string };
}

export function ReservationsFilterBar({ isSuperAdmin, defaultValues }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = React.useState(defaultValues.from ?? "");
  const [to, setTo] = React.useState(defaultValues.to ?? "");
  const [status, setStatus] = React.useState(defaultValues.status ?? "all");
  const [q, setQ] = React.useState(defaultValues.q ?? "");

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    if (status !== "all") params.set("status", status);
    else params.delete("status");
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/admin/reservations?${params.toString()}`);
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/reservations/export?${params.toString()}`;
  }

  return (
    <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">開始日</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">終了日</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">状態</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="checked_in">入館済み</SelectItem>
            <SelectItem value="not_checked_in">未入館</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs text-muted-foreground">キーワード検索</label>
        <Input placeholder="氏名・チーム名・メール・電話番号" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Button type="submit" variant="outline">
        <Search className="h-4 w-4" />
        絞り込む
      </Button>
      {isSuperAdmin && (
        <Button type="button" onClick={handleExport}>
          <Download className="h-4 w-4" />
          CSV出力
        </Button>
      )}
    </form>
  );
}
