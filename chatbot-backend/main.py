from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware
from middlewares.request_context import attach_request_id_middleware
from routes.upload_pdfs import router as upload_router
from routes.ask_questions import router as ask_router
from logger import logger
import os
from utils.response_envelope import success_payload

app=FastAPI(title="JURY AI Chatbot API",description="API for JURY AI Legal Assistant chatbot")

#CORS setup

def _get_allowed_origins() -> list[str]:
    default_origins = "http://localhost:3000,http://localhost:5000,https://jury-ai-production.up.railway.app"
    raw = os.getenv("CORS_ORIGINS", default_origins)
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]

ALLOWED_ORIGINS = _get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

import asyncio

# Startup event to preload models
@app.on_event("startup")
async def startup_event():
    """Preload models on startup for faster first query"""
    logger.info("🚀 Starting up - scheduling model preloading in background...")
    
    def load_models():
        try:
            from modules.model_cache import get_cached_embedding_model, get_cached_pinecone_index
            # Trigger model loading
            get_cached_embedding_model()
            get_cached_pinecone_index()
            logger.info("✅ Models preloaded - ready for fast queries!")
        except Exception as e:
            logger.warning(f"⚠️ Could not preload models: {e}")

    # Run in background executor so FastAPI can start and answer health checks immediately
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, load_models)

# middleware exception handlers
app.middleware("http")(catch_exception_middleware)
app.middleware("http")(attach_request_id_middleware)
#routers
# 1. upload documents
app.include_router(upload_router)

# 2. asking query
app.include_router(ask_router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "JURY AI Chatbot Backend is running"}

@app.get("/health")
async def health_check(request: Request):
    return success_payload(
        {
            "status": "ok",
            "service": "jury-ai-chatbot-backend"
        },
        message="Health check successful",
        request=request,
    )


@app.get("/ready")
async def readiness_check(request: Request):
    try:
        from modules.model_cache import get_cached_embedding_model, get_cached_pinecone_index
        get_cached_embedding_model()
        get_cached_pinecone_index()
        return success_payload({"ready": True}, message="Readiness check successful", request=request)
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "success": False,
            "message": "Readiness check failed",
            "data": {"ready": False},
            "ready": False,
            "error": str(e),
            "requestId": getattr(request.state, "request_id", None),
        }

