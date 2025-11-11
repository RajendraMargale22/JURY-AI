"""
Async background processing for document uploads
Processes files in background without blocking the API response
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List
from fastapi import UploadFile
from logger import logger
from pathlib import Path
import os

# Thread pool for background processing
executor = ThreadPoolExecutor(max_workers=2)

# Track processing status
processing_status = {}


async def process_document_async(file_path: str, file_id: str):
    """
    Process a single document in the background
    """
    try:
        processing_status[file_id] = {"status": "processing", "progress": 0}
        
        # Import heavy libraries only when needed
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_huggingface import HuggingFaceEmbeddings
        from pinecone import Pinecone
        from itertools import islice
        
        logger.info(f"Background processing started: {file_path}")
        
        # Initialize (cached after first use)
        embed_model = HuggingFaceEmbeddings(model_name='sentence-transformers/all-mpnet-base-v2')
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index = pc.Index(os.environ.get("PINECONE_INDEX_NAME"))
        
        processing_status[file_id]["progress"] = 20
        
        # Load PDF
        loader = PyPDFLoader(file_path)
        documents = await asyncio.get_event_loop().run_in_executor(
            executor, loader.load
        )
        
        processing_status[file_id]["progress"] = 40
        
        # Split text
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = splitter.split_documents(documents)
        
        texts = [chunk.page_content for chunk in chunks]
        metadata = [{"text": chunk.page_content, **chunk.metadata} for chunk in chunks]
        ids = [f"{Path(file_path).stem}-{i}" for i in range(len(chunks))]
        
        processing_status[file_id]["progress"] = 60
        processing_status[file_id]["chunks"] = len(chunks)
        
        # Embeddings (run in thread pool)
        embeddings = await asyncio.get_event_loop().run_in_executor(
            executor, embed_model.embed_documents, texts
        )
        
        processing_status[file_id]["progress"] = 80
        
        # Batch upsert
        batch_size = 100
        
        def batch_iterable(iterable, batch_size):
            it = iter(iterable)
            while batch := list(islice(it, batch_size)):
                yield batch
        
        for batch in batch_iterable(zip(ids, embeddings, metadata), batch_size):
            await asyncio.get_event_loop().run_in_executor(
                executor, index.upsert, batch
            )
        
        processing_status[file_id] = {
            "status": "completed",
            "progress": 100,
            "chunks": len(chunks)
        }
        
        logger.info(f"✅ Background processing complete: {file_path}")
        
    except Exception as e:
        logger.error(f"❌ Background processing error: {e}")
        processing_status[file_id] = {
            "status": "failed",
            "error": str(e)
        }


async def queue_documents_for_processing(files: List[UploadFile], upload_dir: str = "./uploaded_docs"):
    """
    Save files and queue them for background processing
    Returns immediately with file IDs
    """
    os.makedirs(upload_dir, exist_ok=True)
    
    file_records = []
    
    for file in files:
        # Generate unique file ID
        file_id = f"{int(asyncio.get_event_loop().time() * 1000)}_{file.filename}"
        save_path = Path(upload_dir) / file_id
        
        # Save file quickly
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Queue for background processing
        asyncio.create_task(process_document_async(str(save_path), file_id))
        
        file_records.append({
            "file_id": file_id,
            "filename": file.filename,
            "status": "queued",
            "size": len(content)
        })
        
        # Initialize status
        processing_status[file_id] = {"status": "queued", "progress": 0}
    
    return file_records


def get_processing_status(file_id: str):
    """Get current processing status of a file"""
    return processing_status.get(file_id, {"status": "not_found"})
