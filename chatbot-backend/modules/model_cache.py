"""
Model caching to speed up query processing
Keeps embedding model in memory to avoid reloading
"""
from functools import lru_cache
from logger import logger
import os

_embedding_model = None
_llm_model = None


class _DimensionReducedEmbeddings:
    """Wrapper that delegates to GoogleGenerativeAIEmbeddings with reduced output dims."""

    def __init__(self, model_name, target_dim):
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        self._inner = GoogleGenerativeAIEmbeddings(model=model_name)
        self._dim = target_dim

    def embed_documents(self, texts, **kwargs):
        kwargs.setdefault("output_dimensionality", self._dim)
        return self._inner.embed_documents(texts, **kwargs)

    def embed_query(self, text, **kwargs):
        kwargs.setdefault("output_dimensionality", self._dim)
        return self._inner.embed_query(text, **kwargs)


def _build_embedding_model():
    provider = os.getenv("EMBEDDING_PROVIDER", "google").lower()
    if provider in {"google", "gemini"}:
        model_name = os.getenv("GOOGLE_EMBEDDING_MODEL", "models/gemini-embedding-001")
        target_dim = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))
        return _DimensionReducedEmbeddings(model_name, target_dim)
    if provider in {"huggingface", "hf"}:
        from langchain_huggingface import HuggingFaceEmbeddings
        model_name = os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2")
        return HuggingFaceEmbeddings(model_name=model_name)
    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {provider}")


@lru_cache(maxsize=1)
def get_cached_embedding_model():
    """
    Get or create embedding model (cached in memory)
    Only loads once, then reuses
    """
    global _embedding_model
    
    if _embedding_model is None:
        logger.info("Loading embedding model (first time)...")
        _embedding_model = _build_embedding_model()
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
