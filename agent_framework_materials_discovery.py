"""ACCELMAT agent framework for mineral extraction and beneficiation hypothesis generation."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from llm_client import (
    MODEL_CRITIC,
    MODEL_CRITIC_2,
    MODEL_CRITIC_3,
    MODEL_EVALUATION,
    MODEL_HGA,
    MODEL_SUMMARIZER,
    chat_completion,
)
from logging_utils import get_logger, log_block, log_step

logger = get_logger("agent")


def format_constraints(constraints: list[str]) -> str:
    return "\n".join(f" {index}) {constraint}" for index, constraint in enumerate(constraints, start=1))


SUGGESTION_JSON_SCHEMA = """
Each suggestion must use these JSON keys exactly as written:
- Materials: target useful mineral(s), ore body, or mineral assemblage to extract (what is recovered)
- Methods_to_develop_the_materials_suggested: extraction and beneficiation flowsheet (mining, comminution, flotation, gravity separation, heap/tank leaching, hydrometallurgy, pyrometallurgy, dewatering, tailings/waste management)
- Reasoning: technical and economic justification (head grade, recovery, reagent/water use, CAPEX/OPEX, equipment compatibility, environmental and regulatory compliance)
"""


def construct_prompt_for_hypotheses_generator(
    goal_statement: str,
    constraint_list: str,
    kg_context: dict | None = None,
    num_hypotheses: int = 20,
) -> str:
    kg_section = ""
    if kg_context:
        kg_section = (
            "\n\n### Knowledge Graph Context (ores, minerals, process constraints from literature graph):\n"
            f"{json.dumps(kg_context, ensure_ascii=False, indent=2)}\n"
            "Use ONLY these KG-suggested entities where applicable; do not ignore constraints.\n"
        )

    return f"""You are generating hypotheses for the extraction and beneficiation of useful minerals (полезные ископаемые).

{goal_statement}{kg_section} \n\n Constraints:- \n{constraint_list}.\n
Provide me {num_hypotheses} innovative technological suggestions that will help achieve the above goal while satisfying all of the above mentioned constraints strictly.
Focus on mining, ore preparation, concentration, hydrometallurgical/pyrometallurgical extraction, and tailings management — not on designing new alloys or structural materials.
Provide reason for each suggestion. The suggestions must be in the below mentioned format in a JSON object. For example:\n
{SUGGESTION_JSON_SCHEMA}
{{Suggestion_1:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning:
    ,
Suggestion_{num_hypotheses}:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning: }}"""


def construct_critic_prompt(goal_statement: str, constraint_list: str, chat_history: str) -> str:
    return f"""{goal_statement}\n\nConstraints:-\n{constraint_list}\n\nSuggestions:\n{chat_history}Given the above goal statement, constraints and suggestions about extraction and beneficiation of useful minerals, evaluate each suggestion and generate detailed feedback which will help the suggestion generation process to generate suggestions such that they help achieve goal statement and satisfy all the constraints strictly. Check recovery, head grade assumptions, reagent/water balance, equipment compatibility, cost limits, tailings/environmental compliance, and regulatory claims. The detailed feedback should be in the below JSON format strictly:
    {{"Feedback_for_suggestion_1":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Feedback_for_suggestion_20":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Overall_Feedback_for_improvement_for_future_suggestion_generation": " " ]]
    }}
    """


def construct_feedback_prompt(feedback: str) -> str:
    return f"""Below provided is the feedback you gave for each of the initial suggestions generated and an overall feedback for the improvement of future suggestion generations\n{feedback}.Refine your suggestions based on the feedback accordingly to meet the goal statement and satisfy all the constraints strictly. Keep focus on useful-mineral extraction and beneficiation (not alloy design). {SUGGESTION_JSON_SCHEMA} The suggestions must be in the below mentioned format in a JSON object. For example:\n
{{Suggestion_1:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning:
    ,
Suggestion_20:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning:}}"""


def construct_feedback_prompt_for_refined_hypotheses(feedback_history: str, chat_history: str) -> str:
    return f"""Below provided is the feedback you gave for the initial suggestions\n{feedback_history}. Below are the refined suggestions based on the feedback\n{chat_history}. Now evaluate each refined suggestion for mineral extraction and beneficiation feasibility and provide detailed feedback which will help the suggestion generation process to generate suggestions such that they help achieve goal statement and satisfy all the constraints strictly. The detailed feedback should be in the below JSON format strictly:
    {{"Feedback_for_suggestion_1":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Feedback_for_suggestion_20":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Overall_Feedback_for_improvement": " " ]]
    }}
    """


def _as_text(value: Any) -> str:
    if isinstance(value, list):
        return "".join(str(item) for item in value)
    return str(value)


def json_to_text(json_obj: dict[str, Any]) -> str:
    output_text = ""
    for key, value in json_obj.items():
        suggestion_details = (
            f"{key.replace('_', ' ')}:\n"
            f"Materials:{_as_text(value.get('Materials', ''))}\n"
            f"Methods_to_develop_the_materials_suggested:{_as_text(value.get('Methods_to_develop_the_materials_suggested', ''))}\n"
            f"Reasoning:{value.get('Reasoning', '')}\n\n"
        )
        output_text += suggestion_details
    return output_text


def extract_suggestion_entries(data: Any) -> dict[str, Any]:
    """Collect Suggestion_* objects from nested JSON returned by the LLM."""
    if isinstance(data, dict):
        suggestions: dict[str, Any] = {}
        for key, value in data.items():
            if re.match(r"Suggestion_\d+", key, re.IGNORECASE) and isinstance(value, dict):
                suggestions[key] = value
            elif isinstance(value, (dict, list)):
                suggestions.update(extract_suggestion_entries(value))
        return suggestions
    if isinstance(data, list):
        merged: dict[str, Any] = {}
        for item in data:
            merged.update(extract_suggestion_entries(item))
        return merged
    return {}


def normalize_hypotheses(hypotheses: dict[str, Any], num_hypotheses: int) -> dict[str, Any]:
    """Keep the first N Suggestion_* entries when the model returns extra keys."""
    hypotheses = extract_suggestion_entries(hypotheses) or hypotheses
    ranked: list[tuple[int, str]] = []
    for key in hypotheses:
        match = re.match(r"Suggestion_(\d+)", key, re.IGNORECASE)
        if match:
            ranked.append((int(match.group(1)), key))
    ranked.sort()
    if len(ranked) < num_hypotheses:
        raise ValueError(f"Expected {num_hypotheses} hypotheses, got {len(ranked)}")
    return {
        f"Suggestion_{index}": hypotheses[original_key]
        for index, (_, original_key) in enumerate(ranked[:num_hypotheses], start=1)
    }


def process_feedback_extract_final_answer(feedback: dict[str, Any]) -> tuple[str, str, int]:
    suggestions_with_no = 0
    processed_feedback = ""
    final_answer = "Yes"
    for key, value in feedback.items():
        if key.startswith("Feedback_for_suggestion") and isinstance(value, dict):
            suggestion_num = key.split("_")[-1]
            meets = value.get("Meets_the_goal_statement_and_satisfies_all_constraints_strictly", "N/A")
            if meets == "NO":
                suggestions_with_no += 1
                final_answer = "NO"
            reasoning = value.get("Reasoning", "N/A")
            processed_feedback += (
                f"Feedback_for_suggestion_{suggestion_num}:\n"
                f"Meets_the_goal_statement_and_satisfies_all_constraints_strictly:{meets}.\n"
                f"Reasoning: {reasoning}\n\n"
            )
        elif key.startswith("Overall_Feedback_for_improvement"):
            processed_feedback += f"Overall Feedback_for_future_suggestion_improvement: {value}\n"
    return processed_feedback, final_answer, suggestions_with_no


def expert_list_generator(goal_statement: str) -> str:
    logger.info("[Expert List] Requesting expert panel from %s", MODEL_HGA)
    completion = chat_completion(
        model=MODEL_HGA,
        temperature=0.7,
        messages=[
            {"role": "system", "content": "You are a helpful assistant"},
            {
                "role": "user",
                "content": (
                    "Generate a list of experts required to achieve the below mentioned goal in mining "
                    "and mineral processing (extraction of useful minerals):\n"
                    f"{goal_statement}. Just list the top 5 experts in the format "
                    '"Expert_1, Expert_2, Expert_3, Expert_4, Expert_5" '
                    "(e.g. mining engineer, mineral processing technologist, hydrometallurgist, "
                    "flotation specialist, environmental/regulatory specialist)."
                ),
            },
        ],
    )
    result = completion.choices[0].message.content or ""
    logger.info("[Expert List] %s", result.strip())
    return result


def hypothesis_generator(
    expert_list: str,
    prompt: str,
    feedback: str | None = None,
    chat_history: str | None = None,
) -> str:
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": (
                f"You are an innovative {expert_list} capable of proposing impactful schemes for "
                "extracting and beneficiating useful minerals (полезные ископаемые): ore preparation, "
                "concentration, leaching, smelting, and tailings management."
            ),
        },
        {"role": "user", "content": prompt},
    ]
    is_refinement = feedback is not None and chat_history is not None
    if is_refinement:
        messages.extend(
            [
                {"role": "assistant", "content": chat_history},
                {"role": "user", "content": feedback},
            ]
        )

    mode = "refinement" if is_refinement else "initial"
    logger.info("[HGA] Requesting %s hypotheses from %s (%s)", "refined" if is_refinement else "initial", MODEL_HGA, mode)
    log_block(logger, "[HGA] Prompt", prompt, level=logging.DEBUG)
    if is_refinement:
        log_block(logger, "[HGA] Refinement feedback", feedback, level=logging.DEBUG)

    completion = chat_completion(
        model=MODEL_HGA,
        temperature=0.7,
        max_tokens=16384,
        messages=messages,
        response_format={"type": "json_object"},
    )
    raw = completion.choices[0].message.content or "{}"
    log_block(logger, "[HGA] Raw response", raw)
    return raw


def parse_hypotheses_response(raw: str, num_hypotheses: int) -> dict[str, Any]:
    return normalize_hypotheses(json.loads(raw), num_hypotheses)


def generate_hypotheses_with_retry(
    expert_list: str,
    prompt: str,
    num_hypotheses: int,
    feedback: str | None = None,
    chat_history: str | None = None,
    max_retries: int = 3,
) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            raw = hypothesis_generator(expert_list, prompt, feedback, chat_history)
            parsed = parse_hypotheses_response(raw, num_hypotheses)
            logger.info("[HGA] Parsed %d hypotheses on attempt %d/%d", len(parsed), attempt, max_retries)
            return parsed
        except (json.JSONDecodeError, ValueError) as exc:
            last_error = exc
            logger.warning("[HGA] Attempt %d/%d failed to parse hypotheses: %s", attempt, max_retries, exc)
    if last_error is not None:
        raise last_error
    raise RuntimeError("Failed to generate hypotheses")


def run_critic(
    model: str,
    expert_list: str,
    critic_prompt: str,
    feedback_history: str | None = None,
    refined_feedback_prompt: str | None = None,
) -> str:
    system_content = (
        f"You are an expert {expert_list} in mining and mineral processing. "
        "Given a goal statement, additional constraints, and a list of suggestions about extraction "
        "and beneficiation of useful minerals, your task is to evaluate each suggestion such that it "
        "meets the goal statement and satisfies all the constraints strictly."
    )
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": critic_prompt},
    ]
    is_refinement = feedback_history is not None and refined_feedback_prompt is not None
    if is_refinement:
        messages.extend(
            [
                {"role": "assistant", "content": feedback_history},
                {"role": "user", "content": refined_feedback_prompt},
            ]
        )

    logger.info("[Critic] Requesting review from %s (%s)", model, "refinement" if is_refinement else "initial")
    log_block(logger, f"[Critic:{model}] Prompt", critic_prompt, level=logging.DEBUG)

    completion = chat_completion(
        model=model,
        temperature=0.7,
        messages=messages,
        response_format={"type": "json_object"},
    )
    raw = completion.choices[0].message.content or "{}"
    log_block(logger, f"[Critic:{model}] Raw response", raw)
    return raw


def run_critic_with_retry(
    model: str,
    expert_list: str,
    critic_prompt: str,
    feedback_history: str | None = None,
    refined_feedback_prompt: str | None = None,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Runs a single critic and parses its JSON response, retrying on empty/invalid output.

    Critic models occasionally return an empty or non-JSON response (observed in
    practice with json_object mode); retry a few times before giving up, mirroring
    generate_hypotheses_with_retry's approach for the hypothesis generator.
    """
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            raw = run_critic(model, expert_list, critic_prompt, feedback_history, refined_feedback_prompt)
            parsed = json.loads(raw)
            _, critic_final_answer, no_count = process_feedback_extract_final_answer(parsed)
            logger.info(
                "[Critic:%s] Verdict=%s, suggestions flagged NO=%d (attempt %d/%d)",
                model,
                critic_final_answer,
                no_count,
                attempt,
                max_retries,
            )
            return parsed
        except (json.JSONDecodeError, ValueError) as exc:
            last_error = exc
            logger.warning("[Critic:%s] Attempt %d/%d failed to parse response: %s", model, attempt, max_retries, exc)
    if last_error is not None:
        raise last_error
    raise RuntimeError(f"Failed to get a valid critic response from {model}")


def summarize_critic_feedback(
    critic_outputs: list[dict[str, Any]],
    goal_statement: str,
    constraint_list: str,
) -> dict[str, Any]:
    prompt = f"""You are the Summarizer Agent in the ACCELMAT framework for mineral extraction hypotheses.
Consolidate the feedback from three critic agents into one structured JSON object that can guide hypothesis refinement.

Goal statement:
{goal_statement}

Constraints:
{constraint_list}

Critic feedback JSON objects:
{json.dumps(critic_outputs, ensure_ascii=False, indent=2)}

Return a single JSON object using the same schema as critic feedback:
- Feedback_for_suggestion_1 ... Feedback_for_suggestion_20
- Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES" only if ALL critics agreed YES
- Overall_Feedback_for_improvement_for_future_suggestion_generation
"""
    logger.info("[Summarizer] Consolidating %d critic responses via %s", len(critic_outputs), MODEL_SUMMARIZER)
    completion = chat_completion(
        model=MODEL_SUMMARIZER,
        temperature=0,
        messages=[{"role": "system", "content": prompt}],
        response_format={"type": "json_object"},
    )
    raw = completion.choices[0].message.content or "{}"
    log_block(logger, "[Summarizer] Raw response", raw)
    return json.loads(raw)


def evaluate_hypotheses(
    goal_statement: str,
    constraint_list: str,
    hypotheses: dict[str, Any],
) -> dict[str, Any]:
    prompt = f"""You are the Evaluation Agent in the ACCELMAT framework for mineral extraction and beneficiation.
Evaluate the closeness and quality of the generated hypotheses relative to the goal and constraints.
Score recovery potential, technical feasibility, cost/environmental compliance, and alignment with stated ore/mineral targets.

Goal statement:
{goal_statement}

Constraints:
{constraint_list}

Hypotheses:
{json.dumps(hypotheses, ensure_ascii=False, indent=2)}

Return JSON with:
{{
  "scores": {{"Suggestion_1": <1-10>, "...": <1-10>}},
  "summary": "<overall evaluation>"
}}
"""
    logger.info("[Evaluation] Scoring %d hypotheses via %s", len(hypotheses), MODEL_EVALUATION)
    try:
        completion = chat_completion(
            model=MODEL_EVALUATION,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        logger.warning("[Evaluation] %s failed (%s); falling back to %s", MODEL_EVALUATION, exc, MODEL_HGA)
        completion = chat_completion(
            model=MODEL_HGA,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
    raw = completion.choices[0].message.content or "{}"
    log_block(logger, "[Evaluation] Raw response", raw)
    result = json.loads(raw)
    if "evaluation_model_fallback" not in result:
        result.setdefault("evaluation_model", MODEL_EVALUATION)
    logger.info("[Evaluation] Scores: %s", result.get("scores"))
    return result


@dataclass
class AccelmatResult:
    hypotheses: dict[str, Any]
    evaluation: dict[str, Any]
    chat_history: list[str] = field(default_factory=list)
    feedback_history: list[str] = field(default_factory=list)
    refinement_iterations: int = 0
    critics_approved: bool = False


def run_accelmat_loop(
    goal: str,
    constraints: str,
    kg_context: dict | None = None,
    *,
    max_iterations: int = 5,
    num_hypotheses: int = 20,
) -> AccelmatResult:
    logger.info("=" * 70)
    logger.info("[ACCELMAT] Starting run: %d hypotheses, up to %d refinement iterations", num_hypotheses, max_iterations)
    log_block(logger, "[ACCELMAT] Goal", goal)
    log_block(logger, "[ACCELMAT] Constraints", constraints)
    if kg_context:
        log_block(logger, "[ACCELMAT] KG context", kg_context)
    else:
        logger.info("[ACCELMAT] No KG context available for this run")

    with log_step(logger, "Step 1/5: Generate expert panel"):
        expert_list = expert_list_generator(goal)

    prompt = construct_prompt_for_hypotheses_generator(
        goal, constraints, kg_context, num_hypotheses=num_hypotheses
    )

    with log_step(logger, "Step 2/5: Generate initial hypotheses (HGA)"):
        hypotheses = generate_hypotheses_with_retry(expert_list, prompt, num_hypotheses)

    chat_history: list[str] = [json_to_text(hypotheses)]
    feedback_history: list[str] = []
    critic_prompt = construct_critic_prompt(goal, constraints, chat_history[-1])

    critics = [MODEL_CRITIC, MODEL_CRITIC_2, MODEL_CRITIC_3]
    with log_step(logger, f"Step 3/5: Run {len(critics)} critics on initial hypotheses"):
        critic_outputs = [
            run_critic_with_retry(model, expert_list, critic_prompt, None, None)
            for model in critics
        ]
    with log_step(logger, "Step 4/5: Summarize critic feedback"):
        consolidated = summarize_critic_feedback(critic_outputs, goal, constraints)
    processed_feedback, final_answer, no_count = process_feedback_extract_final_answer(consolidated)
    feedback_history.append(processed_feedback)
    logger.info("[ACCELMAT] Consolidated verdict=%s (%d suggestions flagged NO)", final_answer, no_count)

    attempts = 0
    while final_answer != "Yes" and attempts < max_iterations:
        attempts += 1
        logger.info("[ACCELMAT] Refinement iteration %d/%d (critics did not unanimously approve)", attempts, max_iterations)
        feedback_prompt = construct_feedback_prompt(processed_feedback)
        with log_step(logger, f"Iteration {attempts}: Refine hypotheses (HGA)"):
            hypotheses = generate_hypotheses_with_retry(
                expert_list, prompt, num_hypotheses, feedback_prompt, chat_history[-1]
            )
        chat_history.append(json_to_text(hypotheses))

        refined_feedback_prompt = construct_feedback_prompt_for_refined_hypotheses(
            feedback_history[-1], chat_history[-1]
        )
        with log_step(logger, f"Iteration {attempts}: Re-run {len(critics)} critics"):
            critic_outputs = [
                run_critic_with_retry(
                    model,
                    expert_list,
                    critic_prompt,
                    feedback_history[-1],
                    refined_feedback_prompt,
                )
                for model in critics
            ]
        with log_step(logger, f"Iteration {attempts}: Summarize critic feedback"):
            consolidated = summarize_critic_feedback(critic_outputs, goal, constraints)
        processed_feedback, final_answer, no_count = process_feedback_extract_final_answer(consolidated)
        feedback_history.append(processed_feedback)
        logger.info(
            "[ACCELMAT] Iteration %d verdict=%s (%d suggestions flagged NO)", attempts, final_answer, no_count
        )

    if final_answer != "Yes":
        logger.warning("[ACCELMAT] Max refinement iterations (%d) reached without unanimous approval", max_iterations)

    with log_step(logger, "Step 5/5: Evaluate final hypotheses"):
        evaluation = evaluate_hypotheses(goal, constraints, hypotheses)

    logger.info(
        "[ACCELMAT] Run complete: approved=%s, iterations=%d",
        final_answer == "Yes",
        attempts,
    )
    logger.info("=" * 70)

    return AccelmatResult(
        hypotheses=hypotheses,
        evaluation=evaluation,
        chat_history=chat_history,
        feedback_history=feedback_history,
        refinement_iterations=attempts,
        critics_approved=final_answer == "Yes",
    )
