"""Fast PDF → markdown via pymupdf4llm."""

from __future__ import annotations

import logging
from pathlib import Path

from doc_converter.converters.pdf.backends.base import PdfBackend, PdfPageResult

logger = logging.getLogger(__name__)

_MIN_TEXT_CHARS = 32


class PyMuPDF4LLMBackend(PdfBackend):
    """Default backend: pymupdf4llm with per-page markdown chunks."""

    backend_name = "pymupdf4llm"

    def parse_pages(self, pdf_path: Path) -> list[PdfPageResult]:
        try:
            import pymupdf4llm
        except ImportError as exc:
            msg = "PDF support requires pymupdf4llm: pip install pymupdf4llm"
            raise ImportError(msg) from exc

        logger.info("Extracting PDF with pymupdf4llm: %s", pdf_path.name)
        chunks = pymupdf4llm.to_markdown(str(pdf_path), page_chunks=True)
        if not isinstance(chunks, list):
            msg = f"Unexpected pymupdf4llm output type: {type(chunks)}"
            raise TypeError(msg)

        results: list[PdfPageResult] = []
        for index, chunk in enumerate(chunks):
            if not isinstance(chunk, dict):
                continue
            metadata = chunk.get("metadata") or {}
            page_num = int(metadata.get("page") or metadata.get("page_number") or (index + 1))
            text = str(chunk.get("text") or "").strip()
            method = "pymupdf4llm-text_layer"
            confidence = 0.95 if len(text) >= _MIN_TEXT_CHARS else 0.4
            results.append(
                PdfPageResult(
                    page_num=page_num,
                    markdown=text,
                    extraction_method=method,
                    confidence=confidence,
                )
            )
        return results
