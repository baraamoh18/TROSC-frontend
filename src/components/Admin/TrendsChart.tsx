import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import * as api from "../../services/api";
import type { DashboardStats } from "../../services/api";

type Period = "daily" | "weekly" | "monthly";

const METRICS = [
  { key: "totalUsers", label: "Total users" },
  { key: "newUsers", label: "New users" },
  { key: "totalSubmissions", label: "Submissions" },
  { key: "avgCompletionRate", label: "Avg completion (%)" },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
const LINE_COLOR = "var(--color-primary)";

const formatDate = (iso: string, period: Period) =>
  new Date(iso).toLocaleDateString(undefined, period === "monthly"
    ? { month: "short", year: "numeric" }
    : { month: "short", day: "numeric" });

const formatValue = (value: number, metric: MetricKey) =>
  metric === "avgCompletionRate" ? `${Math.round(value)}%` : value.toLocaleString();

/** Round the max up to a "nice" number so gridlines land on clean values. */
const niceMax = (max: number) => {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= max / 4) ?? 10;
  return Math.ceil(max / (step * pow)) * step * pow;
};

/**
 * Line chart of stored dashboard snapshots (GET /dashboard-stats/trends).
 * One series at a time, so no legend — the metric picker names it.
 */
const TrendsChart: React.FC = () => {
  const [period, setPeriod] = useState<Period>("daily");
  const [metric, setMetric] = useState<MetricKey>("totalUsers");
  const [points, setPoints] = useState<DashboardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const titleId = useId();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .getDashboardTrends(period, 30)
      .then((res) => {
        if (!cancelled) setPoints(res.data?.trends ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const geometry = useMemo(() => {
    const values = points.map((p) => Number(p[metric] ?? 0));
    const yMax = niceMax(Math.max(0, ...values));
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
    const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);
    return { values, x, y, path, ticks };
  }, [points, metric]);

  const nearestIndex = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * WIDTH;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(geometry.x(i) - svgX) < Math.abs(geometry.x(best) - svgX)) best = i;
    }
    return best;
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      setActive((i) => Math.min(points.length - 1, Math.max(0, (i ?? points.length - 1) + delta)));
    }
  };

  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "";
  const btnCls = (on: boolean) =>
    `rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${
      on ? "bg-primary text-white" : "bg-neutral-light text-neutral-dark hover:bg-neutral-light-active"
    }`;

  return (
    <section className="mt-8 rounded-xl border border-neutral-light-active bg-white p-5 shadow-sm sm:p-6">
      <h3 id={titleId} className="text-lg font-bold text-neutral-darker">
        Trends · {metricLabel}
      </h3>

      {/* Controls: one row above the chart */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Period" className="flex gap-1.5">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} className={btnCls(period === p)}>
              {p}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-neutral-dark">
          Metric
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="rounded-lg border border-neutral-light-active bg-white px-3 py-1.5 text-xs font-semibold text-neutral-darker focus:border-primary focus:outline-none"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={`relative mt-4 transition-opacity ${loading && points.length > 0 ? "opacity-50" : ""}`}>
        {loading && points.length === 0 ? (
          <div className="h-[220px] animate-pulse rounded-xl bg-gray-100" />
        ) : error ? (
          <p className="flex h-[160px] items-center justify-center text-sm text-neutral-dark">
            Couldn't load trends.
          </p>
        ) : points.length === 0 ? (
          <p className="flex h-[160px] items-center justify-center rounded-xl border border-dashed border-neutral-light-active px-6 text-center text-sm text-neutral-dark">
            No {period} snapshots have been recorded yet. Trends appear once the
            backend stores stats snapshots.
          </p>
        ) : (
          <>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
              role="img"
              aria-labelledby={titleId}
              tabIndex={0}
              onPointerMove={(e) => setActive(nearestIndex(e.clientX))}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive((i) => i ?? points.length - 1)}
              onBlur={() => setActive(null)}
              onKeyDown={handleKey}
            >
              {/* Recessive grid + y labels */}
              {geometry.ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={WIDTH - PAD.right} y1={geometry.y(t)} y2={geometry.y(t)} stroke="var(--color-neutral-light-active)" strokeWidth={1} />
                  <text x={PAD.left - 8} y={geometry.y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--color-neutral-dark)">
                    {formatValue(t, metric)}
                  </text>
                </g>
              ))}
              {/* First/last x labels only */}
              {[0, points.length - 1].filter((i, idx, arr) => arr.indexOf(i) === idx).map((i) => (
                <text key={i} x={geometry.x(i)} y={HEIGHT - 8} textAnchor={points.length === 1 ? "middle" : i === 0 ? "start" : "end"} fontSize={11} fill="var(--color-neutral-dark)">
                  {formatDate(points[i].date ?? points[i].createdAt, period)}
                </text>
              ))}
              <path d={geometry.path} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {points.length === 1 && (
                <circle cx={geometry.x(0)} cy={geometry.y(geometry.values[0])} r={4} fill={LINE_COLOR} />
              )}
              {active !== null && (
                <g pointerEvents="none">
                  <line x1={geometry.x(active)} x2={geometry.x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--color-neutral)" strokeWidth={1} />
                  <circle cx={geometry.x(active)} cy={geometry.y(geometry.values[active])} r={5} fill={LINE_COLOR} stroke="white" strokeWidth={2} />
                </g>
              )}
            </svg>

            {active !== null && (
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-neutral-light-active bg-white px-3 py-2 text-xs shadow-md"
                style={{ left: `${(geometry.x(active) / WIDTH) * 100}%` }}
                role="status"
              >
                <p className="text-sm font-bold text-neutral-darker">
                  {formatValue(geometry.values[active], metric)}
                </p>
                <p className="flex items-center gap-1.5 text-neutral-dark">
                  <span className="inline-block h-0.5 w-3 rounded bg-primary" aria-hidden="true" />
                  {metricLabel} · {formatDate(points[active].date ?? points[active].createdAt, period)}
                </p>
              </div>
            )}

            {/* Table view so values don't depend on hovering */}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-neutral-dark hover:text-neutral-darker">
                Show as table
              </summary>
              <table className="mt-2 w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-light-active text-neutral-dark">
                    <th scope="col" className="py-1.5 font-semibold">Date</th>
                    <th scope="col" className="py-1.5 text-right font-semibold">{metricLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={p._id ?? i} className="border-b border-neutral-light last:border-0">
                      <td className="py-1.5 text-neutral-darker">{formatDate(p.date ?? p.createdAt, period)}</td>
                      <td className="py-1.5 text-right font-semibold text-neutral-darker">{formatValue(geometry.values[i], metric)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>
    </section>
  );
};

export default TrendsChart;
