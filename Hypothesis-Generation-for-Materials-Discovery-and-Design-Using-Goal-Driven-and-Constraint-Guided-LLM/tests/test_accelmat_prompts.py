from agent_framework_materials_discovery import (
    FEASIBILITY_CRITIC_TEMPERATURE,
    construct_critic_prompt,
    construct_feasibility_critic_prompt,
    construct_feasibility_critic_system,
    construct_prompt_for_hypotheses_generator,
    evaluate_hypotheses,
    summarize_critic_feedback,
)
from supplementary_context import SUPPLEMENTARY_HEADER

SUPPLEMENTARY = "#### File: ore.xlsx\n| Mineral | Grade |\n| Gold | 4.2 |"


def test_hga_prompt_includes_supplementary_context() -> None:
    prompt = construct_prompt_for_hypotheses_generator(
        "Increase gold recovery",
        " 1) Cost under 10M",
        kg_context=None,
        num_hypotheses=3,
        supplementary_context=SUPPLEMENTARY,
    )
    assert "Increase gold recovery" in prompt
    assert SUPPLEMENTARY_HEADER.strip() in prompt
    assert "Gold" in prompt


def test_critic_prompt_includes_supplementary_context() -> None:
    prompt = construct_critic_prompt(
        "Goal",
        " 1) Constraint",
        "Suggestion_1: ...",
        supplementary_context=SUPPLEMENTARY,
    )
    assert "Дополнительные документы" in prompt
    assert "Gold" in prompt


def test_summarizer_prompt_includes_supplementary_context() -> None:
    from unittest.mock import patch

    with patch("agent_framework_materials_discovery.chat_completion") as mock_chat:
        mock_chat.return_value.choices = [type("Choice", (), {"message": type("Msg", (), {"content": "{}"})()})()]
        summarize_critic_feedback(
            [{"Feedback_for_suggestion_1": {"Meets_the_goal_statement_and_satisfies_all_constraints_strictly": "YES"}}],
            "Goal",
            " 1) Constraint",
            supplementary_context=SUPPLEMENTARY,
        )
        sent_prompt = mock_chat.call_args.kwargs["messages"][0]["content"]
        assert "Дополнительные документы" in sent_prompt
        assert "Gold" in sent_prompt


def test_feasibility_critic_prompt_focuses_on_industrial_feasibility() -> None:
    prompt = construct_feasibility_critic_prompt(
        "Goal",
        " 1) Constraint",
        "Suggestion_1: ...",
    )
    assert "промышлен" in prompt.lower()
    assert "реализуем" in prompt.lower()
    assert "Feedback_for_suggestion_1" in prompt


def test_feasibility_critic_system_is_strict() -> None:
    system = construct_feasibility_critic_system("Expert_1, Expert_2")
    assert "главный технолог" in system.lower()
    assert "при любом сомнении" in system.lower()
    assert FEASIBILITY_CRITIC_TEMPERATURE == 0.3


def test_feasibility_critic_prompt_includes_supplementary_context() -> None:
    prompt = construct_feasibility_critic_prompt(
        "Goal",
        " 1) Constraint",
        "Suggestion_1: ...",
        supplementary_context=SUPPLEMENTARY,
    )
    assert "Дополнительные документы" in prompt
    assert "Gold" in prompt


def test_summarizer_mentions_critic_count() -> None:
    from unittest.mock import patch

    critic_outputs = [{"Feedback_for_suggestion_1": {"Meets_the_goal_statement_and_satisfies_all_constraints_strictly": "YES"}}] * 4
    with patch("agent_framework_materials_discovery.chat_completion") as mock_chat:
        mock_chat.return_value.choices = [type("Choice", (), {"message": type("Msg", (), {"content": "{}"})()})()]
        summarize_critic_feedback(critic_outputs, "Goal", " 1) Constraint")
        sent_prompt = mock_chat.call_args.kwargs["messages"][0]["content"]
        assert "4 критиков" in sent_prompt


def test_evaluation_prompt_includes_supplementary_context() -> None:
    from unittest.mock import patch

    with patch("agent_framework_materials_discovery.chat_completion") as mock_chat:
        mock_chat.return_value.choices = [type("Choice", (), {"message": type("Msg", (), {"content": "{\"scores\": {}, \"summary\": \"ok\"}"})()})()]
        evaluate_hypotheses(
            "Goal",
            " 1) Constraint",
            {"Suggestion_1": {"Materials": "Gold", "Methods_to_develop_the_materials_suggested": "Flotation", "Reasoning": "Test"}},
            supplementary_context=SUPPLEMENTARY,
        )
        sent_prompt = mock_chat.call_args.kwargs["messages"][0]["content"]
        assert "Дополнительные документы" in sent_prompt
        assert "Gold" in sent_prompt
