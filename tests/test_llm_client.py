import os
from unittest.mock import patch

import pytest

from llm_client import resolve_model


def test_resolve_model_short_name() -> None:
    with patch.dict(os.environ, {"YANDEX_FOLDER_ID": "b1g123"}):
        assert resolve_model("yandexgpt/latest") == "gpt://b1g123/yandexgpt/latest"


def test_resolve_model_without_version() -> None:
    with patch.dict(os.environ, {"YANDEX_FOLDER_ID": "b1g123"}):
        assert resolve_model("yandexgpt") == "gpt://b1g123/yandexgpt/latest"


def test_resolve_model_full_uri() -> None:
    uri = "gpt://b1g123/yandexgpt/latest"
    assert resolve_model(uri) == uri


def test_resolve_model_requires_folder_id() -> None:
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="YANDEX_FOLDER_ID"):
            resolve_model("yandexgpt/latest")
