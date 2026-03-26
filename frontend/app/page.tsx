"use client";

import { useState } from "react";
import SimulationForm from "@/components/SimulationForm";
import ResultsSection from "@/components/ResultsSection";
import ExplanationSection from "@/components/ExplanationSection";
import { runSimulation, runComparison } from "@/lib/api";
import type {
  ComparisonResult,
  SimulationConfig,
  SimulationResult,
} from "@/types/simulation";

export default function HomePage() {
  const [singleResult, setSingleResult] = useState<SimulationResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(config: SimulationConfig) {
    setLoading(true);
    setError(null);
    setComparisonResult(null);
    try {
      const result = await runSimulation(config);
      setSingleResult(result);
      // Scroll to results after a short delay (allows DOM update)
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompare(config: Omit<SimulationConfig, "mechanism">) {
    setLoading(true);
    setError(null);
    setSingleResult(null);
    try {
      const result = await runComparison(config);
      setComparisonResult(result);
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSingleResult(null);
    setComparisonResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Multimedia Traffic Scheduler Simulator
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Internet &amp; Multimedia Course — Interactive Teaching Tool
            </p>
          </div>
          {(singleResult || comparisonResult) && (
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <p className="max-w-2xl text-sm text-gray-600 leading-relaxed">
          Configure a network traffic scenario, choose a queue scheduling discipline,
          and observe how it affects latency, throughput, drop rate, and fairness.
          Use <strong>Compare All Mechanisms</strong> to see FIFO, Priority, and Round
          Robin side-by-side on identical traffic.
        </p>
      </header>

      {/* ── Simulation form ────────────────────────────────── */}
      <SimulationForm
        onRun={handleRun}
        onCompare={handleCompare}
        loading={loading}
      />

      {/* ── Loading indicator ──────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-gray-500">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          Running simulation…
        </div>
      )}

      {/* ── Error message ──────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Results ────────────────────────────────────────── */}
      {!loading && (
        <ResultsSection single={singleResult} comparison={comparisonResult} />
      )}

      {/* ── Explanation section (always visible) ───────────── */}
      <ExplanationSection />

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        Discrete-event simulation · M/M/1/K model ·{" "}
        <span>FIFO / Priority / Round Robin</span> · Internet &amp; Multimedia Course
      </footer>
    </main>
  );
}
