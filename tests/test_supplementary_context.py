import json
from pathlib import Path

import pytest
from openpyxl import Workbook

from supplementary_context import (
    SUPPLEMENTARY_HEADER,
    append_supplementary_to_prompt,
    build_supplementary_context,
    format_context_section,
    parse_excel_workbook,
)


@pytest.fixture
def sample_xlsx(tmp_path: Path) -> Path:
    path = tmp_path / "ore_grades.xlsx"
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Grades"
    sheet["A1"] = "Mineral"
    sheet["B1"] = "Grade g/t"
    sheet["A2"] = "Gold"
    sheet["B2"] = 4.2
    sheet2 = workbook.create_sheet("Recovery")
    sheet2["A1"] = "Stage"
    sheet2["B1"] = "Recovery %"
    sheet2["A2"] = "Flotation"
    sheet2["B2"] = 87
    workbook.save(path)
    return path


def test_parse_excel_workbook(sample_xlsx: Path) -> None:
    parsed = parse_excel_workbook(sample_xlsx)
    assert parsed.filename == "ore_grades.xlsx"
    assert len(parsed.sheets) == 2
    assert "Gold" in parsed.sheets[0].markdown
    assert "Flotation" in parsed.sheets[1].markdown


def test_build_supplementary_context_truncation(sample_xlsx: Path) -> None:
    result = build_supplementary_context(
        [sample_xlsx],
        max_total_chars=80,
        max_chars_per_sheet=40,
    )
    assert result.documents[0]["filename"] == "ore_grades.xlsx"
    assert "[truncated]" in result.formatted_text
    assert SUPPLEMENTARY_HEADER.strip() in result.formatted_text


def test_format_context_section_empty() -> None:
    assert format_context_section("") == ""
    assert format_context_section("   ") == ""


def test_append_supplementary_to_prompt() -> None:
    prompt = append_supplementary_to_prompt("Base prompt", "Table data")
    assert "Base prompt" in prompt
    assert "Дополнительные документы" in prompt
    assert "Table data" in prompt


def test_build_supplementary_context_missing_file(tmp_path: Path) -> None:
    result = build_supplementary_context([tmp_path / "missing.xlsx"])
    assert result.documents == []
    assert result.formatted_text == ""
