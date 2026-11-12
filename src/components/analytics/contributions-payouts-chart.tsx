"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatPKR, formatMonth } from "@/lib/format"

export function ContributionsPayoutsChart({
  data,
}: {
  data: { month: string; in: number; out: number }[]
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tickFormatter={(m) => formatMonth(m).split(" ")[0]} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: unknown) => formatPKR(v as number)} labelFormatter={(m: unknown) => formatMonth(m as string)} />
        <Legend />
        <Bar dataKey="in" name="Contributions" fill="#16a34a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="out" name="Payouts" fill="#dc2626" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
