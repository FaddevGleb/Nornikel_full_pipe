"""
Глобальная конфигурация для pytest.
Загружает workspace project.toml через NORNIKEL_PROJECT_ROOT.
"""

import os
from pathlib import Path

import pytest
from dotenv import load_dotenv

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
os.environ.setdefault("NORNIKEL_PROJECT_ROOT", str(WORKSPACE_ROOT))

# Legacy .env fallback for integration tests that still read env vars directly
load_dotenv()


@pytest.fixture
def temp_project_dir(tmp_path):
    """
    Создает временную структуру проекта для тестов.
    Возвращает кортеж (temp_path, raw_dir, staging_dir, out_dir, logs_dir).
    """
    # Создаем структуру директорий как в реальном проекте
    raw_dir = tmp_path / "data" / "raw"
    staging_dir = tmp_path / "data" / "staging"
    out_dir = tmp_path / "data" / "out"
    logs_dir = tmp_path / "logs"
    
    raw_dir.mkdir(parents=True)
    staging_dir.mkdir(parents=True)
    out_dir.mkdir(parents=True)
    logs_dir.mkdir()
    
    return tmp_path, raw_dir, staging_dir, out_dir, logs_dir
