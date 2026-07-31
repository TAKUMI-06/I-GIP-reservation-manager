"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  CalendarDays,
  ClipboardList,
  History,
  Settings,
  LogOut,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "@/app/admin/login/actions";
import type { AdminRole } from "@/lib/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard, roles: ["super_admin", "staff"] },
  { href: "/admin/scanner", label: "QR受付", icon: ScanLine, roles: ["super_admin", "staff"] },
  { href: "/admin/reservations", label: "予約一覧", icon: ClipboardList, roles: ["super_admin", "staff"] },
  { href: "/admin/history", label: "入館履歴", icon: History, roles: ["super_admin", "staff"] },
  { href: "/admin/dates", label: "利用可能日管理", icon: CalendarDays, roles: ["super_admin"] },
  { href: "/admin/settings", label: "設定", icon: Settings, roles: ["super_admin"] },
];

export function AdminSidebar({ role, name }: { role: AdminRole; name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = navItems.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    await logoutAdmin();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5 font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <QrCode className="h-4 w-4" />
        </span>
        i-GIP 管理画面
      </div>

      <div className="px-3 pt-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          利用者画面を見る
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-4">
        <p className="mb-1 truncate text-sm font-medium">{name}</p>
        <p className="mb-3 text-xs text-muted-foreground">
          {role === "super_admin" ? "スーパー管理者" : "受付担当"}
        </p>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </aside>
  );
}
