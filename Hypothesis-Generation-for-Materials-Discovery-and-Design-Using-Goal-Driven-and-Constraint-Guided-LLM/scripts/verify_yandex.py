#!/usr/bin/env python3
"""Backward-compatible alias for scripts/verify_llm.py."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from verify_llm import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
