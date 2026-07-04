"""Semantic text chunking via LLM (Yandex GPT)."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from src.utils.tokenizer import choice_the_tokenizer

logger = logging.getLogger(__name__)

SLICER_SYSTEM_PROMPT = (
    "You split educational texts into semantic chunks for a knowledge graph pipeline. "
    "Return ONLY valid JSON without markdown fences."
)


def _normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _parse_llm_json(response_text: str) -> dict[str, Any] | None:
    text = response_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("LLM slicer returned invalid JSON")
        return None
    return data if isinstance(data, dict) else None


def _split_by_boundaries(text: str, boundaries: list[str]) -> list[str]:
    chunks: list[str] = []
    start = 0
    for boundary in boundaries:
        boundary = str(boundary).strip()
        if not boundary:
            continue
        idx = text.find(boundary, start)
        if idx == -1:
            logger.warning("Boundary not found in text: %s", boundary[:80])
            continue
        end = idx + len(boundary)
        chunks.append(text[start:end])
        start = end
    if start < len(text):
        chunks.append(text[start:])
    return [chunk for chunk in chunks if chunk.strip()]


def _align_chunks(text: str, chunks: list[str]) -> list[str]:
    aligned: list[str] = []
    pos = 0
    for chunk in chunks:
        chunk = str(chunk).strip()
        if not chunk:
            continue
        idx = text.find(chunk, pos)
        if idx == -1:
            aligned.append(chunk)
            continue
        if idx > pos:
            aligned.append(text[pos:idx])
        aligned.append(chunk)
        pos = idx + len(chunk)
    if pos < len(text):
        aligned.append(text[pos:])
    return [chunk for chunk in aligned if chunk.strip()]


def _enforce_max_tokens(text: str, max_tokens: int, encoding) -> list[str]:
    tokens = encoding.encode(text)
    if len(tokens) <= max_tokens:
        return [text]
    parts: list[str] = []
    start = 0
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        parts.append(encoding.decode(tokens[start:end]))
        start = end
    return parts


def _split_section_with_llm(
    section: str,
    *,
    max_tokens: int,
    llm_client,
    encoding,
    llm_window_chars: int,
) -> list[str]:
    if len(section) <= llm_window_chars:
        windows = [section]
    else:
        windows = []
        pos = 0
        while pos < len(section):
            windows.append(section[pos : pos + llm_window_chars])
            pos += llm_window_chars

    section_chunks: list[str] = []
    for window in windows:
        user_prompt = f"""Разбей фрагмент учебного текста на смысловые части.
Каждая часть — законченная тема или раздел. Не обрывай мысль посередине.
Ориентир размера: до {max_tokens} токенов на часть.

Верни JSON одного из форматов:
1) {{"chunks": ["<дословный текст части 1>", "<дословный текст части 2>"]}}
2) {{"boundaries": ["<дословная строка — конец части 1>", "<дословная строка — конец части 2>"]}}

Требования:
- Текст частей должен быть скопирован из исходника без перефразирования
- Сохраняй порядок
- Минимум 1 часть

ТЕКСТ:
{window}
"""
        response_text, _, _ = llm_client.create_response(SLICER_SYSTEM_PROMPT, user_prompt)
        data = _parse_llm_json(response_text)
        if not data:
            logger.warning("LLM slicer failed for window, using token fallback for window")
            section_chunks.extend(_enforce_max_tokens(window, max_tokens, encoding))
            continue

        if isinstance(data.get("chunks"), list) and data["chunks"]:
            window_chunks = _align_chunks(window, [str(item) for item in data["chunks"]])
        elif isinstance(data.get("boundaries"), list) and data["boundaries"]:
            window_chunks = _split_by_boundaries(window, [str(item) for item in data["boundaries"]])
        else:
            window_chunks = [window]

        for chunk in window_chunks:
            section_chunks.extend(_enforce_max_tokens(chunk, max_tokens, encoding))

    return section_chunks


def _split_by_markdown_headers(text: str) -> list[str]:
    parts = re.split(r"(?=^#{1,3}\s+.+$)", text, flags=re.MULTILINE)
    cleaned = [part for part in parts if part.strip()]
    return cleaned or [text]


def slice_text_semantic_llm(
    text: str,
    max_tokens: int,
    llm_client,
    *,
    tokenizer_path: str | None = None,
    llm_window_chars: int = 30000,
    file_name: str | None = None,
) -> list[tuple[str, int, int]]:
    """Split *text* into semantic chunks using Yandex LLM."""
    if not text or not text.strip():
        return []

    encoding = choice_the_tokenizer(True, tokenizer_path, None)
    total_tokens = len(encoding.encode(text))
    if total_tokens <= max_tokens:
        if file_name:
            logger.info("File fits in single semantic slice: %s (%s tokens)", file_name, total_tokens)
        return [(text, 0, total_tokens)]

    if file_name:
        logger.info(
            "Semantic LLM slicing: %s (~%s tokens, window=%s chars)",
            file_name,
            total_tokens,
            llm_window_chars,
        )

    sections = _split_by_markdown_headers(text)
    slices: list[tuple[str, int, int]] = []
    global_offset = 0
    slice_num = 1

    for section in sections:
        section_tokens = len(encoding.encode(section))
        if section_tokens <= max_tokens:
            slices.append((section, global_offset, global_offset + section_tokens))
            global_offset += section_tokens
            slice_num += 1
            continue

        chunks = _split_section_with_llm(
            section,
            max_tokens=max_tokens,
            llm_client=llm_client,
            encoding=encoding,
            llm_window_chars=llm_window_chars,
        )
        for chunk in chunks:
            token_count = len(encoding.encode(chunk))
            logger.info(
                "Creating slice_%03d (tokens %s-%s) [semantic]",
                slice_num,
                global_offset,
                global_offset + token_count,
            )
            slices.append((chunk, global_offset, global_offset + token_count))
            global_offset += token_count
            slice_num += 1

    if file_name:
        logger.info("Completed semantic slicing: %s slices from %s", len(slices), file_name)

    return slices


def build_slicer_llm_config(config: dict[str, Any]) -> dict[str, Any]:
    """Build LLM client config for slicer from [slicer] with fallback to concepts."""
    slicer = config.get("slicer", {})
    concepts = config.get("itext2kg_concepts", {})
    llm_keys = (
        "provider", "base_url", "api_key", "folder_id", "model", "max_completion",
        "temperature", "timeout", "max_retries", "request_delay_seconds", "tpm_limit", "log_level",
    )
    merged = {key: concepts[key] for key in llm_keys if key in concepts}
    merged.update({key: slicer[key] for key in llm_keys if key in slicer})
    merged.setdefault("provider", "yandex")
    merged.setdefault("model", "yandexgpt")
    merged.setdefault("max_completion", slicer.get("llm_max_completion", 8000))
    merged.setdefault("temperature", 0.3)
    merged.setdefault("timeout", 600)
    merged.setdefault("max_retries", 3)
    merged.setdefault("request_delay_seconds", 2)
    merged.setdefault("tpm_limit", 100000)
    merged.setdefault("log_level", "info")
    return merged
