import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export const metadata: Metadata = { title: "パスワード設定" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" />
          </span>
          <CardTitle>パスワード設定</CardTitle>
          <CardDescription>i-GIP 入館管理システム 管理画面</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
