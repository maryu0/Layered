# Layered - Architecture Drift Detection Platform

A powerful tool for detecting and preventing architecture degradation in software projects through automated dependency analysis and layer violation detection.

## Features

- **Architecture Understanding**: Automatically infers architectural layers from code structure
- **Drift Detection**: Identifies 4 types of violations:
  - Layer violations (bypassing architectural layers)
  - Circular dependencies
  - Legacy system access violations
  - Gateway bypasses
- **AI Explanations**: Provides detailed explanations and remediation suggestions
- **Visual Graph**: Interactive dependency graph with violation highlighting
- **Real-time Analysis**: Analyze repositories on-demand

## Tech Stack

### Backend

- **Python 3.12** with FastAPI
- **NetworkX** for dependency graph analysis
- **SQLAlchemy** with SQLite for persistence
- **AST parsing** for static code analysis

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The backend will be available at http://localhost:8000

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd Layered_UI
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Usage

1. **Start both servers** (backend on 8000, frontend on 5173)

2. **Open the application** in your browser at http://localhost:5173

3. **Analyze a repository**:

   - Enter the absolute path to your Python repository in the input field
   - Click "Analyze" or press Enter
   - Wait for the analysis to complete

4. **View results**:

   - **Graph View**: See the dependency graph with nodes organized by architectural layers
   - **Violations View**: Browse detected violations in a card layout
   - Click any violation to see detailed information in the right panel

5. **Understand violations**:
   - Each violation shows severity (Critical, High, Medium)
   - AI-generated explanations describe why it's problematic
   - Suggested fixes provide actionable remediation steps

## Architecture

### Backend Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── api/
│   │   └── endpoints.py     # REST API routes
│   ├── models/
│   │   ├── schemas.py       # Pydantic models
│   │   └── database.py      # SQLAlchemy models
│   ├── analysis/
│   │   ├── analyzer.py      # AST-based code analysis
│   │   └── inference.py     # Layer inference engine
│   ├── graph/
│   │   └── builder.py       # NetworkX dependency graph
│   ├── rules/
│   │   └── engine.py        # Architectural rules
│   ├── drift/
│   │   └── detector.py      # Violation detection
│   ├── ai/
│   │   └── explainer.py     # AI explanation generation
│   └── db/
│       └── connection.py    # Database connection
└── requirements.txt
```

### Frontend Structure

```
Layered_UI/
├── src/
│   ├── App.tsx
│   ├── pages/
│   │   └── Dashboard.tsx    # Main dashboard view
│   ├── components/
│   │   ├── Sidebar.tsx      # Navigation
│   │   ├── CommandPalette.tsx  # Analysis trigger
│   │   ├── ArchitectureGraph.tsx  # Graph visualization
│   │   ├── ViolationsInbox.tsx    # Violations list
│   │   └── RightPanel.tsx   # Violation details
│   └── services/
│       └── api.ts           # Backend API client
└── package.json
```

## API Endpoints

- `POST /analyze` - Trigger repository analysis
- `GET /architecture-map` - Get dependency graph with layers
- `GET /violations` - List all violations
- `GET /violations/{id}` - Get detailed violation info
- `GET /history` - Get analysis history
- `GET /health` - Health check

## Configuration

### Backend (`.env`)

```
DATABASE_URL=sqlite+aiosqlite:///./layered.db
OPENAI_API_KEY=your_key_here  # Optional, for enhanced AI explanations
```

### Frontend

The frontend automatically connects to `http://localhost:8000` for the backend API.

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd Layered_UI
npm test
```

### Building for Production

```bash
# Frontend
cd Layered_UI
npm run build

# Backend is production-ready as-is
```

## Roadmap

- [ ] Support for Java/Spring projects
- [ ] Custom rule definitions
- [ ] Integration with CI/CD pipelines
- [ ] Historical trend analysis
- [ ] Team collaboration features
- [ ] Slack/Teams notifications

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
