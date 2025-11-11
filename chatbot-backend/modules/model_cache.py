"""
Model caching to speed up query processing
Keeps embedding model in memory to avoid reloading
"""
from functools import lru_cache
from logger import logger

_embedding_model = None
_llm_model = None


@lru_cache(maxsize=1)
def get_cached_embedding_model():
    """
    Get or create embedding model (cached in memory)
    Only loads once, then reuses
    """
    global _embedding_model
    
    if _embedding_model is None:
        logger.info("Loading embedding model (first time)...")
        from langchain_huggingface import HuggingFaceEmbeddings
        _embedding_model = HuggingFaceEmbeddings(
            model_name='sentence-transformers/all-mpnet-base-v2'
        )
        logger.info("✅ Embedding model loaded and cached")
    
    return _embedding_model


@lru_cache(maxsize=1)
def get_cached_pinecone_index():
    """
    Get or create Pinecone index connection (cached)
    """
    import os
    from pinecone import Pinecone
    
    logger.info("Connecting to Pinecone index...")
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    index = pc.Index(os.environ["PINECONE_INDEX_NAME"])
    logger.info("✅ Pinecone index connected")
    
    return index


def clear_cache():
    """Clear cached models (useful for testing/debugging)"""
    global _embedding_model, _llm_model
    _embedding_model = None
    _llm_model = None
    get_cached_embedding_model.cache_clear()
    get_cached_pinecone_index.cache_clear()
    logger.info("Model cache cleared")
