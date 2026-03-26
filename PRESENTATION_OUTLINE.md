# Presentation Outline — 10 Slides
## Interactive Multimedia Traffic Scheduler Simulator

---

### Slide 1 — Title
- **Title:** Interactive Multimedia Traffic Scheduler Simulator
- **Subtitle:** Internet and Multimedia Course Project
- Your name, date, course code
- *Visual:* a simple diagram of packets arriving at a queue and departing

---

### Slide 2 — Motivation
- Real multimedia applications need guarantees: VoIP < 150 ms, video < 200 ms
- IP networks carry mixed traffic: real-time + best-effort on the same link
- The scheduler decides which packet goes next — a critical design choice
- *Bullet:* "Which discipline should a network designer choose?"

---

### Slide 3 — Problem Statement
- Traffic intensity ρ = λ/μ
  - ρ < 1: stable queue
  - ρ ≥ 1: queue grows → drops → degraded QoS
- Without differentiation, urgent traffic waits behind bulk data (head-of-line blocking)
- *Bullet:* "Our goal: measure how scheduling changes latency, fairness, and drop rate"

---

### Slide 4 — The Three Mechanisms
| Mechanism   | Key property              |
|-------------|---------------------------|
| FIFO        | Simple, no differentiation |
| Priority    | Real-time first, starvation risk |
| Round Robin | Fair alternation, no starvation |

- One conceptual diagram per mechanism (3 small queue sketches)

---

### Slide 5 — Simulation Design
- Discrete-event simulation (DES)
- M/M/1/K model: Poisson arrivals, exponential service, finite buffer K
- Same random seed → identical packet stream across all three mechanisms
- Key metrics: avg delay, throughput, drop rate, Jain's fairness index
- *Bullet:* "The only variable is the scheduler — everything else is constant"

---

### Slide 6 — Architecture & Demo
- Backend: Python + FastAPI (simulation engine)
- Frontend: Next.js + Recharts (live dashboard)
- **Live demo here:** open browser, click *Congested Network* preset, Compare All
- Point out: form controls, metric cards, queue chart, comparison bars

---

### Slide 7 — Results: Balanced Traffic (ρ = 0.71)
- Show comparison bar chart from the simulator
- Key observation: all three mechanisms produce similar metrics at low load
- FIFO is sufficient when the link is not congested
- Teaching point: scheduling choice matters most under stress

---

### Slide 8 — Results: Congested Network (ρ = 1.43)
- Show comparison bar chart from the simulator
- Priority: high-priority delay drops dramatically; low-priority may starve
- Round Robin: middle ground — both classes served, higher fairness
- FIFO: all traffic suffers equally → unacceptable for real-time
- *Show Jain fairness index comparison*

---

### Slide 9 — Results: High-Priority Multimedia (ρ = 0.75)
- 70 % of packets are high-priority (like a video conference call)
- Priority and Round Robin both protect the high-priority majority
- Jain's index comparison: RR > FIFO ≈ Priority in terms of fairness
- Teaching point: when most traffic is real-time, Priority may not add much

---

### Slide 10 — Conclusion & Future Work
**Conclusions:**
- FIFO: best when load is light or traffic is homogeneous
- Priority: best for protecting real-time flows, at cost of fairness
- Round Robin: best balance between performance and fairness

**Possible extensions:**
- Weighted Fair Queuing (WFQ) / Deficit Round Robin (DRR)
- Multi-server models
- Variable packet sizes / bursts

**The simulator is publicly available — professors can run it with two commands.**

---

### Presenter Notes (general)
- Use the live simulator during slides 6–9 to replace static screenshots
- Click presets to switch scenarios in real time
- Point to metric cards before clicking "Compare" to set expectations
- Jain's index is a good entry point for discussing "what is fairness?"
