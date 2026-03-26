"use client";

import { useEffect, useState } from "react";
import { fetchPresets } from "@/lib/api";
import type { Mechanism, PresetsResponse, SimulationConfig } from "@/types/simulation";
import { MECHANISM_LABELS } from "@/types/simulation";

const DEFAULT_CONFIG: SimulationConfig = {
  mechanism: "fifo",
  num_packets: 300,
  arrival_rate: 5,
  service_rate: 7,
  buffer_size: 50,
  high_priority_fraction: 0.3,
  seed: 42,
};

interface Props {
  onRun: (config: SimulationConfig) => void;
  onCompare: (config: Omit<SimulationConfig, "mechanism">) => void;
  loading: boolean;
}

interface SliderFieldProps {
  label: string;
  name: keyof SimulationConfig;
  value: number;
  min: number;
  max: number;
  step: number;
  hint: string;
  onChange: (name: keyof SimulationConfig, value: number) => void;
  formatter?: (v: number) => string;
}

function SliderField({
  label,
  name,
  value,
  min,
  max,
  step,
  hint,
  onChange,
  formatter,
}: SliderFieldProps) {
  const display = formatter ? formatter(value) : String(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-mono font-semibold text-blue-700">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(name, parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg accent-blue-600 cursor-pointer"
      />
      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  );
}

export default function SimulationForm({ onRun, onCompare, loading }: Props) {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [presets, setPresets] = useState<PresetsResponse | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    fetchPresets()
      .then(setPresets)
      .catch(() => {
        /* Presets are optional — silently fail */
      });
  }, []);

  function handleField(name: keyof SimulationConfig, value: number | string) {
    setConfig((prev) => ({ ...prev, [name]: value }));
    setActivePreset(null);
  }

  function applyPreset(key: string) {
    if (!presets) return;
    const preset = presets[key];
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
    }));
    setActivePreset(key);
  }

  const rho = (config.arrival_rate / config.service_rate).toFixed(2);
  const stable = config.arrival_rate < config.service_rate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
      {/* Presets */}
      {presets && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Quick Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                title={preset.description}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                  activePreset === key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mechanism selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Scheduling Mechanism
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(MECHANISM_LABELS) as [Mechanism, string][]).map(
            ([mech, label]) => (
              <button
                key={mech}
                onClick={() => handleField("mechanism", mech)}
                className={`rounded-lg border py-2 px-3 text-sm font-medium transition-colors ${
                  config.mechanism === mech
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Traffic parameters */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Traffic Parameters
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SliderField
            label="Arrival Rate (λ)"
            name="arrival_rate"
            value={config.arrival_rate}
            min={1}
            max={20}
            step={0.5}
            hint="Mean number of packets arriving per second (Poisson process)"
            onChange={handleField}
            formatter={(v) => `${v} pkt/s`}
          />
          <SliderField
            label="Service Rate (μ)"
            name="service_rate"
            value={config.service_rate}
            min={1}
            max={20}
            step={0.5}
            hint="Mean number of packets the server can process per second"
            onChange={handleField}
            formatter={(v) => `${v} pkt/s`}
          />
          <SliderField
            label="Buffer Size (K)"
            name="buffer_size"
            value={config.buffer_size}
            min={5}
            max={200}
            step={5}
            hint="Maximum packets allowed in the waiting queue (tail-drop when full)"
            onChange={handleField}
            formatter={(v) => `${v} pkts`}
          />
          <SliderField
            label="High-Priority Fraction"
            name="high_priority_fraction"
            value={config.high_priority_fraction}
            min={0}
            max={1}
            step={0.05}
            hint="Proportion of packets classified as high-priority (e.g. video/VoIP)"
            onChange={handleField}
            formatter={(v) => `${Math.round(v * 100)} %`}
          />
          <SliderField
            label="Number of Packets"
            name="num_packets"
            value={config.num_packets}
            min={50}
            max={2000}
            step={50}
            hint="Total packets to inject into the simulation"
            onChange={handleField}
            formatter={(v) => `${v}`}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Random Seed
            </label>
            <input
              type="number"
              value={config.seed ?? ""}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  seed: e.target.value === "" ? null : parseInt(e.target.value, 10),
                }))
              }
              placeholder="Leave blank for random"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400">
              Fixed seed ensures identical packet streams across runs (good for comparisons)
            </p>
          </div>
        </div>
      </div>

      {/* Traffic intensity indicator */}
      <div
        className={`rounded-lg px-4 py-3 text-sm ${
          stable
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        <span className="font-semibold">Traffic intensity ρ = λ/μ = {rho}</span>
        {stable
          ? " — Queue is stable. Packets will mostly be served in time."
          : " — Queue is overloaded (ρ ≥ 1). Buffer will fill; expect high drop rates."}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onRun(config)}
          disabled={loading}
          className="flex-1 sm:flex-none rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Running..." : "Run Simulation"}
        </button>
        <button
          onClick={() => {
            const { mechanism: _m, ...rest } = config;
            onCompare(rest);
          }}
          disabled={loading}
          className="flex-1 sm:flex-none rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Running..." : "Compare All Mechanisms"}
        </button>
      </div>
    </div>
  );
}
