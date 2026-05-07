from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    id: str
    image_url: str
    metadata: Dict[str, Any]
    duplicate: bool = False


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: Optional[int] = Field(default=None, ge=1, le=50)


class SearchImageResponseItem(BaseModel):
    id: str
    image_url: str
    distance: float
    similarity: float
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    results: List[SearchImageResponseItem]


class AnalyzeRequest(BaseModel):
    image_path: Optional[str] = None
    prompt: str = Field("Describe this image and mention any notable details.", min_length=1)


class AnalyzeResponse(BaseModel):
    analysis: str
    confidence: str


class HealthResponse(BaseModel):
    status: str
    chroma: str
    ollama: str


class ErrorResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# New schemas for dedicated similarity search endpoints
# ---------------------------------------------------------------------------

class SimilarityResult(BaseModel):
    """Individual similarity search result."""
    id: str
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    image_path: str = Field(..., description="Server path to the matched image")
    image_url: str = Field(..., description="Accessible URL for the matched image")
    metadata: Dict[str, Any] = Field(..., description="Image metadata (filename, upload_time, etc.)")
    distance: float = Field(..., description="Raw cosine distance from ChromaDB")


class ImageSimilarityResponse(BaseModel):
    """Response for image-to-image similarity search."""
    query_image_url: str
    total_results: int
    results: List[SimilarityResult]


class TextSearchRequest(BaseModel):
    """Request for text-to-image semantic search."""
    query: str = Field(..., min_length=1)
    top_k: Optional[int] = Field(default=5, ge=1, le=50)


class TextSearchResponse(BaseModel):
    """Response for text-to-image semantic retrieval."""
    query_text: str
    total_results: int
    results: List[SimilarityResult]
