# Layered Backend - Architecture Drift Detection API

Production-ready backend for the Layered platform - detecting and explaining architecture drift in codebases.

## Quick Start

### 1. Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and configure (optional - works with defaults)
DATABASE_URL=sqlite+aiosqlite:///./layered.db
OPENAI_API_KEY=your-key-here  # Optional for AI explanations
```

### 3. Run the Server

```bash
# Development mode with auto-reload
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
app/
├── api/
│   └── endpoints.py          # FastAPI route handlers
├── analysis/
│   ├── analyzer.py           # Repository analysis pipeline
│   └── inference.py          # Architecture inference engine
├── graph/
│   └── builder.py            # Dependency graph construction
├── rules/
│   └── engine.py             # Architecture rules validation
├── drift/
│   └── detector.py           # Violation detection logic
├── ai/
│   └── explainer.py          # AI-powered explanations
├── models/
│   ├── schemas.py            # Pydantic models (API)
│   └── database.py           # SQLAlchemy models (DB)
├── db/
│   └── connection.py         # Database connection management
└── main.py                   # Application entry point
```

## API Endpoints

### POST /api/analyze

Analyze a repository and detect architecture drift.

**Request:**

```json
{
  "repo_path": "/path/to/repository",
  "branch": "main",
  "include_tests": false
}
```

**Response:**

```json
{
  "analysis_id": "uuid",
  "status": "success",
  "total_modules": 42,
  "total_dependencies": 156,
  "total_violations": 8,
  "violations_by_severity": {
    "critical": 2,
    "high": 3,
    "medium": 2,
    "low": 1
  },
  "timestamp": "2024-01-14T12:00:00",
  "duration_seconds": 2.5
}
```

### GET /api/architecture-map

Get dependency graph for frontend visualization.

**Query params:**

- `analysis_id` (optional) - defaults to latest

**Response:**

```json
{
  "nodes": [...],
  "edges": [...],
  "layers": [...],
  "metadata": {}
}
```

### GET /api/violations

List all violations with optional filtering.

**Query params:**

- `analysis_id` (optional)
- `severity` (optional): critical, high, medium, low
- `type` (optional): layer_violation, circular_dependency, etc.

### GET /api/violations/{id}

Get detailed violation with explanation and suggested fix.

### GET /api/history

View historical architecture snapshots.

**Query params:**

- `limit` (default: 10)

## Core Components

### 1. Repository Analyzer

- Walks directory tree
- Extracts Python modules
- Parses imports using AST
- Filters out external dependencies

### 2. Dependency Graph Builder

- Constructs directed graph using NetworkX
- Provides graph queries (cycles, paths, etc.)
- Stores metadata about modules

### 3. Architecture Inference Engine

- Infers layers from folder structure and naming
- Determines layer hierarchy from dependency flow
- Generates allowed dependency rules

### 4. Rules Engine

- Encodes architectural rules
- Validates layer boundaries
- Determines violation severity

### 5. Violation Detector

- Detects layer violations
- Finds circular dependencies
- Identifies legacy access issues
- Detects gateway bypasses

### 6. AI Explanation Service

- Generates plain-English explanations
- Provides refactoring suggestions
- Template-based (fast) or AI-powered (OpenAI)

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app
```

### Code Quality

```bash
# Format code
black app/

# Lint
flake8 app/
```

## Deployment

### Production Configuration

```bash
# Set production environment
ENVIRONMENT=production

# Use PostgreSQL for production
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

### Run with Gunicorn

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

## Database

The application uses SQLite by default for MVP. To upgrade to PostgreSQL:

1. Update `.env`:

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/layered
```

2. Install PostgreSQL driver:

```bash
pip install asyncpg
```

3. Database tables are auto-created on startup.

## Frontend Integration

The API is designed for seamless frontend integration:

- **CORS enabled** for localhost development
- **JSON responses** optimized for React components
- **Graph data** ready for React Flow / D3 visualization
- **Violations** linkable to graph nodes
- **Real-time** analysis progress (can add WebSocket)

## Architecture Decisions

### Why FastAPI?

- Modern async Python framework
- Automatic OpenAPI docs
- Type-safe with Pydantic
- High performance

### Why NetworkX?

- Industry-standard graph library
- Rich algorithms (cycles, paths, etc.)
- Easy to use and extend

### Why SQLite for MVP?

- Zero configuration
- File-based (easy deployment)
- Upgradeable to PostgreSQL
- Sufficient for 1000s of analyses

### Why Template-based Explanations?

- Fast (no API calls)
- Deterministic
- No external dependencies
- Can upgrade to AI later

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
