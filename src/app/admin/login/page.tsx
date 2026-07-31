import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "lucide-react";

export const metadata: Metadata = { title: "管理者ログイン" };

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" />
          </span>
          <CardTitle>管理者ログイン</CardTitle>
          <CardDescription>i-GIP 入館管理システム 管理画面</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/admin"} />
        </CardContent>
      </Card>
    </div>
  );
}
