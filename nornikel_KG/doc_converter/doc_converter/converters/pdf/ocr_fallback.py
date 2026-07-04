"""OCR fallback for scanned PDF pages using Yandex Vision OCR."""

from __future__ import annotations

import base64
import logging
import re
from pathlib import Path
from typing import Any

import requests

from doc_converter.config import Settings
from doc_converter.converters.pdf.backends.base import PdfPageResult
from doc_converter.converters.pdf.pymupdf_utils import render_page_to_image

logger = logging.getLogger(__name__)

_MIN_TEXT_CHARS = 32


def page_needs_ocr(page: PdfPageResult) -> bool:
    """Return True when extracted page text is too sparse."""
    stripped = re.sub(r"\s+", " ", page.markdown).strip()
    return len(stripped) < _MIN_TEXT_CHARS


def ocr_page_markdown(
    pdf_path: Path,
    page_num: int,
    settings: Settings,
    *,
    render_dir: Path,
) -> PdfPageResult | None:
    """Render a PDF page and OCR it via Yandex Vision."""
    image_path = render_dir / f"page{page_num}_ocr.png"

    try:
        render_page_to_image(pdf_path, page_num, image_path)
    except Exception:
        logger.exception("Failed to render page %s for OCR", page_num)
        return None

    text = _ocr_with_yandex(image_path, settings)
    if not text:
        logger.warning("Yandex OCR returned no text for page %s", page_num)
        return None

    return PdfPageResult(
        page_num=page_num,
        markdown=text,
        extraction_method="yandex_vision_ocr",
        confidence=0.9,
    )


def _ocr_with_yandex(image_path: Path, settings: Settings) -> str | None:
    api_key = settings.yandex_api_key
    folder_id = settings.yandex_folder_id

    if not api_key or not folder_id:
        logger.error("Missing Yandex credentials (YANDEX_API_KEY / YANDEX_FOLDER_ID)")
        return None

    try:
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")

        url = "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze"
        headers = {
            "Authorization": f"Api-Key {api_key}",
            "x-folder-id": folder_id,
            "Content-Type": "application/json",
        }
        payload = {
            "folderId": folder_id,
            "analyze_specs": [
                {
                    "content": image_data,
                    "mime_type": "image/png",
                    "features": [
                        {
                            "type": "TEXT_DETECTION",
                            "text_detection_config": {
                                "language_codes": ["ru", "en"],
                            },
                        }
                    ],
                }
            ],
        }

        response = requests.post(url, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        return _parse_yandex_response(response.json())
    except Exception:
        logger.exception("Yandex OCR failed for %s", image_path.name)
        return None


def _parse_yandex_response(data: dict[str, Any]) -> str | None:
    """Parse batchAnalyze JSON; supports Vision v1 textDetection tree."""
    try:
        page_texts: list[str] = []

        for analyze_result in data.get("results", []):
            for feature_result in analyze_result.get("results", []):
                text = _extract_feature_text(feature_result)
                if text:
                    page_texts.append(text)

        combined = "\n\n".join(page_texts).strip()
        if combined:
            return combined

        logger.debug("Yandex OCR response contained no recognizable text: %s", _response_keys(data))
        return None
    except Exception:
        logger.exception("Failed to parse Yandex OCR response")
        return None


def _extract_feature_text(feature_result: dict[str, Any]) -> str | None:
    text_detection = feature_result.get("textDetection") or feature_result.get("text_detection")
    if text_detection:
        aggregated = text_detection.get("text") or text_detection.get("fullText")
        if isinstance(aggregated, str) and aggregated.strip():
            return aggregated.strip()

        lines: list[str] = []
        for page in text_detection.get("pages", []):
            lines.extend(_extract_page_lines(page))
        if lines:
            return "\n\n".join(lines)

    text_annotation = feature_result.get("textAnnotation") or feature_result.get("text_annotation")
    if text_annotation:
        aggregated = text_annotation.get("text") or text_annotation.get("fullText")
        if isinstance(aggregated, str) and aggregated.strip():
            return aggregated.strip()

        lines = []
        for page in text_annotation.get("pages", []):
            lines.extend(_extract_page_lines(page))
        if lines:
            return "\n\n".join(lines)

    return None


def _extract_page_lines(page: dict[str, Any]) -> list[str]:
    lines_out: list[str] = []
    for block in page.get("blocks", []):
        block_lines = block.get("lines")
        if block_lines:
            lines_out.extend(_join_line_texts(block_lines))
            continue
        for paragraph in block.get("paragraphs", []):
            lines_out.extend(_join_line_texts(paragraph.get("lines", [])))
    return lines_out


def _join_line_texts(lines: list[dict[str, Any]]) -> list[str]:
    joined: list[str] = []
    for line in lines:
        words = line.get("words", [])
        line_text = " ".join(str(word.get("text", "")).strip() for word in words if word.get("text"))
        if line_text.strip():
            joined.append(line_text.strip())
    return joined


def _response_keys(data: dict[str, Any]) -> str:
    top = list(data.keys())
    nested: list[str] = []
    for analyze_result in data.get("results", [])[:1]:
        for feature_result in analyze_result.get("results", [])[:1]:
            nested = list(feature_result.keys())
    return f"top={top}, feature={nested}"
