"""End-to-end pipeline: graph + goal + constraints -> hypotheses."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from agent_framework_materials_discovery import format_constraints, run_accelmat_loop
from kg_context import build_kg_context, build_subrelobj_from_graph
from logging_utils import get_logger, log_step

logger = get_logger("pipeline")


@dataclass
class PipelineRequest:
    graph_path: Path
    goal: str
    constraints: list[str]
    max_refinement_iterations: int = 5
    num_hypotheses: int = 20


@dataclass
class PipelineResult:
    goal: str
    constraints: list[str]
    kg_context: dict[str, Any]
    hypotheses: dict[str, Any]
    evaluation: dict[str, Any]
    metadata: dict[str, Any] = field(default_factory=dict)


def load_pipeline_request(path: str | Path) -> PipelineRequest:
    path = Path(path)
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    return PipelineRequest(
        graph_path=Path(data["graph_path"]),
        goal=data["goal"],
        constraints=list(data["constraints"]),
        max_refinement_iterations=int(data.get("max_refinement_iterations", 5)),
        num_hypotheses=int(data.get("num_hypotheses", 20)),
    )


def run_pipeline(
    request: PipelineRequest,
    *,
    save_subrelobj_path: Path | None = None,
) -> PipelineResult:
    logger.info("[Pipeline] Loading graph from %s", request.graph_path)
    graph_path = request.graph_path
    with graph_path.open(encoding="utf-8") as f:
        graph = json.load(f)

    with log_step(logger, "Stage 1/3: Build SUBRELOBJ triplets from graph"):
        subrelobj = build_subrelobj_from_graph(graph_path)
        logger.info("[Pipeline] Built %d triplets", len(subrelobj))
        if save_subrelobj_path is not None:
            subrelobj.to_csv(save_subrelobj_path, index=False)
            logger.info("[Pipeline] Saved SUBRELOBJ to %s", save_subrelobj_path)

    with log_step(logger, "Stage 2/3: Build KG context"):
        kg_context = build_kg_context(request.goal, subrelobj, graph)
        logger.info("[Pipeline] KG context entries: %d", len(kg_context))

    constraint_text = format_constraints(request.constraints)

    with log_step(logger, "Stage 3/3: Run ACCELMAT loop"):
        accelmat = run_accelmat_loop(
            request.goal,
            constraint_text,
            kg_context,
            max_iterations=request.max_refinement_iterations,
            num_hypotheses=request.num_hypotheses,
        )

    metadata = {
        "graph_path": str(graph_path),
        "triplet_count": len(subrelobj),
        "refinement_iterations": accelmat.refinement_iterations,
        "critics_approved": accelmat.critics_approved,
        "kg_context_empty": not bool(kg_context),
    }
    logger.info("[Pipeline] Finished: %s", metadata)

    return PipelineResult(
        goal=request.goal,
        constraints=request.constraints,
        kg_context=kg_context,
        hypotheses=accelmat.hypotheses,
        evaluation=accelmat.evaluation,
        metadata=metadata,
    )


def pipeline_result_to_dict(result: PipelineResult) -> dict[str, Any]:
    return {
        "goal": result.goal,
        "constraints": result.constraints,
        "kg_context": result.kg_context,
        "hypotheses": result.hypotheses,
        "evaluation": result.evaluation,
        "metadata": result.metadata,
    }


def save_pipeline_result(result: PipelineResult, output_path: str | Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(pipeline_result_to_dict(result), f, ensure_ascii=False, indent=2)
