# Multimedia Traffic Scheduler Simulator

An interactive web application that simulates multimedia network traffic under
three queue scheduling disciplines: **FIFO**, **Priority Queue**, and **Round Robin**.
Built for the *Internet and Multimedia* university course as a self-contained
teaching and demonstration tool.

---

## Features

- **Discrete-event simulation** based on the M/M/1/K queue model
- Three scheduling mechanisms with side-by-side comparison
- Real-time performance metrics: delay, throughput, drop rate, Jain's fairness index
- Interactive charts: queue length over time, per-class delay, cross-mechanism comparisons
- Three built-in presets (Balanced, Congested, High-Priority Multimedia)
- Fixed random seed for reproducible classroom demonstrations
- Fully responsive layout (mobile / tablet / desktop)

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Backend  | Python 3.12 + FastAPI + Pydantic   |
| Frontend | Next.js 14 + TypeScript + Tailwind |
| Charts   | Recharts                           |
| Deploy   | Docker Compose (optional)          |

---

## Running Locally (Recommended for Teaching)

### Prerequisites

- Python ≥ 3.10
- Node.js ≥ 18
- `pip` and `npm`

### 1. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Running with Docker (One-Command Setup)

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## API Reference

### `POST /api/simulate`

Run a simulation for a single scheduling mechanism.

**Request body:**
```json
{
  "mechanism": "fifo",        // "fifo" | "priority" | "round_robin"
  "num_packets": 300,
  "arrival_rate": 5.0,        // packets/second (λ)
  "service_rate": 7.0,        // packets/second (μ)
  "buffer_size": 50,          // max waiting queue length
  "high_priority_fraction": 0.3,
  "seed": 42                  // null for random
}
```

**Response:** summary metrics + downsampled queue-length timeseries.

---

### `POST /api/simulate/compare`

Run all three mechanisms on the **same** packet stream (same seed). Ideal for
teaching because the only variable is the scheduling discipline.

**Request body:** same as above but without `mechanism`.

---

### `GET /api/presets`

Returns the three built-in demonstration presets with labels and configurations.

---

## Simulation Model

The simulator implements a **discrete-event simulation** of a single-server queue:

- **Arrival process:** Poisson with rate λ (exponential inter-arrival times)
- **Service times:** Exponential with rate μ
- **Buffer:** Finite capacity K; packets are dropped (tail-drop) when full
- **Traffic intensity:** ρ = λ/μ  (stable if ρ < 1)

| Mechanism   | Queue discipline                                      |
|-------------|-------------------------------------------------------|
| FIFO        | Strict arrival order, no priority                     |
| Priority    | Non-preemptive; class 1 (high) served before class 0  |
| Round Robin | Alternates between high and low queues (no starvation)|

**Metrics computed:**
- Average waiting time (time in buffer before service)
- Average end-to-end delay (sojourn time = wait + service)
- Throughput (served packets / simulation duration)
- Packet drop rate
- Per-class average delay (high vs low priority)
- Jain's Fairness Index

---

## Presets for Classroom Demonstration

| Preset                    | ρ    | Purpose                                         |
|---------------------------|------|-------------------------------------------------|
| Balanced Traffic          | 0.71 | Baseline; all mechanisms behave similarly       |
| Congested Network         | 1.43 | Overloaded; drops and delay differences amplify |
| High-Priority Multimedia  | 0.75 | 70 % high-priority; shows Priority benefit      |

---

## Project Structure

```
.
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── models.py        # Pydantic schemas
│   ├── simulator.py     # Simulation engine
│   └── requirements.txt
├── frontend/
│   ├── app/             # Next.js App Router
│   ├── components/      # UI components
│   ├── lib/api.ts       # Fetch wrappers
│   └── types/           # TypeScript types
├── docker-compose.yml
└── README.md
```

---

## Educational Purpose

This project is designed so that a professor can:

1. Open the browser at `http://localhost:3000`
2. Click a preset button (e.g. *Congested Network*)
3. Click **Compare All Mechanisms**
4. Walk students through the charts and metric cards

The explanation section at the bottom of the page provides concise pros/cons
for each mechanism, suitable for classroom discussion.

---

## Assumptions and Limitations

- Single-server model only (no multi-server extensions)
- Exponential service and inter-arrival times (M/M/1/K assumptions)
- Non-preemptive priority (currently in service is never interrupted)
- Round Robin cycles between exactly two classes (high and low priority)
- Simulation is statistically simplified but academically defensible

---

## License

MIT — free to use for teaching and research.
