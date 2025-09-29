from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

from ..config import settings

class RAGService:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.qdrant_client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
        self.collection_name = settings.qdrant_collection_name
        print("RAG service initialized and connected to Qdrant.")

    def search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        try:
            query_embedding = self.model.encode(query).tolist()
            
            search_result = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=k,
                with_payload=True
            )
            
            return [hit.payload for hit in search_result]
        except Exception as e:
            print(f"Error searching Qdrant: {e}")
            # This can happen if the collection doesn't exist yet.
            # The ingest script should be run first.
            return []

# Singleton instance of the RAG service
rag_service = RAGService()
