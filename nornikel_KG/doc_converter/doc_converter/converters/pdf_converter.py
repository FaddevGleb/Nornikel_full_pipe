"""PDF → ParsedDocument converter using pymupdf4llm + PyMuPDF figures."""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from doc_converter.config import Settings
from doc_converter.converters.base import BaseConverter
from doc_converter.converters.pdf.factory import get_pdf_backend
from doc_converter.converters.pdf.ocr_fallback import ocr_page_markdown, page_needs_ocr
from doc_converter.converters.pdf.pymupdf_utils import ExtractedFigure, extract_pdf_images, render_page_to_image
from doc_converter.converters.pdf.table_heuristics import is_low_quality_table
from doc_converter.image_pipeline.processor import persist_media_file, process_image
from doc_converter.image_pipeline.table_extractor import extract_table
from doc_converter.ir import DocElement, ParsedDocument
from doc_converter.utils.markdown_parser import parse_markdown
from doc_converter.vlm.factory import get_vlm_backend

logger = logging.getLogger(__name__)


class PdfConverter(BaseConverter):
    """Convert PDF documents via pluggable fast backends."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or Settings()

    def parse(self, path: Path) -> ParsedDocument:
        path = path.resolve()
        backend = get_pdf_backend(self.settings)

        with tempfile.TemporaryDirectory(prefix="doc_convert_pdf_") as tmp:
            tmp_dir = Path(tmp)
            figures_dir = tmp_dir / "figures"
            render_dir = tmp_dir / "render"

            page_results = backend.parse_pages(path)
            page_results = self._apply_ocr_fallback(path, page_results, render_dir)
            figures = extract_pdf_images(path, figures_dir)
            figures_by_page = _group_figures_by_page(figures)

            elements: list[DocElement] = []
            for page in page_results:
                if not page.markdown.strip():
                    continue
                method = page.extraction_method
                page_elements = parse_markdown(page.markdown, extraction_method=method)
                page_elements = self._tag_source_page(page_elements, page.page_num, method, page.confidence)
                page_elements = self._fix_low_quality_tables(
                    page_elements,
                    pdf_path=path,
                    page_num=page.page_num,
                    render_dir=render_dir,
                )
                elements.extend(page_elements)
                elements.extend(
                    self._process_page_figures(
                        figures_by_page.get(page.page_num, []),
                        page_num=page.page_num,
                    )
                )

            if not elements:
                logger.error(
                    "PDF produced no extractable content: %s "
                    "(empty text layer and OCR yielded no text)",
                    path.name,
                )

        return ParsedDocument(
            source_file=str(path),
            source_type="pdf",
            elements=elements,
        )

    def _apply_ocr_fallback(
        self,
        pdf_path: Path,
        pages: list,
        render_dir: Path,
    ) -> list:
        updated = []
        for page in pages:
            if not page_needs_ocr(page):
                updated.append(page)
                continue
            ocr_page = ocr_page_markdown(pdf_path, page.page_num, self.settings, render_dir=render_dir)
            updated.append(ocr_page or page)
        return updated

    def _tag_source_page(
        self,
        elements: list[DocElement],
        page_num: int,
        method: str,
        confidence: float | None,
    ) -> list[DocElement]:
        for element in elements:
            element.source_page = page_num
            if element.extraction_method in (None, "pandoc"):
                element.extraction_method = method
            if element.confidence is None and confidence is not None:
                element.confidence = confidence
        return elements

    def _fix_low_quality_tables(
        self,
        elements: list[DocElement],
        *,
        pdf_path: Path,
        page_num: int,
        render_dir: Path,
    ) -> list[DocElement]:
        fixed: list[DocElement] = []
        vlm = get_vlm_backend(self.settings)

        for element in elements:
            if element.type != "table" or not is_low_quality_table(element.content):
                fixed.append(element)
                continue

            logger.info("Re-extracting low-quality table on page %s", page_num)
            page_image = render_dir / f"page{page_num}_render.png"
            try:
                render_page_to_image(pdf_path, page_num, page_image)
            except Exception:
                logger.exception("Failed to render page %s for table fallback", page_num)
                fixed.append(element)
                continue

            relative_render = persist_media_file(page_image, self.settings)
            replacement = extract_table(
                page_image,
                self.settings,
                vlm,
                raw_image_path=relative_render,
            )
            if replacement is None:
                fixed.append(element)
                continue

            replacement.source_page = page_num
            replacement.extraction_method = f"{replacement.extraction_method}+page-rerender"
            fixed.append(replacement)

        return fixed

    def _process_page_figures(
        self,
        figures: list[ExtractedFigure],
        *,
        page_num: int,
    ) -> list[DocElement]:
        processed: list[DocElement] = []
        for figure in figures:
            element = process_image(
                figure.path,
                self.settings,
                extraction_method="pymupdf-figure",
            )
            element.source_page = page_num
            processed.append(element)
        return processed


def _group_figures_by_page(figures: list[ExtractedFigure]) -> dict[int, list[ExtractedFigure]]:
    grouped: dict[int, list[ExtractedFigure]] = {}
    for figure in figures:
        grouped.setdefault(figure.page_num, []).append(figure)
    return grouped
