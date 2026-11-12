"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatMonth } from "@/lib/format"

export function ComplianceChart({
  data,
}: {
  data: { month: string; on_time: number; late: number; missed: number }[]
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tickFormatter={(m) => formatMonth(m).split(" ")[0]} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(m: unknown) => formatMonth(m as string)} />
        <Legend />
        <Bar dataKey="on_time" name="On Time" stackId="a" fill="#16a34a" />
        <Bar dataKey="late" name="Late" stackId="a" fill="#d97706" />
        <Bar dataKey="missed" name="Missed" stackId="a" fill="#dc2626" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
