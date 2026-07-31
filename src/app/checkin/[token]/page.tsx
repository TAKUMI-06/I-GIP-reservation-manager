import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getReservationByToken } from "@/lib/actions/checkin";
import { CheckinPanel } from "@/components/checkin/checkin-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "受付" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CheckinTokenPage({ params }: PageProps) {
  await requireAdmin();
  const { token } = await params;

  const result = await getReservationByToken(token);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">受付</CardTitle>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <CheckinPanel reservation={result.reservation} token={token} />
          ) : (
            <Alert variant="danger">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>読み取りに失敗しました</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
