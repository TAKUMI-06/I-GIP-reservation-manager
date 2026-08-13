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

// UUID形式チェック（不正なIDでの無駄なDB問い合わせを防ぐ）
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !reservation) {
    notFound();
  }

  const qrDataUrl = await generateQrDataUrl(reservation.qr_token);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="container max-w-xl py-10">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl">予約が完了しました</CardTitle>
              <CardDescription>
                当日は下記QRコードを受付でご提示ください。予約確認メールも送信済みです。
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

                <dt className="text-muted-foreground">利用日</dt>
                <dd className="col-span-2 font-medium">
                  {formatJst(reservation.visit_date, "yyyy年M月d日(E)")}
                </dd>

                <dt className="text-muted-foreground">利用時間</dt>
                <dd className="col-span-2">10:30〜17:00</dd>

                <dt className="text-muted-foreground">氏名</dt>
                <dd className="col-span-2">{reservation.name}</dd>

                <dt className="text-muted-foreground">チーム名</dt>
                <dd className="col-span-2">{reservation.team_name}</dd>

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
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
