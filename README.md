# Layered — Architecture Drift Detection Platform

**Layered** is an architecture drift detection platform that helps engineers understand, monitor, and reason about how software architecture evolves over time.

Instead of treating architecture as a static diagram, Layered models it as a **time-based system**, detecting violations, tracking drift, and visualizing dependency boundaries as they change across analysis runs.

---

## Why Layered?

As codebases grow, architectural intent often fades:

- Services bypass intended layers
- Legacy systems become tightly coupled
- Circular dependencies creep in silently

Layered detects these issues early by analyzing dependencies, enforcing architectural boundaries, and preserving **historical snapshots** so drift can be traced back to its origin.

---

## Core Features

### 🗺️ Architecture Map

- Automatically infers architectural layers from code structure
- Visualizes dependencies as an interactive graph
- Clearly highlights forbidden and unintended dependency directions

### 🚨 Drift Detection

Detects and classifies architectural violations, including:

- Layer boundary violations
- Circular dependencies
- Legacy system access
- API gateway bypasses

Violations are categorized by severity (Critical / High / Medium) and surfaced contextually in the graph.

### 🕒 Analysis History

- Stores each analysis run as an **immutable snapshot**
- Enables time-based reasoning about architecture
- Compare snapshots to see when drift was introduced or resolved

### ⚙️ Settings & Architecture Rules

- Control which rules are enforced during analysis
- Adjust severity thresholds and visualization behavior
- Embedded documentation explains _why_ rules exist, not just what they do

### 🤖 AI-Assisted Explanations

- Generates clear, technical explanations for detected violations
- Provides remediation guidance grounded in architectural best practices

---

## Tech Stack

### Backend

- **Python 3.12**
- **FastAPI** — async API framework
- **MongoDB Atlas** — immutable snapshot storage
- **Motor** — async MongoDB client
- **NetworkX** — dependency graph modeling
- **AST Parsing** — static code analysis

### Frontend

- **React 18 + TypeScript**
- **Vite** — fast build tooling
- **Tailwind CSS** — UI styling
- **Framer Motion** — subtle UI animations
- **React Flow** — interactive architecture visualization

---

## System Design Overview

### Architecture Principles

- Architecture is treated as **data**, not documentation
- Each analysis run produces a **complete snapshot**
- Snapshots are immutable and time-ordered
- Drift is detected by comparing _intent_ vs _actual dependencies_

---

## Project Structure

### Backend

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── api/                 # API routes
│   ├── analysis/            # Code parsing & dependency analysis
│   ├── graph/               # Dependency graph construction
│   ├── rules/               # Architecture rules engine
│   ├── drift/               # Drift & violation detection
│   ├── history/             # Snapshot persistence & comparison
│   ├── settings/            # Analysis configuration
│   └── db/                  # MongoDB connection
└── requirements.txt
```

### Frontend

```
frontend/
├── src/
│   ├── pages/
│   │   ├── ArchitectureMap.tsx
│   │   ├── DriftViolations.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── GraphCanvas.tsx
│   │   └── ViolationCard.tsx
│   ├── services/
│   │   └── api.ts
│   └── App.tsx
└── package.json
```

---

## API Endpoints

| Method | Endpoint                   | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| POST   | `/analysis`                | Run architecture analysis and store snapshot |
| GET    | `/architecture-map`        | Get architecture graph for a snapshot        |
| GET    | `/violations`              | List detected violations                     |
| GET    | `/history`                 | List historical analysis snapshots           |
| GET    | `/history/{id}`            | Retrieve a specific snapshot                 |
| GET    | `/history/compare/{a}/{b}` | Compare two snapshots                        |
| GET    | `/settings`                | Get analysis settings                        |
| POST   | `/settings`                | Update analysis settings                     |
| GET    | `/health`                  | Health check                                 |

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB Atlas cluster

---

### Backend Setup

```bash
cd backend

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd Layered_UI
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Configuration

**Backend (.env)**

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/layered
OPENAI_API_KEY=optional
```

**Frontend**

```
VITE_API_URL=http://localhost:8000
```

---

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

This setup provides a production-like environment while remaining lightweight and cost-effective.

---

## Design Philosophy

Layered intentionally avoids:

- User accounts
- Team management
- Alerts and notifications
- CI/CD enforcement

The focus is on **clarity, correctness, and architectural reasoning**, not SaaS complexity.

---

## Future Enhancements

- Support for additional languages (Java, Go)
- Custom rule definitions
- CI/CD integration
- Architecture trend visualization
- Large-repo optimization

---

## License

MIT

---

## Author

Built as a portfolio project to explore architecture analysis, system design, and time-based reasoning in software systems.
