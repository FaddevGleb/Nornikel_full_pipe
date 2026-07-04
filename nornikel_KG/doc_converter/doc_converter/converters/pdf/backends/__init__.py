"""Pluggable PDF extraction backends."""

from doc_converter.converters.pdf.backends.base import PdfBackend, PdfPageResult

__all__ = ["PdfBackend", "PdfPageResult"]
