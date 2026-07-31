import Link from "next/link";
import { QrCode } from "lucide-react";

/** 一般利用者向けページ共通ヘッダー */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-4 w-4" />
          </span>
          i-GIP <span className="font-normal text-muted-foreground text-base">入館管理</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            利用規約
          </Link>
          <Link
            href="/reserve"
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            予約する
          </Link>
        </nav>
      </div>
    </header>
  );
}
