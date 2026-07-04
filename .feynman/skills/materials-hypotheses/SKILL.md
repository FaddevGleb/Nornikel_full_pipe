---
name: materials-hypotheses
description: Generate, rank, expand, and regenerate materials-discovery hypotheses using the local ACCELMAT pipeline (Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM). Use when the user asks to generate hypotheses, rank hypotheses, discuss/expand a specific hypothesis, or rerun hypothesis generation with a new goal, constraints, or knowledge graph.
---

# Materials Discovery Hypotheses (ACCELMAT)

Pipeline directory (sibling of this workspace root): `Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM/`.
Run all commands below with that directory as the working directory (`bash` tool, e.g. `cd "Hypothesis-Generation-for-Materials-Discovery-and-Design-Using-Goal-Driven-and-Constraint-Guided-LLM" && ...`).

## One-time setup (check before first run)
1. `pip install -r requirements.txt` (if not already installed).
2. Confirm `.env` exists there with `YANDEX_API_KEY` and `YANDEX_FOLDER_ID` set (see the pipeline's own `README.md`). It uses the same Yandex AI Studio account as Feynman — the same key/folder id can be reused.

## Deriving a slug
For every new goal, derive a short slug (lowercase, hyphens, ≤5 words), matching Feynman's own file-naming convention. Reuse it for the request/output file pair below so concurrent hypothesis sets never collide:
- Request: `inputs/pipeline_request_<slug>.json`
- Output: `output/hypotheses_<slug>.json`

## 1. Get hypotheses + constraints (generate new)
1. Write `inputs/pipeline_request_<slug>.json`:
   ```json
   {
     "graph_path": "Examples_prev_step/<graph>.json",
     "goal": "<goal statement from the user>",
     "constraints": ["<constraint 1>", "..."],
     "max_refinement_iterations": 1,
     "num_hypotheses": 5
   }
   ```
   Keep `max_refinement_iterations` and `num_hypotheses` small (1-2 / 5-8) for interactive/iterative sessions — each run is many LLM calls (KG extraction + HGA + 3 critics + summarizer per iteration + evaluation). Only raise them when the user explicitly wants a full/final run (defaults: 5 / 20).
   - If the user does not name a graph, list `Examples_prev_step/*.json` and ask, or reuse the same `graph_path` as the closest existing `inputs/pipeline_request*.json`.
   - If the user wants to use an already-generated set instead of a new run, skip straight to reading the matching `output/hypotheses_*.json` (e.g. `output/hypotheses_nornikel_niw.json`, `output/hypotheses_nornikel.json`).
2. Run: `python run_pipeline.py --request "inputs/pipeline_request_<slug>.json" --output "output/hypotheses_<slug>.json"`
3. Read `output/hypotheses_<slug>.json`.

## 2. Rank hypotheses
Read `evaluation.scores` (1-10 per `Suggestion_N`) and `evaluation.summary` from the output JSON. Present hypotheses sorted by score, descending, with the one-line `Materials` field and the score. Do not re-invent a ranking — the pipeline's Evaluation Agent already produced one.

## 3. Expand / discuss a hypothesis
When asked to expand/discuss `Suggestion_N`:
- Show its `Materials`, `Methods_to_develop_the_materials_suggested`, and `Reasoning` in full.
- Cross-reference `kg_context` entries for materials mentioned in that hypothesis.
- If the user wants external validation, use Feynman's own research tools (`alpha_search`, `web_search`) to check literature support for the proposed materials/methods — this is a value-add on top of the raw pipeline output, not part of ACCELMAT itself.

## 4. Rerun with new inputs
When the user supplies a new goal, constraints, or graph:
- Derive a new slug (do not overwrite an existing `inputs/pipeline_request_<slug>.json` / `output/hypotheses_<slug>.json` pair unless the user explicitly asks to redo the same run).
- Repeat step 1 with the updated fields (goal / constraints / graph_path / num_hypotheses can all change independently).
- When discussing results, compare the new ranked list against the previous run's `evaluation.summary` if the user asks how the new hypotheses differ.
