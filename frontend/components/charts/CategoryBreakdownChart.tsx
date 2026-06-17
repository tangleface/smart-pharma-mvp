"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BreakdownPoint } from "@/lib/types";
import { categoryLabel } from "@/lib/format";

export function CategoryBreakdownChart({ data }: { data: BreakdownPoint[] }) {
  const formatted = data.map((item) => ({ ...item, label: categoryLabel(item.name) }));

  return (
    <div className="h-72 rounded-lg border border-white/10 bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-text">Répartition par signal</h2>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={formatted}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F7FA" }} />
          <Bar dataKey="value" fill="#00D1FF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
