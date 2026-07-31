import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrScanner } from "@/components/admin/qr-scanner";
import { ReservationSearch } from "@/components/admin/reservation-search";

export const metadata: Metadata = { title: "QR受付" };

export default function ScannerPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR受付</h1>
        <p className="text-sm text-muted-foreground">
          来場者のQRコードを読み取って入館登録します。QRを提示できない場合は検索から手動入館できます。
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="scan">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">QR読み取り</TabsTrigger>
              <TabsTrigger value="search">検索して手動入館</TabsTrigger>
            </TabsList>
            <TabsContent value="scan">
              <QrScanner />
            </TabsContent>
            <TabsContent value="search">
              <ReservationSearch />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ご利用のヒント</CardTitle>
          <CardDescription>
            カメラの利用を許可していない場合は、ブラウザの設定からカメラへのアクセスを許可してください。
            うまく読み取れない場合は「検索して手動入館」タブをご利用ください。
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
