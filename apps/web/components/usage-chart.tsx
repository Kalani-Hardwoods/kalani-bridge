"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"

const data = [
  { month: "Mar", spend: 2.14 },
  { month: "Apr", spend: 3.02 },
  { month: "May", spend: 2.88 },
  { month: "Jun", spend: 3.61 },
  { month: "Jul", spend: 4.12 },
  { month: "Aug", spend: 3.94 },
]

const config = {
  spend: { label: "Spend (USD)", color: "var(--chart-2)" },
} satisfies ChartConfig

export function UsageChart() {
  return (
    <ChartContainer config={config} className="aspect-[16/7] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-spend)"
              stopOpacity={0.4}
            />
            <stop
              offset="100%"
              stopColor="var(--color-spend)"
              stopOpacity={0.04}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => `$${v}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="spend"
          type="monotone"
          stroke="var(--color-spend)"
          strokeWidth={2}
          fill="url(#fillSpend)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
