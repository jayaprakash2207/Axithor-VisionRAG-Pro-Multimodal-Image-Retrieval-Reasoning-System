import hashlib
from functools import lru_cache
from typing import List, Tuple

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from utils.config import settings


class CLIPService:
    def __init__(self) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = CLIPProcessor.from_pretrained(settings.clip_model_name)
        self.model = CLIPModel.from_pretrained(settings.clip_model_name)
        self.model.to(self.device)
        self.model.eval()

    def encode_image(self, image: Image.Image) -> List[float]:
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)

        image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
        return image_features.squeeze(0).cpu().numpy().astype(np.float32).tolist()

    def encode_text(self, text: str) -> List[float]:
        text_hash = hashlib.md5(text.strip().lower().encode()).hexdigest()
        cached = self._cached_encode_text(text_hash, text.strip())
        return list(cached)

    @lru_cache(maxsize=256)
    def _cached_encode_text(self, text_hash: str, text: str) -> Tuple[float, ...]:
        """LRU-cached text encoding keyed by content hash for retrieval speed."""
        inputs = self.processor(text=[text], return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)

        text_features = text_features / text_features.norm(p=2, dim=-1, keepdim=True)
        return tuple(text_features.squeeze(0).cpu().numpy().astype(np.float32).tolist())


_clip_service: CLIPService | None = None


def get_clip_service() -> CLIPService:
    global _clip_service
    if _clip_service is None:
        _clip_service = CLIPService()
    return _clip_service
