import os
from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from middlewares.exception_handlers import catch_exception_middleware
from middlewares.metrics import instrument_request_middleware
from middlewares.request_context import attach_request_id_middleware
from routes.contract_review import router as contract_review_router
from models.schemas import HealthResponse
from services.legacy_adapter import load_legacy_analyzer
from services import runtime_state
from services.ml_classifier import get_ml_model_status
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
app.middleware("http")(attach_request_id_middleware)

legacy_path = os.getenv("LEGACY_CONTRACT_REVIEW_PATH", "./legacy/copy_of_contract_review.py")
use_legacy_analyzer = False  # Hardcoded to bypass legacy analyzer and use internal ML
runtime_state.legacy_analyzer = None


@app.get("/")
async def root():
    return {"status": "ok", "message": "JURY AI Contract Review Backend is running"}

@app.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    request_id = getattr(request.state, "request_id", None)
    return HealthResponse(
        success=True,
        message="Health check successful",
        requestId=request_id,
        data={"status": "healthy"},
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
    ml_status = get_ml_model_status()
    if ml_status.get("ready"):
        logger.info(
            "ML primary ready (%s): %s",
            ml_status.get("model_type"),
            ml_status.get("model_path"),
        )
    else:
        logger.warning(
            "ML primary not ready; set CONTRACT_REVIEW_MODEL_PATH to a trained model to enable ML-first review"
        )
    if runtime_state.legacy_analyzer is not None:
        logger.info("✅ Legacy analyzer wired successfully")
    elif use_legacy_analyzer:
        logger.warning("⚠️ USE_LEGACY_CONTRACT_REVIEW=true but analyzer not loaded; using native engine")
    else:
        logger.info("ℹ️ Using native contract review engine (legacy disabled by default)")


app.include_router(contract_review_router)
