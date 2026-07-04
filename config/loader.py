"""
Unified workspace configuration loader.

Reads project.toml from workspace root (c:\\Хакатоны\\Nornikel by default).
"""
from __future__ import annotations

import os
import re
import sys
import base64
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any

if sys.version_info >= (3, 11):
    import tomllib
else:
    try:
        import tomli as tomllib
    except ImportError as exc:
        raise ImportError("tomli is required for Python < 3.11") from exc

try:
    import tomli_w
except ImportError:
    tomli_w = None

PROJECT_FILENAME = "project.toml"
EXAMPLE_FILENAME = "project.example.toml"
PLACEHOLDER_RE = re.compile(r"\{paths(?:\.\w+)+\}")

_cached_config: dict[str, Any] | None = None
_cached_root: Path | None = None


class ProjectConfigError(Exception):
    """Raised when project.toml is missing or invalid."""


def find_workspace_root(start: Path | str | None = None) -> Path:
    env_root = os.environ.get("NORNIKEL_PROJECT_ROOT")
    if env_root:
        root = Path(env_root).expanduser().resolve()
        if (root / PROJECT_FILENAME).exists():
            return root
        raise ProjectConfigError(
            f"NORNIKEL_PROJECT_ROOT={env_root} but {PROJECT_FILENAME} not found"
        )

    current = Path(start or Path.cwd()).resolve()
    for candidate in [current, *current.parents]:
        if (candidate / PROJECT_FILENAME).exists():
            return candidate

    raise ProjectConfigError(
        f"{PROJECT_FILENAME} not found. Copy {EXAMPLE_FILENAME} to {PROJECT_FILENAME} "
        f"in workspace root or set NORNIKEL_PROJECT_ROOT."
    )


def _parse_toml(path: Path) -> dict[str, Any]:
    with path.open("rb") as handle:
        return tomllib.load(handle)


def _flatten_prefix(config: dict[str, Any], prefix: str) -> dict[str, Any]:
    """Extract nested table prefix (e.g. kg.slicer -> {slicer: ...})."""
    parts = prefix.split(".")
    node: Any = config
    for part in parts:
        if not isinstance(node, dict) or part not in node:
            return {}
        node = node[part]
    if not isinstance(node, dict):
        return {}
    return deepcopy(node)


def _resolve_string(value: str, paths: dict[str, Any], workspace_root: Path) -> str:
    def replacer(match: re.Match[str]) -> str:
        token = match.group(0)[1:-1]  # strip {}
        parts = token.split(".")
        if parts[0] != "paths":
            return match.group(0)
        node: Any = paths
        for part in parts[1:]:
            if isinstance(node, dict) and part in node:
                node = node[part]
            else:
                return match.group(0)
        if isinstance(node, str):
            p = Path(node)
            if not p.is_absolute():
                p = workspace_root / p
            return str(p.resolve())
        return match.group(0)

    prev = None
    current = value
    while prev != current:
        prev = current
        current = PLACEHOLDER_RE.sub(replacer, current)
    return current


def _resolve_value(value: Any, paths: dict[str, Any], workspace_root: Path) -> Any:
    if isinstance(value, str):
        return _resolve_string(value, paths, workspace_root)
    if isinstance(value, list):
        return [_resolve_value(item, paths, workspace_root) for item in value]
    if isinstance(value, dict):
        return {k: _resolve_value(v, paths, workspace_root) for k, v in value.items()}
    return value


def _resolve_paths_table(paths: dict[str, Any], workspace_root: Path) -> dict[str, Any]:
    resolved: dict[str, Any] = {}
    for key, value in paths.items():
        if isinstance(value, dict):
            resolved[key] = _resolve_paths_table(value, workspace_root)
        elif isinstance(value, str):
            p = Path(value)
            if not p.is_absolute():
                p = workspace_root / p
            resolved[key] = str(p.resolve())
        else:
            resolved[key] = value
    return resolved


def load_project_config(force_reload: bool = False) -> dict[str, Any]:
    global _cached_config, _cached_root
    if _cached_config is not None and not force_reload:
        return _cached_config

    root = find_workspace_root()
    raw = _parse_toml(root / PROJECT_FILENAME)
    paths_raw = raw.get("paths", {})
    if not isinstance(paths_raw, dict):
        paths_raw = {}

    resolved_paths = _resolve_paths_table(paths_raw, root)
    config = _resolve_value(raw, resolved_paths, root)
    config["paths"] = resolved_paths
    config["_workspace_root"] = str(root)

    _cached_config = config
    _cached_root = root
    return config


def get_workspace_root() -> Path:
    global _cached_root
    if _cached_root is None:
        load_project_config()
    assert _cached_root is not None
    return _cached_root


def resolve_path(relative: str) -> Path:
    root = get_workspace_root()
    p = Path(relative)
    if p.is_absolute():
        return p
    return (root / p).resolve()


def get_nornikel_kg_root() -> Path:
    config = load_project_config()
    paths = config.get("paths", {})
    nkg = paths.get("nornikel_kg")
    if not nkg:
        raise ProjectConfigError("paths.nornikel_kg is not set in project.toml")
    return Path(nkg)


def get_kg_config(provider_override: str | None = None) -> dict[str, Any]:
    config = load_project_config()
    kg = config.get("kg", {})
    if not isinstance(kg, dict):
        raise ProjectConfigError("[kg] section missing in project.toml")

    result = deepcopy(kg)
    if provider_override:
        for section in ("itext2kg_concepts", "itext2kg_graph", "refiner"):
            if section in result and isinstance(result[section], dict):
                result[section]["provider"] = provider_override

    # Inject shared API key from accelmat if kg sections have empty api_key
    accelmat = config.get("accelmat", {}).get("llm", {})
    shared_key = accelmat.get("routerai_api_key") or accelmat.get("openrouter_api_key") or ""
    for section in ("itext2kg_concepts", "itext2kg_graph", "refiner"):
        if section in result and isinstance(result[section], dict):
            api_key = result[section].get("api_key", "")
            if not api_key or str(api_key).startswith("sk-..."):
                if shared_key:
                    result[section]["api_key"] = shared_key

    return result


def get_viz_config() -> dict[str, Any]:
    config = load_project_config()
    viz = config.get("viz", {})
    if not isinstance(viz, dict):
        return {}
    return deepcopy(viz)


def get_web_config() -> dict[str, Any]:
    config = load_project_config()
    web = config.get("web", {})
    if not isinstance(web, dict):
        return {}
    return deepcopy(web)


def get_accelmat_config() -> dict[str, Any]:
    config = load_project_config()
    accelmat = config.get("accelmat", {})
    if not isinstance(accelmat, dict):
        return {}
    return deepcopy(accelmat)


def get_feynman_config() -> dict[str, Any]:
    config = load_project_config()
    feynman = config.get("feynman", {})
    if not isinstance(feynman, dict):
        return {}
    return deepcopy(feynman)


def get_doc_converter_config() -> dict[str, Any]:
    config = load_project_config()
    doc = config.get("doc_converter", {})
    if not isinstance(doc, dict):
        return {}
    return deepcopy(doc)


def _decode_secret(value: Any) -> str:
    text = str(value)
    if text.startswith("b64:"):
        return base64.b64decode(text[4:], validate=False).decode("utf-8")
    return text


def apply_env_from_config() -> None:
    """Populate os.environ from project.toml for legacy consumers."""
    config = load_project_config()
    accelmat_llm = config.get("accelmat", {}).get("llm", {})
    if isinstance(accelmat_llm, dict):
        provider = accelmat_llm.get("provider")
        if provider:
            os.environ["LLM_PROVIDER"] = str(provider)

        mapping = {
            "routerai_api_key": "ROUTERAI_API_KEY",
            "routerai_base_url": "ROUTERAI_BASE_URL",
            "yandex_api_key": "YANDEX_API_KEY",
            "yandex_folder_id": "YANDEX_FOLDER_ID",
            "yandex_base_url": "YANDEX_BASE_URL",
            "openrouter_api_key": "OPENROUTER_API_KEY",
        }
        for src, dst in mapping.items():
            val = accelmat_llm.get(src)
            if val:
                os.environ[dst] = _decode_secret(val)

        models = accelmat_llm.get("models", {})
        if isinstance(models, dict):
            for role, model_id in models.items():
                os.environ[f"MODEL_{role}"] = str(model_id)
                provider_name = str(accelmat_llm.get("provider", "routerai"))
                if provider_name == "yandex":
                    os.environ[f"YANDEX_MODEL_{role}"] = str(model_id)
                else:
                    os.environ[f"ROUTERAI_MODEL_{role}"] = str(model_id)

    kg = config.get("kg", {})
    if isinstance(kg, dict):
        for section in ("itext2kg_concepts", "itext2kg_graph", "refiner"):
            sec = kg.get(section, {})
            if isinstance(sec, dict) and sec.get("api_key"):
                os.environ.setdefault("OPENROUTER_API_KEY", str(sec["api_key"]))
                os.environ.setdefault("OPENAI_API_KEY", str(sec["api_key"]))

    feynman_env = config.get("feynman", {}).get("env", {})
    if isinstance(feynman_env, dict):
        for key, value in feynman_env.items():
            if value is not None:
                os.environ.setdefault(str(key), _decode_secret(value))

    yandex_b64 = os.getenv("YANDEX_API_KEY_B64")
    if yandex_b64 and not os.getenv("YANDEX_API_KEY"):
        os.environ["YANDEX_API_KEY"] = base64.b64decode(yandex_b64, validate=False).decode("utf-8")


def save_project_config(updates: dict[str, Any]) -> None:
    """Merge updates into project.toml and reload cache."""
    global _cached_config, _cached_root
    if tomli_w is None:
        raise ProjectConfigError("tomli_w is required to save project.toml (pip install tomli-w)")

    root = find_workspace_root()
    path = root / PROJECT_FILENAME
    current = _parse_toml(path) if path.exists() else {}

    def deep_merge(base: dict, patch: dict) -> dict:
        for key, value in patch.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                base[key] = deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    merged = deep_merge(current, updates)
    with path.open("wb") as handle:
        tomli_w.dump(merged, handle)
    _cached_config = None
    _cached_root = None
    load_project_config(force_reload=True)


def get_provider_for_mode(mode: str | None = None) -> str:
    config = load_project_config()
    web = config.get("web", {})
    providers = web.get("providers", {})
    active_mode = mode or web.get("mode", "online")
    if active_mode == "offline":
        return providers.get("offline", "local_transformers")
    return providers.get("online", "openrouter")


def patch_kg_provider(provider: str) -> dict[str, Any]:
    return get_kg_config(provider_override=provider)
