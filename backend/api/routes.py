import os
from typing import Any, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from starlette.concurrency import run_in_threadpool

from services.chroma_service import get_chroma_service
from services.clip_service import get_clip_service
from services.ollama_service import get_ollama_service
from utils.config import settings
from utils.image_utils import load_image, save_upload, validate_image
from .schemas import (
    AnalyzeResponse,
    HealthResponse,
    ImageSimilarityResponse,
    SearchRequest,
    SearchResponse,
    SimilarityResult,
    TextSearchRequest,
    TextSearchResponse,
    UploadResponse,
)

router = APIRouter()


def build_image_url(request: Request, filename: str) -> str:
    return str(request.base_url) + f"uploads/{filename}"


def normalize_top_k(top_k: Optional[int]) -> int:
    value = top_k or settings.top_k
    if value < 1 or value > 50:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="top_k must be between 1 and 50")
    return value


def ensure_managed_image_path(image_path: str) -> str:
    upload_root = os.path.abspath(settings.upload_dir)
    resolved_path = os.path.abspath(image_path)
    if os.path.commonpath([upload_root, resolved_path]) != upload_root:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Image path is outside the upload directory")
    return resolved_path


async def persist_valid_image(file: UploadFile) -> tuple[str, str]:
    validate_image(file)
    file_path, filename = await save_upload(file)
    try:
        await run_in_threadpool(load_image, file_path)
    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    return file_path, filename


async def index_uploaded_image(request: Request, file: UploadFile) -> UploadResponse:
    file_path, filename = await persist_valid_image(file)
    image = await run_in_threadpool(load_image, file_path)

    clip_service = get_clip_service()
    chroma_service = get_chroma_service()

    embedding = await run_in_threadpool(clip_service.encode_image, image)
    record = await run_in_threadpool(chroma_service.add_image, embedding, file_path, filename)

    return UploadResponse(
        id=record["id"],
        image_url=build_image_url(request, filename),
        metadata=record["metadata"],
        duplicate=record.get("duplicate", False),
    )


@router.post(
    "/upload-image",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and index an image",
)
async def upload_image(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    return await index_uploaded_image(request, file)


@router.post("/search-by-text", response_model=SearchResponse, summary="Search indexed images by text")
async def search_by_text(request: Request, payload: SearchRequest) -> SearchResponse:
    clip_service = get_clip_service()
    chroma_service = get_chroma_service()

    embedding = await run_in_threadpool(clip_service.encode_text, payload.query)
    results = await run_in_threadpool(chroma_service.query, embedding, normalize_top_k(payload.top_k))

    return SearchResponse(results=_format_results(request, results))


@router.post("/search-by-image", response_model=SearchResponse, summary="Search indexed images by image")
async def search_by_image(
    request: Request,
    file: UploadFile = File(...),
    top_k: Optional[int] = Form(None),
) -> SearchResponse:
    file_path, _filename = await persist_valid_image(file)
    image = await run_in_threadpool(load_image, file_path)

    clip_service = get_clip_service()
    chroma_service = get_chroma_service()

    embedding = await run_in_threadpool(clip_service.encode_image, image)
    results = await run_in_threadpool(chroma_service.query, embedding, normalize_top_k(top_k))

    return SearchResponse(results=_format_results(request, results))


# ---------------------------------------------------------------------------
# New dedicated similarity search endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/search-similar-images",
    response_model=ImageSimilarityResponse,
    summary="Find top similar images using CLIP + ChromaDB cosine similarity",
)
async def search_similar_images(
    request: Request,
    file: UploadFile = File(...),
    top_k: Optional[int] = Form(5),
) -> ImageSimilarityResponse:
    """Upload a query image and retrieve the top-k most similar images."""
    file_path, filename = await persist_valid_image(file)
    image = await run_in_threadpool(load_image, file_path)

    clip_service = get_clip_service()
    chroma_service = get_chroma_service()

    embedding = await run_in_threadpool(clip_service.encode_image, image)
    similar = await run_in_threadpool(
        chroma_service.search_similar_images, embedding, normalize_top_k(top_k)
    )

    results = [
        SimilarityResult(
            id=item["id"],
            similarity_score=round(item["similarity"], 4),
            image_path=item["image_path"] or "",
            image_url=build_image_url(request, item["metadata"].get("filename", "")),
            metadata=item["metadata"],
            distance=item["distance"],
        )
        for item in similar
    ]

    return ImageSimilarityResponse(
        query_image_url=build_image_url(request, filename),
        total_results=len(results),
        results=results,
    )


@router.post(
    "/search-text-to-image",
    response_model=TextSearchResponse,
    summary="Semantic text-to-image retrieval using CLIP embeddings",
)
async def search_text_to_image(
    request: Request,
    payload: TextSearchRequest,
) -> TextSearchResponse:
    """Convert text into CLIP embedding and find semantically similar images."""
    clip_service = get_clip_service()
    chroma_service = get_chroma_service()

    embedding = await run_in_threadpool(clip_service.encode_text, payload.query)
    similar = await run_in_threadpool(
        chroma_service.text_search, embedding, normalize_top_k(payload.top_k)
    )

    results = [
        SimilarityResult(
            id=item["id"],
            similarity_score=round(item["similarity"], 4),
            image_path=item["image_path"] or "",
            image_url=build_image_url(request, item["metadata"].get("filename", "")),
            metadata=item["metadata"],
            distance=item["distance"],
        )
        for item in similar
    ]

    return TextSearchResponse(
        query_text=payload.query,
        total_results=len(results),
        results=results,
    )


@router.post("/analyze-image", response_model=AnalyzeResponse, summary="Analyze an image with Ollama")
async def analyze_image(
    request: Request,
    file: UploadFile | None = File(None),
    image_path: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
) -> AnalyzeResponse:
    if request.headers.get("content-type", "").startswith("application/json"):
        payload = await request.json()
        image_path = payload.get("image_path", image_path)
        prompt = payload.get("prompt", prompt)

    prompt = prompt or "Describe this image and mention any notable details."

    if file is not None:
        image_path, _filename = await persist_valid_image(file)

    if not image_path:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Provide either file or image_path")

    image_path = ensure_managed_image_path(image_path)

    if not os.path.exists(image_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    ollama_service = get_ollama_service()
    response = await run_in_threadpool(ollama_service.analyze_image, image_path, prompt)
    return AnalyzeResponse(**response)


@router.get("/health", response_model=HealthResponse, summary="Service health")
async def health() -> HealthResponse:
    chroma_status = "ok"
    ollama_status = "ok"

    try:
        chroma_service = get_chroma_service()
        await run_in_threadpool(chroma_service.count)
    except Exception:
        chroma_status = "error"

    try:
        ollama_service = get_ollama_service()
        await run_in_threadpool(ollama_service.healthcheck)
    except Exception:
        ollama_status = "error"

    status_value = "ok" if chroma_status == "ok" and ollama_status == "ok" else "degraded"
    return HealthResponse(status=status_value, chroma=chroma_status, ollama=ollama_status)


@router.post("/api/images/upload", response_model=UploadResponse, include_in_schema=False)
async def upload_image_legacy(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    return await index_uploaded_image(request, file)


@router.post("/api/search/text", response_model=SearchResponse, include_in_schema=False)
async def search_by_text_legacy(request: Request, payload: SearchRequest) -> SearchResponse:
    return await search_by_text(request, payload)


@router.post("/api/search/image", response_model=SearchResponse, include_in_schema=False)
async def search_by_image_legacy(request: Request, file: UploadFile = File(...)) -> SearchResponse:
    return await search_by_image(request, file, top_k=None)


@router.post("/api/analyze", response_model=AnalyzeResponse, include_in_schema=False)
async def analyze_image_legacy(request: Request) -> AnalyzeResponse:
    return await analyze_image(request, file=None, image_path=None, prompt=None)


def _format_results(request: Request, results: dict[str, Any]) -> List[dict[str, Any]]:
    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    formatted = []
    for image_id, distance, metadata in zip(ids, distances, metadatas):
        filename = metadata.get("filename", "")
        distance_value = float(distance)
        formatted.append(
            {
                "id": image_id,
                "image_url": build_image_url(request, filename),
                "distance": distance_value,
                "similarity": max(0.0, min(1.0, 1.0 - distance_value)),
                "metadata": metadata,
            }
        )

    return formatted
