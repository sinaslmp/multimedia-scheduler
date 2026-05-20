"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationResult } from "@/types/simulation";
import { MECHANISM_COLORS, MECHANISM_LABELS } from "@/types/simulation";

interface Props {
  /** One result → per-class breakdown. Multiple → overlay comparison. */
  results: SimulationResult[];
}

/**
 * Single-result mode: two lines — multimedia (high-priority) vs regular (low-priority).
 * Comparison mode: one aggregate line per mechanism, same as before.
 */
export default function QueueChart({ results }: Props) {
  if (results.length === 0) return null;

  if (results.length === 1) {
    return <SingleClassChart result={results[0]} />;
  }

  return <ComparisonChart results={results} />;
}

// ── Single result: high vs low timeseries ─────────────────────────────────────

function SingleClassChart({ result }: { result: SimulationResult }) {
  const pts = result.queue_timeseries;
  const step = Math.max(1, Math.floor(pts.length / 120));
  const isFifo = result.mechanism === "fifo";

  const mechLabel =
    MECHANISM_LABELS[result.mechanism as keyof typeof MECHANISM_LABELS] ??
    result.mechanism;

  // FIFO makes no class distinction — show total queue only to avoid
  // a misleading visual split that is purely proportional to packet fraction.
  if (isFifo) {
    const chartData = pts
      .filter((_, i) => i % step === 0)
      .map((p) => ({ time: p.time, total: p.queue_length }));

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-semibold text-gray-800">
          Queue Length Over Time — {mechLabel}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          FIFO serves packets in strict arrival order with{" "}
          <span className="font-medium">no class distinction</span> — all
          traffic shares a single queue regardless of type.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tickFormatter={(v: number) => `${v.toFixed(1)}s`}
              label={{
                value: "Simulation time (s)",
                position: "insideBottom",
                offset: -2,
                fontSize: 11,
              }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              label={{
                value: "Packets in queue",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fontSize: 11,
              }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(v: number) => [v, "Queue length"]}
              labelFormatter={(l: number) => `Time: ${Number(l).toFixed(2)}s`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="total"
              name="Queue length (all traffic)"
              stroke="#6b7280"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Priority / Round Robin: per-class split is meaningful here
  const chartData = pts
    .filter((_, i) => i % step === 0)
    .map((p) => ({
      time: p.time,
      multimedia: p.high_queue,
      regular: p.low_queue,
    }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-800">
        Queue Length Over Time — {mechLabel}
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Packets waiting in the buffer, split by traffic class.{" "}
        <span className="font-medium text-amber-600">Multimedia</span>{" "}
        (high-priority) vs{" "}
        <span className="font-medium text-blue-600">Regular</span>{" "}
        (low-priority).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tickFormatter={(v: number) => `${v.toFixed(1)}s`}
            label={{
              value: "Simulation time (s)",
              position: "insideBottom",
              offset: -2,
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            label={{
              value: "Packets in queue",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number, name: string) => [
              v,
              name === "multimedia" ? "Multimedia (High-Priority)" : "Regular (Low-Priority)",
            ]}
            labelFormatter={(l: number) => `Time: ${Number(l).toFixed(2)}s`}
          />
          <Legend
            formatter={(value) =>
              value === "multimedia"
                ? "Multimedia (High-Priority)"
                : "Regular (Low-Priority)"
            }
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="multimedia"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="regular"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Comparison mode: aggregate queue per mechanism ────────────────────────────

function ComparisonChart({ results }: { results: SimulationResult[] }) {
  const merged: Record<string, number | undefined>[] = [];
  const timeSet = new Set<number>();

  for (const r of results) {
    for (const pt of r.queue_timeseries) {
      timeSet.add(pt.time);
    }
  }

  const sortedTimes = Array.from(timeSet).sort((a, b) => a - b);

  for (const t of sortedTimes) {
    const entry: Record<string, number | undefined> = { time: t };
    for (const r of results) {
      const pts = r.queue_timeseries;
      let nearest = pts[0];
      for (const pt of pts) {
        if (Math.abs(pt.time - t) < Math.abs(nearest.time - t)) {
          nearest = pt;
        }
      }
      entry[r.mechanism] = nearest?.queue_length;
    }
    merged.push(entry);
  }

  const step = Math.max(1, Math.floor(merged.length / 120));
  const chartData = merged.filter((_, i) => i % step === 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-800">Queue Length Over Time</h3>
      <p className="mb-4 text-sm text-gray-500">
        Total packets waiting in the buffer for each scheduling mechanism.
        All three ran on the same traffic stream (same seed).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tickFormatter={(v: number) => `${v.toFixed(1)}s`}
            label={{
              value: "Simulation time (s)",
              position: "insideBottom",
              offset: -2,
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            label={{
              value: "Queue length",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number, name: string) => [
              v,
              MECHANISM_LABELS[name as keyof typeof MECHANISM_LABELS] ?? name,
            ]}
            labelFormatter={(l: number) => `Time: ${Number(l).toFixed(2)}s`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {results.map((r) => (
            <Line
              key={r.mechanism}
              type="monotone"
              dataKey={r.mechanism}
              name={r.mechanism}
              stroke={
                MECHANISM_COLORS[r.mechanism as keyof typeof MECHANISM_COLORS] ??
                "#6b7280"
              }
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
