"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReservationStatusBadge } from "@/components/admin/reservation-status-badge";
import { formatJst } from "@/lib/date";
import type { ReservationRow } from "@/lib/types/database";

export function ReservationsTable({
  reservations,
  hideContact = false,
}: {
  reservations: ReservationRow[];
  hideContact?: boolean;
}) {
  if (reservations.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">該当する予約がありません。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>利用日</TableHead>
          <TableHead>氏名</TableHead>
          <TableHead>チーム名</TableHead>
          <TableHead>連絡先</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>入館時刻</TableHead>
          <TableHead>方法</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="whitespace-nowrap">{formatJst(r.visit_date, "M/d(E)")}</TableCell>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell>{r.team_name}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {hideContact ? (
                <span>非公開</span>
              ) : (
                <>
                  <div>{r.email}</div>
                  <div>{r.phone}</div>
                </>
              )}
            </TableCell>
            <TableCell>
              <ReservationStatusBadge status={r.status} />
            </TableCell>
            <TableCell>{r.checked_in_at ? formatJst(r.checked_in_at, "M/d HH:mm") : "-"}</TableCell>
            <TableCell>
              {r.checked_in_method === "qr" ? "QR" : r.checked_in_method === "manual" ? "手動" : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
