import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/lib/types/database";

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  if (status === "checked_in") {
    return <Badge variant="success">入館済み</Badge>;
  }
  return <Badge variant="secondary">未入館</Badge>;
}
