"""
Quick test script to verify MongoDB connection and save a test document
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Load .env
load_dotenv()

async def test_mongodb():
    try:
        # Get connection string
        mongo_url = os.getenv("MONGODB_URL")
        print(f"Connecting to: {mongo_url[:50]}...")
        
        # Connect
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client["layered_history"]
        
        # Test connection
        await client.server_info()
        print("✓ Connected to MongoDB successfully!")
        
        # Try to insert a test document
        collection = db["analysis_snapshots"]
        test_doc = {
            "test": True,
            "timestamp": datetime.utcnow(),
            "message": "Test document from test_mongo.py"
        }
        
        result = await collection.insert_one(test_doc)
        print(f"✓ Inserted test document with ID: {result.inserted_id}")
        
        # Count documents
        count = await collection.count_documents({})
        print(f"✓ Total documents in collection: {count}")
        
        # Clean up test document
        await collection.delete_one({"_id": result.inserted_id})
        print("✓ Cleaned up test document")
        
        client.close()
        print("\n✓ MongoDB connection test PASSED!")
        
    except Exception as e:
        import traceback
        print(f"\n✗ MongoDB connection test FAILED!")
        print(f"Error: {e}")
        print(f"\nFull traceback:\n{traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_mongodb())
