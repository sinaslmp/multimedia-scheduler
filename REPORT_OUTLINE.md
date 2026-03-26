# Academic Report Outline
## Interactive Multimedia Traffic Scheduler Simulator
### Internet and Multimedia Course

---

## 1. Introduction (0.5 pages)

- Context: multimedia applications (VoIP, video streaming, real-time gaming) require
  low latency and predictable service quality
- The network layer must manage competing traffic flows on shared links
- Queue scheduling is the mechanism that decides which packet gets served next
- **Goal of this work:** build and demonstrate a simulator that makes these trade-offs
  tangible and measurable

---

## 2. Problem Statement (0.5 pages)

- Modern IP networks carry heterogeneous traffic: real-time (delay-sensitive) and
  best-effort (throughput-sensitive)
- A naive FIFO discipline cannot differentiate between them
- **Research question:** how do different scheduling disciplines affect latency,
  throughput, packet loss, and fairness for mixed-priority multimedia traffic?
- Define traffic intensity ρ = λ/μ and explain its role in queue stability

---

## 3. Scheduling Mechanisms (1 page)

### 3.1 FIFO (First In, First Out)
- Packets served in strict arrival order
- M/M/1/K queue model; well-studied analytically
- Simple, no starvation, but no QoS differentiation

### 3.2 Non-Preemptive Priority Queue
- Two traffic classes: high (real-time) and low (best-effort)
- High-priority packets served before low-priority
- Risk: starvation of low-priority under heavy load

### 3.3 Round Robin
- Two queues alternate: server cycles between high and low classes
- Eliminates starvation; provides bounded waiting for all classes
- Trade-off: slightly higher delay for high-priority vs strict Priority

---

## 4. System Design (0.75 pages)

### 4.1 Simulation model
- Discrete-event simulation (DES)
- Arrival process: Poisson (exponential inter-arrivals with rate λ)
- Service time: Exponential with rate μ
- Buffer: finite capacity K (tail-drop)
- Same packet stream across mechanisms (fixed seed) for fair comparison

### 4.2 Implementation
- Backend: Python + FastAPI; simulation engine in `simulator.py`
- Frontend: Next.js + TypeScript + Recharts
- REST API: `POST /api/simulate`, `POST /api/simulate/compare`

### 4.3 Metrics computed
- Average waiting time, average sojourn delay
- Throughput (packets/second)
- Drop rate (buffer overflow)
- Per-class delay (high vs low priority)
- Jain's Fairness Index

---

## 5. Experimental Scenarios (0.75 pages)

### 5.1 Scenario A — Balanced traffic (ρ = 0.71)
- Parameters: λ=5, μ=7, K=50, p_high=0.3, N=300 packets
- Expected: all mechanisms perform similarly; low drop rate; FIFO adequate

### 5.2 Scenario B — Congested network (ρ = 1.43)
- Parameters: λ=10, μ=7, K=30, p_high=0.3, N=500 packets
- Expected: significant drops; Priority greatly reduces high-priority delay
  but increases low-priority delay; FIFO treats all equally

### 5.3 Scenario C — High-priority multimedia (ρ = 0.75)
- Parameters: λ=6, μ=8, K=50, p_high=0.7, N=400 packets
- Expected: Priority and RR benefit the majority-high traffic;
  RR better for the low-priority minority

---

## 6. Results and Discussion (0.75 pages)

Present results as tables and figures, referencing the simulator output.

Key observations (to fill in with actual simulation numbers):

| Scenario | Mechanism   | Avg Delay | Drop Rate | Hi-Pri Delay | Lo-Pri Delay | Jain |
|----------|-------------|-----------|-----------|--------------|--------------|------|
| A        | FIFO        | …         | …         | …            | …            | …    |
| A        | Priority    | …         | …         | …            | …            | …    |
| A        | Round Robin | …         | …         | …            | …            | …    |
| B        | FIFO        | …         | …         | …            | …            | …    |
| B        | Priority    | …         | …         | …            | …            | …    |
| B        | Round Robin | …         | …         | …            | …            | …    |

Discussion points:
- Under low load, scheduling choice has minimal impact (ρ ≪ 1)
- Under congestion, Priority provides the best QoS for real-time traffic at the
  cost of fairness (lower Jain index)
- Round Robin provides a compromise: better fairness, bounded waiting, moderate
  delay for all classes
- FIFO is only suitable when all traffic has similar QoS requirements

---

## 7. Conclusion (0.25 pages)

- Summary of findings
- Priority scheduling is well-suited for networks dominated by real-time multimedia
- Round Robin is preferable when fairness across traffic classes is a requirement
- The simulator provides an intuitive, reproducible environment for studying these
  trade-offs, and can be extended to cover weighted fair queuing (WFQ), deficit
  round robin (DRR), or multi-server scenarios

---

## References

- Kleinrock, L. (1975). *Queueing Systems, Volume 1: Theory*. Wiley.
- Tanenbaum, A. & Wetherall, D. (2011). *Computer Networks* (5th ed.). Prentice Hall.
- Jain, R., Chiu, D., & Hawe, W. (1984). A Quantitative Measure of Fairness and
  Discrimination for Resource Allocation in Shared Computer Systems. DEC Report TR-301.
- RFC 2205 — Resource ReSerVation Protocol (RSVP).
