import hashlib
import logging
import os
import uuid
from typing import Any, Dict, List, Optional

import chromadb

from utils.config import settings
from utils.image_utils import now_iso

logger = logging.getLogger(__name__)


class ChromaService:
    def __init__(self) -> None:
        if settings.chroma_http_host:
            self.client = chromadb.HttpClient(
                host=settings.chroma_http_host,
                port=settings.chroma_http_port,
            )
        else:
            os.makedirs(settings.chroma_path, exist_ok=True)
            self.client = chromadb.PersistentClient(path=settings.chroma_path)
        self.collection = self.client.get_or_create_collection(
            settings.chroma_collection,
            metadata={
                "hnsw:space": "cosine",
                "hnsw:construction_ef": 200,
                "hnsw:search_ef": 100,
                "hnsw:M": 16,
            },
        )

    def _build_id(self, image_path: str) -> str:
        return hashlib.sha256(image_path.encode("utf-8")).hexdigest()

    def _find_duplicate(self, image_path: str) -> Optional[str]:
        try:
            result = self.collection.get(
                where={"image_path": image_path},
            )
            ids = result.get("ids", [])
            return ids[0] if ids else None
        except Exception:
            logger.exception("Failed to check duplicate for %s", image_path)
            return None

    def add_embedding(
        self,
        embedding: List[float],
        image_path: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        try:
            existing_id = self._find_duplicate(image_path)
            if existing_id:
                logger.info("Duplicate image skipped: %s", image_path)
                existing = self.collection.get(ids=[existing_id], include=["metadatas"])
                return {
                    "id": existing_id,
                    "metadata": (existing.get("metadatas") or [{}])[0],
                    "duplicate": True,
                }

            image_id = self._build_id(image_path)
            record_metadata = {
                "image_path": image_path,
                "upload_time": now_iso(),
            }
            if metadata:
                record_metadata.update(metadata)

            self.collection.add(
                ids=[image_id],
                embeddings=[embedding],
                metadatas=[record_metadata],
                documents=[image_path],
            )

            return {"id": image_id, "metadata": record_metadata, "duplicate": False}
        except Exception as exc:
            logger.exception("Failed to add embedding for %s", image_path)
            raise RuntimeError("Failed to add embedding") from exc

    def search_similar_images(self, embedding: List[float], top_k: int) -> List[Dict[str, Any]]:
        try:
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=top_k,
                include=["metadatas", "distances", "documents"],
            )
            ids = results.get("ids", [[]])[0]
            distances = results.get("distances", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]

            formatted: List[Dict[str, Any]] = []
            for image_id, distance, metadata in zip(ids, distances, metadatas):
                similarity = max(0.0, min(1.0, 1.0 - float(distance)))
                formatted.append(
                    {
                        "id": image_id,
                        "image_path": metadata.get("image_path"),
                        "metadata": metadata,
                        "distance": float(distance),
                        "similarity": similarity,
                    }
                )
            return formatted
        except Exception as exc:
            logger.exception("Failed to search similar images")
            raise RuntimeError("Failed to search embeddings") from exc

    def text_search(self, text_embedding: List[float], top_k: int) -> List[Dict[str, Any]]:
        """Semantic text-to-image search using cosine similarity."""
        return self.search_similar_images(text_embedding, top_k)

    def delete_embedding(self, image_id: str) -> bool:
        try:
            self.collection.delete(ids=[image_id])
            return True
        except Exception as exc:
            logger.exception("Failed to delete embedding: %s", image_id)
            raise RuntimeError("Failed to delete embedding") from exc

    def get_image(self, image_id: str) -> Dict[str, Any]:
        try:
            result = self.collection.get(ids=[image_id], include=["metadatas", "documents"])
            metadata = (result.get("metadatas") or [{}])[0]
            document = (result.get("documents") or [None])[0]
            return {
                "id": image_id,
                "image_path": document,
                "metadata": metadata,
            }
        except Exception as exc:
            logger.exception("Failed to fetch image: %s", image_id)
            raise RuntimeError("Failed to fetch image") from exc

    def add_image(self, embedding: List[float], file_path: str, filename: str) -> Dict[str, Any]:
        record = self.add_embedding(
            embedding,
            file_path,
            metadata={"filename": filename, "timestamp": now_iso()},
        )
        return record

    def query(self, embedding: List[float], top_k: int) -> Dict[str, Any]:
        results = self.collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            include=["metadatas", "distances", "documents"],
        )
        return results

    def count(self) -> int:
        return int(self.collection.count())


_chroma_service: ChromaService | None = None


def get_chroma_service() -> ChromaService:
    global _chroma_service
    if _chroma_service is None:
        _chroma_service = ChromaService()
    return _chroma_service
