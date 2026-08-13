import Link from "next/link";
import { CalendarCheck, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const steps = [
  {
    icon: CalendarCheck,
    title: "① かんたん予約",
    description: "利用可能な日程から選んで、氏名・チーム名・連絡先を入力するだけ。",
  },
  {
    icon: QrCode,
    title: "② QRコード発行",
    description: "予約完了と同時にQRコードを発行。スマホに保存していつでも提示できます。",
  },
  {
    icon: Smartphone,
    title: "③ 当日はQRを提示",
    description: "受付でQRコードを読み取るだけでスムーズに入館できます。",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-b from-accent/40 to-background">
          <div className="container flex flex-col items-center gap-6 py-20 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              安心・かんたんな入館管理
            </span>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              予約から受付まで、
              <br className="hidden sm:block" />
              スマホひとつでスムーズに。
            </h1>
            <p className="max-w-xl text-muted-foreground">
              i-GIP 入館管理は、施設の利用予約・QRコード受付・入館履歴の管理をシンプルに行える
              Webサービスです。
            </p>
            <p className="text-sm font-medium text-muted-foreground">利用時間: 10:30〜17:00</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/reserve">今すぐ予約する</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/terms">利用規約を見る</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <h2 className="mb-10 text-center text-2xl font-bold">ご利用の流れ</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {step.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-secondary/30">
          <div className="container flex flex-col items-center gap-4 py-16 text-center">
            <h2 className="text-2xl font-bold">予約は1分で完了します</h2>
            <p className="max-w-md text-muted-foreground">
              事前登録された日程からご希望の日を選ぶだけ。会員登録は不要です。
            </p>
            <Button asChild size="lg">
              <Link href="/reserve">予約ページへ進む</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
