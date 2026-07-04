#!/usr/bin/env python3
"""Quick check that configured LLM provider credentials work before running ACCELMAT."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env", override=True)

from llm_client import MODEL_KG, chat_completion, get_provider, resolve_model, validate_credentials  # noqa: E402


def main() -> int:
    try:
        validate_credentials()
    except ValueError as exc:
        print(f"FAILED — {exc}", file=sys.stderr)
        return 1

    provider = get_provider()
    model = resolve_model(MODEL_KG)
    print(f"Testing {provider} with model {model} ...")
    try:
        response = chat_completion(
            model=MODEL_KG,
            messages=[{"role": "user", "content": "Reply with OK only."}],
            max_tokens=10,
        )
        text = (response.choices[0].message.content or "").strip()
        print(f"OK — response: {text[:80]!r}")
        return 0
    except Exception as exc:
        print(f"FAILED — {exc}", file=sys.stderr)
        if provider == "routerai":
            print(
                "\nFix: create an API key at https://routerai.ru/, set ROUTERAI_API_KEY in .env, "
                "and pick a model id from https://routerai.ru/models (e.g. qwen/qwen3.6-flash).",
                file=sys.stderr,
            )
        else:
            print(
                "\nFix: set LLM_PROVIDER=yandex, YANDEX_API_KEY and YANDEX_FOLDER_ID in .env "
                "(see https://aistudio.yandex.ru/).",
                file=sys.stderr,
            )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
