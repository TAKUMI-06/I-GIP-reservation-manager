import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Download } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateQrDataUrl } from "@/lib/qr";
import { formatJst } from "@/lib/date";

export const metadata: Metadata = { title: "予約完了" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ReservationCompletePage({ searchParams }: PageProps) {
  const { ids } = await searchParams;

  const idList = (ids ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => UUID_RE.test(v));

  if (idList.length === 0) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("*")
    .in("id", idList);

  if (error || !reservations || reservations.length === 0) {
    notFound();
  }

  // 日付順に並べる
  const sorted = [...reservations].sort((a, b) => a.visit_date.localeCompare(b.visit_date));

  const withQr = await Promise.all(
    sorted.map(async (reservation) => ({
      reservation,
      qrDataUrl: await generateQrDataUrl(reservation.qr_token),
    })),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="container max-w-xl space-y-6 py-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-semibold">
              {withQr.length > 1 ? `${withQr.length}件の予約が完了しました` : "予約が完了しました"}
            </h1>
            <p className="text-sm text-muted-foreground">
              各日程ごとにQRコードが発行されています。当日は該当する日程のQRコードを受付でご提示ください。予約確認メールも送信済みです。
            </p>
          </div>

          {withQr.map(({ reservation, qrDataUrl }) => (
            <Card key={reservation.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {formatJst(reservation.visit_date, "yyyy年M月d日(E)")}
                </CardTitle>
                <CardDescription>
                  {reservation.team_name} / {reservation.name}
                  <br />
                  利用時間: 10:00〜17:00
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Data URLのためnext/imageは使用しない */}
                  <img src={qrDataUrl} alt="入館用QRコード" width={240} height={240} className="rounded-lg" />
                  <Button asChild variant="outline" size="sm">
                    <a href={qrDataUrl} download={`i-gip-qr-${reservation.id}.png`}>
                      <Download className="h-4 w-4" />
                      QRコードをPNGで保存
                    </a>
                  </Button>
                </div>

                <Separator />

                <dl className="grid grid-cols-3 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">予約ID</dt>
                  <dd className="col-span-2 break-all font-mono text-xs">{reservation.id}</dd>

                  <dt className="text-muted-foreground">状態</dt>
                  <dd className="col-span-2">
                    {reservation.status === "checked_in" ? (
                      <Badge variant="success">入館済み</Badge>
                    ) : (
                      <Badge variant="secondary">未入館</Badge>
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
