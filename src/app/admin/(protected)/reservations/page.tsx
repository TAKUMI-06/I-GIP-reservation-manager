import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationsTable } from "@/components/admin/reservations-table";
import { ReservationsFilterBar } from "@/components/admin/reservations-filter-bar";
import { sanitizeSearchTerm } from "@/lib/search";

export const metadata: Metadata = { title: "予約一覧" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; status?: string; q?: string }>;
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const admin = await getCurrentAdmin();
  const { from, to, status, q } = await searchParams;

  const supabase = createAdminSupabaseClient();
  let query = supabase.from("reservations").select("*").order("visit_date", { ascending: false }).limit(300);

  if (from) query = query.gte("visit_date", from);
  if (to) query = query.lte("visit_date", to);
  if (status === "checked_in" || status === "not_checked_in") query = query.eq("status", status);
  if (q) {
    const escaped = sanitizeSearchTerm(q);
    query = query.or(
      `name.ilike.%${escaped}%,team_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    );
  }

  const { data: reservations } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">予約一覧</h1>
          <p className="text-sm text-muted-foreground">全予約の検索・確認ができます。</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">絞り込み</CardTitle>
        </CardHeader>
        <CardContent>
          <ReservationsFilterBar
            isSuperAdmin={admin?.role === "super_admin"}
            defaultValues={{ from, to, status, q }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ReservationsTable
            reservations={reservations ?? []}
            hidePhone={admin?.role === "sub_admin"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
