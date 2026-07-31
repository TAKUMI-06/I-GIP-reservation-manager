import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "利用規約",
};

const sections = [
  {
    title: "第1条（施設ルールの遵守）",
    body: "利用者は、来場する施設が定める規則・案内・スタッフの指示に従うものとします。施設内での危険行為、他の利用者への迷惑行為、施設物品の破損等が確認された場合、施設側の判断により入館をお断りする場合があります。",
  },
  {
    title: "第2条（QRコードの取り扱い）",
    body: "予約完了時に発行されるQRコードは、本人確認のための重要な情報です。第三者への共有・譲渡・転売は固く禁止します。QRコードの不正利用によって生じた損害について、当システム運営者は責任を負いません。紛失した場合は受付にて本人確認の上、手動での入館手続きを行います。",
  },
  {
    title: "第3条（個人情報の利用目的）",
    body: "予約時にご提供いただく氏名・チーム名・メールアドレス・電話番号は、以下の目的にのみ利用します。（1）予約の確認・管理、（2）当日の入館受付・本人確認、（3）予約確認メール・前日リマインドメールの送信、（4）施設側への利用履歴の提供、（5）システムの安全な運用のための監査記録。上記目的以外での利用は行いません。",
  },
  {
    title: "第4条（施設への情報提供）",
    body: "本システムを通じて取得した予約情報・入館履歴は、来場先施設の管理担当者に対し、施設運営・安全管理の目的で提供されることがあります。",
  },
  {
    title: "第5条（利用履歴の保存期間）",
    body: "予約情報および入館履歴は、取得日から3か月間保存された後、順次削除されます。保存期間中であっても、スーパー管理者の判断により削除される場合があります。",
  },
  {
    title: "第6条（禁止事項）",
    body: "虚偽の情報での予約、他人になりすましての予約、システムへの不正アクセス、その他法令または本規約に違反する行為を禁止します。",
  },
  {
    title: "第7条（規約の変更）",
    body: "運営者は、必要と判断した場合に本規約を変更できるものとします。変更後の規約は本ページに掲載した時点で効力を生じます。",
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container max-w-3xl py-12">
          <h1 className="mb-2 text-3xl font-bold">利用規約</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            i-GIP 入館管理システムのご利用にあたっては、以下の規約に同意いただく必要があります。
          </p>
          <Card>
            <CardContent className="space-y-8 pt-6">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="mb-2 text-lg font-semibold">{section.title}</h2>
                  <p className="leading-relaxed text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
