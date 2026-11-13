from pathlib import Path

import chromadb

from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
BASE_DIR = Path(__file__).resolve().parent.parent
chromadb_client = chromadb.PersistentClient(str(BASE_DIR / "chroma_db"))

embedding_function = SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)
job_collection = chromadb_client.get_or_create_collection(
    name="jobs",
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"},
)
