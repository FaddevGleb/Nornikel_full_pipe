"""Convert LearningChunkGraph JSON to MatKG SUBRELOBJ triplets."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

NODE_TYPE_TO_MATKG: dict[str, str] = {
    "Material": "CHM",
    "Property": "PRO",
    "Application": "APL",
    "SynthesisMethod": "SYN",
    "CharacterizationMethod": "CMT",
    # Extended Nornikel ontology (LearningChunkGraphNORNIKEL.schema): entities beyond the
    # original MatKG 5-type universe, needed to represent economic/resource constraints.
    "FailureMode": "FLR",
    "Mechanism": "MEC",
    "Condition": "CND",
    "Source": "SRC",
    "Equipment": "EQP",
    "BusinessMetric": "BIZ",
    "InternalExperiment": "EXP",
    "Constraint": "CST",
    "HypothesisRecord": "HYP",
}

SUBRELOBJ_COLUMNS = ["Subject", "Rel", "Object", "Count"]

PROPERTY_EDGE_TYPES = frozenset({"IMPROVES", "DEGRADES"})


def _node_label(node: dict[str, Any]) -> str:
    name = node.get("name")
    if name:
        return str(name)
    text = node.get("text")
    if text:
        return str(text)
    return str(node.get("id", ""))


def _edge_count(edge: dict[str, Any]) -> int:
    attributes = edge.get("attributes") or {}
    count = attributes.get("co_occurrence_count", 1)
    try:
        return max(int(count), 1)
    except (TypeError, ValueError):
        return 1


def _matkg_code(node: dict[str, Any]) -> str | None:
    return NODE_TYPE_TO_MATKG.get(node.get("type", ""))


def _triplet(
    subject: str,
    rel: str,
    obj: str,
    count: int,
) -> tuple[str, str, str, int]:
    return subject, rel, obj, max(int(count), 1)


def _direct_triplets(
    nodes: dict[str, dict[str, Any]],
    edges: list[dict[str, Any]],
) -> list[tuple[str, str, str, int]]:
    triplets: list[tuple[str, str, str, int]] = []

    for edge in edges:
        source = nodes.get(edge.get("source", ""))
        target = nodes.get(edge.get("target", ""))
        if source is None or target is None:
            continue

        src_code = _matkg_code(source)
        tgt_code = _matkg_code(target)
        if src_code is None or tgt_code is None:
            continue

        triplets.append(
            _triplet(
                _node_label(source),
                f"{src_code}-{tgt_code}",
                _node_label(target),
                _edge_count(edge),
            )
        )

    return triplets


def _derive_apl_pro_triplets(
    nodes: dict[str, dict[str, Any]],
    edges: list[dict[str, Any]],
) -> list[tuple[str, str, str, int]]:
    material_apps: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    material_props: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for edge in edges:
        edge_type = edge.get("type", "")
        source_id = edge.get("source", "")
        target_id = edge.get("target", "")
        source = nodes.get(source_id)
        target = nodes.get(target_id)
        if source is None or target is None:
            continue
        if _matkg_code(source) != "CHM":
            continue

        count = _edge_count(edge)
        if edge_type == "APPLIED_IN" and _matkg_code(target) == "APL":
            material_apps[source_id][target_id] += count
        elif edge_type in PROPERTY_EDGE_TYPES and _matkg_code(target) == "PRO":
            material_props[source_id][target_id] += count

    triplets: list[tuple[str, str, str, int]] = []
    for material_id, apps in material_apps.items():
        props = material_props.get(material_id)
        if not props:
            continue
        for app_id, app_count in apps.items():
            app_node = nodes[app_id]
            for prop_id, prop_count in props.items():
                prop_node = nodes[prop_id]
                triplets.append(
                    _triplet(
                        _node_label(app_node),
                        "APL-PRO",
                        _node_label(prop_node),
                        min(app_count, prop_count),
                    )
                )

    return triplets


def _aggregate_triplets(
    triplets: list[tuple[str, str, str, int]],
) -> pd.DataFrame:
    counts: dict[tuple[str, str, str], int] = defaultdict(int)
    for subject, rel, obj, count in triplets:
        counts[(subject, rel, obj)] += count

    rows = [
        {"Subject": subject, "Rel": rel, "Object": obj, "Count": count}
        for (subject, rel, obj), count in counts.items()
    ]
    if not rows:
        return pd.DataFrame(columns=SUBRELOBJ_COLUMNS)

    return pd.DataFrame(rows, columns=SUBRELOBJ_COLUMNS)


def learning_chunk_graph_to_subrelobj(
    graph: dict[str, Any],
    *,
    derive_apl_pro: bool = True,
) -> pd.DataFrame:
    """Convert a LearningChunkGraph dict to a SUBRELOBJ DataFrame."""
    nodes_list = graph.get("nodes") or []
    edges = graph.get("edges") or []
    nodes = {node["id"]: node for node in nodes_list if "id" in node}

    triplets = _direct_triplets(nodes, edges)
    if derive_apl_pro:
        triplets.extend(_derive_apl_pro_triplets(nodes, edges))

    return _aggregate_triplets(triplets)


def graph_json_to_subrelobj_csv(
    input_path: str | Path,
    output_path: str | Path,
    *,
    derive_apl_pro: bool = True,
) -> pd.DataFrame:
    """Load JSON graph, convert to SUBRELOBJ, and write CSV."""
    input_path = Path(input_path)
    output_path = Path(output_path)

    with input_path.open(encoding="utf-8") as f:
        graph = json.load(f)

    df = learning_chunk_graph_to_subrelobj(graph, derive_apl_pro=derive_apl_pro)
    df.to_csv(output_path, index=False)
    return df


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Convert LearningChunkGraph JSON to MatKG SUBRELOBJ CSV.",
    )
    parser.add_argument("input", type=Path, help="Path to LearningChunkGraph JSON")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("SUBRELOBJ.csv"),
        help="Output CSV path (default: SUBRELOBJ.csv)",
    )
    parser.add_argument(
        "--no-derive-apl-pro",
        action="store_true",
        help="Skip deriving APL-PRO triplets via shared materials",
    )
    return parser


def main() -> None:
    parser = _build_arg_parser()
    args = parser.parse_args()
    df = graph_json_to_subrelobj_csv(
        args.input,
        args.output,
        derive_apl_pro=not args.no_derive_apl_pro,
    )
    print(f"Wrote {len(df)} triplets to {args.output}")
    print(df["Rel"].value_counts().to_string())


if __name__ == "__main__":
    main()
