import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} i-GIP 入館管理</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            利用規約
          </Link>
          <Link href="/admin/login" className="hover:text-foreground transition-colors">
            管理者ログイン
          </Link>
        </div>
      </div>
    </footer>
  );
}
