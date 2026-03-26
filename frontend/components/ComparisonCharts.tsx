"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationResult } from "@/types/simulation";
import { MECHANISM_COLORS, MECHANISM_LABELS } from "@/types/simulation";

interface Props {
  results: SimulationResult[];
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function labelOf(mech: string): string {
  return MECHANISM_LABELS[mech as keyof typeof MECHANISM_LABELS] ?? mech;
}

function colorOf(mech: string): string {
  return MECHANISM_COLORS[mech as keyof typeof MECHANISM_COLORS] ?? "#6b7280";
}

/** Generic bar chart for a single metric across all mechanisms. */
function MechanismBarChart({
  data,
  dataKey,
  label,
  formatter,
  description,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  label: string;
  formatter: (v: number) => string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-800">{label}</h3>
      <p className="mb-4 text-sm text-gray-500">{description}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatter(v)} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name as string} fill={colorOf(entry.mech as string)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Priority delay split chart (high vs low within one result). */
function PriorityDelayChart({ result }: { result: SimulationResult }) {
  const { summary } = result;
  if (summary.high_priority_avg_delay == null && summary.low_priority_avg_delay == null)
    return null;

  const data = [
    {
      name: "High Priority",
      delay: summary.high_priority_avg_delay ?? 0,
      fill: "#f59e0b",
    },
    {
      name: "Low Priority",
      delay: summary.low_priority_avg_delay ?? 0,
      fill: "#3b82f6",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-800">Delay by Traffic Class</h3>
      <p className="mb-4 text-sm text-gray-500">
        Average end-to-end delay (sojourn time) split between high-priority and
        low-priority packets. A large gap indicates that the scheduler
        differentiates classes significantly.
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `${v.toFixed(2)}s`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v: number) => `${Number(v).toFixed(3)} s`} />
          <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ComparisonCharts({ results }: Props) {
  if (results.length === 0) return null;

  const baseData = results.map((r) => ({
    name: labelOf(r.mechanism),
    mech: r.mechanism,
    avg_delay:  r.summary.avg_delay,
    throughput: r.summary.throughput,
    drop_rate:  r.summary.drop_rate,
    fairness:   r.summary.jains_fairness ?? 1,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MechanismBarChart
          data={baseData}
          dataKey="avg_delay"
          label="Average End-to-End Delay"
          formatter={(v) => `${v.toFixed(3)} s`}
          description="Lower is better. Priority scheduling reduces average delay by serving urgent packets first; FIFO ignores packet class."
        />
        <MechanismBarChart
          data={baseData}
          dataKey="throughput"
          label="Throughput"
          formatter={(v) => `${v.toFixed(2)} pkt/s`}
          description="Packets successfully served per second. Drops reduce effective throughput; the scheduler choice affects this under congestion."
        />
        <MechanismBarChart
          data={baseData}
          dataKey="drop_rate"
          label="Packet Drop Rate"
          formatter={pct}
          description="Fraction of packets dropped due to a full buffer. High drop rates signal that the link (service rate) is undersized for the offered load."
        />
        <MechanismBarChart
          data={baseData}
          dataKey="fairness"
          label="Jain's Fairness Index"
          formatter={(v) => v.toFixed(3)}
          description="Jain's index ranges from 1/n to 1. A value near 1 means all packets experience similar delays (fair). Priority typically scores lower than FIFO or Round Robin."
        />
      </div>

      {/* Per-class delay breakdown for each mechanism */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {results.map((r) => (
          <PriorityDelayChart key={r.mechanism} result={r} />
        ))}
      </div>
    </div>
  );
}
