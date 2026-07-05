"""
Pipeline launcher for the K2-18 web application.

Runs pipeline stages using workspace project.toml configuration.
"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent
NKG_ROOT = WEB_DIR.parent
WORKSPACE_ROOT = NKG_ROOT.parent

STAGE_MODULES = {
    "slicer": "src.slicer",
    "concepts": "src.itext2kg_concepts",
    "graph": "src.itext2kg_graph",
    "dedup": "src.dedup",
    "refiner": "src.refiner_longrange",
    "metrics": "viz.graph2metrics",
    "fix": "viz.graph_fix",
    "split": "viz.graph_split",
    "graph2html": "viz.graph2html",
    "graph2viewer": "viz.graph2viewer",
}


def _bootstrap_paths() -> None:
    if str(WORKSPACE_ROOT) not in sys.path:
        sys.path.insert(0, str(WORKSPACE_ROOT))
    if str(NKG_ROOT) not in sys.path:
        sys.path.insert(0, str(NKG_ROOT))


def _patch_config_loader() -> str:
    _bootstrap_paths()
    from config.loader import apply_env_from_config, get_provider_for_mode, get_web_config

    apply_env_from_config()
    web = get_web_config()
    mode = web.get("mode", "online")
    provider = get_provider_for_mode(mode)

    import src.utils.config as config_module

    original_load = config_module.load_config

    def patched_load(config_path=None, provider_override=None):
        if config_path is not None:
            return original_load(config_path=config_path)
        return original_load(provider_override=provider_override or provider)

    config_module.load_config = patched_load
    return provider


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python web/run_with_config.py <stage>", file=sys.stderr)
        print(f"Stages: {', '.join(STAGE_MODULES)}", file=sys.stderr)
        return 1

    stage = sys.argv[1].lower()
    module_name = STAGE_MODULES.get(stage)
    if module_name is None:
        print(f"Unknown stage: {stage}", file=sys.stderr)
        return 1

    provider = _patch_config_loader()
    print(f"[run_with_config] mode provider={provider}")

    saved_argv = sys.argv[:]
    sys.argv = [saved_argv[0]]

    try:
        runpy.run_module(module_name, run_name="__main__", alter_sys=True)
    except SystemExit as exc:
        code = exc.code
        if code is None:
            return 0
        if isinstance(code, int):
            return code
        return 1
    finally:
        sys.argv = saved_argv
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
