from fastapi import APIRouter,UploadFile,File
from typing import List
from modules.load_vectorstore import load_vectorstore
from modules.async_processor import queue_documents_for_processing, get_processing_status
from fastapi.responses import JSONResponse
from logger import logger
from datetime import datetime
import os

# Import MongoDB functions
try:
    from config.mongodb import get_db
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    logger.warning("MongoDB not available for upload tracking")

router=APIRouter()

@router.post("/upload/")
async def upload_to_database(files: List[UploadFile] = File(...)):
    """
    Upload documents to vector database and store metadata in MongoDB
    NOW WITH ASYNC PROCESSING - Returns immediately, processes in background
    """
    try:
        logger.info(f"Received {len(files)} files for database upload")
        
        # Queue files for background processing (returns immediately)
        file_records = await queue_documents_for_processing(files)
        
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
        return {
            "message": f"Successfully queued {len(files)} document(s) for processing",
            "files": file_records,
            "count": len(files),
            "status": "processing",
            "note": "Documents are being processed in the background. You can continue using the chat."
        }

    except Exception as e:
        logger.exception("Error during database upload")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/upload/status/{file_id}")
async def get_upload_status(file_id: str):
    """
    Check the processing status of an uploaded file
    """
    status = get_processing_status(file_id)
    return {
        "file_id": file_id,
        **status
    }


@router.post("/upload_pdfs/")
async def upload_pdfs(files:List[UploadFile] = File(...)):
    """
    Legacy synchronous upload endpoint (slower)
    Consider using /upload/ instead for faster response
    """
    try:
        logger.info("Received uploaded files (synchronous processing)")
        load_vectorstore(files)
        logger.info("Document added to vector store")
        return {"message":"Files processed and vectorstore updated"}

    except Exception as e:
        logger.exception("Error during pdf upload")
        return JSONResponse(status_code=500,content={"error":str(e)})
