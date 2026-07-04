import json
from pathlib import Path
from unittest.mock import patch

import pytest

from pipeline import PipelineRequest, load_pipeline_request, run_pipeline, save_pipeline_result

EXAMPLE_GRAPH = Path("Examples_prev_step/LearningChunkGraph_dedup.json")
EXAMPLE_REQUEST = Path("inputs/pipeline_request.example.json")

MOCK_HYPOTHESES = {
    f"Suggestion_{index}": {
        "Materials": f"Material {index}",
        "Methods_to_develop_the_materials_suggested": f"Method {index}",
        "Reasoning": f"Reasoning {index}",
    }
    for index in range(1, 21)
}

MOCK_EVALUATION = {
    "scores": {f"Suggestion_{index}": 8 for index in range(1, 21)},
    "summary": "Good hypotheses overall.",
}


@pytest.fixture
def pipeline_request() -> PipelineRequest:
    return load_pipeline_request(EXAMPLE_REQUEST)


@patch("pipeline.run_accelmat_loop")
@patch("pipeline.build_kg_context")
def test_run_pipeline(mock_build_kg, mock_accelmat, pipeline_request) -> None:
    from agent_framework_materials_discovery import AccelmatResult

    mock_build_kg.return_value = {
        "Armor Element": {
            "KG Suggested Materials": {"ВТ6": "Known armor alloy"},
            "KG Suggested Properties": {"Impact Toughness": "Key property"},
        }
    }
    mock_accelmat.return_value = AccelmatResult(
        hypotheses=MOCK_HYPOTHESES,
        evaluation=MOCK_EVALUATION,
        refinement_iterations=1,
        critics_approved=True,
    )

    pipeline_request.graph_path = EXAMPLE_GRAPH.resolve()
    result = run_pipeline(pipeline_request)

    assert result.goal == pipeline_request.goal
    assert len(result.hypotheses) == 20
    assert result.metadata["triplet_count"] > 0
    assert result.metadata["critics_approved"] is True
    assert "Armor Element" in result.kg_context


def test_save_pipeline_result(tmp_path: Path, pipeline_request) -> None:
    from pipeline import PipelineResult

    result = PipelineResult(
        goal=pipeline_request.goal,
        constraints=pipeline_request.constraints,
        kg_context={},
        hypotheses=MOCK_HYPOTHESES,
        evaluation=MOCK_EVALUATION,
        metadata={"triplet_count": 50},
        supplementary_context={
            "documents": [{"filename": "ore.xlsx", "sheets": ["Grades"], "char_count": 120}],
            "formatted_text": "### Supplementary Excel Documents\nGold 4.2 g/t",
        },
    )
    output = tmp_path / "out.json"
    save_pipeline_result(result, output)
    loaded = json.loads(output.read_text(encoding="utf-8"))
    assert loaded["goal"] == pipeline_request.goal
    assert len(loaded["hypotheses"]) == 20
    assert loaded["supplementary_context"]["documents"][0]["filename"] == "ore.xlsx"


def test_load_pipeline_request_with_supplementary_paths(tmp_path: Path) -> None:
    request_path = tmp_path / "request.json"
    request_path.write_text(
        json.dumps(
            {
                "graph_path": "Examples_prev_step/LearningChunkGraph_dedup.json",
                "goal": "Test goal",
                "constraints": ["C1"],
                "supplementary_document_paths": ["inputs/accelmat_docs/run-1/data.xlsx"],
            }
        ),
        encoding="utf-8",
    )
    loaded = load_pipeline_request(request_path)
    assert len(loaded.supplementary_document_paths) == 1
    assert loaded.supplementary_document_paths[0].as_posix().endswith("data.xlsx")
