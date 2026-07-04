"""Extract markdown/HTML tables from table images."""

from __future__ import annotations

import logging
from pathlib import Path

from doc_converter.config import Settings
from doc_converter.ir import DocElement
from doc_converter.image_pipeline.prompts import TABLE_EXTRACTION_PROMPT
from doc_converter.utils.markdown_parser import markdown_table_to_html
from doc_converter.vlm.base import VLMBackend

logger = logging.getLogger(__name__)


def _extract_with_img2table(image_path: Path) -> str | None:
    """img2table/Tesseract table OCR (disabled until Tesseract is installed)."""
    return None


def extract_table(
    image_path: Path,
    settings: Settings,
    vlm: VLMBackend | None,
    *,
    raw_image_path: str,
) -> DocElement | None:
    """Extract a table element from an image."""
    markdown_table: str | None = None
    method = "unknown"
    confidence = 0.5

    if vlm is not None:
        markdown_table = vlm.ask(image_path, TABLE_EXTRACTION_PROMPT).strip()
        backend = getattr(vlm, "backend_name", vlm.__class__.__name__)
        method = f"vlm-{backend}"
        confidence = 0.87

    if not markdown_table or "|" not in markdown_table:
        markdown_table = _extract_with_img2table(image_path)
        if markdown_table:
            method = "img2table"
            confidence = 0.65

    if not markdown_table:
        return None

    return DocElement(
        type="table",
        content=markdown_table,
        html_content=markdown_table_to_html(markdown_table),
        raw_image_path=raw_image_path,
        extraction_method=method,
        confidence=confidence,
    )
