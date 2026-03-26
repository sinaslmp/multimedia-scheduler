"""
main.py — FastAPI application entry point.

Run with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    CompareConfig,
    ComparisonResult,
    SimulationConfig,
    SimulationResult,
)
from simulator import run_comparison, run_simulation

app = FastAPI(
    title="Multimedia Traffic Scheduler Simulator",
    description=(
        "Discrete-event simulation of FIFO, Priority, and Round Robin "
        "queue scheduling for multimedia network traffic."
    ),
    version="1.0.0",
)

# Allow the Next.js dev server (and any origin in development) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Presets ─────────────────────────────────────────────────────────────────

PRESETS: dict[str, dict] = {
    "balanced": {
        "label": "Balanced Traffic",
        "description": "Moderate load (ρ ≈ 0.71). Queue stays short; all mechanisms behave similarly.",
        "config": {
            "num_packets": 300,
            "arrival_rate": 5.0,
            "service_rate": 7.0,
            "buffer_size": 50,
            "high_priority_fraction": 0.3,
            "seed": 42,
        },
    },
    "congested": {
        "label": "Congested Network",
        "description": "Overloaded link (ρ ≈ 1.43). Buffer fills fast; high drop rates highlight scheduling trade-offs.",
        "config": {
            "num_packets": 500,
            "arrival_rate": 10.0,
            "service_rate": 7.0,
            "buffer_size": 30,
            "high_priority_fraction": 0.3,
            "seed": 42,
        },
    },
    "multimedia": {
        "label": "High-Priority Multimedia",
        "description": "70 % of traffic is high-priority (video/voice). Demonstrates Priority and RR protecting real-time flows.",
        "config": {
            "num_packets": 400,
            "arrival_rate": 6.0,
            "service_rate": 8.0,
            "buffer_size": 50,
            "high_priority_fraction": 0.7,
            "seed": 42,
        },
    },
}


# ─── Routes ──────────────────────────────────────────────────────────────────


@app.get("/api/presets")
def get_presets() -> dict:
    """Return the built-in demonstration presets."""
    return PRESETS


@app.post("/api/simulate", response_model=SimulationResult)
def simulate(config: SimulationConfig) -> SimulationResult:
    """
    Run a simulation for a single scheduling mechanism.

    Returns per-packet summary metrics and a downsampled queue-length timeseries
    suitable for chart rendering.
    """
    try:
        result = run_simulation(config)
        return SimulationResult(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/simulate/compare", response_model=ComparisonResult)
def compare(config: CompareConfig) -> ComparisonResult:
    """
    Run FIFO, Priority, and Round Robin on the SAME packet stream.

    Using the same seed guarantees that the only difference in results comes
    from the scheduling discipline, not from randomness — ideal for teaching.
    """
    try:
        result = run_comparison(config)
        return ComparisonResult(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
