"""
MongoDB cache layer for the AI Agent.
Stores question-answer pairs to avoid redundant Groq API calls.
"""

import os
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

_client = None
_collection = None


def _get_collection():
    """Lazy-initialize MongoDB connection and return the qa_cache collection."""
    global _client, _collection
    if _collection is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = _client["booksphere_ai"]
        _collection = db["qa_cache"]
        # Create index on normalized_question for fast lookups
        _collection.create_index("normalized_question", unique=True)
    return _collection


def _normalize(question: str) -> str:
    """Normalize a question for cache matching: lowercase, strip, collapse whitespace."""
    return " ".join(question.lower().strip().split())


def find_cached_answer(question: str) -> dict | None:
    """
    Look up a cached answer for the given question.
    Returns the full cached document (with 'answer', 'intent', etc.) or None.
    """
    try:
        collection = _get_collection()
        normalized = _normalize(question)
        doc = collection.find_one({"normalized_question": normalized})
        if doc:
            # Update hit count
            collection.update_one(
                {"_id": doc["_id"]},
                {"$inc": {"hit_count": 1}, "$set": {"last_accessed": datetime.now(timezone.utc)}}
            )
            return {
                "answer": doc["answer"],
                "book": doc.get("book"),
                "intent": doc.get("intent"),
                "from_cache": True,
            }
        return None
    except Exception as e:
        print(f"⚠️ Cache lookup failed: {e}")
        return None


def save_to_cache(question: str, answer: str, intent: str, book: dict = None) -> None:
    """Save a question-answer pair to the MongoDB cache."""
    try:
        collection = _get_collection()
        normalized = _normalize(question)
        collection.update_one(
            {"normalized_question": normalized},
            {
                "$set": {
                    "original_question": question,
                    "normalized_question": normalized,
                    "answer": answer,
                    "intent": intent,
                    "book": book,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {
                    "created_at": datetime.now(timezone.utc),
                    "hit_count": 0,
                },
            },
            upsert=True,
        )
        print(f"✅ Cached answer for: {normalized[:60]}...")
    except Exception as e:
        print(f"⚠️ Cache save failed: {e}")
