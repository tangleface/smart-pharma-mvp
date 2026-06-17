"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BreakdownPoint } from "@/lib/types";
import { severityLabel } from "@/lib/format";

const COLORS: Record<string, string> = {
  critical: "#FF4D4F",
  high: "#FF9F43",
  medium: "#00D1FF",
  low: "#00C48C"
};

export function SeverityDistributionChart({ data }: { data: BreakdownPoint[] }) {
  return (
    <div className="h-72 rounded-lg border border-white/10 bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-text">Distribution des sévérités</h2>
      <ResponsiveContainer width="100%" height="72%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={4}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? "#9CA3AF"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, severityLabel(String(name))]}
            contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F7FA" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[entry.name] ?? "#9CA3AF" }} />
            {severityLabel(entry.name)} ({entry.value})
          </div>
        ))}
      </div>
    </div>
  );
}
