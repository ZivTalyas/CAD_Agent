import os
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: Optional[AsyncIOMotorClient] = None


def get_db() -> AsyncIOMotorDatabase:
    global _client
    if _client is None:
        url = os.environ["MONGODB_URL"]
        _client = AsyncIOMotorClient(url)
    return _client["cad_agent"]
