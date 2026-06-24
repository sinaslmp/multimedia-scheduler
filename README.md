# Multimedia Traffic Scheduler Simulator

![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

A full-stack discrete-event simulation engine for analyzing multimedia network traffic under three queue scheduling disciplines: **FIFO**, **Priority Queue**, and **Round Robin** — with real-time metrics and interactive visualizations.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | [multimedia-scheduler.vercel.app](https://multimedia-scheduler.vercel.app/) |
| Backend API | [multimedia-scheduler.onrender.com](https://multimedia-scheduler.onrender.com/) |
| API Docs | [/docs](https://multimedia-scheduler.onrender.com/docs) |

---

## Features

- **Discrete-event simulation** based on the M/M/1/K queue model with Poisson arrival process
- **Three scheduling disciplines** with side-by-side comparison: FIFO, Priority Queue (non-preemptive), Round Robin
- **Real-time performance metrics**: end-to-end delay, throughput, packet drop rate, Jain's fairness index
- **Interactive charts**: queue length over time, per-class delay, cross-mechanism comparisons (Recharts)
- **Reproducible runs** via configurable random seed for consistent benchmarking
- **Three built-in presets**: Balanced Traffic, Congested Network, High-Priority Multimedia
- **Fully responsive** layout (mobile / tablet / desktop)
- **Docker Compose** one-command local setup

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + FastAPI + Pydantic |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Deploy | Vercel (frontend) + Render (backend) |
| Containerization | Docker Compose |

---

## Getting Started

### Prerequisites

- Python >= 3.10
- Node.js >= 18
- Docker (optional, for one-command setup)

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/sinaslmp/multimedia-scheduler.git
cd multimedia-scheduler
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### POST /api/simulate

Run a simulation for a single scheduling mechanism.

**Request body:**
```json
{
  "mechanism": "fifo",
  "num_packets": 300,
  "arrival_rate": 5.0,
  "service_rate": 7.0,
  "buffer_size": 50,
  "high_priority_fraction": 0.3,
  "seed": 42
}
```

mechanism: "fifo" | "priority" | "round_robin"

**Response:** Summary metrics + downsampled queue-length time series.

---

### POST /api/simulate/compare

Run all three mechanisms on the same packet stream (same seed) for direct comparison.

Request body: Same as /api/simulate, without mechanism field.

---

### GET /api/presets

Returns the three built-in presets with labels and default configurations.

---

## Simulation Model

The engine implements a single-server finite-buffer queue:

| Parameter | Description |
|-----------|-------------|
| Arrival process | Poisson with rate lambda (exponential inter-arrival times) |
| Service times | Exponential with rate mu |
| Buffer | Finite capacity K; tail-drop when full |
| Traffic intensity | rho = lambda/mu |

**Metrics computed:**
- Average waiting time and end-to-end delay (sojourn time)
- Throughput (served packets / simulation duration)
- Packet drop rate
- Per-class average delay (high vs low priority)
- Jain's Fairness Index

---

## Built-in Presets

| Preset | rho | Description |
|--------|-----|-------------|
| Balanced Traffic | 0.71 | Baseline; all mechanisms perform similarly |
| Congested Network | 1.43 | Overloaded system; exposes drop rate and delay tradeoffs |
| High-Priority Multimedia | 0.75 | 70% high-priority traffic; highlights Priority Queue advantage |

---

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI routes and app entry point
│   ├── models.py         # Pydantic request/response schemas
│   ├── simulator.py      # Discrete-event simulation engine
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js 14 App Router
│   ├── components/       # UI components
│   ├── lib/api.ts        # Typed fetch wrappers for backend API
│   └── types/            # TypeScript type definitions
├── docker-compose.yml
└── README.md
```

---

## License

MIT
