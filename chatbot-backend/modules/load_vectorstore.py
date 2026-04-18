import os
import time
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from itertools import islice
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from modules.model_cache import get_cached_embedding_model

load_dotenv()

# 🔑 Environment variables
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_ENV = "us-east-1"
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "legal-index")

UPLOAD_DIR = "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _get_pinecone_index():
    pc = Pinecone(api_key=PINECONE_API_KEY)
    spec = ServerlessSpec(cloud="aws", region=PINECONE_ENV)
    existing_indexes = []
    for item in pc.list_indexes():
        if isinstance(item, dict):
            name = item.get("name")
        else:
            name = getattr(item, "name", None)
        if name:
            existing_indexes.append(name)

    if PINECONE_INDEX_NAME not in existing_indexes:
        print(f"Creating Pinecone index: {PINECONE_INDEX_NAME}")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=768,
            metric="cosine",
            spec=spec
        )
        while True:
            description = pc.describe_index(PINECONE_INDEX_NAME)
            status = getattr(description, "status", None)
            if isinstance(status, dict) and status.get("ready"):
                break
            time.sleep(1)

    return pc.Index(PINECONE_INDEX_NAME)

# ✅ Helper for batching
def batch_iterable(iterable, batch_size):
    """Yield successive batch_size-sized chunks from iterable"""
    it = iter(iterable)
    while batch := list(islice(it, batch_size)):
        yield batch


# ✅ Load, split, embed, and upsert PDFs
def load_vectorstore(uploaded_files):
    try:
        print("\n🔹 Initializing embedding model...")
        embed_model = get_cached_embedding_model()

        file_paths = []

        # 1️⃣ Save uploaded files locally
        for file in uploaded_files:
            save_path = Path(UPLOAD_DIR) / file.filename
            with open(save_path, "wb") as f:
                f.write(file.file.read())
            file_paths.append(str(save_path))

        # 2️⃣ Process each file
        for file_path in file_paths:
            print(f"\n📘 Processing: {file_path}")

            # Load PDF
            loader = PyPDFLoader(file_path)
            documents = loader.load()

            # Split text
            splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
            chunks = splitter.split_documents(documents)

            texts = [chunk.page_content for chunk in chunks]
            metadata = [{"text": chunk.page_content, **chunk.metadata} for chunk in chunks]
            ids = [f"{Path(file_path).stem}-{i}" for i in range(len(chunks))]

            # 3️⃣ Embeddings
            print(f"🧠 Embedding {len(texts)} chunks...")
            embeddings = embed_model.embed_documents(texts)

            # 4️⃣ Safe batched upsert to Pinecone
            print(f"📤 Upserting Embeddings (in safe batches)...")
            batch_size = 100  # adjust 50–150 depending on your doc size
            index = _get_pinecone_index()
            for batch in tqdm(batch_iterable(zip(ids, embeddings, metadata), batch_size),
                              total=len(embeddings)//batch_size + 1,
                              desc="Upserting to Pinecone"):
                index.upsert(vectors=batch)

            print(f"✅ Upload complete for {Path(file_path).name}")

    except Exception as e:
        print(f"❌ Error during document upload: {e}")
        raise
