"""
MongoDB connection and setup for history tracking.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os

# MongoDB connection
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

# Configuration - use environment variable or default to Atlas template
MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
)
DATABASE_NAME = "layered_history"


async def connect_to_mongo():
    """Connect to MongoDB and set up indexes."""
    global _client, _db
    
    _client = AsyncIOMotorClient(MONGODB_URL)
    _db = _client[DATABASE_NAME]
    
    # Create indexes
    await _db.analysis_snapshots.create_index([("repo.name", 1), ("timestamp", -1)])
    await _db.analysis_snapshots.create_index([("summary.critical", -1)])
    
    print(f"Connected to MongoDB: {DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()
        print("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _db
