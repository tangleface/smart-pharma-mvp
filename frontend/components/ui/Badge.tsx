import type { ReactNode } from "react";

type BadgeTone = "neutral" | "cyan" | "warning" | "critical" | "success";

const tones = {
  neutral: "border-white/10 bg-white/5 text-muted",
  cyan: "border-accent/30 bg-accent/10 text-accent",
  warning: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-critical/30 bg-critical/10 text-critical",
  success: "border-success/30 bg-success/10 text-success"
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

