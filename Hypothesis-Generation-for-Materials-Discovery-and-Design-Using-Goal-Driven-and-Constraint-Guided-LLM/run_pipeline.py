#!/usr/bin/env python3
"""CLI entry point for the ACCELMAT end-to-end pipeline."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from logging_utils import setup_logging
from llm_client import validate_credentials
from pipeline import load_pipeline_request, run_pipeline, save_pipeline_result


def _bootstrap_workspace() -> None:
    import sys

    root = Path(__file__).resolve().parent.parent
    if not (root / "project.toml").exists():
        for parent in Path(__file__).resolve().parents:
            if (parent / "project.toml").exists():
                root = parent
                break
    sys.path.insert(0, str(root))
    from config.loader import apply_env_from_config

    apply_env_from_config()


_bootstrap_workspace()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run ACCELMAT pipeline: graph JSON + goal + constraints -> hypotheses JSON",
    )
    parser.add_argument(
        "--request",
        type=Path,
        required=True,
        help="Path to pipeline request JSON",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("output/hypotheses.json"),
        help="Output hypotheses JSON path",
    )
    parser.add_argument(
        "--save-subrelobj",
        type=Path,
        default=None,
        help="Optional path to save intermediate SUBRELOBJ CSV",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Log everything, including full untruncated LLM prompts and raw responses (DEBUG level)",
    )
    parser.add_argument(
        "-q",
        "--quiet",
        action="store_true",
        help="Suppress step-by-step logging; only print the final summary",
    )
    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()

    if args.quiet:
        log_level = "WARNING"
    elif args.debug:
        log_level = "DEBUG"
    else:
        log_level = "INFO"
    setup_logging(log_level)

    try:
        validate_credentials()
    except ValueError as exc:
        print(f"Error: {exc} Copy .env.example to .env and set LLM_PROVIDER plus API keys.", file=sys.stderr)
        return 1

    request = load_pipeline_request(args.request)
    result = run_pipeline(request, save_subrelobj_path=args.save_subrelobj)
    save_pipeline_result(result, args.output)

    print(f"Wrote hypotheses to {args.output}")
    print(f"KG context applications: {len(result.kg_context)}")
    print(f"Hypotheses: {len(result.hypotheses)}")
    print(f"Critics approved: {result.metadata.get('critics_approved')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
