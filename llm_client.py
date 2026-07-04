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

SUPPORTED_PROVIDERS = frozenset({"routerai", "yandex"})

ROUTERAI_BASE_URL = "https://routerai.ru/api/v1"
YANDEX_BASE_URL = "https://llm.api.cloud.yandex.net/v1"

ROUTERAI_MODEL_DEFAULTS = {
    "HGA": "qwen/qwen3.6-flash",
    "CRITIC": "qwen/qwen3.6-flash",
    "CRITIC_2": "qwen/qwen3.6-flash",
    "CRITIC_3": "qwen/qwen3.6-flash",
    "SUMMARIZER": "qwen/qwen3.6-flash",
    "EVALUATION": "qwen/qwen3.6-flash",
    "KG": "qwen/qwen3.6-flash",
}

YANDEX_MODEL_DEFAULTS = {
    "HGA": "qwen3.6-flash/latest",
    "CRITIC": "qwen3.6-flash/latest",
    "CRITIC_2": "qwen3.6-flash/latest",
    "CRITIC_3": "qwen3.6-flash/latest",
    "SUMMARIZER": "qwen3.6-flash/latest",
    "EVALUATION": "qwen3.6-flash/latest",
    "KG": "qwen3.6-flash/latest",
}

_client: OpenAI | None = None
_client_provider: str | None = None


def get_provider() -> str:
    provider = os.getenv("LLM_PROVIDER", "routerai").strip().lower()
    if provider not in SUPPORTED_PROVIDERS:
        supported = ", ".join(sorted(SUPPORTED_PROVIDERS))
        raise ValueError(f"LLM_PROVIDER must be one of: {supported} (got {provider!r})")
    return provider


def _resolve_model_env(role: str) -> str:
    """Read MODEL_<ROLE>, then provider-specific override, then provider default."""
    direct = os.getenv(f"MODEL_{role}")
    if direct:
        return direct

    provider = get_provider()
    if provider == "yandex":
        return os.getenv(f"YANDEX_MODEL_{role}", YANDEX_MODEL_DEFAULTS[role])
    return os.getenv(f"ROUTERAI_MODEL_{role}", ROUTERAI_MODEL_DEFAULTS[role])


MODEL_HGA = _resolve_model_env("HGA")
MODEL_CRITIC = _resolve_model_env("CRITIC")
MODEL_CRITIC_2 = _resolve_model_env("CRITIC_2")
MODEL_CRITIC_3 = _resolve_model_env("CRITIC_3")
MODEL_SUMMARIZER = _resolve_model_env("SUMMARIZER")
MODEL_EVALUATION = _resolve_model_env("EVALUATION")
MODEL_KG = _resolve_model_env("KG")


def validate_credentials() -> None:
    provider = get_provider()
    if provider == "yandex":
        if not os.getenv("YANDEX_API_KEY"):
            raise ValueError("YANDEX_API_KEY is not set (required when LLM_PROVIDER=yandex)")
        if not os.getenv("YANDEX_FOLDER_ID"):
            raise ValueError("YANDEX_FOLDER_ID is not set (required when LLM_PROVIDER=yandex)")
        return
    if not os.getenv("ROUTERAI_API_KEY"):
        raise ValueError("ROUTERAI_API_KEY is not set (required when LLM_PROVIDER=routerai)")


def resolve_model(model: str) -> str:
    """Normalize model id for the active provider."""
    if get_provider() == "routerai":
        return model

    if model.startswith("gpt://"):
        return model
    folder_id = os.getenv("YANDEX_FOLDER_ID")
    if not folder_id:
        raise ValueError("YANDEX_FOLDER_ID is not set")
    model_name = model if "/" in model else f"{model}/latest"
    return f"gpt://{folder_id}/{model_name}"


def _build_routerai_client() -> OpenAI:
    api_key = os.getenv("ROUTERAI_API_KEY")
    if not api_key:
        raise ValueError("ROUTERAI_API_KEY is not set")
    return OpenAI(
        api_key=api_key,
        base_url=os.getenv("ROUTERAI_BASE_URL", ROUTERAI_BASE_URL),
    )


def _build_yandex_client() -> OpenAI:
    api_key = os.getenv("YANDEX_API_KEY")
    folder_id = os.getenv("YANDEX_FOLDER_ID")
    if not api_key:
        raise ValueError("YANDEX_API_KEY is not set")
    if not folder_id:
        raise ValueError("YANDEX_FOLDER_ID is not set")
    return OpenAI(
        api_key=api_key,
        base_url=os.getenv("YANDEX_BASE_URL", YANDEX_BASE_URL),
        default_headers={
            "x-folder-id": folder_id,
            "x-data-logging-enabled": "false",
        },
    )


def get_client() -> OpenAI:
    global _client, _client_provider
    provider = get_provider()
    if _client is not None and _client_provider == provider:
        return _client

    if provider == "yandex":
        _client = _build_yandex_client()
    else:
        _client = _build_routerai_client()
    _client_provider = provider
    logger.info("[llm_client] Using provider=%s", provider)
    return _client


class _ClientProxy:
    """Lazy proxy so imports work before credentials are configured in tests."""

    @property
    def chat(self):
        return get_client().chat


client = _ClientProxy()


def chat_completion(**kwargs: Any):
    """Create a chat completion with provider-specific model resolution."""
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
    """Call the configured LLM provider with optional JSON mode and retries."""
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
            logger.warning(
                "[llm_completion:%s:%s] Attempt %d/%d failed: %s",
                get_provider(),
                model,
                attempt,
                max_retries,
                exc,
            )
            time.sleep(retry_delay)

    if last_error is not None:
        if isinstance(last_error, PermissionDeniedError) and get_provider() == "yandex":
            raise PermissionDeniedError(
                "Yandex AI Studio returned 403 Permission denied. "
                "Regenerate the API key in https://aistudio.yandex.ru/ and verify YANDEX_FOLDER_ID "
                f"({os.getenv('YANDEX_FOLDER_ID', 'unset')}) matches the folder where the key was issued.",
                response=getattr(last_error, "response", None),
                body=getattr(last_error, "body", None),
            ) from last_error
        raise last_error
    raise RuntimeError("LLM completion failed without an error")
