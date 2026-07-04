"""Console logging helpers for full visibility into the ACCELMAT pipeline run."""

from __future__ import annotations

import json
import logging
import sys
import time
from contextlib import contextmanager
from typing import Any, Iterator

LOGGER_NAME = "accelmat"

_LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)-24s | %(message)s"
_DATE_FORMAT = "%H:%M:%S"


def setup_logging(level: str | int = "INFO") -> logging.Logger:
    """Configure the ACCELMAT logger to stream all pipeline activity to the console."""
    if isinstance(level, str):
        level = getattr(logging, level.upper(), logging.INFO)

    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(level)
    logger.propagate = False

    if not logger.handlers:
        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
        logger.addHandler(handler)
    else:
        for handler in logger.handlers:
            handler.setLevel(level)

    return logger


def get_logger(component: str) -> logging.Logger:
    """Return a child logger, e.g. get_logger('agent') -> 'accelmat.agent'."""
    return logging.getLogger(f"{LOGGER_NAME}.{component}")


def truncate(text: Any, limit: int | None = 4000) -> str:
    text = text if isinstance(text, str) else json.dumps(text, ensure_ascii=False, indent=2)
    if limit is None or len(text) <= limit:
        return text
    return text[:limit] + f"\n... [truncated, {len(text)} chars total]"


def log_block(
    logger: logging.Logger,
    label: str,
    content: Any,
    *,
    level: int = logging.INFO,
    limit: int | None = 4000,
) -> None:
    """Log a labeled, optionally truncated block of text/JSON (prompts, responses, etc.)."""
    if not logger.isEnabledFor(level):
        return
    effective_limit = None if logger.isEnabledFor(logging.DEBUG) else limit
    logger.log(level, "%s:\n%s", label, truncate(content, effective_limit))


@contextmanager
def log_step(
    logger: logging.Logger,
    message: str,
    *,
    level: int = logging.INFO,
) -> Iterator[None]:
    """Log the start, duration, and completion (or failure) of a pipeline step."""
    logger.log(level, "-> %s", message)
    start = time.perf_counter()
    try:
        yield
    except Exception:
        elapsed = time.perf_counter() - start
        logger.exception("x  %s FAILED after %.1fs", message, elapsed)
        raise
    else:
        elapsed = time.perf_counter() - start
        logger.log(level, "<- %s done (%.1fs)", message, elapsed)
