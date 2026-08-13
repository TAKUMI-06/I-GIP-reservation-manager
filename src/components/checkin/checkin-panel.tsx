"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReservationStatusBadge } from "@/components/admin/reservation-status-badge";
import { checkInByToken } from "@/lib/actions/checkin";
import { formatJst } from "@/lib/date";
import type { ReservationRow } from "@/lib/types/database";

export function CheckinPanel({
  reservation,
  token,
  hideContact = false,
}: {
  reservation: ReservationRow;
  token: string;
  hideContact?: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState(reservation);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleCheckin() {
    setSubmitting(true);
    try {
      const result = await checkInByToken(token);
      if (!result.success) {
        toast.error(result.error ?? "入館登録に失敗しました。");
        if (result.reservation) setCurrent(result.reservation);
        setSubmitting(false);
        return;
      }
      toast.success(`${result.reservation!.name} 様の入館登録が完了しました。`);
      setCurrent(result.reservation!);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。ネットワーク状況をご確認ください。");
    } finally {
      setSubmitting(false);
    }
  }

  const alreadyCheckedIn = current.status === "checked_in";

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-3 gap-y-3 text-sm">
        <dt className="text-muted-foreground">氏名</dt>
        <dd className="col-span-2 text-base font-semibold">{current.name}</dd>

        <dt className="text-muted-foreground">チーム名</dt>
        <dd className="col-span-2">{current.team_name}</dd>

        <dt className="text-muted-foreground">利用日</dt>
        <dd className="col-span-2">{formatJst(current.visit_date, "yyyy年M月d日(E)")}</dd>

        {!hideContact && (
          <>
            <dt className="text-muted-foreground">メール</dt>
            <dd className="col-span-2 break-all">{current.email}</dd>

            <dt className="text-muted-foreground">電話番号</dt>
            <dd className="col-span-2">{current.phone}</dd>
          </>
        )}

        <dt className="text-muted-foreground">状態</dt>
        <dd className="col-span-2">
          <ReservationStatusBadge status={current.status} />
        </dd>
      </dl>

      <Separator />

      {alreadyCheckedIn ? (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>入館済みです</AlertTitle>
          <AlertDescription>
            {current.checked_in_at && `${formatJst(current.checked_in_at, "HH:mm")} に入館登録済みです。`}
          </AlertDescription>
        </Alert>
      ) : (
        <Button size="lg" className="w-full" onClick={handleCheckin} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          入館登録する
        </Button>
      )}
    </div>
  );
}
