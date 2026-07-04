# K2-18 Web Dashboard

Interactive Node.js + React frontend for the K2-18 materials science knowledge graph pipeline.

## Quick Start

```powershell
cd web
npm install
npm run build
npm start
```

Open **http://localhost:3847**

Development (hot reload frontend + API):

```powershell
npm run dev
```

Frontend dev server: http://localhost:5173 (proxies API to :3847)

## Architecture

- **Backend**: Express (`server/`) — pipeline orchestration, diagnostics, audit, hypotheses
- **Frontend**: React 18 + Vite + react-i18next (`frontend/`) — Russian UI
- **Python**: invoked via `run_with_config.py` — no changes to `src/` or `viz/`

## API Highlights

| Endpoint | Description |
|----------|-------------|
| `GET /api/graph` | Graph + concepts + `loadStatus` (auto-sync from `data/out` when newer) |
| `POST /api/graph/sync` | Force sync `data/out` → `viz/data/in`; optional `runMetrics` |
| `GET /api/graph/stream` | SSE: `graph_updated` when graph files change (CLI or pipeline) |
| `POST /api/diagnostics/offline` | 8-step offline graph diagnostics |
| `POST /api/audit/full` | Full system audit |
| `GET /api/viz-config` | Node shapes/colors from `project.toml` `[viz]` |
| `GET /generated/viewer/...` | Served `knowledge_graph_viewer.html` |

## Configuration

All settings live in **`project.toml`** at the workspace root (`c:\Хакатоны\Nornikel\`).

1. Copy `project.example.toml` → `project.toml` (gitignored; contains API keys).
2. Run `python scripts/consolidate_config.py` to migrate legacy `.env`, `src/config.toml`, `viz/config.toml`, and `web/settings.json`.
3. Loaders: `config/loader.py` (Python), `config/loader.mjs` (Node web server).

Deprecated stubs (do not edit): `web/settings.json`, `web/config.default.json`, `src/config.toml`, `viz/config.toml`.

Web reads `[web]` — port, mode, pipeline, feynman, hypothesis. Python pipeline reads `[kg.*]`; viz reads `[viz.*]`.

### Автоподхват графов (web ↔ data/out)

```
data/out/LearningChunkGraph_*.json
        ↓ graphSyncService (on request / watcher / after pipeline stage)
viz/data/in/LearningChunkGraph.json
        ↓ metrics stage (auto-queued when graph changes)
viz/data/out/LearningChunkGraph_wow.json  →  GET /api/graph
```

- **`graphSyncService.js`** — выбор артефакта (`longrange` > `dedup` > `raw`), merge в `viz/data/in/`, инвалидация устаревших `_wow.json`.
- **`graphWatcher.js`** — следит за `data/out/` при CLI-прогонах (`watchDataOut` в `project.toml` → `[web.pipeline]`).
- После этапов `graph`, `dedup`, `refiner` web автоматически синхронизирует файлы и ставит job **metrics-only**, если метрики ещё не в текущем pipeline.
- UI подписан на `/api/graph/stream` и обновляет Dashboard / GraphView без перезагрузки страницы.

---

## Диагностика проблем с оффлайн-графом

Если **Обозреватель графа** пуст после оффлайн-построения, выполните диагностику в приложении:

### Шаг 1. Откройте вкладку «Диагностика»

Нажмите **«Запустить диагностику»**. Система последовательно проверит:

1. **Наличие файлов** — `viz/data/out/LearningChunkGraph_wow.json` и `ConceptDictionary_wow.json`
2. **Схему JSON** — обязательные поля узлов/рёбер и метрики (`pagerank`, `cluster_id`, …)
3. **Состав типов узлов** — распределение Material, Property, SynthesisMethod, …
4. **Целостность рёбер** — все `source`/`target` ссылаются на существующие узлы
5. **Индекс упоминаний** — для онтологии NORNIKEL ожидается предупреждение (Python индексирует только `type=Concept`)
6. **Статические ресурсы** — файлы просмотрщика в `viz/static/viewer/`
7. **Модель эмбеддингов** — локальный путь из `[dedup].embedding_model`
8. **Тест отрисовки** — проверка пригодности данных для Cytoscape.js

Отчёты сохраняются в `viz/logs/offline_diagnostics_<timestamp>.json`.

### Шаг 2. Типичные причины пустого графа

| Симптом | Решение |
|---------|---------|
| Файлы `_wow.json` отсутствуют | Запустите этап **«Расчёт метрик»** (или кнопку в баннере обозревателя) |
| Баннер «тестовые данные» | Положите `_wow.json` в `viz/data/out/` и перезагрузите |
| API возвращает узлы, canvas пуст | Переключитесь на вкладку «Обозреватель графа» — Cytoscape инициализируется только при активной вкладке |
| 0 узлов в `_wow.json` | Проверьте логи конвейера на этапах concepts/graph |

### Шаг 3. Полная проверка системы

В **Настройки → Полная проверка системы** проверяются Python-окружение, конфигурация, каталоги, входные данные, статические ресурсы и локальные модели.

### Шаг 4. Режим работы

Переключатель **Онлайн / Оффлайн** в шапке меняет `provider` в runtime-конфиге. При смене режима после построения графа приложение предупредит о необходимости перестроения.

---

## License

MIT (same as parent K2-18 project)
