import os
from unittest.mock import patch

import pytest

from llm_client import get_provider, resolve_model


def test_routerai_passthrough_model() -> None:
    with patch.dict(
        os.environ,
        {"LLM_PROVIDER": "routerai", "ROUTERAI_API_KEY": "test-key"},
        clear=False,
    ):
        assert resolve_model("qwen/qwen3.6-flash") == "qwen/qwen3.6-flash"


def test_resolve_model_short_name() -> None:
    with patch.dict(
        os.environ,
        {"LLM_PROVIDER": "yandex", "YANDEX_FOLDER_ID": "b1g123", "YANDEX_API_KEY": "key"},
        clear=False,
    ):
        assert resolve_model("yandexgpt/latest") == "gpt://b1g123/yandexgpt/latest"


def test_resolve_model_without_version() -> None:
    with patch.dict(
        os.environ,
        {"LLM_PROVIDER": "yandex", "YANDEX_FOLDER_ID": "b1g123", "YANDEX_API_KEY": "key"},
        clear=False,
    ):
        assert resolve_model("yandexgpt") == "gpt://b1g123/yandexgpt/latest"


def test_resolve_model_full_uri() -> None:
    with patch.dict(os.environ, {"LLM_PROVIDER": "yandex", "YANDEX_API_KEY": "key"}, clear=False):
        uri = "gpt://b1g123/yandexgpt/latest"
        assert resolve_model(uri) == uri


def test_resolve_model_requires_folder_id_for_yandex() -> None:
    with patch.dict(os.environ, {"LLM_PROVIDER": "yandex", "YANDEX_API_KEY": "key"}, clear=True):
        with pytest.raises(ValueError, match="YANDEX_FOLDER_ID"):
            resolve_model("yandexgpt/latest")


def test_default_provider_is_routerai() -> None:
    with patch.dict(os.environ, {}, clear=True):
        assert get_provider() == "routerai"
