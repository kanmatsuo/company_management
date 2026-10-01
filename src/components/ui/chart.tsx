"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartRow = Record<string, string | number | null | undefined>;

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
};

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
};

/** Shared bar chart. Pass rows and series; set `stacked` or `layout="vertical"` when the case needs it. */
export function SeriesChart({
  data,
  series,
  height = 280,
  layout = "horizontal",
  stacked = false,
  categoryKey = "name",
}: {
  data: ChartRow[];
  series: ChartSeries[];
  height?: number;
  layout?: "horizontal" | "vertical";
  stacked?: boolean;
  categoryKey?: string;
}) {
  const router = useRouter();
  const vertical = layout === "vertical";
  if (data.length === 0) return <p className="text-muted-foreground text-sm">No numbers for this chart.</p>;
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={vertical ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, left: vertical ? 12 : 0, bottom: 0 }}
          onClick={(state) => {
            const index = state?.activeTooltipIndex;
            const row = typeof index === "number" ? data[index] : undefined;
            if (typeof row?.href === "string") router.push(row.href);
          }}
        >
          <CartesianGrid stroke="var(--border)" vertical={!vertical} horizontal={vertical} />
          {vertical ? (
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
          ) : (
            <XAxis dataKey={categoryKey} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} interval={0} />
          )}
          {vertical ? (
            <YAxis type="category" dataKey={categoryKey} width={120} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
          ) : (
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} width={40} />
          )}
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Legend wrapperStyle={{ color: "var(--foreground)", fontSize: 12 }} />
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={item.color}
              stackId={stacked ? "stack" : undefined}
              radius={stacked ? 0 : 4}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
