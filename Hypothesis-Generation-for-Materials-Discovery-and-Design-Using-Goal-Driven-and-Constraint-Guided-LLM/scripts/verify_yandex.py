#!/usr/bin/env python3
"""Quick check that Yandex AI Studio credentials work before running ACCELMAT."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env", override=True)

from llm_client import MODEL_KG, chat_completion, resolve_model  # noqa: E402


def main() -> int:
    model = resolve_model(MODEL_KG)
    print(f"Testing Yandex API with model {model} ...")
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
        print(
            "\nFix in Yandex Cloud console:\n"
            "1. IAM -> Service accounts -> select the account tied to this API key\n"
            "2. Assign role ai.languageModels.user on folder b1ggusvist6c2sia1dno\n"
            "3. Create a NEW API key with scope yc.ai.foundationModels.execute "
            "(AI Studio -> API keys, or IAM -> Create API key -> Scope)\n"
            "4. Update YANDEX_API_KEY in .env and ~/.feynman/agent/models.json\n"
            "5. Re-run: python scripts/verify_yandex.py",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
