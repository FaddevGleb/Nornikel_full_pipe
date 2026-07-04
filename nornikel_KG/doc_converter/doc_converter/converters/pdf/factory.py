"""PDF backend factory."""

from __future__ import annotations

from doc_converter.config import Settings
from doc_converter.converters.pdf.backends.base import PdfBackend
from doc_converter.converters.pdf.backends.pymupdf4llm_backend import PyMuPDF4LLMBackend
from doc_converter.converters.pdf.backends.pymupdf_backend import PyMuPDFBackend


def get_pdf_backend(settings: Settings) -> PdfBackend:
    """Return configured PDF extraction backend."""
    if settings.pdf_backend == "pymupdf4llm":
        return PyMuPDF4LLMBackend()
    if settings.pdf_backend == "pymupdf":
        return PyMuPDFBackend()
    msg = f"Unknown PDF backend: {settings.pdf_backend}"
    raise ValueError(msg)
