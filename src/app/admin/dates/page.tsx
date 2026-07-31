import type { Metadata } from "next";
import { requireSuperAdmin, ForbiddenError } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ForbiddenNotice } from "@/components/admin/forbidden-notice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddDateForm } from "@/components/admin/add-date-form";
import { AvailableDatesTable } from "@/components/admin/available-dates-table";

export const metadata: Metadata = { title: "利用可能日管理" };
export const dynamic = "force-dynamic";

export default async function DatesPage() {
  try {
    await requireSuperAdmin();
  } catch (err) {
    if (err instanceof ForbiddenError) return <ForbiddenNotice />;
    throw err;
  }

  const supabase = createAdminSupabaseClient();
  const { data: dates } = await supabase
    .from("available_dates")
    .select("*")
    .order("date", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">利用可能日管理</h1>
        <p className="text-sm text-muted-foreground">
          ここで登録した日付のみ、利用者は予約ページから選択できます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">日程を追加</CardTitle>
          <CardDescription>カレンダーから日付を選択して追加してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <AddDateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">登録済みの日程</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailableDatesTable dates={dates ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
