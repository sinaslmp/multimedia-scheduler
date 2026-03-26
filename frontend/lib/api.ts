/**
 * api.ts — Typed fetch wrappers for the FastAPI backend.
 *
 * All functions throw on non-2xx responses so the caller can handle errors
 * uniformly with try/catch.
 */

import type {
  CompareConfig,
  ComparisonResult,
  PresetsResponse,
  SimulationConfig,
  SimulationResult,
} from "@/types/simulation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPresets(): Promise<PresetsResponse> {
  return apiFetch<PresetsResponse>("/api/presets");
}

export function runSimulation(config: SimulationConfig): Promise<SimulationResult> {
  return apiFetch<SimulationResult>("/api/simulate", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export function runComparison(config: CompareConfig): Promise<ComparisonResult> {
  return apiFetch<ComparisonResult>("/api/simulate/compare", {
    method: "POST",
    body: JSON.stringify(config),
  });
}
