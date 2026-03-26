"""
models.py — Pydantic schemas for the simulation API.

All request and response types are defined here so that the API contract
is explicit and validated automatically by FastAPI.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ───────────────────────────────────────────────────────────────────


class Mechanism(str, Enum):
    FIFO = "fifo"
    PRIORITY = "priority"
    ROUND_ROBIN = "round_robin"


# ─── Request ─────────────────────────────────────────────────────────────────


class SimulationConfig(BaseModel):
    """
    Input parameters for a simulation run.

    Traffic intensity ρ = arrival_rate / service_rate.
    When ρ < 1 the queue is stable; when ρ ≥ 1 packets accumulate and
    the buffer fills, causing drops — good for demonstrating congestion.
    """

    mechanism: Mechanism = Field(
        default=Mechanism.FIFO,
        description="Scheduling discipline to apply",
    )
    num_packets: int = Field(
        default=300,
        ge=10,
        le=2000,
        description="Total packets to inject into the simulation",
    )
    arrival_rate: float = Field(
        default=5.0,
        gt=0,
        description="Mean packet arrival rate λ (packets / second)",
    )
    service_rate: float = Field(
        default=7.0,
        gt=0,
        description="Mean service rate μ (packets / second)",
    )
    buffer_size: int = Field(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of packets in the waiting queue (tail-drop when full)",
    )
    high_priority_fraction: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Fraction of packets that are high-priority (class 1)",
    )
    seed: Optional[int] = Field(
        default=42,
        description="RNG seed for reproducibility (null = random)",
    )


class CompareConfig(BaseModel):
    """Same as SimulationConfig but without a mechanism — all three are run."""

    num_packets: int = Field(default=300, ge=10, le=2000)
    arrival_rate: float = Field(default=5.0, gt=0)
    service_rate: float = Field(default=7.0, gt=0)
    buffer_size: int = Field(default=50, ge=1, le=500)
    high_priority_fraction: float = Field(default=0.3, ge=0.0, le=1.0)
    seed: Optional[int] = Field(default=42)


# ─── Response ────────────────────────────────────────────────────────────────


class SummaryMetrics(BaseModel):
    avg_waiting_time: float
    avg_delay: float
    throughput: float
    drop_rate: float
    dropped_count: int
    served_count: int
    high_priority_avg_delay: Optional[float]
    low_priority_avg_delay: Optional[float]
    jains_fairness: Optional[float]


class TimePoint(BaseModel):
    time: float
    queue_length: int


class SimulationResult(BaseModel):
    mechanism: str
    config: SimulationConfig
    summary: SummaryMetrics
    queue_timeseries: list[TimePoint]


class ComparisonResult(BaseModel):
    config: CompareConfig
    fifo: SimulationResult
    priority: SimulationResult
    round_robin: SimulationResult
