# Nornikel Full Pipeline

Полный пайплайн материаловедения: **граф знаний (K2-18)** → **метрики и визуализация** → **генерация и оценка гипотез (ACCELMAT)** → **веб-дашборд** с чат-агентом **Feynman**.

Репозиторий объединяет три самостоятельных проекта (через `git subtree`, история коммитов сохранена). Секреты (API-ключи) в git не входят — настраиваются локально через `.env` и `~/.feynman/agent/models.json`.

---

## Структура репозитория

```
Nornikel_full_pipe/
├── README.md                          ← этот файл
├── ConceptDictionary.json             ← пример словаря концептов (демо-данные)
├── LearningChunkGraph_longrange.json  ← пример графа после refiner (демо-данные)
│
├── .feynman/
│   └── skills/                        ← project-local skills для Feynman в дашборде
│       ├── materials-hypotheses/      ← обсуждение гипотез ACCELMAT
│       └── accelmat-web-critic/       ← опциональный web-критик через Feynman
│
├── nornikel_KG/                       ← построение графа знаний + веб-дашборд
│   ├── src/                           ← Python-пайплайн K2-18 (iText2KG)
│   │   ├── slicer.py                  ← нарезка текста на семантические чанки
│   │   ├── itext2kg_concepts.py       ← извлечение ConceptDictionary
│   │   ├── itext2kg_graph.py          ← построение LearningChunkGraph
│   │   ├── dedup.py                   ← семантическая дедупликация
│   │   ├── refiner_longrange.py       ← long-range связи
│   │   ├── main.py                    ← CLI-оркестратор стадий
│   │   ├── config.toml                ← локальные настройки KG (legacy)
│   │   ├── prompts/                   ← промпты для LLM-стадий
│   │   └── schemas/                   ← JSON-схемы графа
│   │
│   ├── viz/                           ← метрики графа и HTML-визуализация
│   │   ├── graph2metrics.py           ← 12 метрик + normalize_node_types()
│   │   ├── graph2html.py              ← интерактивный Cytoscape-граф
│   │   ├── graph2viewer.py            ← трёхколоночный viewer
│   │   ├── graph_fix.py / graph_split.py / anomaly_detector.py
│   │   ├── static/                    ← graph_core.js (layout без «прыжков»)
│   │   ├── templates/                 ← HTML-шаблоны
│   │   ├── data/in/                   ← входные JSON для viz
│   │   └── config.toml                ← настройки viz (physics_enabled=false)
│   │
│   ├── web/                           ← единая точка входа (Express + React)
│   │   ├── server/                    ← API: pipeline, graph, ACCELMAT, Feynman
│   │   ├── frontend/                  ← React 18 + Vite, UI на русском
│   │   ├── run_with_config.py         ← запуск Python-стадий из Node
│   │   ├── settings.json              ← порт, пути, pipeline stages
│   │   └── README.md                  ← подробности по API и конфигу
│   │
│   ├── doc_converter/                 ← PDF/DOCX → markdown для slicer
│   ├── data/                          ← входные документы и data/out/ (графы)
│   ├── docs/                          ← документация K2-18
│   ├── tests/                         ← unit-тесты (src, viz)
│   └── README.md                      ← полное описание K2-18
│
├── Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/
│   ├── run_pipeline.py                ← CLI ACCELMAT (цель + ограничения + граф)
│   ├── pipeline.py                    ← оркестрация стадий
│   ├── agent_framework_materials_discovery.py  ← HGA, 4 критика, Summarizer, EA
│   ├── llm_client.py                  ← RouterAI / Yandex AI Studio
│   ├── kg_context.py                  ← контекст из LearningChunkGraph (Nornikel ontology)
│   ├── supplementary_context.py       ← доп. контекст из Excel (.xlsx)
│   ├── graph_to_subrelobj.py          ← граф → MatKG triplets (SUBRELOBJ.csv)
│   ├── inputs/                        ← примеры целей и ограничений
│   ├── Examples_prev_step/            ← примеры графов и схем
│   ├── tests/                         ← test_accelmat_prompts.py и др.
│   ├── .env.example                   ← шаблон LLM-конфига (скопировать в .env)
│   └── README.md                      ← ACCELMAT: модели, MatKG, Nornikel ontology
│
└── feynman/                           ← CLI/чат-агент-исследователь (Pi-based)
    ├── src/                           ← TypeScript-ядро агента
    ├── skills/                        ← встроенные skills Feynman
    ├── scripts/                       ← сборка и утилиты
    ├── website/                       ← Astro-сайт проекта
    └── tests/
```

### Кратко по компонентам

| Папка | Назначение | Стек |
|-------|------------|------|
| [`nornikel_KG/`](nornikel_KG) | Построение графа знаний (K2-18), метрики, веб-дашборд | Python + Node.js/Express/React |
| [`Hypothesis-Generation-.../`](Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM) | ACCELMAT — итеративная генерация и оценка гипотез | Python |
| [`feynman/`](feynman) | Чат-агент для обсуждения гипотез в дашборде | Node.js/TypeScript |
| [`.feynman/skills/`](.feynman/skills) | Project-local skills (materials-hypotheses, accelmat-web-critic) | Markdown |

---

## Как всё связано

```mermaid
flowchart LR
    docs[Документы PDF/DOCX/MD] --> slicer[Slicer]
    slicer --> concepts[Concepts]
    concepts --> graph[Graph]
    graph --> dedup[Dedup]
    dedup --> refiner[Refiner]
    refiner --> metrics[graph2metrics]
    metrics --> web[Web Dashboard]
    web --> accelmat[ACCELMAT run_pipeline]
    accelmat --> feynman[Feynman Chat]
```

1. **nornikel_KG** строит граф из корпуса: `slicer → concepts → graph → dedup → refiner → metrics`.
2. **graph2metrics** вычисляет метрики; если у узла пустой `type`, подставляется `ontology_class`.
3. **Веб-дашборд** (`nornikel_KG/web`, :3847) — визуализация графа (стабильный layout без анимации), запуск стадий KG, ACCELMAT и чат Feynman.
4. **ACCELMAT** принимает граф + цель + ограничения (+ опционально Excel-документы) и выдаёт ранжированные гипотезы.
5. **Feynman** читает результат ACCELMAT и обсуждает гипотезы, используя project-local skill `materials-hypotheses`.

---

## ACCELMAT: 4 критика + Summarizer + Evaluation Agent

| Агент | Роль | Env (RouterAI) |
|-------|------|----------------|
| **HGA** | Генерация 20 гипотез | `ROUTERAI_MODEL_HGA` |
| **Critic 1–3** | Общая оценка по цели и ограничениям | `ROUTERAI_MODEL_CRITIC`, `_2`, `_3` |
| **Critic 4 (feasibility)** | Промышленная реализуемость, масштаб, риски внедрения | `ROUTERAI_MODEL_CRITIC_4` |
| **Summarizer** | Сводка feedback; все 4 критика должны согласиться (YES) | `ROUTERAI_MODEL_SUMMARIZER` |
| **Evaluation Agent** | Финальный скоринг гипотез | `ROUTERAI_MODEL_EVALUATION` |

Цикл: HGA → 4 критика → Summarizer → при несогласии refinement → повтор. Подробности и модели Yandex — в [`Hypothesis-Generation-.../README.md`](Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/README.md).

**Дополнительный контекст:** в UI дашборда можно загрузить Excel (.xlsx); текст попадает во все LLM-стадии ACCELMAT и в Feynman enrichment (`supplementary_context.py`).

---

## Быстрый запуск

### 1. Веб-дашборд (рекомендуется)

```powershell
cd nornikel_KG/web
npm install
npm run build
npm start
```

Открыть **http://localhost:3847**

Dev-режим (Vite :5173 + API :3847):

```powershell
npm run dev
```

### 2. ACCELMAT из CLI

```powershell
cd Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM
copy .env.example .env
# заполнить ROUTERAI_API_KEY или YANDEX_API_KEY
pip install -r requirements.txt
python scripts/verify_llm.py
python run_pipeline.py --help
```

### 3. KG-пайплайн из CLI

```powershell
cd nornikel_KG
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src/main.py --help
```

---

## Конфигурация

| Компонент | Где настраивать |
|-----------|-----------------|
| ACCELMAT LLM | `Hypothesis-Generation-.../.env` (из `.env.example`) |
| Веб-дашборд | `nornikel_KG/web/settings.json` — порт, пути к Python, стадии pipeline |
| KG / viz (legacy) | `nornikel_KG/src/config.toml`, `nornikel_KG/viz/config.toml` |
| Feynman модели | `~/.feynman/agent/models.json` |
| Feynman skills | `.feynman/skills/` в корне репозитория |

**Требования:** Node.js ≥ 22, Python ≥ 3.11, опционально Pandoc для `doc_converter`.

---

## Демо-данные в корне

| Файл | Описание |
|------|----------|
| `ConceptDictionary.json` | Словарь концептов для примера |
| `LearningChunkGraph_longrange.json` | Граф после refiner (long-range связи) |

Их можно загрузить в viz/web или использовать как вход для ACCELMAT (`kg_context.py` поддерживает расширенную Nornikel-онтологию: `SRC`, `EQP`, `BIZ`, `EXP`, `CST`, `HYP` и др.).

---

## Документация по подпроектам

- [`nornikel_KG/README.md`](nornikel_KG/README.md) — K2-18 pipeline, use cases
- [`nornikel_KG/viz/README.md`](nornikel_KG/viz/README.md) — метрики и HTML-инструменты
- [`nornikel_KG/web/README.md`](nornikel_KG/web/README.md) — API, graph sync, ACCELMAT bridge
- [`Hypothesis-Generation-.../README.md`](Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/README.md) — ACCELMAT, MatKG, Nornikel ontology

---

## Недавние изменения

- **CRITIC_4 (feasibility)** — четвёртый обязательный критик промышленной реализуемости; Summarizer требует единогласия всех четырёх.
- **graph2metrics** — `normalize_node_types()`: пустой `type` → `ontology_class`.
- **Стабильный layout графа** — отключена физика/анимация Cytoscape, узлы блокируются после layout (web + viz HTML).
