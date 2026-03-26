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
  /** One result → single line. Multiple → overlay comparison. */
  results: SimulationResult[];
}

/**
 * QueueChart — Queue length over simulated time.
 *
 * When comparing mechanisms, all lines share the same time axis (same seed
 * guarantees identical arrival events, making the comparison fair).
 */
export default function QueueChart({ results }: Props) {
  if (results.length === 0) return null;

  // Merge all timeseries onto a shared time axis for overlay comparison.
  // Each entry: { time, fifo?: number, priority?: number, round_robin?: number }
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
      // Find nearest point in this result's timeseries
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

  // Downsample further for rendering performance
  const step = Math.max(1, Math.floor(merged.length / 120));
  const chartData = merged.filter((_, i) => i % step === 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-800">Queue Length Over Time</h3>
      <p className="mb-4 text-sm text-gray-500">
        Number of packets waiting in the buffer at each simulated moment.
        Sustained high values indicate congestion; spikes show burst arrivals.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tickFormatter={(v: number) => `${v.toFixed(1)}s`}
            label={{ value: "Simulation time (s)", position: "insideBottom", offset: -2, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            label={{ value: "Queue length", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number, name: string) => [
              v,
              MECHANISM_LABELS[name as keyof typeof MECHANISM_LABELS] ?? name,
            ]}
            labelFormatter={(l: number) => `Time: ${Number(l).toFixed(2)}s`}
          />
          {results.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {results.map((r) => (
            <Line
              key={r.mechanism}
              type="monotone"
              dataKey={r.mechanism}
              name={r.mechanism}
              stroke={MECHANISM_COLORS[r.mechanism as keyof typeof MECHANISM_COLORS] ?? "#6b7280"}
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
