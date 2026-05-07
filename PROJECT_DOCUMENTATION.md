# Axithor VisionRAG Pro — Project Documentation

**Document Version:** 1.0  
**Date:** May 2026  
**Classification:** Internal / Company Submission  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Repository Structure](#5-repository-structure)
6. [Backend — Detailed Code Documentation](#6-backend--detailed-code-documentation)
   - 6.1 [Application Entry Point (`main.py`)](#61-application-entry-point-mainpy)
   - 6.2 [API Layer (`api/`)](#62-api-layer-api)
   - 6.3 [Services Layer (`services/`)](#63-services-layer-services)
   - 6.4 [Embeddings Module (`embeddings/`)](#64-embeddings-module-embeddings)
   - 6.5 [Utilities (`utils/`)](#65-utilities-utils)
7. [Frontend — Detailed Code Documentation](#7-frontend--detailed-code-documentation)
   - 7.1 [Application Shell](#71-application-shell)
   - 7.2 [Pages](#72-pages)
   - 7.3 [Components](#73-components)
   - 7.4 [API Service Client](#74-api-service-client)
8. [API Reference](#8-api-reference)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Deployment Guide](#10-deployment-guide)
11. [Configuration Reference](#11-configuration-reference)
12. [Security Model](#12-security-model)
13. [Performance Characteristics](#13-performance-characteristics)
14. [Roadmap](#14-roadmap)
15. [Glossary](#15-glossary)

---

## 1. Executive Summary

**Axithor VisionRAG Pro** is a production-grade, fully-local multimodal Retrieval-Augmented Generation (RAG) system designed for visual intelligence workflows. It enables organizations to build a semantically searchable image knowledge base that operates entirely on-premise — with no cloud APIs, no data transmission to third-party services, and no recurring API costs.

### Core Value Proposition

| Capability | Description |
|---|---|
| **Text-to-Image Search** | Find images using natural language descriptions via CLIP semantic embeddings |
| **Image-to-Image Similarity** | Identify visually similar images using cosine similarity in a high-dimensional vector space |
| **AI Visual Reasoning** | Generate natural-language analysis and descriptions of any image using a local LLM (LLaVA) |
| **100% On-Premise** | All AI inference runs locally — zero data leaves the deployment environment |
| **Production-Ready** | Containerized, health-checked, configurable, and ready for immediate deployment |

---

## 2. Project Overview

### Problem Statement

Traditional image management systems rely on manual tagging, file naming, or keyword metadata. These approaches are fragile, labor-intensive, and fail to capture semantic visual content. Cloud-based visual AI services introduce privacy risks, recurring costs, and internet dependency.

### Solution

Axithor VisionRAG Pro implements a Retrieval-Augmented Generation pipeline for images:

1. **Index Phase:** Each uploaded image is converted into a 512-dimensional vector embedding by the CLIP ViT-B/32 model. Embeddings are stored in ChromaDB's HNSW (Hierarchical Navigable Small World) vector index with cosine similarity metric.

2. **Retrieval Phase:** A user's natural language query or a reference image is embedded by the same CLIP model, then matched against the stored corpus using HNSW approximate nearest-neighbor search. Results are ranked by cosine similarity.

3. **Reasoning Phase:** A selected image is sent to a locally-running LLaVA vision-language model (via Ollama), which generates descriptive, analytical, or task-specific natural language output.

### Key Differentiators

- **No cloud dependency** — CLIP inference and LLaVA reasoning both run locally
- **Joint vision-language space** — The same CLIP model understands both images and text, enabling cross-modal search without separate text/image models
- **HNSW index** — Sub-millisecond nearest-neighbor search even at scale
- **LRU-cached text embeddings** — Repeated text queries served from a 256-entry in-memory cache
- **SHA-256 deduplication** — Prevents identical images from being indexed twice

---

## 3. System Architecture

### High-Level Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                   Docker Bridge Network: image-rag-net                 │
│                                                                         │
│  ┌─────────────────┐   REST/HTTP    ┌───────────────────────────────┐  │
│  │                 │ ────────────►  │       FastAPI Backend          │  │
│  │  React + Vite   │                │         Port: 8000             │  │
│  │  Frontend       │ ◄────────────  │                               │  │
│  │  Port: 5173     │   JSON/URLs    │  ┌─────────────────────────┐  │  │
│  └─────────────────┘                │  │  CLIP ViT-B/32 Encoder  │  │  │
│                                     │  │  LRU Cache (256 entries) │  │  │
│                                     │  └────────────┬────────────┘  │  │
│                                     └───────────────┼───────────────┘  │
│                                                     │                   │
│                          ┌──────────────────────────┼─────────────┐    │
│                          │                          │             │    │
│                          ▼                          ▼             │    │
│              ┌───────────────────┐    ┌───────────────────────┐   │    │
│              │    ChromaDB       │    │   Ollama (LLaVA)      │   │    │
│              │   Port: 8001      │    │   Port: 11434          │   │    │
│              │                   │    │                         │   │    │
│              │  HNSW Index       │    │  Vision Reasoning      │   │    │
│              │  Cosine Sim.      │    │  Natural Language      │   │    │
│              │  Persistent Vol.  │    │  Analysis & Caption    │   │    │
│              └───────────────────┘    └───────────────────────┘   │    │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Role |
|---|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS | User interface: upload, search, analyze |
| **Backend** | FastAPI (Python 3.11) | REST API, orchestration, embedding pipeline |
| **CLIP Encoder** | `openai/clip-vit-base-patch32` via HuggingFace | Convert images and text into 512-dim vectors |
| **ChromaDB** | ChromaDB 0.5.4 | Persist and query HNSW vector index |
| **Ollama / LLaVA** | Ollama + LLaVA model | Local vision-language model for image reasoning |

### Service Communication

```
Frontend  ──(HTTP/JSON)──►  Backend  ──(Python API)──►  CLIP Model (in-process)
                                    ──(HTTP)──────────►  ChromaDB  (vector store)
                                    ──(HTTP)──────────►  Ollama    (LLM server)
```

All inter-service communication within Docker Compose occurs over the isolated `image-rag-net` bridge network.

---

## 4. Technology Stack

### Backend

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.111.0 | Async REST API framework |
| Uvicorn | 0.30.1 | ASGI server (1 worker) |
| Pydantic-Settings | 2.3.4 | Environment variable configuration and validation |
| python-multipart | 0.0.9 | Multipart file upload parsing |
| Pillow | 10.3.0 | Image opening, format validation, RGB conversion |
| PyTorch | 2.3.1 | Tensor operations for CLIP inference |
| Transformers (HuggingFace) | 4.42.4 | CLIP model hosting (`CLIPModel`, `CLIPProcessor`) |
| ChromaDB | 0.5.4 | Vector database client (persistent or HTTP mode) |
| Requests | 2.32.3 | HTTP client for Ollama API calls |
| NumPy | 1.26.4 | Embedding normalization and type conversion |

### Frontend

| Library | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI component framework |
| React Router DOM | 6.30.3 | Client-side routing (3 routes) |
| Vite | 5.2.11 | Build tool and HMR dev server |
| Tailwind CSS | 3.4.4 | Utility-first CSS framework |
| Axios | 1.7.2 | HTTP client with upload progress support |
| Lucide React | 1.14.0 | SVG icon library |

### Infrastructure

| Tool | Version | Purpose |
|---|---|---|
| Docker Compose | v2 | 4-service container orchestration |
| Python | 3.11-slim | Backend runtime |
| Node.js | (via Vite) | Frontend build |
| ChromaDB image | 0.5.4 | Vector database container |
| Ollama image | latest | LLM model server container |

---

## 5. Repository Structure

```
Axithor-VisionRAG-Pro/
│
├── docker-compose.yml              # Orchestrates all 4 services
├── .env.example                    # Root environment variable template
├── .gitignore
├── .dockerignore
├── MultiImageRAG_Colab.ipynb       # Google Colab notebook demo
├── assets/
│   └── banner.png
│
├── backend/                        # FastAPI Python application
│   ├── main.py                     # App factory, middleware, exception handlers
│   ├── requirements.txt            # Python dependencies (pinned versions)
│   ├── Dockerfile                  # Multi-stage build (builder + runtime)
│   ├── .env.example                # Backend environment template
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py               # All REST endpoint handlers (8 primary + 4 legacy)
│   │   └── schemas.py              # Pydantic request/response models
│   │
│   ├── embeddings/
│   │   ├── __init__.py
│   │   └── clip_encoder.py         # Standalone module-level CLIP encoding functions
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── clip_service.py         # CLIP encoder class with LRU cache (singleton)
│   │   ├── chroma_service.py       # ChromaDB CRUD and search operations (singleton)
│   │   └── ollama_service.py       # Ollama/LLaVA integration with retry logic (singleton)
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── config.py               # Application settings via pydantic-settings
│   │   ├── image_utils.py          # Validation, save, load, base64, dedup utilities
│   │   └── logger.py               # Structured logging setup
│   │
│   └── vectordb/
│       └── __init__.py             # Vector DB package placeholder
│
└── frontend/                       # React + Vite single-page application
    ├── Dockerfile                  # Node build → Nginx-like Vite preview
    ├── .env.example                # Frontend environment template
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx                # React root mount
        ├── App.jsx                 # Router and layout shell
        ├── index.css               # Global styles and Tailwind directives
        │
        ├── pages/
        │   ├── Home.jsx            # Landing page with feature overview
        │   ├── Upload.jsx          # Drag-and-drop image upload and indexing
        │   └── Search.jsx          # Text/image search with AI analysis panel
        │
        ├── components/
        │   ├── Navbar.jsx          # Top navigation bar
        │   ├── SearchBar.jsx       # Tabbed text / image search input
        │   ├── Gallery.jsx         # Responsive image result grid
        │   ├── ResultCard.jsx      # Individual search result card
        │   ├── AiPanel.jsx         # LLaVA analysis sidebar
        │   ├── UploadDropzone.jsx  # File drag-and-drop zone
        │   ├── ImageModal.jsx      # Fullscreen image viewer
        │   ├── LoadingSkeleton.jsx # Animated loading placeholders
        │   ├── MetricCard.jsx      # Stats display card
        │   ├── StatusPill.jsx      # Status indicator badge
        │   └── Logo.jsx            # App logo component
        │
        └── services/
            └── api.js              # Axios client with all 7 API methods
```

---

## 6. Backend — Detailed Code Documentation

### 6.1 Application Entry Point (`main.py`)

**File:** `backend/main.py`

The application is created via an **app factory** pattern (`create_app()`), which returns a configured `FastAPI` instance. This pattern supports clean testing and initialization ordering.

**Initialization sequence:**
1. `setup_logging()` — Configures Python's `logging` module using settings from `config.py`
2. `ensure_upload_dir()` — Creates the upload directory if it does not exist
3. `FastAPI(...)` — Creates the app with title, description, and version metadata
4. **CORS Middleware** — Added with origins from `settings.allowed_origins` (comma-separated string, split at startup)
5. **HTTP Middleware** — Custom middleware that:
   - Generates or reads `x-request-id` from request headers
   - Times each request with `time.perf_counter()`
   - Catches unhandled exceptions and returns a structured 500 JSON response
   - Logs method, path, and elapsed time for every request
6. **Exception Handlers** — Registered for `StarletteHTTPException` (HTTP errors) and `RequestValidationError` (422 validation failures)
7. **Router** — Mounts the `APIRouter` from `api/routes.py`
8. **Static Files** — The `/uploads` URL path is mounted to serve uploaded images directly

**Key design decisions:**
- Using `create_app()` factory keeps the module importable without side effects during testing
- Request IDs flow through all log lines for distributed tracing readiness
- The upload directory is served as static files, allowing the frontend to display images directly via URL

---

### 6.2 API Layer (`api/`)

#### `api/schemas.py` — Pydantic Models

All request and response bodies are validated by Pydantic v2 models. This ensures:
- Automatic request parsing and validation with descriptive errors
- Auto-generated OpenAPI documentation (available at `/docs`)
- Type-safe data contracts between frontend and backend

| Model | Direction | Description |
|---|---|---|
| `UploadResponse` | Response | Returned after indexing an image; includes `id`, `image_url`, `metadata`, `duplicate` flag |
| `SearchRequest` | Request | Text search query + optional `top_k` (1–50) |
| `SearchImageResponseItem` | Response item | Single result with `id`, `image_url`, `distance`, `similarity`, `metadata` |
| `SearchResponse` | Response | Wraps a list of `SearchImageResponseItem` |
| `AnalyzeRequest` | Request | `image_path` + `prompt` for LLaVA analysis |
| `AnalyzeResponse` | Response | `analysis` (LLaVA text) + `confidence` (high/medium/low) |
| `HealthResponse` | Response | `status`, `chroma`, `ollama` service states |
| `SimilarityResult` | Response item | Richer result for similarity endpoints; adds `similarity_score`, `image_path`, `distance` |
| `ImageSimilarityResponse` | Response | Image-to-image search results with `query_image_url` and `total_results` |
| `TextSearchRequest` | Request | Text query + `top_k` for the dedicated text-to-image endpoint |
| `TextSearchResponse` | Response | Text search results with `query_text` and `total_results` |

#### `api/routes.py` — REST Endpoints

The router provides **8 primary endpoints** and **4 legacy aliases** (for backward compatibility, excluded from OpenAPI docs).

**Helper functions:**

| Function | Purpose |
|---|---|
| `build_image_url(request, filename)` | Constructs absolute URL for an uploaded file using the request's base URL |
| `normalize_top_k(top_k)` | Validates `top_k` is between 1 and 50; falls back to `settings.top_k` if None |
| `ensure_managed_image_path(image_path)` | Verifies the path resolves within the upload directory (path traversal protection) |
| `persist_valid_image(file)` | Validates, saves, and verifies a file upload; removes the file on failure |
| `index_uploaded_image(request, file)` | Orchestrates the full upload → validate → CLIP encode → ChromaDB store pipeline |

**Primary endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload-image` | Validate image, CLIP-encode, store in ChromaDB; returns ID + URL + metadata |
| `POST` | `/search-by-text` | Encode text query with CLIP, query ChromaDB, return ranked image list |
| `POST` | `/search-by-image` | Encode query image with CLIP, query ChromaDB, return ranked image list |
| `POST` | `/search-similar-images` | Image-to-image similarity search; returns `ImageSimilarityResponse` with scores |
| `POST` | `/search-text-to-image` | Semantic text-to-image search; returns `TextSearchResponse` with scores |
| `POST` | `/analyze-image` | Send image to Ollama/LLaVA with a prompt; returns `AnalyzeResponse` |
| `GET` | `/health` | Deep health check of ChromaDB and Ollama; returns service statuses |
| `GET/POST` | `/uploads/{filename}` | Static file serving for uploaded images (via `StaticFiles` mount) |

**Legacy aliases (hidden from docs):**

| Method | Path | Delegates to |
|---|---|---|
| `POST` | `/api/images/upload` | `upload_image` |
| `POST` | `/api/search/text` | `search_by_text` |
| `POST` | `/api/search/image` | `search_by_image` |
| `POST` | `/api/analyze` | `analyze_image` |

**Async design:** All endpoint handlers are `async`. CPU-bound operations (CLIP encoding, image loading) are dispatched to a thread pool via `run_in_threadpool()` to avoid blocking the event loop.

---

### 6.3 Services Layer (`services/`)

The service layer implements the singleton pattern for all three external integrations. Each service is instantiated once at first use and reused on subsequent calls.

#### `services/clip_service.py` — CLIP Encoder Service

**Class:** `CLIPService`

Wraps the HuggingFace `CLIPModel` and `CLIPProcessor` for producing L2-normalized 512-dimensional embeddings.

| Method | Description |
|---|---|
| `__init__()` | Detects CUDA availability; loads `CLIPProcessor` and `CLIPModel` from HuggingFace Hub (or local cache); moves model to device; sets eval mode |
| `encode_image(image)` | Accepts a PIL `Image`; runs forward pass through CLIP image tower; returns normalized float list |
| `encode_text(text)` | Normalizes text (strip + lowercase), computes MD5 hash, delegates to `_cached_encode_text` |
| `_cached_encode_text(text_hash, text)` | `@lru_cache(maxsize=256)` — caches up to 256 unique text embeddings; runs text through CLIP text tower; returns normalized float tuple |

**Key implementation details:**
- L2 normalization (`/ tensor.norm(p=2, ...)`) ensures cosine similarity equals dot product, enabling correct ChromaDB distance computation
- LRU cache key is the MD5 hash of the text (not the text itself), preventing memory bloat from long strings
- `torch.no_grad()` context manager disables gradient computation for inference, reducing memory and compute overhead

#### `services/chroma_service.py` — ChromaDB Vector Store Service

**Class:** `ChromaService`

Manages all vector database operations: indexing, querying, deduplication, and deletion.

**Initialization:** Supports two ChromaDB modes:
- **HTTP mode** — connects to an external ChromaDB server (`CHROMA_HTTP_HOST` is set); used in Docker Compose
- **Persistent mode** — creates a local persistent client at `CHROMA_PATH`; used in local development

Collection HNSW parameters:

| Parameter | Value | Effect |
|---|---|---|
| `hnsw:space` | `cosine` | Uses cosine distance metric |
| `hnsw:construction_ef` | 200 | Higher accuracy index construction |
| `hnsw:search_ef` | 100 | Accuracy/speed tradeoff at query time |
| `hnsw:M` | 16 | Number of bidirectional links per node (memory/quality balance) |

| Method | Description |
|---|---|
| `_build_id(image_path)` | SHA-256 hash of the absolute file path — deterministic, dedup-safe image ID |
| `_find_duplicate(image_path)` | Queries ChromaDB for an existing record with matching `image_path` metadata |
| `add_embedding(embedding, image_path, metadata)` | Checks for duplicate; if new, creates record with ID, embedding, metadata, and document path |
| `add_image(embedding, file_path, filename)` | Convenience wrapper around `add_embedding`; adds `filename` and `timestamp` to metadata |
| `search_similar_images(embedding, top_k)` | Queries ChromaDB with a CLIP embedding; returns list of ranked results with similarity scores |
| `text_search(text_embedding, top_k)` | Delegates to `search_similar_images`; text and image embeddings are in the same space |
| `query(embedding, top_k)` | Raw ChromaDB query returning unprocessed result dictionaries |
| `get_image(image_id)` | Retrieves a single record by ID |
| `delete_embedding(image_id)` | Deletes a record by ID |
| `count()` | Returns the total number of indexed images |

**Similarity computation:** Distance returned by ChromaDB's cosine metric is `1 - cosine_similarity`. The similarity score is computed as `max(0.0, min(1.0, 1.0 - distance))`, clamped to `[0, 1]`.

#### `services/ollama_service.py` — Ollama LLM Service

**Class:** `OllamaService`

Integrates with a locally-running Ollama server to perform vision reasoning using the LLaVA model.

| Method | Description |
|---|---|
| `analyze_image(image_path, prompt)` | Reads image, base64-encodes it, POSTs to `/api/generate` with prompt and image; retries up to `max_retries` times with linear backoff (capped at 3s) |
| `healthcheck()` | GETs `/api/tags` to verify Ollama is reachable |
| `_infer_confidence(response_payload, analysis)` | Heuristic confidence scoring: `high` if ≥150 eval tokens and `done_reason=stop`; `medium` if ≥50 tokens or analysis ≥8 words; otherwise `low` |

**Retry strategy:** On timeout or request failure, the service waits `min(attempt, 3)` seconds before retrying. After all retries are exhausted, it raises `RuntimeError` with the original exception chained.

---

### 6.4 Embeddings Module (`embeddings/`)

#### `embeddings/clip_encoder.py` — Module-Level CLIP Functions

This module provides **standalone, function-level** CLIP encoding as an alternative to the service class. It is CPU-optimized (limits PyTorch thread count to half available threads) and uses module-level global model state, making it suitable for scripts, notebooks, and the Google Colab demo.

| Function | Description |
|---|---|
| `encode_image(image_path)` | Opens image from path, converts to RGB, delegates to `encode_pil_image` |
| `encode_pil_image(image)` | Encodes a PIL Image object using the module-level CLIP model |
| `encode_text(text)` | Validates non-empty text, encodes via the module-level CLIP model |
| `_normalize_embedding(tensor)` | L2-normalizes a tensor and converts to `float32` list |

**Note:** This module eagerly loads the CLIP model at import time. The service-based approach in `services/clip_service.py` is preferred for the main application (lazy initialization, GPU support, LRU caching).

---

### 6.5 Utilities (`utils/`)

#### `utils/config.py` — Application Settings

**Class:** `Settings(BaseSettings)`

All configuration is managed through a single Pydantic `Settings` class. Values are read from environment variables (case-insensitive) and fall back to defaults. An `.env` file is automatically loaded.

| Setting | Default | Description |
|---|---|---|
| `app_name` | `"Multimodal Image RAG"` | Application display name |
| `environment` | `"dev"` | Runtime environment (`dev` / `production`) |
| `log_level` | `"INFO"` | Python logging level |
| `allowed_origins` | `"http://localhost:5173"` | Comma-separated CORS allowed origins |
| `chroma_path` | `"./vectordb_store"` | Local ChromaDB persistence directory |
| `chroma_collection` | `"image_rag"` | ChromaDB collection name |
| `chroma_http_host` | `None` | If set, uses HTTP ChromaDB client |
| `chroma_http_port` | `8000` | ChromaDB HTTP server port |
| `upload_dir` | `"./uploads"` | Directory for storing uploaded images |
| `max_upload_mb` | `10` | Maximum upload file size in megabytes |
| `clip_model_name` | `"openai/clip-vit-base-patch32"` | HuggingFace model identifier |
| `ollama_base_url` | `"http://localhost:11434"` | Ollama server base URL |
| `ollama_model` | `"llava"` | Ollama model name |
| `ollama_timeout_seconds` | `120` | Per-request Ollama timeout |
| `ollama_max_retries` | `3` | Ollama retry attempts |
| `top_k` | `5` | Default number of search results |

#### `utils/image_utils.py` — Image Utilities

| Function | Description |
|---|---|
| `ensure_upload_dir()` | Creates the upload directory (idempotent) |
| `validate_image(file)` | Validates extension (`.png`, `.jpg`, `.jpeg`, `.webp`), content type, and file size; raises `HTTPException` on failure |
| `save_upload(file)` | Reads file contents, checks size again, generates a UUID-based filename, writes to disk asynchronously via thread pool |
| `load_image(file_path)` | Opens file with Pillow, validates format, converts to RGB; raises `HTTPException(400)` on failure |
| `image_to_base64(file_path)` | Reads file bytes and returns base64-encoded string for Ollama API |
| `now_iso()` | Returns current UTC timestamp in ISO 8601 format with `Z` suffix |

**Allowed formats:** PNG, JPEG, WebP (both by extension and MIME type)

#### `utils/logger.py` — Logging Setup

Configures Python's standard `logging` with format: `timestamp | LEVEL | module_name | message`. Log level is read from settings.

---

## 7. Frontend — Detailed Code Documentation

### 7.1 Application Shell

#### `src/main.jsx`
React 18 root entry point. Mounts `<App />` into the `#root` DOM element using `ReactDOM.createRoot`.

#### `src/App.jsx`
Defines client-side routing using React Router DOM's `BrowserRouter`:

| Route | Component | Purpose |
|---|---|---|
| `/` | `Home` | Landing page |
| `/upload` | `UploadPage` | Image upload and indexing |
| `/search` | `SearchPage` | Search and AI analysis |

The `<Navbar />` component is rendered outside the `<Routes>`, making it persistent across all pages.

#### `src/index.css`
Contains global Tailwind CSS directives (`@tailwind base/components/utilities`), custom CSS properties for the dark glassmorphism theme (neon accents, backdrop blur), and keyframe animations (`fadeIn`, `slideUp`, `pulse`).

---

### 7.2 Pages

#### `pages/Home.jsx`
Landing page displaying the application name, description, and navigation cards to the Upload and Search pages. Serves as the entry point for new users.

#### `pages/Upload.jsx`
Manages the image upload workflow:
- Renders `<UploadDropzone />` for file selection
- Calls `uploadImage()` from the API service
- Displays upload progress and indexing confirmation
- Shows indexed image count and duplicate detection feedback

#### `pages/Search.jsx`
The primary search interface — the most complex page in the application.

**State management:**

| State | Type | Description |
|---|---|---|
| `results` | Array | Current search results |
| `selected` | Object | Currently selected result for AI analysis |
| `modalItem` | Object | Item displayed in fullscreen modal |
| `analysis` | String | LLaVA analysis text |
| `loading` | Boolean | Search in-progress flag |
| `analyzing` | Boolean | AI analysis in-progress flag |
| `status` | Object | `{ text, type }` for status pill |
| `lastQuery` | String | Last search query (text or filename) |
| `searchTime` | Number | Search latency in milliseconds |

**Key handlers:**
- `handleTextSearch(query)` — calls `searchTextToImage()`, measures latency, updates results and status
- `handleImageSearch(file)` — calls `searchSimilarImages()`, measures latency, updates results and status
- `handleAnalyze(item)` — calls `analyzeImage()` with the item's path and a standard descriptive prompt; stores result in `analysis` state

**Layout:** Two-column responsive grid:
- Left column: `<SearchBar />`, metrics cards, `<Gallery />`
- Right column (sticky): `<AiPanel />`

---

### 7.3 Components

| Component | Props | Description |
|---|---|---|
| `Navbar` | — | Top navigation with links to Home, Upload, Search; dark glassmorphism style |
| `SearchBar` | `onTextSearch`, `onImageSearch`, `loading` | Tabbed component with text input tab and image upload tab |
| `Gallery` | `items`, `onSelect`, `onAnalyze` | Responsive grid of `<ResultCard />` components |
| `ResultCard` | `item`, `onSelect`, `onAnalyze` | Displays image thumbnail, similarity score, filename, and Analyze button |
| `AiPanel` | `selected`, `response`, `loading` | Sticky sidebar showing selected image and LLaVA analysis text with loading animation |
| `UploadDropzone` | `onFilesSelected`, `uploading`, `progress` | Drag-and-drop file zone with hover/drag-over visual feedback |
| `ImageModal` | `item`, `onClose` | Full-screen image overlay with keyboard `Escape` dismiss |
| `LoadingSkeleton` | `count` | Animated placeholder cards for loading states |
| `MetricCard` | `label`, `value`, `icon`, `accent` | Statistics display card with colored accent variants |
| `StatusPill` | `text`, `status` | Color-coded inline badge (`idle`/`loading`/`active`/`error`) |
| `Logo` | — | SVG application logo mark |

---

### 7.4 API Service Client

**File:** `src/services/api.js`

Axios instance configured with:
- `baseURL`: `VITE_API_URL` environment variable (defaults to `http://localhost:8000`)
- `timeout`: 120,000 ms (matches Ollama's 2-minute analysis timeout)

| Exported Function | HTTP Method | Endpoint | Description |
|---|---|---|---|
| `uploadImage(file, onProgress)` | `POST` | `/upload-image` | Uploads a file with optional progress callback |
| `searchByText(query, top_k)` | `POST` | `/search-by-text` | Legacy text search |
| `searchByImage(file)` | `POST` | `/search-by-image` | Legacy image search |
| `searchSimilarImages(file, top_k)` | `POST` | `/search-similar-images` | Image-to-image similarity search |
| `searchTextToImage(query, top_k)` | `POST` | `/search-text-to-image` | Semantic text-to-image search |
| `analyzeImage(image_path, prompt)` | `POST` | `/analyze-image` | LLaVA image analysis |
| `checkHealth()` | `GET` | `/health` | Service health check |

---

## 8. API Reference

Base URL: `http://localhost:8000` (configurable via `BACKEND_PORT`)  
Interactive documentation: `http://localhost:8000/docs`

---

### `POST /upload-image`

Index an image into the ChromaDB vector store.

**Request:** `multipart/form-data`
```
file: <image>    (PNG, JPEG, or WebP; max 10 MB)
```

**Response `201 Created`:**
```json
{
  "id": "a3f4c2...",
  "image_url": "http://localhost:8000/uploads/abc123.jpg",
  "metadata": {
    "image_path": "/app/uploads/abc123.jpg",
    "filename": "abc123.jpg",
    "upload_time": "2026-05-07T10:00:00Z",
    "timestamp": "2026-05-07T10:00:00Z"
  },
  "duplicate": false
}
```

**Error responses:** `413` (file too large), `415` (unsupported format), `422` (validation error)

---

### `POST /search-by-text`

Search indexed images using a natural language text query.

**Request:** `application/json`
```json
{
  "query": "a dog running in a park",
  "top_k": 5
}
```

**Response `200 OK`:**
```json
{
  "results": [
    {
      "id": "a3f4c2...",
      "image_url": "http://localhost:8000/uploads/dog.jpg",
      "distance": 0.12,
      "similarity": 0.88,
      "metadata": { "filename": "dog.jpg", ... }
    }
  ]
}
```

---

### `POST /search-by-image`

Search indexed images using a reference image upload.

**Request:** `multipart/form-data`
```
file: <query image>
top_k: 5  (optional form field)
```

**Response:** Same structure as `/search-by-text`

---

### `POST /search-similar-images`

Image-to-image similarity search with richer response schema.

**Request:** `multipart/form-data`
```
file: <query image>
top_k: 5
```

**Response `200 OK`:**
```json
{
  "query_image_url": "http://localhost:8000/uploads/query.jpg",
  "total_results": 5,
  "results": [
    {
      "id": "...",
      "similarity_score": 0.9234,
      "image_path": "/app/uploads/match.jpg",
      "image_url": "http://localhost:8000/uploads/match.jpg",
      "metadata": { ... },
      "distance": 0.0766
    }
  ]
}
```

---

### `POST /search-text-to-image`

Semantic text-to-image retrieval with richer response schema.

**Request:** `application/json`
```json
{
  "query": "sunset over a mountain lake",
  "top_k": 5
}
```

**Response `200 OK`:**
```json
{
  "query_text": "sunset over a mountain lake",
  "total_results": 5,
  "results": [ ... ]
}
```

---

### `POST /analyze-image`

Analyze an image using the locally-running LLaVA vision model.

**Request (JSON mode):** `application/json`
```json
{
  "image_path": "/app/uploads/photo.jpg",
  "prompt": "Describe the objects and scene visible in this image."
}
```

**Request (file upload mode):** `multipart/form-data`
```
file: <image>
prompt: "What defect is visible in this image?"
```

**Response `200 OK`:**
```json
{
  "analysis": "The image shows a mountainous landscape at dusk. In the foreground...",
  "confidence": "high"
}
```

**Confidence values:** `high` (≥150 eval tokens, stop reason), `medium`, `low`

---

### `GET /health`

Deep health check for all dependent services.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "chroma": "ok",
  "ollama": "ok"
}
```

`status` is `"ok"` only when both `chroma` and `ollama` are `"ok"`; otherwise `"degraded"`.

---

## 9. Data Flow Diagrams

### Image Upload and Indexing

```
User selects image in browser
        │
        ▼
Frontend: POST /upload-image (multipart)
        │
        ▼
Backend: validate_image()
  ├── Check extension (.png/.jpg/.jpeg/.webp)
  ├── Check MIME type
  └── Check file size (≤ MAX_UPLOAD_MB)
        │
        ▼
Backend: save_upload()
  └── Write to {UPLOAD_DIR}/{uuid4}.{ext}
        │
        ▼
Backend: load_image()
  └── PIL.Image.open() → convert("RGB")
        │
        ▼
CLIPService.encode_image(pil_image)
  ├── CLIPProcessor: preprocess pixel values
  ├── CLIPModel.get_image_features()
  └── L2-normalize → float32 list [512 dims]
        │
        ▼
ChromaService.add_image(embedding, path, filename)
  ├── _find_duplicate(): query by image_path
  │   └── If duplicate: return existing record (duplicate=True)
  ├── _build_id(): SHA-256(image_path)
  ├── collection.add(id, embedding, metadata, document)
  └── Return {id, metadata, duplicate=False}
        │
        ▼
Frontend: display image_url + metadata
```

---

### Text-to-Image Search

```
User types query text in SearchBar
        │
        ▼
Frontend: POST /search-text-to-image { query, top_k }
        │
        ▼
CLIPService.encode_text(query)
  ├── Normalize: strip() + lower()
  ├── MD5 hash for LRU cache key
  ├── Cache hit? → Return cached embedding
  └── Cache miss:
      ├── CLIPProcessor: tokenize text
      ├── CLIPModel.get_text_features()
      └── L2-normalize → float32 tuple [512 dims]
        │
        ▼
ChromaService.text_search(embedding, top_k)
  └── collection.query(embedding, n_results=top_k)
      └── HNSW cosine nearest-neighbor search
        │
        ▼
Format results: distance → similarity = 1 - distance
        │
        ▼
Frontend: Gallery renders ranked images with scores
```

---

### Image Analysis (LLaVA Reasoning)

```
User clicks "Analyze" on a search result
        │
        ▼
Frontend: POST /analyze-image { image_path, prompt }
        │
        ▼
Backend: ensure_managed_image_path()
  └── Verify path is within UPLOAD_DIR (path traversal protection)
        │
        ▼
image_to_base64(image_path)
  └── Read file bytes → base64 string
        │
        ▼
OllamaService.analyze_image(image_path, prompt)
  ├── POST http://ollama:11434/api/generate
  │   { model: "llava", prompt: "...", images: ["<base64>"] }
  ├── On failure: retry up to 3 times with backoff
  └── Extract response text + infer confidence
        │
        ▼
Frontend: AiPanel displays analysis text
```

---

## 10. Deployment Guide

### Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB |
| Storage | 15 GB | 30 GB |
| Docker Engine | 24.x | Latest |
| Docker Compose | v2 | Latest |
| CPU | 4 cores | 8+ cores |
| GPU (optional) | — | NVIDIA CUDA (faster CLIP inference) |

### Option A: Docker Compose (Recommended for Production)

```bash
# 1. Clone the repository
git clone https://github.com/jayaprakash2207/Axithor-VisionRAG-Pro-Multimodal-Image-Retrieval-Reasoning-System.git
cd Axithor-VisionRAG-Pro-Multimodal-Image-Retrieval-Reasoning-System

# 2. Configure environment variables
cp .env.example .env
# Edit .env to set custom ports if needed

# 3. Start all 4 services
docker compose up --build -d

# 4. Pull the LLaVA vision model (one-time download, ~4.7 GB)
docker exec image-rag-ollama ollama pull llava

# 5. Verify services are healthy
docker compose ps
curl http://localhost:8000/health
```

**Service endpoints after startup:**

| Service | URL |
|---|---|
| Frontend UI | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| ChromaDB | http://localhost:8001 |
| Ollama | http://localhost:11434 |

> **First Run Note:** The backend downloads the CLIP model (`openai/clip-vit-base-patch32`, ~600 MB) from HuggingFace on first startup. The Docker health check has a 90-second grace period to accommodate this. Subsequent starts use the cached model from the `image-rag-clip-cache` volume.

### Option B: Local Development (Without Docker)

**Backend setup:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
# .venv\Scripts\activate           # Windows

pip install -r requirements.txt
cp .env.example .env
# Edit .env: set CHROMA_PATH=./vectordb_store, OLLAMA_BASE_URL=http://localhost:11434

uvicorn main:app --reload --port 8000
```

**Frontend setup:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000
npm run dev
```

**External dependencies for local development:**
- ChromaDB must be running locally (or configured with `CHROMA_HTTP_HOST`)
- Ollama must be running locally: `ollama serve` and `ollama pull llava`

### Option C: Google Colab

Open `MultiImageRAG_Colab.ipynb` for a zero-install notebook demonstration. The notebook uses the `embeddings/clip_encoder.py` module-level API for encoding without requiring any service infrastructure.

### Docker Volume Management

| Volume | Name | Contents |
|---|---|---|
| `uploads_data` | `image-rag-uploads` | All uploaded image files |
| `chroma_data` | `image-rag-chroma-data` | ChromaDB HNSW index and metadata |
| `ollama_data` | `image-rag-ollama-data` | Downloaded Ollama models (LLaVA) |
| `clip_cache` | `image-rag-clip-cache` | HuggingFace CLIP model cache |

```bash
# Backup volumes
docker run --rm -v image-rag-uploads:/data -v $(pwd):/backup ubuntu \
  tar czf /backup/uploads_backup.tar.gz /data

# Remove all data (DESTRUCTIVE)
docker compose down -v
```

---

## 11. Configuration Reference

### Root `.env` (Port Overrides)

```env
BACKEND_PORT=8000
FRONTEND_PORT=5173
CHROMA_PORT=8001
OLLAMA_PORT=11434
```

### Backend `.env`

```env
# Application
APP_NAME=Axithor VisionRAG Pro
ENVIRONMENT=dev                          # dev or production
LOG_LEVEL=INFO                           # DEBUG, INFO, WARNING, ERROR

# CORS
ALLOWED_ORIGINS=http://localhost:5173    # Comma-separated list

# ChromaDB
CHROMA_PATH=./vectordb_store             # Local mode: storage directory
CHROMA_HTTP_HOST=                        # Set to enable HTTP client mode
CHROMA_HTTP_PORT=8000                    # ChromaDB HTTP port
CHROMA_COLLECTION=image_rag              # Collection name

# File Upload
UPLOAD_DIR=./uploads                     # Image storage directory
MAX_UPLOAD_MB=10                         # Max file size in megabytes

# CLIP Model
CLIP_MODEL_NAME=openai/clip-vit-base-patch32

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llava
OLLAMA_TIMEOUT_SECONDS=120
OLLAMA_MAX_RETRIES=3

# Search defaults
TOP_K=5
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## 12. Security Model

### Authentication and Authorization
The current implementation does not include authentication. It is designed for **trusted internal network deployment**. For public-facing deployments, an authentication layer (e.g., OAuth2, API keys, reverse proxy authentication) should be added in front of the FastAPI backend.

### Input Validation
- **File type enforcement:** Extension and MIME type checked on every upload
- **File size limit:** Configurable maximum enforced both in validation and at byte-read time
- **Image format verification:** Pillow opens and validates the file beyond the extension check
- **Pydantic validation:** All JSON request bodies are parsed and validated against strict schemas before handler execution
- **`top_k` bounds:** Clamped to 1–50 in both schema validation and the `normalize_top_k` helper

### Path Traversal Protection
The `ensure_managed_image_path()` function in `api/routes.py` resolves the absolute path of any `image_path` parameter and verifies it shares a common ancestor with the configured `UPLOAD_DIR`. Any path that resolves outside the upload directory returns `HTTP 403 Forbidden`.

```python
# Simplified logic
if os.path.commonpath([upload_root, resolved_path]) != upload_root:
    raise HTTPException(403, "Image path is outside the upload directory")
```

### Data Privacy
- **100% local inference:** No image data, embeddings, or queries are sent to external services
- **No telemetry:** ChromaDB is configured with `ANONYMIZED_TELEMETRY=FALSE`
- **No API keys required:** The system operates entirely with locally-running models

### Deduplication
SHA-256 of the absolute image path is used as the ChromaDB record ID. Duplicate uploads are detected by querying for existing records with the same `image_path` metadata field. Duplicates return the existing record without re-indexing.

### CORS
Allowed origins are explicitly configured via `ALLOWED_ORIGINS` (comma-separated). The middleware does not use wildcard origins in the provided configuration.

### Cleanup on Upload Failure
If image validation passes but the file cannot be opened by Pillow (corrupt image), the saved file is deleted before the error is returned to the client, preventing accumulation of invalid files.

---

## 13. Performance Characteristics

### Measured Latencies

| Operation | CPU Latency | GPU Latency | Notes |
|---|---|---|---|
| Image upload + CLIP encode | 200–400 ms | ~50 ms | Includes file write + model inference |
| Text-to-image search (cached) | ~15 ms | ~15 ms | LRU cache hit; no model call |
| Text-to-image search (cold) | 120–200 ms | ~30 ms | CLIP text encoding required |
| Image-to-image search | 200–350 ms | ~50 ms | CLIP image encoding required |
| LLaVA image analysis | 5–30 sec | 2–10 sec | Depends on hardware and output length |
| ChromaDB HNSW query (5k vectors) | < 5 ms | < 5 ms | `ef=100` search parameter |

### Scalability Considerations

| Dimension | Current Limit | Notes |
|---|---|---|
| Vector index size | ~1M entries (est.) | ChromaDB HNSW scales well to millions of vectors |
| Upload concurrency | 1 worker | Single Uvicorn worker; scale with `--workers` or multiple replicas |
| Text cache size | 256 entries | LRU cache evicts oldest entries beyond this limit |
| Max upload size | 10 MB | Configurable via `MAX_UPLOAD_MB` |
| `top_k` maximum | 50 | Enforced in validation |

### Memory Requirements

| Component | Approximate Memory |
|---|---|
| CLIP ViT-B/32 model | ~600 MB (first download) / ~300 MB loaded |
| ChromaDB HNSW index | ~100 MB per 100k vectors |
| LLaVA 7B model (Ollama) | ~4–8 GB |
| FastAPI backend (idle) | ~500 MB |

---

## 14. Roadmap

The following features are planned for future releases:

| Feature | Description | Priority |
|---|---|---|
| **SigLIP Support** | Swap CLIP for Google's SigLIP encoder for improved zero-shot retrieval accuracy | High |
| **GPU Acceleration** | Add CUDA Docker profile for 5–10x faster CLIP inference | High |
| **Bulk Folder Upload** | Frontend UI for ingesting entire directories at once | Medium |
| **Model Selection Dropdown** | Switch between `llava`, `bakllava`, `llava:13b` in the UI without restart | Medium |
| **Metadata Tagging** | Tag images at upload time; filter ChromaDB queries by arbitrary metadata | Medium |
| **Export Collection** | Download the indexed collection as JSON or Parquet | Low |
| **Multi-Collection Support** | Organize images into named namespaces within ChromaDB | Low |
| **Authentication** | Add OAuth2/API key authentication for multi-user deployments | High (for public deployment) |

---

## 15. Glossary

| Term | Definition |
|---|---|
| **RAG** | Retrieval-Augmented Generation — a technique that augments an LLM with retrieved context (here, images) rather than relying solely on parametric knowledge |
| **CLIP** | Contrastive Language–Image Pretraining — an OpenAI model that maps both images and text into a shared 512-dimensional embedding space |
| **ViT-B/32** | Vision Transformer (Base, 32-pixel patches) — the CLIP model variant used; processes images as sequences of 32×32-pixel patch tokens |
| **Embedding** | A dense numerical vector that represents the semantic content of an image or text |
| **HNSW** | Hierarchical Navigable Small World — a graph-based approximate nearest-neighbor index algorithm; enables sub-millisecond similarity search at scale |
| **Cosine Similarity** | A measure of similarity between two vectors based on the angle between them (range: -1 to 1; 1 = identical direction) |
| **ChromaDB** | An open-source vector database optimized for storing and querying embeddings |
| **Ollama** | A local LLM server that manages model downloads and serves inference via a REST API |
| **LLaVA** | Large Language and Vision Assistant — a multimodal LLM capable of understanding and describing image content |
| **LRU Cache** | Least Recently Used cache — a fixed-size cache that evicts the least recently accessed entry when full |
| **SHA-256** | A cryptographic hash function; used here to produce a deterministic, unique image ID from its file path |
| **Pydantic** | A Python data validation library; used for API schema definition and environment variable configuration |
| **FastAPI** | A modern Python async web framework built on Starlette and Pydantic |
| **Uvicorn** | An ASGI server for Python; serves the FastAPI application |
| **Vite** | A frontend build tool with HMR (Hot Module Replacement) for fast development |
| **Tailwind CSS** | A utility-first CSS framework for building custom UI without writing custom CSS |
| **Glassmorphism** | A UI design style featuring frosted glass effects (backdrop blur, translucent panels, neon accents) |

---

*Document prepared from source code analysis of the Axithor VisionRAG Pro repository.*  
*All technical details reflect the codebase at the time of documentation.*
