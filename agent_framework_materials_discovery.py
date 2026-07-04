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
    MODEL_CRITIC_4,
    MODEL_EVALUATION,
    MODEL_HGA,
    MODEL_SUMMARIZER,
    chat_completion,
)
from logging_utils import get_logger, log_block, log_step
from supplementary_context import append_supplementary_to_prompt, append_supplementary_to_system

logger = get_logger("agent")

RUSSIAN_OUTPUT_RULE = (
    "Весь пояснительный текст (Reasoning, обратная связь, summary, Overall_Feedback и т.д.) "
    "пиши строго на русском языке. Ключи JSON оставляй на английском, как указано в схеме."
)


def format_constraints(constraints: list[str]) -> str:
    return "\n".join(f" {index}) {constraint}" for index, constraint in enumerate(constraints, start=1))


SUGGESTION_JSON_SCHEMA = """
Каждое предложение должно использовать эти ключи JSON (имена ключей — на английском, значения — на русском):
- Materials: целевые полезные ископаемые, рудное тело или минеральный ассоциат (что извлекается)
- Methods_to_develop_the_materials_suggested: схема извлечения и обогащения (добыча, дробление, флотация, гравитация, кучное/баковое выщелачивание, гидрометаллургия, пирометаллургия, обезвоживание, хвосты/отходы)
- Reasoning: техническое и экономическое обоснование (содержание, извлечение, реагенты/вода, CAPEX/OPEX, совместимость оборудования, экология и нормативы)
"""


def construct_prompt_for_hypotheses_generator(
    goal_statement: str,
    constraint_list: str,
    kg_context: dict | None = None,
    num_hypotheses: int = 20,
    supplementary_context: str | None = None,
) -> str:
    kg_section = ""
    if kg_context:
        kg_section = (
            "\n\n### Контекст графа знаний (руды, минералы, ограничения процесса из литературного графа):\n"
            f"{json.dumps(kg_context, ensure_ascii=False, indent=2)}\n"
            "Используй ТОЛЬКО сущности из KG, где это применимо; не игнорируй ограничения.\n"
        )

    prompt = f"""Ты генерируешь гипотезы по извлечению и обогащению полезных ископаемых.

{goal_statement}{kg_section} \n\n Ограничения:- \n{constraint_list}.\n
Предложи {num_hypotheses} инновационных технологических решений, которые помогут достичь указанной цели при строгом соблюдении всех ограничений.
Фокус: добыча, подготовка руды, обогащение, гидро/пирометаллургическое извлечение, управление хвостами — не проектирование новых сплавов или конструкционных материалов.
Для каждого предложения приведи обоснование (Reasoning). Формат — JSON-объект, как в примере ниже.\n
{SUGGESTION_JSON_SCHEMA}
{RUSSIAN_OUTPUT_RULE}
{{Suggestion_1:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning:
    ,
Suggestion_{num_hypotheses}:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning: }}"""
    return append_supplementary_to_prompt(prompt, supplementary_context)


def construct_critic_prompt(
    goal_statement: str,
    constraint_list: str,
    chat_history: str,
    supplementary_context: str | None = None,
) -> str:
    prompt = f"""{goal_statement}\n\nОграничения:-\n{constraint_list}\n\nПредложения:\n{chat_history}Учитывая цель, ограничения и предложения по извлечению и обогащению полезных ископаемых, оцени каждое предложение и сформируй подробную обратную связь для улучшения генерации. Проверь извлечение, содержание в питании, баланс реагентов/воды, совместимость оборудования, лимиты затрат, экологию/хвосты и нормативные заявления. {RUSSIAN_OUTPUT_RULE} Формат ответа — JSON:
    {{"Feedback_for_suggestion_1":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Feedback_for_suggestion_20":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Overall_Feedback_for_improvement_for_future_suggestion_generation": " " ]]
    }}
    """
    return append_supplementary_to_prompt(prompt, supplementary_context)


FEASIBILITY_CRITIC_TEMPERATURE = 0.3


def construct_feasibility_critic_system(
    expert_list: str,
    supplementary_context: str | None = None,
) -> str:
    return append_supplementary_to_system(
        (
            f"Ты — главный технолог действующей обогатительной фабрики ({expert_list}). "
            "Твоя единственная задача — оценить промышленную и практическую реализуемость каждого "
            "предложения на реальном производстве. Не оценивай новизну или потенциал исследований. "
            "Жёсткое правило: при любом сомнении в промышленной реализуемости ставь NO. "
            "Проверяй: наличие промышленных аналогов (не лаборатория); реалистичность извлечения, "
            "содержаний и массовых балансов; возможность встраивания в существующую схему без полной "
            "перестройки; правдоподобность CAPEX/OPEX и сроков пилота/внедрения. "
            "Если приложены операционные данные из Excel — они приоритетнее рассуждений модели; "
            "противоречие табличным данным = NO. "
            f"{RUSSIAN_OUTPUT_RULE}"
        ),
        supplementary_context,
    )


def construct_feasibility_critic_prompt(
    goal_statement: str,
    constraint_list: str,
    chat_history: str,
    supplementary_context: str | None = None,
) -> str:
    prompt = f"""{goal_statement}\n\nОграничения:-\n{constraint_list}\n\nПредложения:\n{chat_history}Оцени каждое предложение ТОЛЬКО с точки зрения промышленной и практической реализуемости на действующем производстве. Игнорируй привлекательность инновации — важно, можно ли внедрить схему на реальной фабрике в разумные сроки и с реалистичными затратами. Проверь: промышленные аналоги технологии; реалистичность извлечения и содержаний; массовые балансы; retrofit vs полная перестройка; CAPEX/OPEX и сроки пилота. При сомнении — NO. {RUSSIAN_OUTPUT_RULE} Формат ответа — JSON:
    {{"Feedback_for_suggestion_1":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Feedback_for_suggestion_20":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Overall_Feedback_for_improvement_for_future_suggestion_generation": " " ]]
    }}
    """
    return append_supplementary_to_prompt(prompt, supplementary_context)


def construct_feedback_prompt(
    feedback: str,
    supplementary_context: str | None = None,
) -> str:
    prompt = f"""Ниже — твоя обратная связь по каждому из первоначальных предложений и общие рекомендации для улучшения будущих генераций:\n{feedback}. Уточни предложения с учётом обратной связи так, чтобы достичь цели и строго соблюсти все ограничения. Фокус — извлечение и обогащение полезных ископаемых (не проектирование сплавов). {SUGGESTION_JSON_SCHEMA} {RUSSIAN_OUTPUT_RULE} Формат — JSON-объект, например:\n
{{Suggestion_1:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning:
    ,
Suggestion_20:
    Materials:
    Methods_to_develop_the_materials_suggested:
    Reasoning:}}"""
    return append_supplementary_to_prompt(prompt, supplementary_context)


def construct_feedback_prompt_for_refined_hypotheses(
    feedback_history: str,
    chat_history: str,
    supplementary_context: str | None = None,
) -> str:
    prompt = f"""Ниже — твоя обратная связь по первоначальным предложениям:\n{feedback_history}. Ниже — уточнённые предложения на основе обратной связи:\n{chat_history}. Оцени каждое уточнённое предложение с точки зрения технической реализуемости извлечения и обогащения и сформируй подробную обратную связь для дальнейшего улучшения. {RUSSIAN_OUTPUT_RULE} Формат — JSON:
    {{"Feedback_for_suggestion_1":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Feedback_for_suggestion_20":
    Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES/NO"
    Reasoning:" ",
    "Overall_Feedback_for_improvement": " " ]]
    }}
    """
    return append_supplementary_to_prompt(prompt, supplementary_context)


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


def expert_list_generator(
    goal_statement: str,
    supplementary_context: str | None = None,
) -> str:
    logger.info("[Expert List] Requesting expert panel from %s", MODEL_HGA)
    user_content = (
        "Сформируй список экспертов, необходимых для достижения указанной цели в горной "
        "промышленности и обогащении полезных ископаемых:\n"
        f"{goal_statement}. Перечисли топ-5 экспертов в формате "
        '"Expert_1, Expert_2, Expert_3, Expert_4, Expert_5" '
        "(например: инженер-горняк, технолог обогащения, гидрометаллург, "
        "специалист по флотации, эколог/нормативы). Названия специальностей — на русском."
    )
    completion = chat_completion(
        model=MODEL_HGA,
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": append_supplementary_to_system(
                    f"Ты полезный ассистент в области горного дела и обогащения. {RUSSIAN_OUTPUT_RULE}",
                    supplementary_context,
                ),
            },
            {"role": "user", "content": append_supplementary_to_prompt(user_content, supplementary_context)},
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
    supplementary_context: str | None = None,
) -> str:
    system_content = append_supplementary_to_system(
        (
            f"Ты — инновационная команда экспертов ({expert_list}), способная предлагать "
            "эффективные схемы извлечения и обогащения полезных ископаемых: подготовка руды, "
            "обогащение, выщелачивание, плавка, управление хвостами. "
            f"{RUSSIAN_OUTPUT_RULE}"
        ),
        supplementary_context,
    )
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_content},
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
    supplementary_context: str | None = None,
) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            raw = hypothesis_generator(
                expert_list,
                prompt,
                feedback,
                chat_history,
                supplementary_context=supplementary_context,
            )
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
    supplementary_context: str | None = None,
    *,
    system_content: str | None = None,
    temperature: float = 0.7,
    critic_label: str | None = None,
) -> str:
    if system_content is None:
        system_content = append_supplementary_to_system(
            (
                f"Ты — эксперт ({expert_list}) в горном деле и обогащении полезных ископаемых. "
                "По цели, ограничениям и списку предложений оцени каждое предложение: "
                "соответствует ли оно цели и строго ли соблюдает все ограничения. "
                f"{RUSSIAN_OUTPUT_RULE}"
            ),
            supplementary_context,
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

    label = critic_label or model
    logger.info("[Critic:%s] Requesting review (%s)", label, "refinement" if is_refinement else "initial")
    log_block(logger, f"[Critic:{label}] Prompt", critic_prompt, level=logging.DEBUG)

    completion = chat_completion(
        model=model,
        temperature=temperature,
        messages=messages,
        response_format={"type": "json_object"},
    )
    raw = completion.choices[0].message.content or "{}"
    log_block(logger, f"[Critic:{label}] Raw response", raw)
    return raw


def run_critic_with_retry(
    model: str,
    expert_list: str,
    critic_prompt: str,
    feedback_history: str | None = None,
    refined_feedback_prompt: str | None = None,
    max_retries: int = 3,
    supplementary_context: str | None = None,
    *,
    system_content: str | None = None,
    temperature: float = 0.7,
    critic_label: str | None = None,
) -> dict[str, Any]:
    """Runs a single critic and parses its JSON response, retrying on empty/invalid output.

    Critic models occasionally return an empty or non-JSON response (observed in
    practice with json_object mode); retry a few times before giving up, mirroring
    generate_hypotheses_with_retry's approach for the hypothesis generator.
    """
    label = critic_label or model
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            raw = run_critic(
                model,
                expert_list,
                critic_prompt,
                feedback_history,
                refined_feedback_prompt,
                supplementary_context=supplementary_context,
                system_content=system_content,
                temperature=temperature,
                critic_label=critic_label,
            )
            parsed = json.loads(raw)
            _, critic_final_answer, no_count = process_feedback_extract_final_answer(parsed)
            logger.info(
                "[Critic:%s] Verdict=%s, suggestions flagged NO=%d (attempt %d/%d)",
                label,
                critic_final_answer,
                no_count,
                attempt,
                max_retries,
            )
            return parsed
        except (json.JSONDecodeError, ValueError) as exc:
            last_error = exc
            logger.warning("[Critic:%s] Attempt %d/%d failed to parse response: %s", label, attempt, max_retries, exc)
    if last_error is not None:
        raise last_error
    raise RuntimeError(f"Failed to get a valid critic response from {label}")


def run_all_critics(
    expert_list: str,
    goal: str,
    constraints: str,
    chat_history: str,
    supplementary_context: str | None = None,
    feedback_history: str | None = None,
    refined_feedback_prompt: str | None = None,
) -> list[dict[str, Any]]:
    critic_prompt = construct_critic_prompt(
        goal,
        constraints,
        chat_history,
        supplementary_context=supplementary_context,
    )
    feasibility_prompt = construct_feasibility_critic_prompt(
        goal,
        constraints,
        chat_history,
        supplementary_context=supplementary_context,
    )
    feasibility_system = construct_feasibility_critic_system(
        expert_list,
        supplementary_context=supplementary_context,
    )

    general_critics = [MODEL_CRITIC, MODEL_CRITIC_2, MODEL_CRITIC_3]
    critic_outputs = [
        run_critic_with_retry(
            model,
            expert_list,
            critic_prompt,
            feedback_history,
            refined_feedback_prompt,
            supplementary_context=supplementary_context,
        )
        for model in general_critics
    ]
    critic_outputs.append(
        run_critic_with_retry(
            MODEL_CRITIC_4,
            expert_list,
            feasibility_prompt,
            feedback_history,
            refined_feedback_prompt,
            supplementary_context=supplementary_context,
            system_content=feasibility_system,
            temperature=FEASIBILITY_CRITIC_TEMPERATURE,
            critic_label="feasibility",
        )
    )
    return critic_outputs


def summarize_critic_feedback(
    critic_outputs: list[dict[str, Any]],
    goal_statement: str,
    constraint_list: str,
    supplementary_context: str | None = None,
) -> dict[str, Any]:
    prompt = f"""Ты — агент-суммаризатор в фреймворке ACCELMAT для гипотез по извлечению полезных ископаемых.
Объедини обратную связь {len(critic_outputs)} критиков в один структурированный JSON-объект для уточнения гипотез.

Формулировка цели:
{goal_statement}

Ограничения:
{constraint_list}

JSON-объекты обратной связи критиков:
{json.dumps(critic_outputs, ensure_ascii=False, indent=2)}

Верни один JSON-объект в той же схеме, что и критики:
- Feedback_for_suggestion_1 ... Feedback_for_suggestion_20
- Meets_the_goal_statement_and_satisfies_all_constraints_strictly: "YES" только если ВСЕ критики согласились YES
- Overall_Feedback_for_improvement_for_future_suggestion_generation

{RUSSIAN_OUTPUT_RULE}
"""
    prompt = append_supplementary_to_prompt(prompt, supplementary_context)
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
    supplementary_context: str | None = None,
) -> dict[str, Any]:
    prompt = f"""Ты — агент оценки в фреймворке ACCELMAT для извлечения и обогащения полезных ископаемых.
Оцени качество и близость сгенерированных гипотез к цели и ограничениям.
Учитывай потенциал извлечения, техническую реализуемость, соответствие затратам/экологии и целевым рудам/минералам.

Формулировка цели:
{goal_statement}

Ограничения:
{constraint_list}

Гипотезы:
{json.dumps(hypotheses, ensure_ascii=False, indent=2)}

Верни JSON:
{{
  "scores": {{"Suggestion_1": <1-10>, "...": <1-10>}},
  "summary": "<общая оценка на русском>"
}}

{RUSSIAN_OUTPUT_RULE}
"""
    prompt = append_supplementary_to_prompt(prompt, supplementary_context)
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
    supplementary_context: str | None = None,
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
    if supplementary_context:
        log_block(logger, "[ACCELMAT] Supplementary context", supplementary_context)
    else:
        logger.info("[ACCELMAT] No supplementary Excel context for this run")

    with log_step(logger, "Step 1/5: Generate expert panel"):
        expert_list = expert_list_generator(goal, supplementary_context=supplementary_context)

    prompt = construct_prompt_for_hypotheses_generator(
        goal,
        constraints,
        kg_context,
        num_hypotheses=num_hypotheses,
        supplementary_context=supplementary_context,
    )

    with log_step(logger, "Step 2/5: Generate initial hypotheses (HGA)"):
        hypotheses = generate_hypotheses_with_retry(
            expert_list,
            prompt,
            num_hypotheses,
            supplementary_context=supplementary_context,
        )

    chat_history: list[str] = [json_to_text(hypotheses)]
    feedback_history: list[str] = []
    critic_count = 4

    with log_step(logger, f"Step 3/5: Run {critic_count} critics on initial hypotheses"):
        critic_outputs = run_all_critics(
            expert_list,
            goal,
            constraints,
            chat_history[-1],
            supplementary_context=supplementary_context,
        )
    with log_step(logger, "Step 4/5: Summarize critic feedback"):
        consolidated = summarize_critic_feedback(
            critic_outputs,
            goal,
            constraints,
            supplementary_context=supplementary_context,
        )
    processed_feedback, final_answer, no_count = process_feedback_extract_final_answer(consolidated)
    feedback_history.append(processed_feedback)
    logger.info("[ACCELMAT] Consolidated verdict=%s (%d suggestions flagged NO)", final_answer, no_count)

    attempts = 0
    while final_answer != "Yes" and attempts < max_iterations:
        attempts += 1
        logger.info("[ACCELMAT] Refinement iteration %d/%d (critics did not unanimously approve)", attempts, max_iterations)
        feedback_prompt = construct_feedback_prompt(
            processed_feedback,
            supplementary_context=supplementary_context,
        )
        with log_step(logger, f"Iteration {attempts}: Refine hypotheses (HGA)"):
            hypotheses = generate_hypotheses_with_retry(
                expert_list,
                prompt,
                num_hypotheses,
                feedback_prompt,
                chat_history[-1],
                supplementary_context=supplementary_context,
            )
        chat_history.append(json_to_text(hypotheses))

        refined_feedback_prompt = construct_feedback_prompt_for_refined_hypotheses(
            feedback_history[-1],
            chat_history[-1],
            supplementary_context=supplementary_context,
        )
        with log_step(logger, f"Iteration {attempts}: Re-run {critic_count} critics"):
            critic_outputs = run_all_critics(
                expert_list,
                goal,
                constraints,
                chat_history[-1],
                supplementary_context=supplementary_context,
                feedback_history=feedback_history[-1],
                refined_feedback_prompt=refined_feedback_prompt,
            )
        with log_step(logger, f"Iteration {attempts}: Summarize critic feedback"):
            consolidated = summarize_critic_feedback(
                critic_outputs,
                goal,
                constraints,
                supplementary_context=supplementary_context,
            )
        processed_feedback, final_answer, no_count = process_feedback_extract_final_answer(consolidated)
        feedback_history.append(processed_feedback)
        logger.info(
            "[ACCELMAT] Iteration %d verdict=%s (%d suggestions flagged NO)", attempts, final_answer, no_count
        )

    if final_answer != "Yes":
        logger.warning("[ACCELMAT] Max refinement iterations (%d) reached without unanimous approval", max_iterations)

    with log_step(logger, "Step 5/5: Evaluate final hypotheses"):
        evaluation = evaluate_hypotheses(
            goal,
            constraints,
            hypotheses,
            supplementary_context=supplementary_context,
        )

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
