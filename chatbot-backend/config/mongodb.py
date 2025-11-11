"""
MongoDB Configuration for JURY AI Chatbot Backend
Handles storage of chat history, queries, and analytics
"""

from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
from logger import logger

load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")

try:
    client = MongoClient(MONGO_URI)
    # Test connection
    client.admin.command('ping')
    logger.info("✅ MongoDB connection successful")
except Exception as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    client = None

# Database
db = client["jury-ai"] if client is not None else None

# Collections
legal_queries_collection = db["legal_queries"] if db is not None else None
chatbot_sessions_collection = db["chatbot_sessions"] if db is not None else None
analytics_collection = db["analytics"] if db is not None else None


def get_db():
    """Get MongoDB database instance"""
    return db


def store_legal_query(
    user_id: str,
    query: str,
    ai_response: str,
    category: Optional[str] = None,
    confidence: Optional[float] = None,
    sources: Optional[List[Dict]] = None
) -> Optional[str]:
    """
    Store a legal query and its AI response in MongoDB
    
    Args:
        user_id: User identifier
        query: The user's question
        ai_response: The AI-generated answer
        category: Category of the legal query
        confidence: Confidence score (0-1)
        sources: List of source documents used
    
    Returns:
        The inserted document ID as string, or None if failed
    """
    if legal_queries_collection is None:
        logger.warning("MongoDB not connected, skipping query storage")
        return None
    
    try:
        document = {
            "userId": user_id,
            "query": query,
            "aiResponse": ai_response,
            "timestamp": datetime.utcnow(),
            "category": category if category else "general",  # Default to "general" if None
            "confidence_score": confidence if confidence is not None else 0.0,
            "sources": sources or [],
            "feedback": None
        }
        result = legal_queries_collection.insert_one(document)
        logger.info(f"✅ Stored query with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"❌ Error storing query: {e}")
        return None


def create_chatbot_session(user_id: str, session_id: str) -> Optional[str]:
    """
    Create a new chatbot session
    
    Args:
        user_id: User identifier
        session_id: Unique session identifier
    
    Returns:
        The inserted document ID or None
    """
    if chatbot_sessions_collection is None:
        return None
    
    try:
        session = {
            "sessionId": session_id,
            "userId": user_id,
            "startTime": datetime.utcnow(),
            "endTime": None,
            "queries": [],
            "satisfaction_rating": None
        }
        result = chatbot_sessions_collection.insert_one(session)
        logger.info(f"✅ Created session: {session_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"❌ Error creating session: {e}")
        return None


def add_query_to_session(session_id: str, query_id: str) -> bool:
    """
    Add a query to an existing session
    
    Args:
        session_id: Session identifier
        query_id: Query document ID
    
    Returns:
        True if successful, False otherwise
    """
    if chatbot_sessions_collection is None:
        return False
    
    try:
        result = chatbot_sessions_collection.update_one(
            {"sessionId": session_id},
            {"$push": {"queries": query_id}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"❌ Error adding query to session: {e}")
        return False


def end_chatbot_session(session_id: str, rating: Optional[int] = None) -> bool:
    """
    End a chatbot session and optionally set satisfaction rating
    
    Args:
        session_id: Session identifier
        rating: Satisfaction rating (1-5)
    
    Returns:
        True if successful, False otherwise
    """
    if chatbot_sessions_collection is None:
        return False
    
    try:
        update_data = {"endTime": datetime.utcnow()}
        if rating and 1 <= rating <= 5:
            update_data["satisfaction_rating"] = rating
        
        result = chatbot_sessions_collection.update_one(
            {"sessionId": session_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"❌ Error ending session: {e}")
        return False


def get_user_query_history(user_id: str, limit: int = 10) -> List[Dict]:
    """
    Get user's previous queries
    
    Args:
        user_id: User identifier
        limit: Maximum number of queries to return
    
    Returns:
        List of query documents
    """
    if legal_queries_collection is None:
        return []
    
    try:
        queries = list(legal_queries_collection.find(
            {"userId": user_id}
        ).sort("timestamp", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for query in queries:
            query["_id"] = str(query["_id"])
        
        return queries
    except Exception as e:
        logger.error(f"❌ Error fetching query history: {e}")
        return []


def update_query_feedback(query_id: str, feedback: str) -> bool:
    """
    Update user feedback for a query
    
    Args:
        query_id: Query document ID
        feedback: Feedback type ('helpful', 'not_helpful', 'partially_helpful')
    
    Returns:
        True if successful, False otherwise
    """
    if legal_queries_collection is None:
        return False
    
    valid_feedback = ["helpful", "not_helpful", "partially_helpful"]
    if feedback not in valid_feedback:
        logger.error(f"Invalid feedback value: {feedback}")
        return False
    
    try:
        from bson.objectid import ObjectId
        result = legal_queries_collection.update_one(
            {"_id": ObjectId(query_id)},
            {"$set": {"feedback": feedback}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"❌ Error updating feedback: {e}")
        return False


def track_analytics(event_type: str, data: Dict) -> bool:
    """
    Track analytics events
    
    Args:
        event_type: Type of event (e.g., 'query_received', 'query_success', 'error')
        data: Additional event data
    
    Returns:
        True if successful, False otherwise
    """
    if analytics_collection is None:
        return False
    
    try:
        analytics_collection.insert_one({
            "eventType": event_type,
            "timestamp": datetime.utcnow(),
            "data": data
        })
        return True
    except Exception as e:
        logger.error(f"❌ Error tracking analytics: {e}")
        return False


def get_analytics_summary(days: int = 7) -> Dict:
    """
    Get analytics summary for the last N days
    
    Args:
        days: Number of days to analyze
    
    Returns:
        Dictionary with analytics data
    """
    if analytics_collection is None or legal_queries_collection is None:
        return {}
    
    try:
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total queries
        total_queries = legal_queries_collection.count_documents({
            "timestamp": {"$gte": start_date}
        })
        
        # Average confidence score
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "avg_confidence": {"$avg": "$confidence_score"}
            }}
        ]
        confidence_result = list(legal_queries_collection.aggregate(pipeline))
        avg_confidence = confidence_result[0]["avg_confidence"] if confidence_result else 0
        
        # Feedback distribution
        feedback_pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": "$feedback",
                "count": {"$sum": 1}
            }}
        ]
        feedback_dist = {
            item["_id"]: item["count"]
            for item in legal_queries_collection.aggregate(feedback_pipeline)
        }
        
        return {
            "period_days": days,
            "total_queries": total_queries,
            "average_confidence": round(avg_confidence, 3) if avg_confidence else 0,
            "feedback_distribution": feedback_dist
        }
    except Exception as e:
        logger.error(f"❌ Error getting analytics: {e}")
        return {}


# Utility function to check MongoDB health
def check_mongodb_health() -> bool:
    """Check if MongoDB connection is healthy"""
    if not client:
        return False
    try:
        client.admin.command('ping')
        return True
    except Exception:
        return False
