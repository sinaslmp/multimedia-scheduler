// ─── Shared types mirroring the backend Pydantic schemas ─────────────────────

export type Mechanism = "fifo" | "priority" | "round_robin";

export interface SimulationConfig {
  mechanism: Mechanism;
  num_packets: number;
  arrival_rate: number;
  service_rate: number;
  buffer_size: number;
  high_priority_fraction: number;
  seed: number | null;
}

export interface CompareConfig extends Omit<SimulationConfig, "mechanism"> {}

export interface SummaryMetrics {
  avg_waiting_time: number;
  avg_delay: number;
  throughput: number;
  drop_rate: number;
  dropped_count: number;
  served_count: number;
  high_priority_avg_delay: number | null;
  low_priority_avg_delay: number | null;
  jains_fairness: number | null;
}

export interface TimePoint {
  time: number;
  queue_length: number;
}

export interface SimulationResult {
  mechanism: string;
  config: SimulationConfig;
  summary: SummaryMetrics;
  queue_timeseries: TimePoint[];
}

export interface ComparisonResult {
  config: CompareConfig;
  fifo: SimulationResult;
  priority: SimulationResult;
  round_robin: SimulationResult;
}

// ─── Preset shape (from GET /api/presets) ─────────────────────────────────

export interface Preset {
  label: string;
  description: string;
  config: Omit<SimulationConfig, "mechanism">;
}

export type PresetsResponse = Record<string, Preset>;

// ─── UI helper: human-readable mechanism names ────────────────────────────

export const MECHANISM_LABELS: Record<Mechanism, string> = {
  fifo: "FIFO",
  priority: "Priority Queue",
  round_robin: "Round Robin",
};

export const MECHANISM_COLORS: Record<Mechanism, string> = {
  fifo: "#22c55e",        // green-500
  priority: "#f59e0b",    // amber-500
  round_robin: "#8b5cf6", // violet-500
};
