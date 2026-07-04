"""Fallback PDF backend using raw PyMuPDF text extraction."""

from __future__ import annotations

import logging
from pathlib import Path

from doc_converter.converters.pdf.backends.base import PdfBackend, PdfPageResult
from doc_converter.converters.pdf.pymupdf_utils import _require_fitz

logger = logging.getLogger(__name__)


class PyMuPDFBackend(PdfBackend):
    """Plain text extraction without layout reconstruction."""

    backend_name = "pymupdf"

    def parse_pages(self, pdf_path: Path) -> list[PdfPageResult]:
        fitz = _require_fitz()
        logger.info("Extracting PDF with PyMuPDF text layer: %s", pdf_path.name)
        results: list[PdfPageResult] = []
        with fitz.open(pdf_path) as document:
            for page_index in range(document.page_count):
                page = document[page_index]
                text = page.get_text("text").strip()
                results.append(
                    PdfPageResult(
                        page_num=page_index + 1,
                        markdown=text,
                        extraction_method="pymupdf-text_layer",
                        confidence=0.85 if text else 0.3,
                    )
                )
        return results
