import os
from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware
from middlewares.metrics import instrument_request_middleware
from routes.contract_review import router as contract_review_router
from models.schemas import HealthResponse
from services.legacy_adapter import load_legacy_analyzer
from services import runtime_state
from logger import logger
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

app = FastAPI(
    title="JURY AI Contract Review API",
    description="Isolated contract review backend for document analysis",
    version="1.0.0",
)

# Keep CORS aligned with other local services
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(instrument_request_middleware)
app.middleware("http")(catch_exception_middleware)

legacy_path = os.getenv("LEGACY_CONTRACT_REVIEW_PATH", "./legacy/copy_of_contract_review.py")
use_legacy_analyzer = os.getenv("USE_LEGACY_CONTRACT_REVIEW", "false").lower() == "true"
runtime_state.legacy_analyzer = load_legacy_analyzer(legacy_path) if use_legacy_analyzer else None


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="contract-review-backend",
        legacy_loaded=runtime_state.legacy_analyzer is not None,
        version="1.0.0",
    )


@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Contract Review Backend started")
    if runtime_state.legacy_analyzer is not None:
        logger.info("✅ Legacy analyzer wired successfully")
    elif use_legacy_analyzer:
        logger.warning("⚠️ USE_LEGACY_CONTRACT_REVIEW=true but analyzer not loaded; using native engine")
    else:
        logger.info("ℹ️ Using native contract review engine (legacy disabled by default)")


app.include_router(contract_review_router)
