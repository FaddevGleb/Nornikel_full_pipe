"""Application settings loaded from workspace project.toml."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

VlmBackendChoice = Literal["openai", "anthropic", "local", "mock", "off"]
OutputFormat = Literal["md", "html", "both"]


def _load_doc_converter_defaults() -> dict:
    for parent in Path(__file__).resolve().parents:
        if (parent / "project.toml").exists():
            if str(parent) not in sys.path:
                sys.path.insert(0, str(parent))
            from config.loader import get_doc_converter_config

            return get_doc_converter_config()
    return {}


class Settings(BaseSettings):
    """Runtime configuration for doc-convert."""

    model_config = SettingsConfigDict(extra="ignore")

    vlm_backend: VlmBackendChoice = Field(default="off", alias="VLM_BACKEND")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    ocr_lang: str = Field(default="ru", alias="OCR_LANG")
    vlm_timeout_sec: int = Field(default=30, alias="VLM_TIMEOUT_SEC")
    openai_vlm_model: str = Field(default="gpt-4o-mini", alias="OPENAI_VLM_MODEL")
    anthropic_vlm_model: str = Field(
        default="claude-3-5-sonnet-20241022",
        alias="ANTHROPIC_VLM_MODEL",
    )

    output_format: OutputFormat = "md"
    output_dir: str = "./out"
    academic: bool = False
    recursive: bool = False
    grobid_server: str | None = Field(default=None, alias="GROBID_SERVER")

    @classmethod
    def from_project(cls) -> "Settings":
        defaults = _load_doc_converter_defaults()
        mapping = {
            "vlm_backend": defaults.get("vlm_backend", "off"),
            "ocr_lang": defaults.get("ocr_lang", "ru"),
            "openai_vlm_model": defaults.get("openai_vlm_model", "gpt-4o-mini"),
            "openai_api_key": defaults.get("openai_api_key"),
            "anthropic_api_key": defaults.get("anthropic_api_key"),
        }
        return cls(**{k: v for k, v in mapping.items() if v is not None})
