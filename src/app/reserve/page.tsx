import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ReservationForm } from "@/components/reserve/reservation-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AvailableDateRow } from "@/lib/types/database";

export const metadata: Metadata = { title: "来場予約" };

// 予約可能日は管理者が随時更新するため、常に最新のものを表示する
export const dynamic = "force-dynamic";

async function getAvailableDates(): Promise<AvailableDateRow[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("available_dates")
    .select("*")
    .eq("is_active", true)
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (error) {
    console.error("[reserve/page] 利用可能日の取得に失敗しました:", error);
    return [];
  }
  return data ?? [];
}

export default async function ReservePage() {
  const availableDates = await getAvailableDates();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/20">
        <div className="container max-w-xl py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">来場予約</CardTitle>
              <CardDescription>
                利用可能な日程から選択し、必要事項をご入力ください。予約は即時確定します。
                <br />
                利用時間: 10:30〜17:00
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableDates.length === 0 ? (
                <Alert variant="danger">
                  <CalendarX2 className="h-4 w-4" />
                  <AlertTitle>現在予約可能な日程がありません</AlertTitle>
                  <AlertDescription>
                    施設の予約可能日が登録され次第、こちらのページから予約が可能になります。
                  </AlertDescription>
                </Alert>
              ) : (
                <ReservationForm availableDates={availableDates} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
