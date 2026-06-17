import { Clock, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AlertBadge } from "@/components/AlertBadge";
import { actionTypeLabel, priorityLabel } from "@/lib/format";
import type { NextBestAction } from "@/lib/types";

export function NextBestActionCard({ action }: { action: NextBestAction }) {
  const tone = action.priority === "urgent" ? "critical" : action.priority === "high" ? "warning" : "cyan";

  return (
    <article className="rounded-lg border border-white/10 bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={tone}>{priorityLabel(action.priority)}</Badge>
            {action.signal_severity ? <AlertBadge severity={action.signal_severity} /> : null}
          </div>
          <h2 className="text-base font-semibold text-text">{action.title}</h2>
        </div>
        <Badge tone="neutral">{actionTypeLabel(action.action_type)}</Badge>
      </div>
      <p className="text-sm leading-6 text-muted">{action.rationale}</p>
      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-muted">
          <UserRound className="h-4 w-4 text-accent" />
          {action.suggested_owner}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4 text-warning" />
          Échéance {action.due_in_days} j
        </div>
      </div>
      {action.signal_title ? <p className="mt-3 text-xs text-muted">Signal lié : {action.signal_title}</p> : null}
    </article>
  );
}
