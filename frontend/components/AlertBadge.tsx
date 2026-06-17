import { Badge } from "@/components/ui/Badge";
import type { Severity } from "@/lib/types";
import { severityLabel } from "@/lib/format";

export function AlertBadge({ severity }: { severity: Severity | string }) {
  const tone =
    severity === "critical" ? "critical" : severity === "high" ? "warning" : severity === "medium" ? "cyan" : "success";
  return <Badge tone={tone}>{severityLabel(severity)}</Badge>;
}
