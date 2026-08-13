"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { addAdminUserSchema } from "@/lib/validations/admin";
import { addAdminUser, deleteAdminUser } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatJst } from "@/lib/date";
import type { AdminUserRow } from "@/lib/types/database";

type FormValues = { name: string; email: string; role: "super_admin" | "staff" | "sub_admin"; password: string };

export function AdminUsersManager({
  adminUsers,
  currentAdminId,
}: {
  adminUsers: AdminUserRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(addAdminUserSchema),
    defaultValues: { name: "", email: "", role: "staff", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result = await addAdminUser(values);
      if (!result.success) {
        toast.error(result.error ?? "追加に失敗しました。");
        return;
      }
      toast.success("管理者を追加しました。");
      form.reset({ name: "", email: "", role: "staff", password: "" });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAdminUser(id);
    if (!result.success) {
      toast.error(result.error ?? "削除に失敗しました。");
      return;
    }
    toast.success("削除しました。");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>氏名</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>役割</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="staff">受付担当</SelectItem>
                    <SelectItem value="sub_admin">サブ管理者</SelectItem>
                    <SelectItem value="super_admin">スーパー管理者</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>初期パスワード</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="8文字以上" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              管理者を追加
            </Button>
          </div>
        </form>
      </Form>

      <Separator />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>役割</TableHead>
            <TableHead>追加日</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminUsers.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell className="font-medium">
                {admin.name}
                {admin.id === currentAdminId && (
                  <span className="ml-2 text-xs text-muted-foreground">(自分)</span>
                )}
              </TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                {admin.role === "super_admin" ? (
                  <Badge>スーパー管理者</Badge>
                ) : admin.role === "sub_admin" ? (
                  <Badge variant="outline">サブ管理者</Badge>
                ) : (
                  <Badge variant="secondary">受付担当</Badge>
                )}
              </TableCell>
              <TableCell>{formatJst(admin.created_at, "yyyy/M/d")}</TableCell>
              <TableCell className="text-right">
                {admin.id !== currentAdminId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-danger hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>管理者を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          {admin.name}（{admin.email}）を削除します。この操作は取り消せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(admin.id)}>削除する</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
