"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/types";

export function SignalTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 rounded-lg border border-white/10 bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-text">Tendance des signaux</h2>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#00D1FF" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F7FA" }} />
          <Area type="monotone" dataKey="signals" stroke="#00D1FF" fill="url(#trend)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
