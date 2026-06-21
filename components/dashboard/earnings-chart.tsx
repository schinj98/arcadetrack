"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface ChartData {
  month: string
  earnings: number
}

export function EarningsChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v}`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), "Cleared Earnings"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
          labelStyle={{ color: "#374151", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="earnings"
          stroke="#4f46e5"
          strokeWidth={2}
          fill="url(#earningsGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
