"""Build KG-augmented context from a LearningChunkGraph and goal statement."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

from graph_to_subrelobj import learning_chunk_graph_to_subrelobj
from llm_client import MODEL_KG, llm_completion
from logging_utils import get_logger, log_block
from supplementary_context import append_supplementary_to_prompt

logger = get_logger("kg_context")

RUSSIAN_OUTPUT_RULE = (
    "Все пояснения и текстовые значения в ответе пиши на русском языке. "
    "Ключи JSON оставляй на английском, как указано в схеме."
)

APL_REL_TYPES = frozenset({"APL-CHM", "CHM-APL", "APL-PRO", "PRO-APL"})


def build_subrelobj_from_graph(graph_path: str | Path) -> pd.DataFrame:
    graph_path = Path(graph_path)
    with graph_path.open(encoding="utf-8") as f:
        graph = json.load(f)
    return learning_chunk_graph_to_subrelobj(graph)


def get_known_applications(graph: dict[str, Any]) -> list[str]:
    applications: list[str] = []
    for node in graph.get("nodes", []):
        if node.get("type") != "Application":
            continue
        label = node.get("name") or node.get("text")
        if label:
            applications.append(str(label))
    return applications


def _match_known_in_goal(goal: str, known: list[str]) -> list[str]:
    """Heuristic fallback: pick known graph entities mentioned in the goal text."""
    goal_lower = goal.lower()
    matched: list[str] = []
    for name in known:
        if name.lower() in goal_lower:
            matched.append(name)
    return matched


def extract_applications_from_goal(
    goal: str,
    known_applications: list[str] | None = None,
    supplementary_context: str | None = None,
) -> list[str]:
    if known_applications:
        heuristic = _match_known_in_goal(goal, known_applications)
        if heuristic:
            logger.info("[KG] Matched applications from goal without LLM: %s", heuristic)
            return heuristic

    known_hint = ""
    if known_applications:
        known_hint = (
            "\nИзвестные приложения в графе знаний (предпочитай точные названия из этого списка):\n"
            + ", ".join(known_applications)
        )

    prompt = f"""Ты — эксперт в горном деле и обогащении полезных ископаемых. Твоя задача — извлечь из формулировки цели технологические цели или приложения месторождения. Выведи их через запятую. Каждое слово с заглавной буквы.
Каждый пункт — не более двух–трёх слов (например, «Флотация никеля», «Кучное выщелачивание», «Сульфидный концентрат»).
{known_hint}
Формулировка цели:
{goal}
"""
    prompt = append_supplementary_to_prompt(prompt, supplementary_context)
    logger.info("[KG] Extracting applications from goal via %s (%d known applications)", MODEL_KG, len(known_applications or []))
    try:
        extracted = llm_completion(prompt, model=MODEL_KG)
    except Exception as exc:
        if known_applications:
            fallback = _match_known_in_goal(goal, known_applications) or list(known_applications)
            logger.warning("[KG] LLM application extraction failed (%s); using fallback: %s", exc, fallback)
            return fallback
        raise
    apl_list = [item.strip() for item in extracted.split(",") if item.strip()]
    logger.info("[KG] Extracted applications: %s", apl_list)
    return apl_list


def _unique_entities(subrelobj: pd.DataFrame) -> set[str]:
    return set(subrelobj["Subject"].tolist() + subrelobj["Object"].tolist())


def _apl_subrelobj(subrelobj: pd.DataFrame) -> pd.DataFrame:
    return subrelobj[subrelobj["Rel"].isin(APL_REL_TYPES)]


def _is_apl_entity(apl: str, apl_df: pd.DataFrame) -> bool:
    for _, row in apl_df.iterrows():
        rel = row["Rel"]
        if apl == row["Subject"] and str(rel).startswith("APL"):
            return True
        if apl == row["Object"] and str(rel).endswith("APL"):
            return True
    return False


def query_materials_properties(
    subrelobj: pd.DataFrame,
    apl_list: list[str],
) -> dict[str, dict[str, list[str]]]:
    unique_entities = _unique_entities(subrelobj)
    apl_df = _apl_subrelobj(subrelobj)
    result: dict[str, dict[str, list[str]]] = {}

    for apl in apl_list:
        pattern = r"^" + re.escape(apl) + r".*"
        matches = [ent for ent in unique_entities if re.match(pattern, ent)]
        if not matches:
            continue
        if not _is_apl_entity(apl, apl_df):
            continue

        matched_materials: list[str] = []
        matched_properties: list[str] = []

        for _, row in apl_df.iterrows():
            rel = row["Rel"]
            if rel == "APL-CHM" and row["Subject"] == apl:
                matched_materials.append(row["Object"])
            elif rel == "CHM-APL" and row["Object"] == apl:
                matched_materials.append(row["Subject"])
            elif rel == "APL-PRO" and row["Subject"] == apl:
                matched_properties.append(row["Object"])
            elif rel == "PRO-APL" and row["Object"] == apl:
                matched_properties.append(row["Subject"])

        result[apl] = {
            "materials": sorted(set(matched_materials)),
            "properties": sorted(set(matched_properties)),
        }

    logger.info(
        "[KG] Queried SUBRELOBJ for %d applications, matched %d: %s",
        len(apl_list),
        len(result),
        list(result.keys()),
    )
    return result


def _format_query_results(query_results: dict[str, dict[str, list[str]]]) -> str:
    parts: list[str] = []
    for apl, data in query_results.items():
        parts.append(
            f"\nДля достижения технологической цели «{apl}» потенциальные руды/минералы для рассмотрения: {data['materials']} "
            f"\nДля достижения технологической цели «{apl}» показатели процесса для рассмотрения: {data['properties']} "
        )
    return "".join(parts)


def summarize_kg_context(
    goal: str,
    query_results: dict[str, dict[str, list[str]]],
    supplementary_context: str | None = None,
) -> dict[str, Any]:
    extracted_list = _format_query_results(query_results)
    if not extracted_list.strip():
        logger.info("[KG] No application-based query results to summarize")
        return {}

    prompt = f"""Ты — эксперт в извлечении и обогащении полезных ископаемых.
Твоя задача — пройти по списку руд/минералов и показателей процесса, извлечённых для конкретной технологической цели из графа знаний, и добавить пояснения к выбору этих сущностей.
Тебе дана формулировка цели, из которой уже извлечены целевые задачи.

Следуй инструкциям ниже:
### Инструкции:
1. Если сущностей больше двадцати, оставь только двадцать наиболее релевантных руд/минералов и показателей процесса.
2. Если для извлечённой цели нет данных из графа знаний, верни пустой JSON-словарь {{}}. НЕ добавляй руды, минералы или свойства из своих знаний.
3. НЕ создавай названия целей из своих знаний.

### Формулировка цели:
{goal}

### Извлечённые цели из графа знаний с соответствующими рудами/минералами и показателями процесса:
{extracted_list}

{RUSSIAN_OUTPUT_RULE}

Ответ — строго в формате JSON:
{{
"<Название извлечённой цели>":
    {{
        "KG Suggested Materials": {{"ore_or_mineral_name": "обоснование на русском"}},
        "KG Suggested Properties": {{"process_indicator_name": "обоснование на русском"}}
    }}
}}
"""
    prompt = append_supplementary_to_prompt(prompt, supplementary_context)
    logger.info("[KG] Summarizing application-based KG context via %s", MODEL_KG)
    raw = llm_completion(prompt, model=MODEL_KG, json_format=True)
    log_block(logger, "[KG] Summarize context raw response", raw)
    parsed = json.loads(raw)
    return parsed if isinstance(parsed, dict) else {}


def get_known_materials(graph: dict[str, Any]) -> list[str]:
    """List Material node labels (used for the Nornikel-style graphs without Application nodes)."""
    materials: list[str] = []
    for node in graph.get("nodes", []):
        if node.get("type") != "Material":
            continue
        label = node.get("name") or node.get("text")
        if label:
            materials.append(str(label))
    return materials


def extract_materials_from_goal(
    goal: str,
    known_materials: list[str] | None = None,
    supplementary_context: str | None = None,
) -> list[str]:
    known_hint = ""
    if known_materials:
        known_hint = (
            "\nИзвестные материалы в графе знаний (предпочитай точные названия из этого списка):\n"
            + ", ".join(known_materials)
        )

    prompt = f"""Ты — эксперт в горном деле и обогащении полезных ископаемых. Твоя задача — извлечь из формулировки цели полезные минералы, типы руд или металлические продукты, явно указанные или подразумеваемые. Выведи их через запятую.
{known_hint}
Формулировка цели:
{goal}
"""
    prompt = append_supplementary_to_prompt(prompt, supplementary_context)
    logger.info("[KG] Extracting materials from goal via %s (%d known materials)", MODEL_KG, len(known_materials or []))
    extracted = llm_completion(prompt, model=MODEL_KG)
    material_list = [item.strip() for item in extracted.split(",") if item.strip()]
    logger.info("[KG] Extracted materials: %s", material_list)
    return material_list


def _entity_label(node: dict[str, Any]) -> str | None:
    label = node.get("name") or node.get("text")
    return str(label) if label else None


def query_material_relations(
    graph: dict[str, Any],
    material_list: list[str],
) -> dict[str, dict[str, list[dict[str, Any]]]]:
    """Gather all first-degree relations of the given materials directly from the graph.

    Unlike `query_materials_properties` (which relies on Application nodes and the
    SUBRELOBJ triplet format), this works with any node/edge types from the extended
    Nornikel ontology (Equipment, BusinessMetric, Constraint, Condition, Source, ...),
    preserving relation type, direction, magnitude and evidence for richer context.
    """
    nodes = {node["id"]: node for node in graph.get("nodes", []) if "id" in node}
    name_to_id: dict[str, str] = {}
    for node_id, node in nodes.items():
        label = _entity_label(node)
        if label and label not in name_to_id:
            name_to_id[label] = node_id

    result: dict[str, dict[str, list[dict[str, Any]]]] = {}
    for material in material_list:
        material_id = name_to_id.get(material)
        if material_id is None:
            continue

        relations: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for edge in graph.get("edges", []):
            if edge.get("source") == material_id:
                other = nodes.get(edge.get("target"))
            elif edge.get("target") == material_id:
                other = nodes.get(edge.get("source"))
            else:
                continue
            if other is None:
                continue

            other_label = _entity_label(other)
            if not other_label:
                continue

            attributes = edge.get("attributes") or {}
            relations[edge.get("type", "RELATED_TO")].append(
                {
                    "entity": other_label,
                    "entity_type": other.get("type"),
                    "effect_direction": attributes.get("direction"),
                    "magnitude": attributes.get("magnitude"),
                    "evidence": attributes.get("evidence_quote"),
                }
            )

        if relations:
            result[material] = dict(relations)

    logger.info(
        "[KG] Queried graph relations for %d materials, matched %d: %s",
        len(material_list),
        len(result),
        list(result.keys()),
    )
    return result


def summarize_material_context(
    goal: str,
    material_relations: dict[str, dict[str, list[dict[str, Any]]]],
    supplementary_context: str | None = None,
) -> dict[str, Any]:
    if not material_relations:
        logger.info("[KG] No material-based relations to summarize")
        return {}

    prompt = f"""Ты — эксперт в извлечении и обогащении полезных ископаемых, работающий с промышленным графом знаний,
который описывает не только свойства руд/минералов, но и связи процесса, оборудования, затрат и нормативных ограничений,
извлечённые из внутренних отчётов и литературы.

Тебе дана формулировка цели и для каждой релевантной руды/минерала — сырые связи из графа знаний.

Следуй инструкциям ниже:
### Инструкции:
1. Сгруппируй связи на: свойства и эффекты руды/процесса (IMPROVES, DEGRADES, CAUSES, MITIGATES),
   технологические аспекты (SYNTHESIZED_BY, CHARACTERIZED_BY, REQUIRES_EQUIPMENT, REQUIRES_CONDITION,
   USES_FEEDSTOCK) и экономические/нормативные ограничения (IMPACTS_COST, HAS_REGULATION, HAS_FAILURE_MODE).
2. Для каждого пункта добавь краткое обоснование ТОЛЬКО на основе предоставленных evidence/magnitude/direction. НЕ
   выдумывай факты, которых нет в переданных связях.
3. Если у руды/минерала нет связей в категории, пропусти эту категорию.
4. НЕ создавай названия руд или минералов из своих знаний; используй только переданные сущности.

### Формулировка цели:
{goal}

### Извлечённые связи по рудам/минералам из графа знаний:
{json.dumps(material_relations, ensure_ascii=False, indent=2)}

{RUSSIAN_OUTPUT_RULE}

Ответ — строго в формате JSON:
{{
"<Название руды или минерала>":
    {{
        "KG Suggested Properties": {{"property_or_effect_name": "обоснование на русском"}},
        "KG Process Considerations": {{"consideration_name": "обоснование на русском"}},
        "KG Economic and Regulatory Constraints": {{"constraint_name": "обоснование на русском"}}
    }}
}}
"""
    prompt = append_supplementary_to_prompt(prompt, supplementary_context)
    logger.info("[KG] Summarizing material-based KG context via %s", MODEL_KG)
    raw = llm_completion(prompt, model=MODEL_KG, json_format=True)
    log_block(logger, "[KG] Summarize material context raw response", raw)
    parsed = json.loads(raw)
    return parsed if isinstance(parsed, dict) else {}


def build_kg_context(
    goal: str,
    subrelobj: pd.DataFrame,
    graph: dict[str, Any],
    supplementary_context: str | None = None,
) -> dict[str, Any]:
    known_applications = get_known_applications(graph)
    logger.info("[KG] Graph has %d known Application nodes", len(known_applications))
    if known_applications:
        apl_list = extract_applications_from_goal(
            goal,
            known_applications,
            supplementary_context=supplementary_context,
        )
        query_results = query_materials_properties(subrelobj, apl_list)
        if query_results:
            return summarize_kg_context(
                goal,
                query_results,
                supplementary_context=supplementary_context,
            )
        logger.info("[KG] No application-based matches found; falling back to material-centric context")

    # Fallback for graphs without Application nodes (e.g. the extended Nornikel ontology,
    # which centers on Material -> Property/Equipment/BusinessMetric/Constraint relations).
    known_materials = get_known_materials(graph)
    logger.info("[KG] Graph has %d known Material nodes", len(known_materials))
    if not known_materials:
        logger.info("[KG] No Application or Material nodes found; returning empty KG context")
        return {}
    material_list = extract_materials_from_goal(
        goal,
        known_materials,
        supplementary_context=supplementary_context,
    )
    material_relations = query_material_relations(graph, material_list)
    return summarize_material_context(
        goal,
        material_relations,
        supplementary_context=supplementary_context,
    )


def build_kg_context_from_graph_path(goal: str, graph_path: str | Path) -> tuple[dict[str, Any], pd.DataFrame]:
    graph_path = Path(graph_path)
    with graph_path.open(encoding="utf-8") as f:
        graph = json.load(f)
    subrelobj = learning_chunk_graph_to_subrelobj(graph)
    kg_context = build_kg_context(goal, subrelobj, graph)
    return kg_context, subrelobj
