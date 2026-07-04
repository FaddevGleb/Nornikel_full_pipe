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

logger = get_logger("kg_context")

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


def extract_applications_from_goal(
    goal: str,
    known_applications: list[str] | None = None,
) -> list[str]:
    known_hint = ""
    if known_applications:
        known_hint = (
            "\nKnown applications in the knowledge graph (prefer exact names from this list):\n"
            + ", ".join(known_applications)
        )

    prompt = f"""You are an expert Material Scientist. Your task is to extract the 'applications' embedded in the goal statement provided to you. Extract the applications and print them separated by commas. The initial letter of every word in the applications list should be a capital letter.
The extracted applications should be within two or three words.
{known_hint}
Provided Goal Statement:
{goal}
"""
    logger.info("[KG] Extracting applications from goal via %s (%d known applications)", MODEL_KG, len(known_applications or []))
    extracted = llm_completion(prompt, model=MODEL_KG)
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
            f"\nTo satisfy the application of {apl}, the potential materials which can be explored are: {data['materials']} "
            f"\nTo satisfy the application of {apl}, The properties which can be explored are: {data['properties']} "
        )
    return "".join(parts)


def summarize_kg_context(goal: str, query_results: dict[str, dict[str, list[str]]]) -> dict[str, Any]:
    extracted_list = _format_query_results(query_results)
    if not extracted_list.strip():
        logger.info("[KG] No application-based query results to summarize")
        return {}

    prompt = f"""You are an expert Material Scientist.
Your task is to go through a list of materials and properties extracted based on a particular application from a Knowledge Graph and then add explanations of reasoning behind these extracted materials and properties.
You have been provided with a goal statement from which appropriate target applications, which are to be explored, have been already extracted.

You must follow the instructions below:
### Instructions:
1. Extract only the top twenty materials and properties if there are more than twenty of them.
2. If there is no data extracted from the Knowledge Graph for an extracted application, then return an empty json dictionary. DO NOT ADD any materials or properties from your parametric knowledge.
3. DO NOT create any 'application' terms from your own parametric knowledge.

### Provided Goal Statement:
{goal}

### Extracted Applications from Knowledge Graph corresponding materials and properties:
{extracted_list}

Provide your response in a strict json format with the following format:
{{
"<Name of the extracted application>":
    {{
        "KG Suggested Materials": {{"material_name": "reasoning"}},
        "KG Suggested Properties": {{"property_name": "reasoning"}}
    }}
}}
"""
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
) -> list[str]:
    known_hint = ""
    if known_materials:
        known_hint = (
            "\nKnown materials in the knowledge graph (prefer exact names from this list):\n"
            + ", ".join(known_materials)
        )

    prompt = f"""You are an expert Material Scientist. Your task is to extract the 'materials' (chemical compounds, alloys, etc.) referenced or implied in the goal statement provided to you. Extract the materials and print them separated by commas.
{known_hint}
Provided Goal Statement:
{goal}
"""
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
) -> dict[str, Any]:
    if not material_relations:
        logger.info("[KG] No material-based relations to summarize")
        return {}

    prompt = f"""You are an expert Material Scientist working with an industrial knowledge graph
that captures not only material properties but also process, equipment, cost, and regulatory
relations extracted from internal reports and literature.

You have been provided with a goal statement and, for each material relevant to it, the raw
relations extracted from the knowledge graph.

You must follow the instructions below:
### Instructions:
1. Group the relations into: properties/effects (IMPROVES, DEGRADES, CAUSES, MITIGATES),
   process considerations (SYNTHESIZED_BY, CHARACTERIZED_BY, REQUIRES_EQUIPMENT, REQUIRES_CONDITION,
   USES_FEEDSTOCK), and economic/regulatory constraints (IMPACTS_COST, HAS_REGULATION, HAS_FAILURE_MODE).
2. For each item, add a short reasoning based ONLY on the provided evidence/magnitude/direction. DO NOT
   invent facts that are not present in the provided relations.
3. If a material has no relations in a category, omit that category.
4. DO NOT create any material names from your own parametric knowledge; only use the materials provided.

### Provided Goal Statement:
{goal}

### Extracted relations per material from the Knowledge Graph:
{json.dumps(material_relations, ensure_ascii=False, indent=2)}

Provide your response in a strict json format with the following format:
{{
"<Name of the material>":
    {{
        "KG Suggested Properties": {{"property_or_effect_name": "reasoning"}},
        "KG Process Considerations": {{"consideration_name": "reasoning"}},
        "KG Economic and Regulatory Constraints": {{"constraint_name": "reasoning"}}
    }}
}}
"""
    logger.info("[KG] Summarizing material-based KG context via %s", MODEL_KG)
    raw = llm_completion(prompt, model=MODEL_KG, json_format=True)
    log_block(logger, "[KG] Summarize material context raw response", raw)
    parsed = json.loads(raw)
    return parsed if isinstance(parsed, dict) else {}


def build_kg_context(
    goal: str,
    subrelobj: pd.DataFrame,
    graph: dict[str, Any],
) -> dict[str, Any]:
    known_applications = get_known_applications(graph)
    logger.info("[KG] Graph has %d known Application nodes", len(known_applications))
    if known_applications:
        apl_list = extract_applications_from_goal(goal, known_applications)
        query_results = query_materials_properties(subrelobj, apl_list)
        if query_results:
            return summarize_kg_context(goal, query_results)
        logger.info("[KG] No application-based matches found; falling back to material-centric context")

    # Fallback for graphs without Application nodes (e.g. the extended Nornikel ontology,
    # which centers on Material -> Property/Equipment/BusinessMetric/Constraint relations).
    known_materials = get_known_materials(graph)
    logger.info("[KG] Graph has %d known Material nodes", len(known_materials))
    if not known_materials:
        logger.info("[KG] No Application or Material nodes found; returning empty KG context")
        return {}
    material_list = extract_materials_from_goal(goal, known_materials)
    material_relations = query_material_relations(graph, material_list)
    return summarize_material_context(goal, material_relations)


def build_kg_context_from_graph_path(goal: str, graph_path: str | Path) -> tuple[dict[str, Any], pd.DataFrame]:
    graph_path = Path(graph_path)
    with graph_path.open(encoding="utf-8") as f:
        graph = json.load(f)
    subrelobj = learning_chunk_graph_to_subrelobj(graph)
    kg_context = build_kg_context(goal, subrelobj, graph)
    return kg_context, subrelobj
