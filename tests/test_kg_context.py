import json
from pathlib import Path
from unittest.mock import patch

import pandas as pd
import pytest

from kg_context import (
    build_subrelobj_from_graph,
    get_known_applications,
    get_known_materials,
    query_material_relations,
    query_materials_properties,
)

EXAMPLE_GRAPH = (
    Path(__file__).resolve().parent.parent
    / "Examples_prev_step"
    / "LearningChunkGraph_dedup.json"
)

NORNIKEL_EXAMPLE_GRAPH = (
    Path(__file__).resolve().parent.parent
    / "Examples_prev_step"
    / "LearningChunkGraphNORNIKEL_EXAMPLE (2).json"
)


@pytest.fixture
def graph() -> dict:
    with EXAMPLE_GRAPH.open(encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def subrelobj() -> pd.DataFrame:
    return build_subrelobj_from_graph(EXAMPLE_GRAPH)


@pytest.fixture
def nornikel_graph() -> dict:
    with NORNIKEL_EXAMPLE_GRAPH.open(encoding="utf-8") as f:
        return json.load(f)


def test_get_known_applications(graph: dict) -> None:
    apps = get_known_applications(graph)
    assert "Armor Element" in apps
    assert "Aircraft Structural Component" in apps


def test_query_materials_properties_armor_element(subrelobj: pd.DataFrame) -> None:
    results = query_materials_properties(subrelobj, ["Armor Element"])
    assert "Armor Element" in results
    assert "ВТ6" in results["Armor Element"]["materials"]
    assert "Impact Toughness" in results["Armor Element"]["properties"]


def test_query_skips_unknown_application(subrelobj: pd.DataFrame) -> None:
    results = query_materials_properties(subrelobj, ["Unknown Application XYZ"])
    assert results == {}


@patch("kg_context.llm_completion")
def test_extract_applications_from_goal(mock_llm) -> None:
    from kg_context import extract_applications_from_goal

    mock_llm.return_value = "Armor Element, Aircraft Structural Component"
    apps = extract_applications_from_goal(
        "goal",
        known_applications=["Armor Element", "Aircraft Structural Component"],
    )
    assert apps == ["Armor Element", "Aircraft Structural Component"]
    assert "Armor Element" in mock_llm.call_args[0][0]


@patch("kg_context.summarize_kg_context")
@patch("kg_context.extract_applications_from_goal")
def test_build_kg_context(mock_extract, mock_summarize, graph, subrelobj) -> None:
    from kg_context import build_kg_context

    mock_extract.return_value = ["Armor Element"]
    mock_summarize.return_value = {
        "Armor Element": {
            "KG Suggested Materials": {"ВТ6": "High toughness alloy"},
            "KG Suggested Properties": {"Impact Toughness": "Required for armor"},
        }
    }
    context = build_kg_context("goal", subrelobj, graph)
    assert "Armor Element" in context
    mock_summarize.assert_called_once()


def test_get_known_materials_nornikel(nornikel_graph: dict) -> None:
    materials = get_known_materials(nornikel_graph)
    assert materials == ["Ni-W Alloy"]


def test_query_material_relations_nornikel(nornikel_graph: dict) -> None:
    relations = query_material_relations(nornikel_graph, ["Ni-W Alloy"])
    assert "Ni-W Alloy" in relations
    material_relations = relations["Ni-W Alloy"]

    equipment = material_relations["REQUIRES_EQUIPMENT"]
    assert equipment[0]["entity"] == "Induction Furnace"
    assert equipment[0]["entity_type"] == "Equipment"

    cost = material_relations["IMPACTS_COST"]
    assert cost[0]["entity"] == "Production Cost"
    assert cost[0]["effect_direction"] == "negative"

    regulation = material_relations["HAS_REGULATION"]
    assert regulation[0]["entity"] == "GOST R 52290-2004"


def test_query_material_relations_unknown_material(nornikel_graph: dict) -> None:
    relations = query_material_relations(nornikel_graph, ["Unknown Alloy XYZ"])
    assert relations == {}


@patch("kg_context.summarize_material_context")
@patch("kg_context.extract_materials_from_goal")
def test_build_kg_context_falls_back_to_materials(
    mock_extract_materials, mock_summarize_materials, nornikel_graph
) -> None:
    from kg_context import build_kg_context

    subrelobj = build_subrelobj_from_graph(NORNIKEL_EXAMPLE_GRAPH)
    mock_extract_materials.return_value = ["Ni-W Alloy"]
    mock_summarize_materials.return_value = {
        "Ni-W Alloy": {"KG Suggested Properties": {"Flexibility": "Improved by temperature"}}
    }

    context = build_kg_context("Optimize Ni-W alloy flexibility", subrelobj, nornikel_graph)
    assert "Ni-W Alloy" in context
    mock_summarize_materials.assert_called_once()
