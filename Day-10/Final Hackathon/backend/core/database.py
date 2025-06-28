import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
from typing import Optional
import asyncio
from core.config import get_settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db = Database()

async def get_database():
    """Get database instance"""
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    settings = get_settings()
    try:
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
            uuidRepresentation='standard'
        )
        db.database = db.client[settings.DATABASE_NAME]
        
        # Create indexes
        await create_indexes()
        print("✅ Connected to MongoDB successfully")
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("✅ Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Users collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("username", unique=True)
        
        # Projects collection indexes
        await db.database.projects.create_index([("user_id", 1), ("created_at", -1)])
        await db.database.projects.create_index("user_id")
        
        # Conversations collection indexes
        await db.database.vivvie_conversations.create_index([("user_id", 1), ("created_at", -1)])
        await db.database.vivvie_conversations.create_index("project_id")
        
        # Edit history indexes
        await db.database.edit_history.create_index([("project_id", 1), ("timestamp", -1)])
        await db.database.edit_history.create_index("user_id")
        
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {e}") 