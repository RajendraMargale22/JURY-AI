from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware
from routes.upload_pdfs import router as upload_router
from routes.ask_questions import router as ask_router
from logger import logger

app=FastAPI(title="Medical Assistant API",description="API for AI Medical Assistant chatbot")

#CORS setup

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Startup event to preload models
@app.on_event("startup")
async def startup_event():
    """Preload models on startup for faster first query"""
    logger.info("🚀 Starting up - preloading models...")
    try:
        from modules.model_cache import get_cached_embedding_model, get_cached_pinecone_index
        # Trigger model loading
        get_cached_embedding_model()
        get_cached_pinecone_index()
        logger.info("✅ Models preloaded - ready for fast queries!")
    except Exception as e:
        logger.warning(f"⚠️ Could not preload models: {e}")

# middleware exception handlers
app.middleware("http")(catch_exception_middleware)
#routers
# 1. upload documents
app.include_router(upload_router)

# 2. asking query
app.include_router(ask_router)

