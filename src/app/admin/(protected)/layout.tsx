import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

/**
 * /admin 配下の共通レイアウト。
 * requireAdmin() が未ログイン時に /admin/login へリダイレクトする。
 * ロール別のナビゲーション出し分けはサイドバー/モバイルナビ側で行う。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <div className="hidden md:flex">
        <AdminSidebar role={admin.role} name={admin.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav role={admin.role} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
