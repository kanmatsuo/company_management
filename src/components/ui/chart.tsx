"use client";

import { BrandMark } from "@/components/brand-mark";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Axis label for a value: full below 10,000, compact (14K, 1.2M) above. */
function formatTick(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  return Math.abs(number) < 10000 ? number.toLocaleString("en-US") : compact.format(number);
}

/** Axis width that fits the longest value label (about 7px per character at 12px). */
function valueAxisWidth(data: ChartRow[], series: ChartSeries[], stacked: boolean) {
  let max = 0;
  for (const row of data) {
    const values = series.map((item) => Math.abs(Number(row[item.key]) || 0));
    max = Math.max(max, stacked ? values.reduce((sum, value) => sum + value, 0) : Math.max(0, ...values));
  }
  // Recharts rounds the top tick up, so size for a little headroom.
  return Math.max(32, formatTick(Math.ceil(max * 1.25)).length * 7 + 12);
}

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
  const valueWidth = valueAxisWidth(data, series, stacked);
  // Recharts draws nothing until the browser has measured the container: spin until then.
  const [measured, setMeasured] = useState(false);
  if (data.length === 0) return <p className="text-muted-foreground text-sm">No numbers for this chart.</p>;
  return (
    <div className="relative w-full" style={{ height }}>
      {measured ? null : (
        <div role="status" className="absolute inset-0 flex items-center justify-center">
          <BrandMark className="size-10 text-muted-foreground" />
          <span className="sr-only">Loading chart…</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%" onResize={(width) => width > 0 && setMeasured(true)}>
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
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} tickFormatter={formatTick} />
          ) : (
            <XAxis
              dataKey={categoryKey}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={12}
              tickMargin={6}
            />
          )}
          {vertical ? (
            <YAxis type="category" dataKey={categoryKey} width={120} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
          ) : (
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              allowDecimals={false}
              tickFormatter={formatTick}
              width={valueWidth}
            />
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
