"""
llm_embeddings.py - получение векторных эмбеддингов.
Поддерживает только локальные модели (sentence-transformers).
Для онлайн-моделей (OpenAI, OpenRouter) используйте отдельные клиенты.
"""
import logging
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer


logger = logging.getLogger(__name__)

HF_DEFAULT_EMBEDDING = "intfloat/multilingual-e5-large"
LOCAL_MODEL_MARKERS = (
    "config_sentence_transformers.json",
    "modules.json",
    "model.safetensors",
    "pytorch_model.bin",
    "config.json",
)


def _is_hf_repo_id(value: str) -> bool:
    if not value or "\\" in value:
        return False
    if value.startswith(("C:", "c:", "D:", "d:", "/", "~")):
        return False
    return "/" in value and ".." not in value


def _local_embedding_ready(path: Path) -> bool:
    return path.is_dir() and any((path / name).is_file() for name in LOCAL_MODEL_MARKERS)


def resolve_embedding_model(model_name: str | None) -> str:
    if not model_name:
        return HF_DEFAULT_EMBEDDING

    if _is_hf_repo_id(model_name):
        return model_name

    local_path = Path(model_name).expanduser()
    try:
        local_path = local_path.resolve(strict=False)
    except OSError:
        local_path = local_path.absolute()

    if _local_embedding_ready(local_path):
        return str(local_path)

    logger.warning(
        "Local embedding model not found at %s; using HuggingFace model %s",
        local_path,
        HF_DEFAULT_EMBEDDING,
    )
    return HF_DEFAULT_EMBEDDING


class LocalEmbeddingsClient:
    """Локальный клиент эмбеддингов (без API, работает оффлайн)."""
    
    def __init__(self, config):
        """Загружает модель sentence-transformers из локального кэша или HuggingFace."""
        model_name = resolve_embedding_model(config.get("embedding_model"))
        logger.info(f"Loading local embedding model: {model_name}")
        
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Embedding model loaded. Dimension: {self.dimension}")
    
    def get_embeddings(self, texts):
        """
        Получает эмбеддинги для списка текстов.
        Возвращает нормализованные векторы (косинусное сходство = скалярное произведение).
        """
        if not texts:
            return np.array([])
        
        # Заменяем пустые строки пробелами (SentenceTransformer не любит пустые)
        valid_texts = [t if t.strip() else " " for t in texts]
        
        logger.info(f"Generating embeddings for {len(valid_texts)} texts...")
        
        embeddings = self.model.encode(
            valid_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,  # Векторы единичной длины
            batch_size=256,
            show_progress_bar=True
        )
        
        return embeddings


def get_embeddings_client(config):
    """
    Фабрика клиентов эмбеддингов.
    В текущей версии возвращает только локальный клиент.
    """
    return LocalEmbeddingsClient(config)


def get_embeddings(texts, config):
    """
    Обёртка для обратной совместимости с dedup.py и refiner.py.
    Создаёт клиент и сразу получает эмбеддинги.
    """
    client = LocalEmbeddingsClient(config)
    return client.get_embeddings(texts)


def cosine_similarity_batch(embeddings1, embeddings2):
    """
    Вычисляет косинусное сходство между двумя наборами эмбеддингов.
    Для нормализованных векторов это просто скалярное произведение.
    """
    return np.dot(embeddings1, embeddings2.T)
