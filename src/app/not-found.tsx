import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="text-muted-foreground">
        お探しのページは存在しないか、移動または削除された可能性があります。
      </p>
      <Button asChild>
        <Link href="/">トップページへ戻る</Link>
      </Button>
    </div>
  );
}
