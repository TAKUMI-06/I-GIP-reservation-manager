"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { addAvailableDateSchema } from "@/lib/validations/admin";
import { addAvailableDate } from "@/lib/actions/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toDateOnlyString } from "@/lib/date";

type FormValues = { date: string; note?: string };

export function AddDateForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(addAvailableDateSchema),
    defaultValues: { date: toDateOnlyString(new Date()), note: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result = await addAvailableDate(values);
      if (!result.success) {
        toast.error(result.error ?? "追加に失敗しました。");
        return;
      }
      toast.success("利用可能日を追加しました。");
      form.reset({ date: values.date, note: "" });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>日付</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>メモ（任意）</FormLabel>
              <FormControl>
                <Input placeholder="団体優先枠 など" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          追加
        </Button>
      </form>
    </Form>
  );
}
