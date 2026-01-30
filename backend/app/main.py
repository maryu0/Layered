"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.api.endpoints import router
from app.api.history_endpoints import history_router
from app.api.settings_endpoints import settings_router
from app.db.connection import init_db
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.models.schemas import HealthCheck

# Application metadata
APP_VERSION = "1.0.0"
APP_TITLE = "Layered - Architecture Drift Detection API"
APP_DESCRIPTION = """
Layered is an Architecture Drift Detection platform that analyzes codebases
to understand their intended architectural structure and continuously checks
whether the actual code still follows that structure.

## Features

* **Architecture Map** - Visualize dependency graph with layer groupings
* **Drift Detection** - Detect layer violations, circular dependencies, and forbidden access
* **AI Explanations** - Plain-English explanations of violations and suggested fixes
* **Historical Tracking** - Monitor architecture drift over time

## Endpoints

* `POST /analyze` - Analyze a repository and detect drift
* `GET /architecture-map` - Get dependency graph for visualization
* `GET /violations` - List all detected violations
* `GET /violations/{id}` - Get detailed violation information
* `GET /history` - View historical drift snapshots
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources."""
    # Startup
    print("Initializing Layered API...")
    await init_db()
    print("Database initialized")
    await connect_to_mongo()
    print("MongoDB connected")
    
    yield
    
    # Shutdown
    print("Shutting down Layered API...")
    await close_mongo_connection()


# Create FastAPI application
app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://layered-theta.vercel.app",
        "https://layered-muw7kxx3a-maryus-projects-db28d80b.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api", tags=["architecture"])
app.include_router(history_router, prefix="/api")
app.include_router(settings_router, prefix="/api")


@app.get("/", tags=["health"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": APP_TITLE,
        "version": APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", response_model=HealthCheck, tags=["health"])
async def health_check():
    """Health check endpoint."""
    return HealthCheck(
        status="healthy",
        version=APP_VERSION,
        timestamp=datetime.utcnow()
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        reload_excludes=["venv/*", "*.pyc", "__pycache__/*", ".git/*"],  # Exclude venv from watching
        log_level="info"
    )
