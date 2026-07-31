"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { updateNotificationSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function NotificationSettingsForm({
  initialEmails,
  initialReminderEnabled,
}: {
  initialEmails: string[];
  initialReminderEnabled: boolean;
}) {
  const router = useRouter();
  const [emails, setEmails] = React.useState<string[]>(initialEmails);
  const [newEmail, setNewEmail] = React.useState("");
  const [reminderEnabled, setReminderEnabled] = React.useState(initialReminderEnabled);
  const [submitting, setSubmitting] = React.useState(false);

  function addEmail() {
    const trimmed = newEmail.trim();
    if (!trimmed) return;
    if (emails.includes(trimmed)) {
      toast.error("既に追加されています。");
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setNewEmail("");
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const result = await updateNotificationSettings({
        adminNotificationEmails: emails,
        reminderEnabled,
      });
      if (!result.success) {
        toast.error(result.error ?? "保存に失敗しました。");
        return;
      }
      toast.success("設定を保存しました。");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">新規予約の通知先メールアドレス</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {emails.length === 0 && <p className="text-sm text-muted-foreground">通知先が設定されていません。</p>}
          {emails.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1 py-1.5">
              {email}
              <button
                type="button"
                onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
                aria-label={`${email}を削除`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="admin@example.jp"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEmail();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addEmail}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">前日リマインドメール</p>
          <p className="text-xs text-muted-foreground">利用日前日に利用者へリマインドメールを自動送信します。</p>
        </div>
        <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
      </div>

      <Button onClick={handleSave} disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        設定を保存
      </Button>
    </div>
  );
}
