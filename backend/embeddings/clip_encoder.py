import logging
from typing import List

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger(__name__)

MODEL_NAME = "openai/clip-vit-base-patch32"
_DEVICE = "cpu"

# Global, CPU-optimized CLIP components
torch.set_num_threads(max(torch.get_num_threads() // 2, 1))
_processor = CLIPProcessor.from_pretrained(MODEL_NAME)
_model = CLIPModel.from_pretrained(MODEL_NAME)
_model.to(_DEVICE)
_model.eval()


def _normalize_embedding(tensor: torch.Tensor) -> List[float]:
    tensor = tensor / tensor.norm(p=2, dim=-1, keepdim=True)
    return tensor.squeeze(0).cpu().numpy().astype(np.float32).tolist()


def encode_image(image_path: str) -> List[float]:
    try:
        with Image.open(image_path) as img:
            image = img.convert("RGB")
    except Exception as exc:
        logger.exception("Failed to open image: %s", image_path)
        raise RuntimeError("Invalid image file") from exc

    return encode_pil_image(image)


def encode_pil_image(image: Image.Image) -> List[float]:
    try:
        inputs = _processor(images=image, return_tensors="pt")
        inputs = {k: v.to(_DEVICE) for k, v in inputs.items()}
        with torch.no_grad():
            image_features = _model.get_image_features(**inputs)
        return _normalize_embedding(image_features)
    except Exception as exc:
        logger.exception("Failed to encode PIL image")
        raise RuntimeError("Image encoding failed") from exc


def encode_text(text: str) -> List[float]:
    if not text or not text.strip():
        raise ValueError("Text must be non-empty")

    try:
        inputs = _processor(text=[text], return_tensors="pt", padding=True)
        inputs = {k: v.to(_DEVICE) for k, v in inputs.items()}
        with torch.no_grad():
            text_features = _model.get_text_features(**inputs)
        return _normalize_embedding(text_features)
    except Exception as exc:
        logger.exception("Failed to encode text")
        raise RuntimeError("Text encoding failed") from exc
