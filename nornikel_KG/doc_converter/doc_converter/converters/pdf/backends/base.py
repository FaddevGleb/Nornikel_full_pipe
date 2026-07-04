"""Abstract PDF backend interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PdfPageResult:
    """Markdown content extracted from a single PDF page."""

    page_num: int
    markdown: str
    extraction_method: str
    confidence: float | None = None


class PdfBackend(ABC):
    """Extract per-page markdown from PDF files."""

    backend_name: str = "base"

    @abstractmethod
    def parse_pages(self, pdf_path: Path) -> list[PdfPageResult]:
        """Return ordered page results (1-based page numbers)."""
