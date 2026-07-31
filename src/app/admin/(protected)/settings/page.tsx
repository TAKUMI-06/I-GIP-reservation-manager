import type { Metadata } from "next";
import { requireSuperAdmin, ForbiddenError } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ForbiddenNotice } from "@/components/admin/forbidden-notice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form";
import { RetentionManager } from "@/components/admin/retention-manager";

export const metadata: Metadata = { title: "設定" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let currentAdminId: string;
  try {
    const admin = await requireSuperAdmin();
    currentAdminId = admin.id;
  } catch (err) {
    if (err instanceof ForbiddenError) return <ForbiddenNotice />;
    throw err;
  }

  const supabase = createAdminSupabaseClient();
  const [{ data: adminUsers }, { data: settings }, { data: retentionCandidates }] = await Promise.all([
    supabase.from("admin_users").select("*").order("created_at", { ascending: true }),
    supabase.from("notification_settings").select("*").limit(1).maybeSingle(),
    supabase.from("retention_candidates").select("*"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">管理者・通知先・データ保持に関する設定です。</p>
      </div>

      <Tabs defaultValue="admins">
        <TabsList>
          <TabsTrigger value="admins">管理者管理</TabsTrigger>
          <TabsTrigger value="notifications">通知先設定</TabsTrigger>
          <TabsTrigger value="retention">データ削除</TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">受付担当・スーパー管理者</CardTitle>
              <CardDescription>受付担当の追加、管理者の削除ができます。</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUsersManager adminUsers={adminUsers ?? []} currentAdminId={currentAdminId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">新規予約の通知先</CardTitle>
              <CardDescription>
                新しい予約が入った際に通知するメールアドレスと、前日リマインドの送信可否を設定します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettingsForm
                initialEmails={settings?.admin_notification_emails ?? []}
                initialReminderEnabled={settings?.reminder_enabled ?? true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">データ保持・削除</CardTitle>
              <CardDescription>
                予約・入館履歴データは取得から3か月で削除対象となります。対象データを確認し、削除できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RetentionManager candidates={retentionCandidates ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
