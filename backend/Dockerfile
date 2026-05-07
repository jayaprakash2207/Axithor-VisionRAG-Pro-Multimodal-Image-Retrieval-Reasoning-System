# ── Build stage ────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies for native packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Runtime stage ─────────────────────────────────
FROM python:3.11-slim AS runtime

LABEL maintainer="Image RAG Team"
LABEL description="Multimodal Image RAG Backend — CLIP + ChromaDB + Ollama"

WORKDIR /app

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p /app/uploads /app/vectordb_store

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    APP_NAME="Multimodal Image RAG" \
    ENVIRONMENT=production \
    LOG_LEVEL=INFO \
    ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000" \
    CHROMA_PATH=/app/vectordb_store \
    CHROMA_COLLECTION=image_rag \
    UPLOAD_DIR=/app/uploads \
    MAX_UPLOAD_MB=10 \
    CLIP_MODEL_NAME=openai/clip-vit-base-patch32 \
    OLLAMA_BASE_URL=http://ollama:11434 \
    OLLAMA_MODEL=llava \
    OLLAMA_TIMEOUT_SECONDS=120 \
    OLLAMA_MAX_RETRIES=3 \
    TOP_K=5

EXPOSE 8000

# Health check — ping the /health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
