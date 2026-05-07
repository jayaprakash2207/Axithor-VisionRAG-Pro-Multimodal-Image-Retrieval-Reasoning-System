import logging
import time
from typing import Any, Dict

import requests

from utils.config import settings
from utils.image_utils import image_to_base64

logger = logging.getLogger(__name__)


class OllamaService:
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.timeout = settings.ollama_timeout_seconds
        self.max_retries = settings.ollama_max_retries

    def analyze_image(self, image_path: str, prompt: str) -> Dict[str, str]:
        """
        Example prompts:
        - "Describe this image"
        - "What defect is visible?"
        - "What object is shown?"
        """
        image_b64 = image_to_base64(image_path)
        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
        }

        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(
                    "Sending image analysis request to Ollama model=%s attempt=%s image_path=%s",
                    self.model,
                    attempt,
                    image_path,
                )
                response = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                data = response.json()
                analysis = str(data.get("response", "")).strip()

                if not analysis:
                    raise RuntimeError("Ollama returned an empty analysis")

                return {
                    "analysis": analysis,
                    "confidence": self._infer_confidence(data, analysis),
                }
            except requests.Timeout as exc:
                last_error = exc
                logger.warning("Ollama request timed out on attempt %s/%s", attempt, self.max_retries)
            except requests.RequestException as exc:
                last_error = exc
                logger.warning("Ollama request failed on attempt %s/%s: %s", attempt, self.max_retries, exc)
            except ValueError as exc:
                last_error = exc
                logger.exception("Invalid JSON returned by Ollama on attempt %s/%s", attempt, self.max_retries)
            except Exception as exc:
                last_error = exc
                logger.exception("Unexpected Ollama error on attempt %s/%s", attempt, self.max_retries)

            if attempt < self.max_retries:
                time.sleep(min(attempt, 3))

        raise RuntimeError(f"Ollama image analysis failed after {self.max_retries} attempts") from last_error

    def healthcheck(self) -> None:
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.warning("Ollama healthcheck failed: %s", exc)
            raise RuntimeError("Ollama healthcheck failed") from exc

    def _infer_confidence(self, response_payload: Dict[str, Any], analysis: str) -> str:
        eval_count = response_payload.get("eval_count")
        done_reason = str(response_payload.get("done_reason", "")).lower()

        if isinstance(eval_count, int) and eval_count >= 150 and done_reason == "stop":
            return "high"
        if isinstance(eval_count, int) and eval_count >= 50:
            return "medium"
        if len(analysis.split()) >= 8:
            return "medium"
        return "low"


_ollama_service: OllamaService | None = None


def get_ollama_service() -> OllamaService:
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service
