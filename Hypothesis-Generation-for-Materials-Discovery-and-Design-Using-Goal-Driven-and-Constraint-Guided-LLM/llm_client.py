import os
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from openai import OpenAI, PermissionDeniedError

from logging_utils import get_logger

logger = get_logger("llm_client")

# Ensure local .env is loaded even when this module is imported outside run_pipeline.py
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

YANDEX_BASE_URL = os.getenv("YANDEX_BASE_URL", "https://llm.api.cloud.yandex.net/v1")
YANDEX_API_KEY = os.getenv("YANDEX_API_KEY")
YANDEX_FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")

MODEL_HGA = os.getenv("YANDEX_MODEL_HGA", "yandexgpt/rc")
MODEL_CRITIC = os.getenv("YANDEX_MODEL_CRITIC", "qwen3-235b-a22b-fp8/latest")
MODEL_CRITIC_2 = os.getenv("YANDEX_MODEL_CRITIC_2", "gpt-oss-120b/latest")
MODEL_CRITIC_3 = os.getenv("YANDEX_MODEL_CRITIC_3", "qwen3-235b-a22b-fp8/latest")
MODEL_SUMMARIZER = os.getenv("YANDEX_MODEL_SUMMARIZER", "yandexgpt/rc")
MODEL_EVALUATION = os.getenv("YANDEX_MODEL_EVALUATION", "yandexgpt/latest")
MODEL_KG = os.getenv("YANDEX_MODEL_KG", "qwen3-235b-a22b-fp8/latest")

_client: OpenAI | None = None


def resolve_model(model: str) -> str:
    """Convert a short model name to Yandex gpt:// URI."""
    if model.startswith("gpt://"):
        return model
    folder_id = os.getenv("YANDEX_FOLDER_ID")
    if not folder_id:
        raise ValueError("YANDEX_FOLDER_ID is not set")
    model_name = model if "/" in model else f"{model}/latest"
    return f"gpt://{folder_id}/{model_name}"


def get_client() -> OpenAI:
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("YANDEX_API_KEY")
    folder_id = os.getenv("YANDEX_FOLDER_ID")
    if not api_key:
        raise ValueError("YANDEX_API_KEY is not set")
    if not folder_id:
        raise ValueError("YANDEX_FOLDER_ID is not set")
    _client = OpenAI(
        api_key=api_key,
        base_url=os.getenv("YANDEX_BASE_URL", YANDEX_BASE_URL),
        default_headers={
            "x-folder-id": folder_id,
            "x-data-logging-enabled": "false",
        },
    )
    return _client


class _ClientProxy:
    """Lazy proxy so imports work before credentials are configured in tests."""

    @property
    def chat(self):
        return get_client().chat


client = _ClientProxy()


def chat_completion(**kwargs: Any):
    """Create a chat completion with Yandex model URI resolution."""
    kwargs = dict(kwargs)
    if "model" in kwargs:
        kwargs["model"] = resolve_model(kwargs["model"])
    return get_client().chat.completions.create(**kwargs)


def llm_completion(
    system_prompt: str,
    *,
    model: str | None = None,
    json_format: bool = False,
    max_retries: int = 3,
    retry_delay: float = 2.0,
) -> str:
    """Call Yandex AI Studio chat completions with optional JSON mode and retries."""
    model = model or MODEL_KG
    last_error: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": [{"role": "system", "content": system_prompt}],
                "temperature": 0,
            }
            if json_format:
                kwargs["response_format"] = {"type": "json_object"}
            response = chat_completion(**kwargs)
            content = response.choices[0].message.content
            if content is None:
                raise ValueError("Empty response from LLM")
            return content
        except (requests.exceptions.Timeout, requests.exceptions.RequestException, Exception) as exc:
            last_error = exc
            logger.warning("[llm_completion:%s] Attempt %d/%d failed: %s", model, attempt, max_retries, exc)
            time.sleep(retry_delay)

    if last_error is not None:
        if isinstance(last_error, PermissionDeniedError):
            raise PermissionDeniedError(
                "Yandex AI Studio returned 403 Permission denied. "
                "Regenerate the API key in https://aistudio.yandex.ru/ and verify YANDEX_FOLDER_ID "
                f"({os.getenv('YANDEX_FOLDER_ID', 'unset')}) matches the folder where the key was issued. "
                "The service account/user needs the ai.languageModels.user role on that folder.",
                response=getattr(last_error, "response", None),
                body=getattr(last_error, "body", None),
            ) from last_error
        raise last_error
    raise RuntimeError("LLM completion failed without an error")
