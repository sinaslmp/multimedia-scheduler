"use client";

import MetricCard from "./MetricCard";
import QueueChart from "./QueueChart";
import ComparisonCharts from "./ComparisonCharts";
import type { ComparisonResult, SimulationResult } from "@/types/simulation";
import { MECHANISM_LABELS } from "@/types/simulation";

interface Props {
  single: SimulationResult | null;
  comparison: ComparisonResult | null;
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}`;
}

function SingleResults({ result }: { result: SimulationResult }) {
  const s = result.summary;
  const mechLabel = MECHANISM_LABELS[result.mechanism as keyof typeof MECHANISM_LABELS] ?? result.mechanism;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800">
          Results — {mechLabel}
        </h2>
        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
          {s.served_count} served / {s.dropped_count} dropped
        </span>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          label="Avg. Waiting Time"
          value={s.avg_waiting_time.toFixed(3)}
          unit="s"
          tone="blue"
          hint="Mean time a packet spends in the buffer before service begins"
        />
        <MetricCard
          label="Avg. End-to-End Delay"
          value={s.avg_delay.toFixed(3)}
          unit="s"
          tone="blue"
          hint="Mean sojourn time = waiting + service time (key QoS metric)"
        />
        <MetricCard
          label="Throughput"
          value={s.throughput.toFixed(2)}
          unit="pkt/s"
          tone="green"
          hint="Packets successfully delivered per second"
        />
        <MetricCard
          label="Drop Rate"
          value={pct(s.drop_rate)}
          unit="%"
          tone={s.drop_rate > 0.1 ? "red" : s.drop_rate > 0.02 ? "amber" : "green"}
          hint="Fraction of packets dropped due to buffer overflow"
        />
        {s.high_priority_avg_delay != null && (
          <MetricCard
            label="High-Priority Delay"
            value={s.high_priority_avg_delay.toFixed(3)}
            unit="s"
            tone="amber"
            hint="Average delay experienced by high-priority (class 1) packets"
          />
        )}
        {s.low_priority_avg_delay != null && (
          <MetricCard
            label="Low-Priority Delay"
            value={s.low_priority_avg_delay.toFixed(3)}
            unit="s"
            tone="violet"
            hint="Average delay experienced by low-priority (class 0) packets"
          />
        )}
        {s.jains_fairness != null && (
          <MetricCard
            label="Jain's Fairness"
            value={s.jains_fairness.toFixed(3)}
            tone={s.jains_fairness > 0.9 ? "green" : s.jains_fairness > 0.7 ? "amber" : "red"}
            hint="Jain's index: 1 = perfectly fair, lower = more unequal delay distribution"
          />
        )}
      </div>

      {/* Queue length chart */}
      <QueueChart results={[result]} />

      {/* Priority delay breakdown */}
      {(s.high_priority_avg_delay != null || s.low_priority_avg_delay != null) && (
        <ComparisonCharts results={[result]} />
      )}
    </section>
  );
}

function ComparisonResults({ data }: { data: ComparisonResult }) {
  const allResults = [data.fifo, data.priority, data.round_robin];

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">
        Mechanism Comparison — Same Traffic Stream
      </h2>
      <p className="text-sm text-gray-500">
        All three schedulers processed identical packets (same random seed). Any
        difference in metrics is caused solely by the scheduling discipline.
      </p>

      {/* Per-mechanism summary rows */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {allResults.map((r) => {
          const s = r.summary;
          const label = MECHANISM_LABELS[r.mechanism as keyof typeof MECHANISM_LABELS] ?? r.mechanism;
          return (
            <div key={r.mechanism} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
              <h3 className="font-semibold text-gray-800">{label}</h3>
              <div className="text-sm space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Avg. Delay</span>
                  <span className="font-mono font-medium">{s.avg_delay.toFixed(3)} s</span>
                </div>
                <div className="flex justify-between">
                  <span>Throughput</span>
                  <span className="font-mono font-medium">{s.throughput.toFixed(2)} pkt/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Drop Rate</span>
                  <span className="font-mono font-medium">{pct(s.drop_rate)} %</span>
                </div>
                {s.jains_fairness != null && (
                  <div className="flex justify-between">
                    <span>Fairness</span>
                    <span className="font-mono font-medium">{s.jains_fairness.toFixed(3)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlaid queue chart */}
      <QueueChart results={allResults} />

      {/* Comparison bar charts */}
      <ComparisonCharts results={allResults} />
    </section>
  );
}

export default function ResultsSection({ single, comparison }: Props) {
  if (!single && !comparison) return null;

  return (
    <div id="results" className="space-y-8">
      <hr className="border-gray-200" />
      {single && <SingleResults result={single} />}
      {comparison && <ComparisonResults data={comparison} />}
    </div>
  );
}
