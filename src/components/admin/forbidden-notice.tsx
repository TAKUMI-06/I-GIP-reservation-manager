import { ShieldX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** 権限不足時に表示する共通UI（スーパー管理者専用ページへ受付担当がアクセスした場合など） */
export function ForbiddenNotice() {
  return (
    <Alert variant="danger">
      <ShieldX className="h-4 w-4" />
      <AlertTitle>権限がありません</AlertTitle>
      <AlertDescription>
        このページはスーパー管理者のみ閲覧できます。必要な場合はスーパー管理者にお問い合わせください。
      </AlertDescription>
    </Alert>
  );
}
