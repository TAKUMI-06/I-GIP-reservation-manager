"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, QrCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "@/app/admin/login/actions";
import type { AdminRole } from "@/lib/types/database";

const items: { href: string; label: string; roles: AdminRole[] }[] = [
  { href: "/admin", label: "ダッシュボード", roles: ["super_admin", "staff"] },
  { href: "/admin/scanner", label: "QR受付", roles: ["super_admin", "staff"] },
  { href: "/admin/reservations", label: "予約一覧", roles: ["super_admin", "staff"] },
  { href: "/admin/history", label: "入館履歴", roles: ["super_admin", "staff"] },
  { href: "/admin/dates", label: "利用可能日管理", roles: ["super_admin"] },
  { href: "/admin/settings", label: "設定", roles: ["super_admin"] },
];

export function AdminMobileNav({ role }: { role: AdminRole }) {
  const router = useRouter();
  const visible = items.filter((i) => i.roles.includes(role));

  async function handleLogout() {
    await logoutAdmin();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-border/60 bg-white px-4 md:hidden">
      <div className="flex items-center gap-2 font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <QrCode className="h-4 w-4" />
        </span>
        i-GIP 管理画面
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {visible.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-danger">
            <LogOut className="h-4 w-4" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
