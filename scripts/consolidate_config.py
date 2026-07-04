#!/usr/bin/env python3
"""Merge scattered configs into workspace project.toml."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

try:
    import tomli_w
except ImportError:
    print("Install tomli-w: pip install tomli-w", file=sys.stderr)
    raise

WORKSPACE = Path(__file__).resolve().parents[1]
HYPOTHESIS = WORKSPACE / "Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM"
NKG = HYPOTHESIS / "nornikel_KG"

CANONICAL_PATHS = {
    "nornikel_kg": "Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/nornikel_KG",
    "hypothesis_repo": "Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM",
    "feynman": "Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/feynman",
    "python_venv": "Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/nornikel_KG/.venv",
}


def parse_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        result[key.strip()] = value.strip()
    return result


def load_toml(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("rb") as handle:
        return tomllib.load(handle)


def normalize_kg_paths(kg: dict) -> dict:
    """Replace legacy absolute paths with placeholders."""
    token = "{paths.nornikel_kg}/src"
    replacements = [
        (re.compile(r"C:/NORNIKEL2/k2-18/src", re.I), token),
        (re.compile(r"C:\\NORNIKEL2\\k2-18\\src", re.I), token),
        (re.compile(r"C:/Хакатоны/Nornikel/nornikel_KG/src", re.I), token),
        (re.compile(r"C:\\Хакатоны\\Nornikel\\nornikel_KG\\src", re.I), token),
    ]

    def walk(value):
        if isinstance(value, str):
            out = value
            for pattern, repl in replacements:
                out = pattern.sub(repl, out)
            return out
        if isinstance(value, dict):
            return {k: walk(v) for k, v in value.items()}
        if isinstance(value, list):
            return [walk(v) for v in value]
        return value

    return walk(kg)


def build_accelmat_llm(env: dict) -> dict:
    provider = env.get("LLM_PROVIDER", "routerai")
    llm: dict = {"provider": provider}
    llm["routerai_api_key"] = env.get("ROUTERAI_API_KEY", "")
    llm["routerai_base_url"] = env.get("ROUTERAI_BASE_URL", "https://routerai.ru/api/v1")
    llm["yandex_api_key"] = env.get("YANDEX_API_KEY", "")
    llm["yandex_folder_id"] = env.get("YANDEX_FOLDER_ID", "")
    llm["yandex_base_url"] = env.get("YANDEX_BASE_URL", "https://llm.api.cloud.yandex.net/v1")
    llm["openrouter_api_key"] = env.get("OPENROUTER_API_KEY", env.get("ROUTERAI_API_KEY", ""))

    roles = ["HGA", "CRITIC", "CRITIC_2", "CRITIC_3", "CRITIC_4", "SUMMARIZER", "EVALUATION", "KG"]
    models = {}
    for role in roles:
        direct = env.get(f"MODEL_{role}")
        if direct:
            models[role] = direct
            continue
        if provider == "yandex":
            models[role] = env.get(f"YANDEX_MODEL_{role}", "qwen3.6-flash/latest")
        else:
            models[role] = env.get(f"ROUTERAI_MODEL_{role}", "qwen/qwen3.6-flash")
    llm["models"] = models
    return llm


def build_project_config() -> dict:
    env = parse_env_file(HYPOTHESIS / ".env")

    kg_source = NKG / "web" / "runtime" / "config.toml"
    if not kg_source.exists():
        kg_source = NKG / "src" / "config.toml"
    kg = normalize_kg_paths(load_toml(kg_source))

    viz = load_toml(NKG / "viz" / "config.toml")

    settings_path = NKG / "web" / "settings.json"
    web = json.loads(settings_path.read_text(encoding="utf-8")) if settings_path.exists() else {}

    feynman_settings = web.pop("feynman", {}) if isinstance(web, dict) else {}
    feynman_enrichment = web.pop("feynmanEnrichment", {}) if isinstance(web, dict) else {}

    accelmat_llm = build_accelmat_llm(env)

    feynman = {
        "root": "{paths.feynman}",
        "cwd": "{paths.hypothesis_repo}",
        "idleTimeoutMs": feynman_settings.get("idleTimeoutMs", 900000),
        "model": feynman_settings.get("model", ""),
        "env": {
            "OPENROUTER_API_KEY": env.get("ROUTERAI_API_KEY", env.get("OPENROUTER_API_KEY", "")),
            "ROUTERAI_API_KEY": env.get("ROUTERAI_API_KEY", ""),
            "YANDEX_API_KEY": env.get("YANDEX_API_KEY", ""),
            "YANDEX_FOLDER_ID": env.get("YANDEX_FOLDER_ID", ""),
        },
    }

    if feynman_enrichment:
        feynman["enrichment"] = feynman_enrichment

    doc_converter = {
        "vlm_backend": "off",
        "ocr_lang": "ru",
        "openai_vlm_model": "gpt-4o-mini",
    }

    return {
        "meta": {"version": 1},
        "paths": {
            **CANONICAL_PATHS,
            "models": {
                "tokenizer": "{paths.nornikel_kg}/src/qwen2.5-0.5b-instruct",
                "llm_local": "{paths.nornikel_kg}/src/qwen2.5-0.5b-instruct",
                "embeddings": "{paths.nornikel_kg}/src/multilingual-e5-large",
            },
        },
        "kg": kg,
        "viz": viz,
        "web": web,
        "accelmat": {"llm": accelmat_llm, **({"projectDir": web.get("accelmat", {}).get("projectDir")} if web.get("accelmat") else {})},
        "feynman": feynman,
        "doc_converter": doc_converter,
    }


def redact_secrets(config: dict) -> dict:
    import copy

    out = copy.deepcopy(config)
    llm = out.get("accelmat", {}).get("llm", {})
    for key in list(llm.keys()):
        if "key" in key.lower() or key.endswith("_id") and "folder" in key:
            llm[key] = "YOUR_SECRET_HERE"
    feynman_env = out.get("feynman", {}).get("env", {})
    for key in feynman_env:
        feynman_env[key] = "YOUR_SECRET_HERE"
    for section in out.get("kg", {}).values():
        if isinstance(section, dict) and "api_key" in section:
            section["api_key"] = ""
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Consolidate configs into project.toml")
    parser.add_argument("--check", action="store_true", help="Print summary without writing")
    parser.add_argument("--write-example", action="store_true", help="Write project.example.toml (redacted)")
    args = parser.parse_args()

    config = build_project_config()

    if args.check:
        print(f"Workspace: {WORKSPACE}")
        print(f"KG sections: {', '.join(config.get('kg', {}).keys())}")
        print(f"Viz sections: {', '.join(config.get('viz', {}).keys())}")
        print(f"Web keys: {', '.join(config.get('web', {}).keys())}")
        print(f"Accelmat provider: {config.get('accelmat', {}).get('llm', {}).get('provider')}")
        return 0

    if args.write_example:
        target = WORKSPACE / "project.example.toml"
        with target.open("wb") as handle:
            tomli_w.dump(redact_secrets(config), handle)
        print(f"Wrote {target}")
        return 0

    target = WORKSPACE / "project.toml"
    with target.open("wb") as handle:
        tomli_w.dump(config, handle)
    print(f"Wrote {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
