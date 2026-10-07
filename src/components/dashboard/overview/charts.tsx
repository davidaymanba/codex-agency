"use client";

import { useFormatter } from "next-intl";
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";

/**
 * Overview charts. Every chart is ONE measure → ONE hue (brand blue via `--link`, which is
 * blue-600 in light and blue-400 in dark — both ≥ 3:1 on their surfaces). No dual axes,
 * recessive grid, crosshair/hover tooltips, values in text tokens. Bars mirror in RTL.
 */

const AXIS = { fontSize: 11, fill: "var(--fg-muted)" } as const;
const ANIM = 700;

function TipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-fg-muted">{title}</p>
      <p className="mt-0.5 text-sm font-medium text-fg tabular-nums" dir="ltr">
        {value}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- Leads over time */

export function LeadsOverTime({
  data,
  seriesLabel,
}: {
  data: { date: string; leads: number }[];
  seriesLabel: string;
}) {
  return (
    <TimeSeries
      data={data.map((d) => ({ date: d.date, value: d.leads }))}
      seriesLabel={seriesLabel}
    />
  );
}

/** Single-measure area chart over days (weekly buckets beyond 45 points). */
export function TimeSeries({
  data,
  seriesLabel,
}: {
  data: { date: string; value: number }[];
  seriesLabel: string;
}) {
  const format = useFormatter();
  const { isRTL } = useDirection();
  const reduced = usePrefersReducedMotion();
  // 90-day ranges read better as weekly buckets.
  const points =
    data.length > 45
      ? Array.from({ length: Math.ceil(data.length / 7) }, (_, i) => {
          const chunk = data.slice(i * 7, i * 7 + 7);
          return { date: chunk[0].date, value: chunk.reduce((s, d) => s + d.value, 0) };
        })
      : data;
  const gradId = `ts-${useId().replace(/:/g, "")}`;
  const label = (d: string) =>
    format.dateTime(new Date(d), { month: "short", day: "numeric", numberingSystem: "latn" });

  return (
    // SVG text anchoring breaks under dir=rtl, so the SVG is always LTR; RTL mirroring is done
    // through the axes (`reversed` X, right-hand Y) instead.
    <div className="h-64" role="img" aria-label={seriesLabel} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--link)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--link)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            tickFormatter={label}
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            reversed={isRTL}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={28}
            orientation={isRTL ? "right" : "left"}
          />
          <Tooltip
            cursor={{ stroke: "var(--fg-muted)", strokeDasharray: "3 3" }}
            content={({ active, payload }: TooltipContentProps<ValueType, NameType>) =>
              active && payload?.length ? (
                <TipBox
                  title={label(String(payload[0].payload.date))}
                  value={`${payload[0].value} ${seriesLabel}`}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--link)"
            strokeWidth={2}
            fill={`url(#${gradId})`}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--link)" }}
            isAnimationActive={!reduced}
            animationDuration={ANIM}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------------------------------------------- Horizontal bars */

export function HBars({
  data,
  valueLabel,
  percent,
  height,
}: {
  data: { label: string; value: number }[];
  valueLabel: string;
  percent?: boolean;
  height?: number;
}) {
  const { isRTL } = useDirection();
  const reduced = usePrefersReducedMotion();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const fmt = (v: number) =>
    percent ? `${Math.round((v / total) * 100)}%` : new Intl.NumberFormat("en-US").format(v);
  const h = height ?? Math.max(120, data.length * 40);

  return (
    <div style={{ height: h }} role="img" aria-label={valueLabel} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 40, bottom: 0 }}
          barCategoryGap={8}
        >
          <XAxis type="number" hide reversed={isRTL} />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ ...AXIS, fill: "var(--fg)" }}
            axisLine={false}
            tickLine={false}
            orientation={isRTL ? "right" : "left"}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }: TooltipContentProps<ValueType, NameType>) =>
              active && payload?.length ? (
                <TipBox
                  title={String(payload[0].payload.label)}
                  value={`${fmt(Number(payload[0].value))} · ${valueLabel}`}
                />
              ) : null
            }
          />
          <Bar
            dataKey="value"
            fill="var(--link)"
            maxBarSize={18}
            radius={isRTL ? [4, 0, 0, 4] : [0, 4, 4, 0]}
            isAnimationActive={!reduced}
            animationDuration={ANIM}
            // Value label drawn at the bar's free end (left end in RTL, right end in LTR).
            label={(p: {
              x?: number | string;
              y?: number | string;
              width?: number | string;
              height?: number | string;
              value?: unknown;
            }) => {
              const x = Number(p.x),
                y = Number(p.y),
                w = Number(p.width),
                hgt = Number(p.height);
              // With a reversed axis the bar's width can be negative — use its true extent.
              const left = Math.min(x, x + w),
                right = Math.max(x, x + w);
              return (
                <text
                  x={isRTL ? left - 6 : right + 6}
                  y={y + hgt / 2}
                  dy="0.35em"
                  textAnchor={isRTL ? "end" : "start"}
                  fill="var(--fg-muted)"
                  fontSize={11}
                >
                  {fmt(Number(p.value))}
                </text>
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
