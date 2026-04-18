from fastapi import APIRouter,UploadFile,File, Request
from typing import List
from modules.load_vectorstore import load_vectorstore
from modules.async_processor import queue_documents_for_processing, get_processing_status
from logger import logger
from datetime import datetime
import os
import requests
from utils.response_envelope import success_payload, error_response

# Import MongoDB functions
try:
    from config.mongodb import get_db
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    logger.warning("MongoDB not available for upload tracking")

router=APIRouter()

MAX_UPLOAD_FILES = int(os.getenv("MAX_UPLOAD_FILES", "10"))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
ALLOWED_UPLOAD_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

AUTH_PROFILE_URL = os.getenv("AUTH_PROFILE_URL", "https://noble-illumination-production-043e.up.railway.app/api/auth/profile")
UPLOAD_ALLOWED_ROLES = {"admin", "lawyer"}


def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "").strip()
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return ""


def _get_role_from_auth_service(token: str) -> str:
    if not token:
        return ""

    try:
        response = requests.get(
            AUTH_PROFILE_URL,
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
        )
        if response.status_code != 200:
            return ""

        payload = response.json() if response.content else {}
        user_data = payload.get("user") or payload.get("data", {}).get("user") or {}
        role = str(user_data.get("role") or "").strip().lower()
        return role
    except Exception as auth_error:
        logger.warning(f"Upload authorization check failed: {auth_error}")
        return ""


def _enforce_upload_access(request: Request):
    token = _extract_bearer_token(request)
    if not token:
        return error_response("Authentication required for knowledge base upload", 401, request)

    role = _get_role_from_auth_service(token)
    if role not in UPLOAD_ALLOWED_ROLES:
        return error_response("Only admin or lawyer can upload documents to knowledge base", 403, request)

    return None

@router.post("/upload/")
async def upload_to_database(request: Request, files: List[UploadFile] = File(...)):
    """
    Upload documents to vector database and store metadata in MongoDB
    NOW WITH ASYNC PROCESSING - Returns immediately, processes in background
    """
    try:
        access_error = _enforce_upload_access(request)
        if access_error:
            return access_error

        if not files:
            return error_response("No files provided", 400, request)

        if len(files) > MAX_UPLOAD_FILES:
            return error_response(f"Too many files. Max allowed is {MAX_UPLOAD_FILES}.", 400, request)

        valid_files: List[UploadFile] = []
        rejected_files = []

        for file in files:
            if file.content_type not in ALLOWED_UPLOAD_TYPES:
                rejected_files.append({
                    "filename": file.filename,
                    "reason": "unsupported_type"
                })
                continue

            content = await file.read()
            await file.seek(0)
            if len(content) > MAX_UPLOAD_BYTES:
                rejected_files.append({
                    "filename": file.filename,
                    "reason": "too_large"
                })
                continue

            valid_files.append(file)

        if not valid_files:
            return error_response("All files were rejected", 400, request, data={"rejectedFiles": rejected_files})

        logger.info(f"Received {len(files)} files for database upload")
        
        # Queue files for background processing (returns immediately)
        file_records = await queue_documents_for_processing(valid_files)
        
        logger.info(f"Files queued for background processing: {len(files)}")
        
        # Store metadata in MongoDB immediately
        if MONGODB_AVAILABLE:
            try:
                db = get_db()
                documents_collection = db['documents']
                
                for record in file_records:
                    doc_metadata = {
                        'file_id': record['file_id'],
                        'filename': record['filename'],
                        'size': record['size'],
                        'uploaded_at': datetime.utcnow(),
                        'status': 'processing',
                        'type': 'knowledge_base'
                    }
                    documents_collection.insert_one(doc_metadata)
                
                logger.info(f"Stored metadata for {len(files)} files in MongoDB")
            except Exception as mongo_error:
                logger.error(f"MongoDB storage error: {mongo_error}")
        
        # Return immediately - processing happens in background
        return success_payload({
            "message": f"Successfully queued {len(valid_files)} document(s) for processing",
            "files": file_records,
            "count": len(valid_files),
            "rejectedFiles": rejected_files,
            "status": "processing",
            "note": "Documents are being processed in the background. You can continue using the chat."
        }, message="Upload queued", request=request)

    except Exception as e:
        logger.exception("Error during database upload")
        return error_response("Error during database upload", 500, request, data={"detail": str(e)})


@router.get("/upload/status/{file_id}")
async def get_upload_status(request: Request, file_id: str):
    """
    Check the processing status of an uploaded file
    """
    status = get_processing_status(file_id)
    return success_payload({
        "file_id": file_id,
        **status
    }, message="Upload status fetched", request=request)


@router.post("/upload_pdfs/")
async def upload_pdfs(request: Request, files:List[UploadFile] = File(...)):
    """
    Legacy synchronous upload endpoint (slower)
    Consider using /upload/ instead for faster response
    """
    try:
        access_error = _enforce_upload_access(request)
        if access_error:
            return access_error

        logger.info("Received uploaded files (synchronous processing)")
        load_vectorstore(files)
        logger.info("Document added to vector store")
        return success_payload({"message":"Files processed and vectorstore updated"}, message="Legacy upload complete", request=request)

    except Exception as e:
        logger.exception("Error during pdf upload")
        return error_response("Error during pdf upload", 500, request, data={"detail": str(e)})
