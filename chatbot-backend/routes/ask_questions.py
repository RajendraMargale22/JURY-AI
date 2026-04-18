from fastapi import APIRouter, Form, UploadFile, File, Request
from fastapi.responses import JSONResponse
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from typing import List, Optional
from pydantic import Field
from logger import logger
import os
from dotenv import load_dotenv
from datetime import datetime
import time
from utils.response_envelope import success_payload, error_response

# Import MongoDB functions
try:
    from config.mongodb import store_legal_query, track_analytics
    MONGODB_ENABLED = True
except ImportError:
    logger.warning("MongoDB config not found, running without database storage")
    MONGODB_ENABLED = False

load_dotenv()

router = APIRouter()

MAX_QUESTION_CHARS = int(os.getenv("MAX_QUESTION_CHARS", "2000"))
MAX_ATTACHMENT_BYTES = int(os.getenv("MAX_ATTACHMENT_BYTES", str(10 * 1024 * 1024)))
ALLOWED_ATTACHMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}
DEFAULT_TOP_K = int(os.getenv("VECTOR_TOP_K", "5"))

@router.post("/ask/")
async def ask_question(
    request: Request,
    question: str = Form(...),
    user_id: str = Form(default="anonymous"),
    file: Optional[UploadFile] = File(None)
):
    try:
        started_at = time.perf_counter()
        question = (question or "").strip()
        user_id = (user_id or "anonymous").strip()[:120] or "anonymous"

        if len(question) < 3:
            return error_response("Question is too short", 400, request)

        if len(question) > MAX_QUESTION_CHARS:
            return error_response(f"Question is too long. Max {MAX_QUESTION_CHARS} characters.", 400, request)

        logger.info(f"User {user_id} query: {question}")
        
        # Handle file if attached
        file_metadata = None
        if file:
            logger.info(f"File attached: {file.filename}")

            if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
                return error_response("Unsupported attachment type", 400, request)
            
            # Store file metadata in MongoDB
            if MONGODB_ENABLED:
                try:
                    from config.mongodb import get_db
                    db = get_db()
                    documents_collection = db['documents']
                    
                    # Read file content for potential processing
                    file_content = await file.read()
                    if len(file_content) > MAX_ATTACHMENT_BYTES:
                        return error_response(
                            f"Attachment too large. Max {MAX_ATTACHMENT_BYTES} bytes.",
                            400,
                            request,
                        )
                    await file.seek(0)  # Reset file pointer
                    
                    file_metadata = {
                        'filename': file.filename,
                        'content_type': file.content_type,
                        'size': len(file_content),
                        'uploaded_at': datetime.utcnow(),
                        'user_id': user_id,
                        'type': 'chat_attachment',
                        'query': question
                    }
                    result = documents_collection.insert_one(file_metadata)
                    file_metadata['_id'] = str(result.inserted_id)
                    logger.info(f"Stored file metadata in MongoDB: {file.filename}")
                except Exception as file_error:
                    logger.error(f"Error storing file metadata: {file_error}")

        # Track analytics if MongoDB is enabled
        if MONGODB_ENABLED:
            track_analytics("query_received", {
                "userId": user_id,
                "queryLength": len(question),
                "hasAttachment": file is not None
            })

        # Lazy-import heavy/optional libraries so the module can be imported even if they are missing
        try:
            from langchain_core.documents import Document
            from langchain_core.retrievers import BaseRetriever
            from modules.model_cache import get_cached_embedding_model, get_cached_pinecone_index
        except Exception as e:
            logger.error(f"Required ML/vector libraries missing: {e}")
            return error_response("ML/vector libraries not available. Please install required packages.", 503, request)

        # Use cached models for much faster response
        embed_model = get_cached_embedding_model()
        index = get_cached_pinecone_index()
        
        # Embed query (much faster with cached model)
        embedded_query = embed_model.embed_query(question)
        res = index.query(vector=embedded_query, top_k=DEFAULT_TOP_K, include_metadata=True)

        # Calculate confidence score from top match
        confidence_score = res.get("matches", [])[0].get("score") if res.get("matches") else 0.0

        docs = [
            Document(
                page_content=match.get("metadata", {}).get("text", ""),
                metadata=match.get('metadata', {})
            ) for match in res.get("matches", [])
            if match.get("metadata", {}).get("text")
        ]

        class SimpleRetriever(BaseRetriever):
            """Minimal retriever that returns pre-fetched documents."""
            docs: List[Document] = Field(default_factory=list)

            def _get_relevant_documents(self, query: str) -> List[Document]:
                return self.docs
            
        retriever = SimpleRetriever(docs=docs)
        chain = get_llm_chain(retriever)

        result = query_chain(chain, question)

        # Extract the clean text response from the result dictionary
        if isinstance(result, dict):
            # query_chain returns {'response': text, 'sources': [...]}
            ai_text = result.get('response') or result.get('answer') or result.get('text') or str(result)
        else:
            ai_text = str(result)
        
        # Ensure ai_text is a clean string, not a stringified dict
        if isinstance(ai_text, str) and ai_text.startswith("{'response':"):
            # If it's a stringified dict, extract just the response value
            try:
                import ast
                parsed = ast.literal_eval(ai_text)
                ai_text = parsed.get('response', ai_text)
            except:
                pass
        
        # Extract sources for MongoDB storage
        sources = [
            {
                "text": doc.page_content[:200],  # Store first 200 chars
                "metadata": doc.metadata
            } for doc in docs[:3]  # Top 3 sources
        ]
        
        # Store in MongoDB if enabled
        query_id = None
        if MONGODB_ENABLED:
            query_id = store_legal_query(
                user_id=user_id,
                query=question,
                ai_response=ai_text,
                confidence=confidence_score,
                sources=sources
            )
            
            # Track successful query
            track_analytics("query_success", {
                "userId": user_id,
                "queryId": query_id,
                "confidence": confidence_score
            })
        
        logger.info("Query is successful")
        
        # Return clean, formatted response
        response_data = {
            "answer": ai_text,
            "confidence": round(float(confidence_score or 0.0), 4),
            "sources": [
                {
                    "snippet": doc.page_content[:220],
                    "metadata": doc.metadata
                }
                for doc in docs[:3]
            ],
            "queryId": query_id,
            "processingMs": round((time.perf_counter() - started_at) * 1000, 2)
        }
        
        # Include file info if file was attached
        if file_metadata:
            response_data["attachedFile"] = {
                "filename": file_metadata.get('filename'),
                "size": file_metadata.get('size')
            }
        
        return success_payload(response_data, message="Query processed successfully", request=request)
        
    except Exception as e:
        logger.exception("Error processing in question")
        
        # Track error if MongoDB enabled
        if MONGODB_ENABLED:
            track_analytics("query_error", {
                "userId": user_id if 'user_id' in locals() else "unknown",
                "error": str(e)
            })
        
        return error_response("Failed to process query", 500, request, data={"detail": str(e)})


@router.post("/feedback/")
async def submit_feedback(
    request: Request,
    query_id: str = Form(...),
    feedback: str = Form(...)
):
    """
    Submit feedback for a query
    feedback should be: 'helpful', 'not_helpful', or 'partially_helpful'
    """
    if not MONGODB_ENABLED:
        return error_response("MongoDB not available", 503, request)
    
    try:
        from config.mongodb import update_query_feedback
        
        success = update_query_feedback(query_id, feedback)
        
        if success:
            logger.info(f"Feedback updated for query {query_id}: {feedback}")
            return success_payload({"queryId": query_id}, message="Feedback recorded", request=request)
        else:
            return error_response("Failed to update feedback", 400, request)
    except Exception as e:
        logger.exception("Error submitting feedback")
        return error_response("Error submitting feedback", 500, request, data={"detail": str(e)})


@router.get("/history/{user_id}")
async def get_query_history(request: Request, user_id: str, limit: int = 10):
    """Get query history for a user"""
    if not MONGODB_ENABLED:
        return error_response("MongoDB not available", 503, request)
    
    try:
        from config.mongodb import get_user_query_history
        
        history = get_user_query_history(user_id, limit)
        
        return success_payload({
            "userId": user_id,
            "totalQueries": len(history),
            "queries": history
        }, message="Query history fetched", request=request)
    except Exception as e:
        logger.exception("Error fetching history")
        return error_response("Error fetching history", 500, request, data={"detail": str(e)})


@router.get("/analytics/")
async def get_analytics(request: Request, days: int = 7):
    """Get analytics summary"""
    if not MONGODB_ENABLED:
        return error_response("MongoDB not available", 503, request)
    
    try:
        from config.mongodb import get_analytics_summary
        
        summary = get_analytics_summary(days)
        return success_payload(summary, message="Analytics fetched", request=request)
    except Exception as e:
        logger.exception("Error fetching analytics")
        return error_response("Error fetching analytics", 500, request, data={"detail": str(e)})


@router.get("/health/")
async def health_check(request: Request):
    """Check MongoDB and service health"""
    try:
        from config.mongodb import check_mongodb_health
        
        mongodb_status = check_mongodb_health() if MONGODB_ENABLED else False
        
        return success_payload({
            "status": "healthy",
            "mongodb": "connected" if mongodb_status else "disconnected",
            "mongodb_enabled": MONGODB_ENABLED
        }, message="Service health fetched", request=request)
    except Exception as e:
        return error_response("Health check degraded", 503, request, data={
            "status": "degraded",
            "mongodb": "error",
            "error": str(e)
        })


