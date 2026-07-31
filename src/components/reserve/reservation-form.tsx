"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { reservationFormSchema, type ReservationFormValues } from "@/lib/validations/reservation";
import { createReservation } from "@/app/reserve/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatJst } from "@/lib/date";
import type { AvailableDateRow } from "@/lib/types/database";

interface ReservationFormProps {
  availableDates: AvailableDateRow[];
}

export function ReservationForm({ availableDates }: ReservationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      availableDateId: "",
      name: "",
      teamName: "",
      email: "",
      phone: "",
      termsAgreed: undefined as unknown as true,
    },
  });

  async function onSubmit(values: ReservationFormValues) {
    setSubmitting(true);
    try {
      const result = await createReservation(values);
      if (!result.success || !result.reservationId) {
        toast.error(result.error ?? "予約に失敗しました。");
        setSubmitting(false);
        return;
      }
      toast.success("予約が完了しました。");
      router.push(`/reservation/${result.reservationId}`);
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。ネットワーク状況をご確認の上、再度お試しください。");
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="availableDateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>利用日</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="利用日を選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableDates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {formatJst(d.date, "yyyy年M月d日(E)")}
                      {d.note ? `（${d.note}）` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>氏名</FormLabel>
              <FormControl>
                <Input placeholder="山田 太郎" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>チーム名</FormLabel>
              <FormControl>
                <Input placeholder="〇〇高等学校 サッカー部" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@i-gip.jp" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="090-1234-5678" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termsAgreed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
              <FormControl>
                <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
                    利用規約
                  </Link>
                  に同意する
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          予約を確定する
        </Button>
      </form>
    </Form>
  );
}
