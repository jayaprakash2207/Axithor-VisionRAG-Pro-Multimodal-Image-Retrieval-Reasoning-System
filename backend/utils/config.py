from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Multimodal Image RAG"
    environment: str = "dev"
    log_level: str = "INFO"
    allowed_origins: str = "http://localhost:5173"

    chroma_path: str = "./vectordb_store"
    chroma_collection: str = "image_rag"
    chroma_http_host: str | None = None
    chroma_http_port: int = 8000

    upload_dir: str = "./uploads"
    max_upload_mb: int = 10

    clip_model_name: str = "openai/clip-vit-base-patch32"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llava"
    ollama_timeout_seconds: int = 120
    ollama_max_retries: int = 3

    top_k: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
