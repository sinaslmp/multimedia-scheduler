"""
simulator.py — Discrete-event simulation engine for multimedia traffic scheduling.

──────────────────────────────────────────────────────────────────────────────
Model assumptions
──────────────────────────────────────────────────────────────────────────────
  • Packet inter-arrival times ~ Exponential(λ)  → Poisson arrival process
  • Service times             ~ Exponential(μ)  → memoryless service
  • Single server (one link / processor)
  • Finite waiting buffer of K packets (tail-drop policy when buffer is full)
  • Non-preemptive scheduling for Priority and Round Robin: a packet already
    in service is never interrupted even when a higher-priority one arrives.

Traffic intensity  ρ = λ/μ
  ρ < 1  → stable queue, low delay
  ρ ≥ 1  → unstable queue, buffer fills, high drop rate

Scheduling disciplines
──────────────────────────────────────────────────────────────────────────────
  FIFO        First-In First-Out; strict arrival order; no class distinction.
  Priority    Non-preemptive two-class: high-priority (class 1) packets are
              served before low-priority (class 0) packets.
  RoundRobin  Two-class alternating service: server cycles between a
              high-priority queue and a low-priority queue, preventing starvation.
"""

from __future__ import annotations

import heapq
import random
from dataclasses import dataclass, field
from typing import Optional

# Event-type constants; kept as ints so the heap is stable.
_ARRIVAL = 0
_DEPARTURE = 1

MAX_TIMESERIES_POINTS = 120   # downsample budget for chart data


# ─── Packet ──────────────────────────────────────────────────────────────────


@dataclass(order=False)
class Packet:
    id: int
    arrival_time: float
    priority: int          # 1 = high-priority, 0 = low-priority
    service_time: float
    # Fields written during simulation:
    service_start:  float = field(default=-1.0, repr=False)
    departure_time: float = field(default=-1.0, repr=False)
    dropped:        bool  = field(default=False, repr=False)

    @property
    def waiting_time(self) -> float:
        """Time spent waiting in the buffer before service begins."""
        if self.service_start < 0:
            return 0.0
        return max(0.0, self.service_start - self.arrival_time)

    @property
    def sojourn_time(self) -> float:
        """End-to-end delay = waiting time + service time (Littl's Law D = W + 1/μ)."""
        if self.departure_time < 0:
            return 0.0
        return max(0.0, self.departure_time - self.arrival_time)


# ─── Packet generation ───────────────────────────────────────────────────────


def _generate_packets(
    num_packets: int,
    arrival_rate: float,
    service_rate: float,
    high_priority_fraction: float,
    seed: Optional[int],
) -> list[Packet]:
    """
    Generate a packet stream using a Poisson arrival process.

    Inter-arrival times are drawn from Exp(λ); service times from Exp(μ).
    Priority is assigned independently with probability p = high_priority_fraction.
    """
    rng = random.Random(seed)
    packets: list[Packet] = []
    t = 0.0
    for i in range(num_packets):
        t += rng.expovariate(arrival_rate)               # next arrival time
        priority = 1 if rng.random() < high_priority_fraction else 0
        svc = rng.expovariate(service_rate)              # service duration
        packets.append(Packet(id=i, arrival_time=t, priority=priority, service_time=svc))
    return packets


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _jains_fairness_index(values: list[float]) -> float:
    """
    Jain's Fairness Index  J = (Σxᵢ)² / (n · Σxᵢ²)   ∈ [1/n, 1].
    A value near 1 means all flows experience similar delays (fair).
    Computed over per-packet sojourn times.
    """
    if not values:
        return 1.0
    n = len(values)
    sq_sum = sum(v * v for v in values)
    return (sum(values) ** 2) / (n * sq_sum) if sq_sum > 0 else 1.0


def _build_summary(packets: list[Packet], sim_end: float) -> dict:
    served  = [p for p in packets if not p.dropped]
    dropped = [p for p in packets if p.dropped]
    high    = [p for p in served if p.priority == 1]
    low     = [p for p in served if p.priority == 0]

    def avg(lst: list[Packet], fn) -> Optional[float]:
        return round(sum(fn(p) for p in lst) / len(lst), 4) if lst else None

    return {
        "avg_waiting_time": avg(served, lambda p: p.waiting_time) or 0.0,
        "avg_delay":        avg(served, lambda p: p.sojourn_time) or 0.0,
        "throughput":       round(len(served) / sim_end, 4) if sim_end > 0 else 0.0,
        "drop_rate":        round(len(dropped) / len(packets), 4) if packets else 0.0,
        "dropped_count":    len(dropped),
        "served_count":     len(served),
        "high_priority_avg_delay": avg(high, lambda p: p.sojourn_time),
        "low_priority_avg_delay":  avg(low,  lambda p: p.sojourn_time),
        "jains_fairness": (
            round(_jains_fairness_index([p.sojourn_time for p in served]), 4)
            if len(served) > 1 else None
        ),
    }


def _downsample(
    points: list[tuple[float, int]],
    max_pts: int = MAX_TIMESERIES_POINTS,
) -> list[dict]:
    """Reduce timeseries length for a lighter JSON response."""
    if not points:
        return []
    if len(points) <= max_pts:
        return [{"time": round(t, 4), "queue_length": q} for t, q in points]
    step = max(1, len(points) // max_pts)
    return [{"time": round(t, 4), "queue_length": q} for t, q in points[::step]]


# ─── FIFO ────────────────────────────────────────────────────────────────────


def _run_fifo(packets: list[Packet], buffer_size: int) -> list[tuple[float, int]]:
    """
    Standard FIFO single-server queue (M/M/1/K).

    All packets are treated identically; served in strict arrival order.
    Simple and predictable, but urgent traffic must wait behind earlier
    low-priority packets — a key teaching point.
    """
    by_id: dict[int, Packet] = {p.id: p for p in packets}
    events: list[tuple[float, int, int]] = []
    for p in packets:
        heapq.heappush(events, (p.arrival_time, _ARRIVAL, p.id))

    waiting:      list[int] = []          # queue of packet ids (FIFO order)
    server_busy:  bool      = False
    snapshots:    list[tuple[float, int]] = [(0.0, 0)]

    while events:
        t, etype, pid = heapq.heappop(events)
        pkt = by_id[pid]

        if etype == _ARRIVAL:
            if not server_busy:
                # Server idle — start service immediately (no queueing delay)
                server_busy = True
                pkt.service_start = t
                heapq.heappush(events, (t + pkt.service_time, _DEPARTURE, pid))
            elif len(waiting) < buffer_size:
                waiting.append(pid)
            else:
                pkt.dropped = True   # Buffer full → tail-drop

        else:  # DEPARTURE
            pkt.departure_time = t
            if waiting:
                next_id = waiting.pop(0)
                next_p = by_id[next_id]
                next_p.service_start = t
                heapq.heappush(events, (t + next_p.service_time, _DEPARTURE, next_id))
            else:
                server_busy = False

        snapshots.append((t, len(waiting)))

    return snapshots


# ─── Priority ────────────────────────────────────────────────────────────────


def _run_priority(packets: list[Packet], buffer_size: int) -> list[tuple[float, int]]:
    """
    Non-preemptive two-class priority queue.

    High-priority (class 1) packets are dequeued before low-priority (class 0).
    Within the same priority class, arrival order (FIFO) is preserved.
    A packet already being served is never preempted.

    Teaching point: high-priority delay drops significantly vs FIFO, but
    low-priority traffic may suffer starvation under heavy load (high ρ).
    """
    by_id: dict[int, Packet] = {p.id: p for p in packets}
    events: list[tuple[float, int, int]] = []
    for p in packets:
        heapq.heappush(events, (p.arrival_time, _ARRIVAL, p.id))

    # Min-heap key: (-priority, arrival_time, id) → highest priority first, then FIFO
    waiting:     list[tuple[int, float, int]] = []
    server_busy: bool = False
    snapshots:   list[tuple[float, int]] = [(0.0, 0)]

    while events:
        t, etype, pid = heapq.heappop(events)
        pkt = by_id[pid]

        if etype == _ARRIVAL:
            if not server_busy:
                server_busy = True
                pkt.service_start = t
                heapq.heappush(events, (t + pkt.service_time, _DEPARTURE, pid))
            elif len(waiting) < buffer_size:
                heapq.heappush(waiting, (-pkt.priority, pkt.arrival_time, pid))
            else:
                pkt.dropped = True

        else:  # DEPARTURE
            pkt.departure_time = t
            if waiting:
                _, _, next_id = heapq.heappop(waiting)
                next_p = by_id[next_id]
                next_p.service_start = t
                heapq.heappush(events, (t + next_p.service_time, _DEPARTURE, next_id))
            else:
                server_busy = False

        snapshots.append((t, len(waiting)))

    return snapshots


# ─── Round Robin ─────────────────────────────────────────────────────────────


def _run_round_robin(packets: list[Packet], buffer_size: int) -> list[tuple[float, int]]:
    """
    Two-class Round Robin scheduler.

    The server alternates between the high-priority queue (class 1) and the
    low-priority queue (class 0), serving one packet from each in turn.
    If the current class queue is empty, the server falls back to the other
    class without losing the alternation state.

    Teaching point: neither class starves (cf. strict Priority under heavy load).
    The Jain Fairness Index is typically higher than Priority. High-priority
    delay is slightly worse than strict Priority, but low-priority delay is
    much better.
    """
    by_id: dict[int, Packet] = {p.id: p for p in packets}
    events: list[tuple[float, int, int]] = []
    for p in packets:
        heapq.heappush(events, (p.arrival_time, _ARRIVAL, p.id))

    high_q:      list[int] = []   # high-priority waiting queue (packet ids)
    low_q:       list[int] = []   # low-priority waiting queue
    rr_turn:     int       = 0    # 0 = high's turn, 1 = low's turn
    server_busy: bool      = False
    snapshots:   list[tuple[float, int]] = [(0.0, 0)]

    def pick_next() -> Optional[int]:
        """Select next packet according to round-robin discipline."""
        nonlocal rr_turn
        # Two attempts: preferred turn first, then fall back to the other
        for _ in range(2):
            if rr_turn == 0 and high_q:
                rr_turn = 1
                return high_q.pop(0)
            if rr_turn == 1 and low_q:
                rr_turn = 0
                return low_q.pop(0)
            rr_turn = 1 - rr_turn   # preferred queue empty → try other side
        return None

    while events:
        t, etype, pid = heapq.heappop(events)
        pkt = by_id[pid]

        if etype == _ARRIVAL:
            total_waiting = len(high_q) + len(low_q)
            if not server_busy:
                # Serve immediately; don't alter rr_turn (not a scheduled pick)
                server_busy = True
                pkt.service_start = t
                heapq.heappush(events, (t + pkt.service_time, _DEPARTURE, pid))
            elif total_waiting < buffer_size:
                if pkt.priority == 1:
                    high_q.append(pid)
                else:
                    low_q.append(pid)
            else:
                pkt.dropped = True

        else:  # DEPARTURE
            pkt.departure_time = t
            next_id = pick_next()
            if next_id is not None:
                next_p = by_id[next_id]
                next_p.service_start = t
                heapq.heappush(events, (t + next_p.service_time, _DEPARTURE, next_id))
            else:
                server_busy = False

        snapshots.append((t, len(high_q) + len(low_q)))

    return snapshots


# ─── Public API ──────────────────────────────────────────────────────────────


def run_simulation(config) -> dict:
    """
    Run a single-mechanism simulation and return a result dict.

    The `config` object must expose the same fields as SimulationConfig.
    Returns a dictionary ready to be validated into a SimulationResult.
    """
    from models import Mechanism  # local import to avoid circular dependency

    packets = _generate_packets(
        num_packets=config.num_packets,
        arrival_rate=config.arrival_rate,
        service_rate=config.service_rate,
        high_priority_fraction=config.high_priority_fraction,
        seed=config.seed,
    )

    dispatcher = {
        Mechanism.FIFO:        _run_fifo,
        Mechanism.PRIORITY:    _run_priority,
        Mechanism.ROUND_ROBIN: _run_round_robin,
    }
    runner = dispatcher[config.mechanism]
    snapshots = runner(packets, config.buffer_size)

    sim_end = max(
        (p.departure_time for p in packets if p.departure_time >= 0),
        default=0.0,
    )

    return {
        "mechanism": config.mechanism.value,
        "config": config,
        "summary": _build_summary(packets, sim_end),
        "queue_timeseries": _downsample(snapshots),
    }


def run_comparison(config) -> dict:
    """
    Run all three mechanisms on the SAME packet stream (same seed) so that
    results are directly comparable — same arrivals, different schedulers.
    """
    from models import Mechanism, SimulationConfig

    # Generate once; run three different schedulers on the same data
    packets_master = _generate_packets(
        num_packets=config.num_packets,
        arrival_rate=config.arrival_rate,
        service_rate=config.service_rate,
        high_priority_fraction=config.high_priority_fraction,
        seed=config.seed,
    )

    results: dict[str, dict] = {}
    for mech in (Mechanism.FIFO, Mechanism.PRIORITY, Mechanism.ROUND_ROBIN):
        # Deep-copy packets so each run starts clean
        import copy
        packets = copy.deepcopy(packets_master)

        dispatcher = {
            Mechanism.FIFO:        _run_fifo,
            Mechanism.PRIORITY:    _run_priority,
            Mechanism.ROUND_ROBIN: _run_round_robin,
        }
        snapshots = dispatcher[mech](packets, config.buffer_size)
        sim_end = max(
            (p.departure_time for p in packets if p.departure_time >= 0),
            default=0.0,
        )

        single_config = SimulationConfig(
            mechanism=mech,
            num_packets=config.num_packets,
            arrival_rate=config.arrival_rate,
            service_rate=config.service_rate,
            buffer_size=config.buffer_size,
            high_priority_fraction=config.high_priority_fraction,
            seed=config.seed,
        )

        results[mech.value] = {
            "mechanism": mech.value,
            "config": single_config,
            "summary": _build_summary(packets, sim_end),
            "queue_timeseries": _downsample(snapshots),
        }

    return {
        "config": config,
        "fifo":        results["fifo"],
        "priority":    results["priority"],
        "round_robin": results["round_robin"],
    }
