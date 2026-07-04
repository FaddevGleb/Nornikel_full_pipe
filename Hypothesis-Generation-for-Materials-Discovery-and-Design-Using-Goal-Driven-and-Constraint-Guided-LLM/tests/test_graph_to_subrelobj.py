import json
from pathlib import Path

import pandas as pd
import pytest

from graph_to_subrelobj import (
    SUBRELOBJ_COLUMNS,
    graph_json_to_subrelobj_csv,
    learning_chunk_graph_to_subrelobj,
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
def nornikel_graph() -> dict:
    with NORNIKEL_EXAMPLE_GRAPH.open(encoding="utf-8") as f:
        return json.load(f)


def test_columns(graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(graph)
    assert list(df.columns) == SUBRELOBJ_COLUMNS


def test_chm_apl_example(graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(graph)
    row = df[
        (df["Rel"] == "CHM-APL")
        & (df["Subject"] == "ВТ6")
        & (df["Object"] == "Armor Element")
    ]
    assert len(row) == 1
    assert row.iloc[0]["Count"] >= 1


def test_chm_pro_impact_toughness(graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(graph)
    rows = df[(df["Rel"] == "CHM-PRO") & (df["Object"] == "Impact Toughness")]
    assert not rows.empty


def test_derived_apl_pro(graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(graph, derive_apl_pro=True)
    rows = df[
        (df["Rel"] == "APL-PRO") & (df["Subject"] == "Armor Element")
    ]
    assert not rows.empty


def test_no_derive_apl_pro_when_disabled(graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(graph, derive_apl_pro=False)
    assert "APL-PRO" not in df["Rel"].values


def test_skips_unmapped_node_types() -> None:
    graph = {
        "nodes": [
            {"id": "m1", "type": "Material", "name": "Alloy X"},
            {"id": "u1", "type": "UnknownCustomType", "name": "Mystery Entity"},
        ],
        "edges": [
            {"source": "m1", "target": "u1", "type": "RELATED_TO", "attributes": {}},
        ],
    }
    df = learning_chunk_graph_to_subrelobj(graph)
    assert "Mystery Entity" not in df["Subject"].values
    assert "Mystery Entity" not in df["Object"].values


def test_counts_are_positive(graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(graph)
    assert (df["Count"] >= 1).all()


def test_nornikel_extended_ontology_triplets(nornikel_graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(nornikel_graph)

    assert not df[
        (df["Rel"] == "CHM-EQP")
        & (df["Subject"] == "Ni-W Alloy")
        & (df["Object"] == "Induction Furnace")
    ].empty
    assert not df[
        (df["Rel"] == "CHM-BIZ")
        & (df["Subject"] == "Ni-W Alloy")
        & (df["Object"] == "Production Cost")
    ].empty
    assert not df[
        (df["Rel"] == "CHM-CST")
        & (df["Subject"] == "Ni-W Alloy")
        & (df["Object"] == "GOST R 52290-2004")
    ].empty
    assert not df[
        (df["Rel"] == "CHM-SRC")
        & (df["Subject"] == "Ni-W Alloy")
        & (df["Object"] == "Internal Lab Report 2023-Q3")
    ].empty
    assert not df[
        (df["Rel"] == "CND-PRO")
        & (df["Object"] == "Flexibility")
    ].empty


def test_nornikel_missing_co_occurrence_count_defaults_to_one(nornikel_graph: dict) -> None:
    df = learning_chunk_graph_to_subrelobj(nornikel_graph)
    row = df[
        (df["Rel"] == "CHM-SRC")
        & (df["Subject"] == "Ni-W Alloy")
        & (df["Object"] == "Internal Lab Report 2023-Q3")
    ]
    assert row.iloc[0]["Count"] == 1


def test_graph_json_to_subrelobj_csv(tmp_path: Path, graph: dict) -> None:
    input_path = tmp_path / "graph.json"
    output_path = tmp_path / "out.csv"
    input_path.write_text(json.dumps(graph), encoding="utf-8")

    df = graph_json_to_subrelobj_csv(input_path, output_path)
    assert output_path.exists()
    loaded = pd.read_csv(output_path)
    pd.testing.assert_frame_equal(df, loaded)
