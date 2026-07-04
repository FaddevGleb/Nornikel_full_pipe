# Nornikel Full Pipeline

Полный пайплайн: генерация графа знаний → генерация и оценка гипотез (ACCELMAT) → веб-интерфейс с чат-агентом Feynman для их обсуждения.

## Структура репозитория

| Папка | Что это | Стек |
|---|---|---|
| [`nornikel_KG/`](nornikel_KG) | Построение графа знаний по материаловедению (K2-18) и веб-дашборд (`nornikel_KG/web`), объединяющий конвейер построения графа, запуск ACCELMAT и чат с Feynman | Python (граф) + Node.js/Express/React (веб) |
| [`Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/`](Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM) | ACCELMAT — итеративный пайплайн генерации и оценки гипотез по цели/ограничениям на основе графа знаний | Python |
| [`feynman/`](feynman) | Feynman — CLI/чат-агент-исследователь на базе Pi, встроенный в веб-дашборд для обсуждения гипотез ACCELMAT | Node.js/TypeScript |

## Как всё связано

1. **nornikel_KG** строит граф знаний из корпуса документов (`slicer → concepts → graph → dedup → refiner → metrics`).
2. **ACCELMAT** (`Hypothesis-Generation-.../run_pipeline.py`) принимает граф + цель + ограничения и генерирует ранжированные гипотезы через LLM (Yandex AI Studio).
3. **Веб-дашборд** (`nornikel_KG/web`) — единая точка входа: визуализация графа, запуск ACCELMAT и вкладка чата с **Feynman**, который может прочитать результат ACCELMAT и обсудить любую гипотезу, используя собственные инструменты (bash/read/write) и project-local skill `materials-hypotheses` (описано в `.feynman/skills/` в корне рабочего пространства, где эти три папки лежат рядом).

## Быстрый запуск

```powershell
cd nornikel_KG/web
npm install
npm run build
npm start
```

Открыть **http://localhost:3847**. Подробности по настройке моделей (Yandex AI Studio), переменным окружения и структуре API — в `README.md` каждой из трёх папок.

> Каждая папка — самостоятельный проект (объединён из отдельного репозитория через `git subtree`, история коммитов сохранена). Секреты (API-ключи) не входят в этот репозиторий — они настраиваются локально через `.env` / `~/.feynman/agent/models.json`.
