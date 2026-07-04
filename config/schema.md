# Unified configuration schema

Workspace root: `project.toml` (gitignored, copy from `project.example.toml`).

| Section | Source (legacy) | Consumers |
|---------|-----------------|-----------|
| `[paths]` | manual | all services — relative paths from workspace root |
| `[kg.*]` | `nornikel_KG/src/config.toml` | Python pipeline (`load_config`) |
| `[viz.*]` | `nornikel_KG/viz/config.toml` | graph2metrics, graph2html, web viz API |
| `[web]` | `web/settings.json` | Node dashboard |
| `[accelmat.llm]` | `.env` | `llm_client.py`, `run_pipeline.py` |
| `[feynman]` | settings + env | Feynman bridge |
| `[doc_converter]` | doc_converter `.env` | doc_converter CLI |

Loader: `config/loader.py` (Python), `config/loader.mjs` (Node).

Migration: `python scripts/consolidate_config.py`
