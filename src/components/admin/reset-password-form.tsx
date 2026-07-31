"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/admin";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type SessionState = "loading" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [sessionState, setSessionState] = React.useState<SessionState>("loading");
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setSessionState("invalid");
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        setSessionState(error ? "invalid" : "ready");
        // トークンをURLに残さない
        window.history.replaceState(null, "", window.location.pathname);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ実行
  }, []);

  async function onSubmit(values: ResetPasswordValues) {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast.error(error.message || "パスワードの設定に失敗しました。");
        setSubmitting(false);
        return;
      }
      await supabase.auth.signOut();
      toast.success("パスワードを設定しました。ログインしてください。");
      router.push("/admin/login");
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
      setSubmitting(false);
    }
  }

  if (sessionState === "loading") {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (sessionState === "invalid") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          リンクが無効か、有効期限が切れています。管理者にパスワード再設定メールの再送を依頼してください。
        </p>
        <Button asChild variant="outline" className="w-full">
          <a href="/admin/login">ログインページへ戻る</a>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新しいパスワード</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新しいパスワード（確認）</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          パスワードを設定する
        </Button>
      </form>
    </Form>
  );
}
