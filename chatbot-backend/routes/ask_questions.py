from fastapi import APIRouter, Form, UploadFile, File
from fastapi.responses import JSONResponse
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from typing import List, Optional
from pydantic import Field
from logger import logger
import os
from dotenv import load_dotenv
from datetime import datetime

# Import MongoDB functions
try:
    from config.mongodb import store_legal_query, track_analytics
    MONGODB_ENABLED = True
except ImportError:
    logger.warning("MongoDB config not found, running without database storage")
    MONGODB_ENABLED = False

load_dotenv()

router = APIRouter()

@router.post("/ask/")
async def ask_question(
    question: str = Form(...),
    user_id: str = Form(default="anonymous"),
    file: Optional[UploadFile] = File(None)
):
    try:
        logger.info(f"User {user_id} query: {question}")
        
        # Handle file if attached
        file_metadata = None
        if file:
            logger.info(f"File attached: {file.filename}")
            
            # Store file metadata in MongoDB
            if MONGODB_ENABLED:
                try:
                    from config.mongodb import get_db
                    db = get_db()
                    documents_collection = db['documents']
                    
                    # Read file content for potential processing
                    file_content = await file.read()
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
            return JSONResponse(status_code=503, content={"error": "ML/vector libraries not available. Please install required packages."})

        # Use cached models for much faster response
        embed_model = get_cached_embedding_model()
        index = get_cached_pinecone_index()
        
        # Embed query (much faster with cached model)
        embedded_query = embed_model.embed_query(question)
        res = index.query(vector=embedded_query, top_k=5, include_metadata=True)

        # Calculate confidence score from top match
        confidence_score = res.get("matches", [])[0].get("score") if res.get("matches") else 0.0

        docs = [
            Document(
                page_content=match.get("metadata", {}).get("text", ""),
                metadata=match.get('metadata', {})
            ) for match in res.get("matches", [])
        ]

        class SimpleRetriever(BaseRetriever):                          
            tags: Optional[List[str]] = Field(default_factory=list)
            metadata: Optional[dict] = Field(default_factory=dict)

            def __init__(self, documents: List[Document]):
                super().__init__()
                self._docs = documents

            def _get_relevant_documents(self, query: str) -> List[Document]:
                return self._docs
            
        retriever = SimpleRetriever(docs)
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
            "answer": ai_text
        }
        
        # Include file info if file was attached
        if file_metadata:
            response_data["attachedFile"] = {
                "filename": file_metadata.get('filename'),
                "size": file_metadata.get('size')
            }
        
        return response_data
        
    except Exception as e:
        logger.exception("Error processing in question")
        
        # Track error if MongoDB enabled
        if MONGODB_ENABLED:
            track_analytics("query_error", {
                "userId": user_id if 'user_id' in locals() else "unknown",
                "error": str(e)
            })
        
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/feedback/")
async def submit_feedback(
    query_id: str = Form(...),
    feedback: str = Form(...)
):
    """
    Submit feedback for a query
    feedback should be: 'helpful', 'not_helpful', or 'partially_helpful'
    """
    if not MONGODB_ENABLED:
        return JSONResponse(
            status_code=503,
            content={"error": "MongoDB not available"}
        )
    
    try:
        from config.mongodb import update_query_feedback
        
        success = update_query_feedback(query_id, feedback)
        
        if success:
            logger.info(f"Feedback updated for query {query_id}: {feedback}")
            return {"message": "Feedback recorded", "queryId": query_id}
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Failed to update feedback"}
            )
    except Exception as e:
        logger.exception("Error submitting feedback")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/history/{user_id}")
async def get_query_history(user_id: str, limit: int = 10):
    """Get query history for a user"""
    if not MONGODB_ENABLED:
        return JSONResponse(
            status_code=503,
            content={"error": "MongoDB not available"}
        )
    
    try:
        from config.mongodb import get_user_query_history
        
        history = get_user_query_history(user_id, limit)
        
        return {
            "userId": user_id,
            "totalQueries": len(history),
            "queries": history
        }
    except Exception as e:
        logger.exception("Error fetching history")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/analytics/")
async def get_analytics(days: int = 7):
    """Get analytics summary"""
    if not MONGODB_ENABLED:
        return JSONResponse(
            status_code=503,
            content={"error": "MongoDB not available"}
        )
    
    try:
        from config.mongodb import get_analytics_summary
        
        summary = get_analytics_summary(days)
        return summary
    except Exception as e:
        logger.exception("Error fetching analytics")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/health/")
async def health_check():
    """Check MongoDB and service health"""
    try:
        from config.mongodb import check_mongodb_health
        
        mongodb_status = check_mongodb_health() if MONGODB_ENABLED else False
        
        return {
            "status": "healthy",
            "mongodb": "connected" if mongodb_status else "disconnected",
            "mongodb_enabled": MONGODB_ENABLED
        }
    except Exception as e:
        return {
            "status": "degraded",
            "mongodb": "error",
            "error": str(e)
        }


