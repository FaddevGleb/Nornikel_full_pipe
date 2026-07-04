#!/usr/bin/env python
"""
refiner_longrange.py - добавление связей для ИЗОЛИРОВАННЫХ узлов графа.

Логика:
- Обрабатываются ТОЛЬКО узлы без связей (degree = 0 в обе стороны)
- Кандидаты для связей выбираются из ВСЕХ узлов графа
- После каждого успешно обработанного узла граф сохраняется (checkpoint)
- При прерывании процесс можно возобновить с места остановки
"""
from dotenv import load_dotenv
load_dotenv()

import json
import logging
import shutil
import sys
import time
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))
import faiss
import numpy as np
from src.utils.llm_embeddings import get_embeddings_client
from src.utils.config import load_config
from src.utils.console_encoding import setup_console_encoding
from src.utils.exit_codes import (
    EXIT_API_LIMIT_ERROR, EXIT_CONFIG_ERROR, EXIT_INPUT_ERROR,
    EXIT_IO_ERROR, EXIT_RUNTIME_ERROR, EXIT_SUCCESS,
)
from src.utils.llm_providers import LLMClientFactory
from src.utils.validation import validate_graph_invariants, validate_json
from src.utils.ontology_config import ONTOLOGY_CONSTRAINTS

setup_console_encoding()

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

logger = logging.getLogger("refiner")


def setup_json_logging(config):
    """Настраивает JSON Lines логирование для refiner."""
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file = log_dir / f"refiner_longrange_{timestamp}.log"
    
    class JSONLineFormatter(logging.Formatter):
        def format(self, record):
            log_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": record.levelname,
                "event": getattr(record, "event", "log")
            }
            for key in ["node_id", "target", "type", "weight", "tokens_used",
                        "duration_ms", "edges_added", "error"]:
                if hasattr(record, key):
                    log_data[key] = getattr(record, key)
            if record.getMessage():
                log_data["message"] = record.getMessage()
            return json.dumps(log_data, ensure_ascii=False)
    
    refiner_logger = logging.getLogger("refiner")
    refiner_logger.setLevel(logging.DEBUG if config.get("log_level", "info").lower() == "debug" else logging.INFO)
    refiner_logger.handlers = []
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(JSONLineFormatter())
    refiner_logger.addHandler(file_handler)
    
    refiner_logger.info("Refiner started (isolated nodes mode)", extra={
        "event": "refiner_longrange_start",
        "config": {
            "model": config["model"],
            "sim_threshold": config["sim_threshold"],
            "max_pairs_per_node": config["max_pairs_per_node"]
        }
    })
    return refiner_logger


def validate_refiner_longrange_config(config):
    """Валидирует параметры конфигурации refiner."""
    required = [
        "embedding_model", "sim_threshold", "max_pairs_per_node",
        "model", "api_key", "tpm_limit", "max_completion", "faiss_M", "faiss_metric"
    ]
    for param in required:
        if param not in config:
            raise ValueError(f"Missing required parameter: {param}")
    if not config["api_key"].strip():
        raise ValueError("api_key cannot be empty")
    if not 0 <= config["sim_threshold"] <= 1:
        raise ValueError(f"sim_threshold must be in [0,1], got {config['sim_threshold']}")
    if config["max_pairs_per_node"] <= 0:
        raise ValueError(f"max_pairs_per_node must be > 0")
    if config["faiss_M"] <= 0:
        raise ValueError(f"faiss_M must be > 0")
    if config["faiss_metric"] not in ["INNER_PRODUCT", "L2"]:
        raise ValueError(f"faiss_metric must be INNER_PRODUCT or L2")


def load_and_validate_graph(input_path):
    """Загружает граф. Ошибки схемы - warning, не crash."""
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    with open(input_path, encoding="utf-8") as f:
        graph_data = json.load(f)
    if "nodes" not in graph_data or "edges" not in graph_data:
        raise ValueError("Invalid graph structure: missing nodes or edges")
    
    try:
        validate_json({"nodes": graph_data["nodes"], "edges": graph_data["edges"]}, "LearningChunkGraph")
    except Exception as e:
        logger.warning(f"Schema validation warning (continuing): {e}")
    
    return graph_data


def extract_isolated_nodes(graph):
    """
    Находит узлы БЕЗ КАКИХ-ЛИБО связей (изолированные).
    Узел считается изолированным, если он не встречается ни как source,
    ни как target ни в одном ребре графа.
    """
    # Собираем все узлы, участвующие в рёбрах
    connected_ids = set()
    for edge in graph.get("edges", []):
        connected_ids.add(edge.get("source"))
        connected_ids.add(edge.get("target"))
    
    # Фильтруем узлы - оставляем только изолированные с непустым текстом
    isolated = []
    for node in graph.get("nodes", []):
        node_id = node.get("id")
        if node_id in connected_ids:
            continue
        # Нужен текст для генерации эмбеддингов
        text = node.get("text") or node.get("definition") or node.get("name") or ""
        if text.strip():
            isolated.append(node)
    
    return isolated


def get_node_text(node):
    """Извлекает текст узла для эмбеддингов (с фолбэками)."""
    return node.get("text") or node.get("definition") or node.get("name") or ""


def build_embeddings_for_nodes(nodes, config, logger):
    """Генерирует эмбеддинги для списка узлов. Возвращает dict {node_id: embedding}."""
    texts = []
    node_ids = []
    for node in nodes:
        text = get_node_text(node)
        if text.strip():
            texts.append(text)
            node_ids.append(node["id"])
    
    if not texts:
        return {}
    
    logger.info(f"Getting embeddings for {len(texts)} nodes...")
    try:
        client = get_embeddings_client(config)
        embeddings = client.get_embeddings(texts)
        embeddings_dict = {}
        for i, node_id in enumerate(node_ids):
            embeddings_dict[node_id] = embeddings[i]
        logger.info(f"Successfully obtained {len(embeddings_dict)} embeddings")
        return embeddings_dict
    except Exception as e:
        logger.error(f"Failed to get embeddings: {e}")
        raise


def build_faiss_index(embeddings_dict, node_ids_order, config, logger):
    """Строит FAISS индекс в заданном порядке узлов."""
    embeddings_list = []
    for node_id in node_ids_order:
        if node_id in embeddings_dict:
            embeddings_list.append(embeddings_dict[node_id])
    
    if not embeddings_list:
        raise ValueError("No embeddings to build index")
    
    matrix = np.array(embeddings_list, dtype=np.float32)
    dim = matrix.shape[1]
    logger.info(f"Building FAISS index: dim={dim}, M={config['faiss_M']}, metric={config['faiss_metric']}")
    
    metric = faiss.METRIC_INNER_PRODUCT if config["faiss_metric"] == "INNER_PRODUCT" else faiss.METRIC_L2
    index = faiss.IndexHNSWFlat(dim, config["faiss_M"], metric)
    index.hnsw.efConstruction = config.get("faiss_efC", 200)
    index.add(matrix)
    
    logger.info(f"FAISS index built with {index.ntotal} vectors")
    return index


def find_best_candidates(isolated_id, isolated_emb, index, all_node_ids, config):
    """
    Находит топ-K кандидатов для изолированного узла среди ВСЕХ узлов.
    Возвращает список (candidate_id, similarity).
    """
    k = min(config["max_pairs_per_node"] + 1, len(all_node_ids))
    query = np.array([isolated_emb], dtype=np.float32)
    similarities, indices = index.search(query, k)
    
    threshold = config["sim_threshold"]
    candidates = []
    
    isolated_idx = None
    if isolated_id in all_node_ids:
        isolated_idx = all_node_ids.index(isolated_id)
    
    for sim, idx in zip(similarities[0], indices[0]):
        if idx == -1:
            break
        if idx == isolated_idx:
            continue  # пропускаем сам узел
        if sim < threshold:
            continue
        candidate_id = all_node_ids[idx]
        candidates.append((candidate_id, float(sim)))
    
    # Сортируем по убыванию сходства и берём top-K
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[:config["max_pairs_per_node"]]


def load_refiner_prompt(config):
    """Загружает промпт для refiner (forward pass)."""
    prompt_path = Path(__file__).parent / "prompts" / "refiner_longrange_fw.md"
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    with open(prompt_path, encoding="utf-8") as f:
        return f.read()


def save_checkpoint(graph, output_path, processed_ids):
    """
    Сохраняет граф с обновлённым списком обработанных изолированных узлов.
    Атомарная запись через временный файл для защиты от прерываний.
    """
    if "_meta" not in graph:
        graph["_meta"] = {}
    if "refiner_longrange" not in graph["_meta"]:
        graph["_meta"]["refiner_longrange"] = {}
    
    graph["_meta"]["refiner_longrange"]["processed_isolated_ids"] = sorted(list(processed_ids))
    graph["_meta"]["refiner_longrange"]["last_checkpoint_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Атомарная запись: сначала в .tmp, потом rename
    temp_path = output_path.with_suffix(".json.tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(graph, f, ensure_ascii=False, indent=2)
    temp_path.replace(output_path)


def load_processed_ids(graph):
    """Загружает список уже обработанных изолированных узлов из метаданных."""
    try:
        return set(graph.get("_meta", {}).get("refiner_longrange", {}).get("processed_isolated_ids", []))
    except Exception:
        return set()


def analyze_isolated_node(isolated_node, candidates_data, graph, config, llm_client, prompt, logger):
    """
    Отправляет один изолированный узел + его кандидатов в LLM.
    Возвращает список новых валидных рёбер.
    """
    source_id = isolated_node["id"]
    source_text = get_node_text(isolated_node)
    source_type = isolated_node.get("type", "Concept")
    
    # Формируем candidates с текстами
    nodes_by_id = {n["id"]: n for n in graph.get("nodes", [])}
    candidates_for_llm = []
    for cand_id, similarity in candidates_data:
        cand_node = nodes_by_id.get(cand_id)
        if not cand_node:
            continue
        candidates_for_llm.append({
            "node_id": cand_id,
            "type": cand_node.get("type", "Concept"),
            "text": get_node_text(cand_node)[:500],  # Обрезаем для экономии токенов
            "similarity": similarity
        })
    
    if not candidates_for_llm:
        return []
    
    input_data = {
        "source_node": {
            "id": source_id,
            "type": source_type,
            "text": source_text[:1000]
        },
        "candidates": candidates_for_llm
    }
    
    max_retries = config.get("max_retries", 3)
    last_error_type = None
    request_start = time.time()
    
    for attempt in range(max_retries + 1):
        try:
            if attempt == 0:
                response_text, response_id, usage = llm_client.create_response(
                    instructions=prompt,
                    input_data=json.dumps(input_data, ensure_ascii=False, indent=2),
                )
            else:
                repair_hint = ""
                if last_error_type == "json":
                    repair_hint = "\nPLEASE RETURN ONLY VALID JSON ARRAY, NO OTHER TEXT."
                elif last_error_type == "timeout":
                    repair_hint = "\nBE CONCISE. Focus on important edges."
                
                response_text, response_id, usage = llm_client.repair_response(
                    instructions=prompt + repair_hint,
                    input_data=json.dumps(input_data, ensure_ascii=False, indent=2),
                )
            
            # Парсим JSON
            edges_response = json.loads(response_text)
            llm_client.confirm_response()
            
            # Валидируем и возвращаем
            valid_edges = validate_llm_edges(
                edges_response, source_id, {c["node_id"] for c in candidates_for_llm},
                graph, logger
            )
            
            duration_ms = int((time.time() - request_start) * 1000)
            tokens_used = usage.total_tokens if usage else 0
            logger.info(
                f"Analyzed isolated node {source_id}: {len(valid_edges)} edges, "
                f"{tokens_used} tokens, {duration_ms}ms",
                extra={
                    "event": "isolated_node_processed",
                    "node_id": source_id,
                    "edges_added": len(valid_edges),
                    "tokens_used": tokens_used,
                    "duration_ms": duration_ms,
                }
            )
            return valid_edges
        
        except json.JSONDecodeError as e:
            last_error_type = "json"
            logger.warning(f"JSON decode failed for {source_id}, attempt {attempt + 1}/{max_retries + 1}: {e}")
            if attempt == max_retries:
                bad_path = Path(f"logs/{source_id}_bad.json")
                bad_path.parent.mkdir(exist_ok=True)
                with open(bad_path, "w", encoding="utf-8") as f:
                    json.dump({"node_id": source_id, "response": response_text, "error": str(e)},
                              f, ensure_ascii=False, indent=2)
                return []
            continue
        
        except TimeoutError:
            last_error_type = "timeout"
            if attempt == max_retries:
                return []
            time.sleep(30 * (attempt + 1))
        
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate limit" in error_str.lower():
                last_error_type = "rate_limit"
                if attempt == max_retries:
                    return []
                time.sleep(30 * (attempt + 1))
            else:
                logger.error(f"Unexpected error for node {source_id}: {e}")
                return []
    
    return []


def validate_llm_edges(edges_response, source_id, candidate_ids, graph, logger):
    """Валидирует рёбра от LLM с учётом онтологии."""
    # Все допустимые типы онтологических рёбер (для материаловедения)
    valid_edge_types = {
        "IMPROVES", "DEGRADES", "CAUSES", "MITIGATES", "REQUIRES_CONDITION",
        "SYNTHESIZED_BY", "CHARACTERIZED_BY", "HAS_FAILURE_MODE", "APPLIED_IN",
        "SUPPORTED_BY", "SUBCLASS_OF",
        "REQUIRES_EQUIPMENT", "USES_FEEDSTOCK", "IMPACTS_COST", "HAS_REGULATION",
        "SUBSTITUTE_FOR", "ANALOGOUS_TO",
        "TESTED_BY", "CONFIRMS", "REFUTES",
        "PREREQUISITE", "ELABORATES", "EXAMPLE_OF", "MENTIONS",
        "HINT_FORWARD", "REFER_BACK", "PARALLEL", "TESTS", "REVISION_OF",
    }
    node_registry = {n["id"]: n["type"] for n in graph.get("nodes", [])}
    valid_edges = []
    
    if not isinstance(edges_response, list):
        return []
    
    for edge_data in edges_response:
        if not isinstance(edge_data, dict):
            continue
        if edge_data.get("type") is None:
            continue
        
        source = edge_data.get("source")
        target = edge_data.get("target")
        edge_type = edge_data.get("type")
        
        if not all([source, target, edge_type]):
            continue
        if source != source_id:
            continue
        if target not in candidate_ids:
            continue
        if source == target:
            continue
        if edge_type not in valid_edge_types:
            logger.warning(f"Rejected unknown edge type: {edge_type}")
            continue
        
        # Онтологическая валидация
        s_type = node_registry.get(source)
        t_type = node_registry.get(target)
        if s_type and t_type:
            constraints = ONTOLOGY_CONSTRAINTS.get(edge_type)
            if constraints:
                if s_type not in constraints["domain"] or t_type not in constraints["range"]:
                    continue
                if edge_type == "SUBCLASS_OF" and s_type != t_type:
                    continue
        
        # Формируем attributes
        attrs = edge_data.get("attributes", {})
        if not isinstance(attrs, dict):
            attrs = {}
        if "confidence_score" not in attrs:
            attrs["confidence_score"] = edge_data.get("weight", 0.5)
        attrs["added_by"] = "refiner_longrange_isolated"
        
        valid_edges.append({
            "source": source,
            "target": target,
            "type": edge_type,
            "attributes": attrs
        })
    
    return valid_edges


def add_edges_to_graph(graph, new_edges):
    """Добавляет валидированные рёбра в граф, избегая дубликатов."""
    existing_keys = {(e["source"], e["target"], e["type"]) for e in graph.get("edges", [])}
    added = 0
    for edge in new_edges:
        key = (edge["source"], edge["target"], edge["type"])
        if key in existing_keys:
            continue
        graph["edges"].append(edge)
        existing_keys.add(key)
        added += 1
    return added


def main():
    try:
        config = load_config()
        refiner_config = config["refiner"]
        
        if not refiner_config.get("run", True):
            print("Refiner longrange is disabled (run=false), copying file without changes")
            input_path = Path("data/out/LearningChunkGraph_dedup.json")
            output_path = Path("data/out/LearningChunkGraph_longrange.json")
            if not input_path.exists():
                return EXIT_INPUT_ERROR
            shutil.copy2(input_path, output_path)
            return EXIT_SUCCESS
        
        logger = setup_json_logging(refiner_config)
        validate_refiner_longrange_config(refiner_config)
        
        # ВХОД: dedup.json (если есть) или raw.json
        input_path = Path("data/out/LearningChunkGraph_dedup.json")
        if not input_path.exists():
            input_path = Path("data/out/LearningChunkGraph_raw.json")
        output_path = Path("data/out/LearningChunkGraph_longrange.json")
        
        # Если output уже существует - используем его как вход для возобновления
        if output_path.exists():
            logger.info(f"Resuming from existing checkpoint: {output_path}")
            input_path = output_path
        
        graph = load_and_validate_graph(input_path)
        total_nodes = len(graph.get("nodes", []))
        total_edges_before = len(graph.get("edges", []))
        
        # === ШАГ 1: Находим изолированные узлы ===
        isolated_nodes = extract_isolated_nodes(graph)
        logger.info(f"Found {len(isolated_nodes)} isolated nodes out of {total_nodes} total")
        
        if not isolated_nodes:
            logger.info("No isolated nodes to process - graph is fully connected")
            print("No isolated nodes to process - graph is fully connected")
            # Всё равно сохраняем (с метаданными)
            save_checkpoint(graph, output_path, load_processed_ids(graph))
            return EXIT_SUCCESS
        
        # === ШАГ 2: Загружаем список уже обработанных ===
        processed_ids = load_processed_ids(graph)
        nodes_to_process = [n for n in isolated_nodes if n["id"] not in processed_ids]
        
        logger.info(
            f"Isolated nodes: {len(isolated_nodes)} total, "
            f"{len(processed_ids)} already processed, "
            f"{len(nodes_to_process)} to process"
        )
        print(f"Isolated nodes: {len(nodes_to_process)} to process (of {len(isolated_nodes)} total)")
        
        if not nodes_to_process:
            logger.info("All isolated nodes already processed")
            print("All isolated nodes already processed - graph is up to date")
            save_checkpoint(graph, output_path, processed_ids)
            return EXIT_SUCCESS
        
        # === ШАГ 3: Строим эмбеддинги для ВСЕХ узлов (для кандидатов) ===
        all_nodes = graph.get("nodes", [])
        all_nodes_with_text = [n for n in all_nodes if get_node_text(n).strip()]
        all_node_ids = [n["id"] for n in all_nodes_with_text]
        
        logger.info(f"Building embeddings for {len(all_nodes_with_text)} total nodes (candidate pool)")
        all_embeddings = build_embeddings_for_nodes(all_nodes_with_text, refiner_config, logger)
        
        # FAISS индекс по всем узлам
        faiss_index = build_faiss_index(all_embeddings, all_node_ids, refiner_config, logger)
        
        # === ШАГ 4: Инициализируем LLM клиент и промпт ===
        llm_client = LLMClientFactory.create_client(refiner_config)
        prompt = load_refiner_prompt(refiner_config)
        
        # === ШАГ 5: Обрабатываем изолированные узлы ПО ОДНОМУ ===
        start_time = time.time()
        total_edges_added = 0
        nodes_processed_now = 0
        nodes_failed = 0
        
        utc3_tz = timezone(timedelta(hours=3))
        start_timestamp = datetime.now(utc3_tz).strftime("%H:%M:%S")
        print(
            f"[{start_timestamp}] START    | {len(nodes_to_process)} isolated nodes | "
            f"model={refiner_config['model']}"
        )
        
        for i, isolated_node in enumerate(nodes_to_process):
            node_id = isolated_node["id"]
            
            # Пропускаем, если уже обработан (на случай race condition)
            if node_id in processed_ids:
                continue
            
            # Находим кандидатов среди ВСЕХ узлов
            node_emb = all_embeddings.get(node_id)
            if node_emb is None:
                logger.warning(f"No embedding for node {node_id}, skipping")
                nodes_failed += 1
                continue
            
            candidates = find_best_candidates(
                node_id, node_emb, faiss_index, all_node_ids, refiner_config
            )
            
            if not candidates:
                logger.info(f"No candidates above threshold for {node_id}")
                # Всё равно помечаем как обработанный, чтобы не крутить каждый раз
                processed_ids.add(node_id)
                continue
            
            # Отправляем в LLM
            new_edges = analyze_isolated_node(
                isolated_node, candidates, graph, refiner_config, llm_client, prompt, logger
            )
            
            # Добавляем в граф
            added = add_edges_to_graph(graph, new_edges)
            total_edges_added += added
            
            # Помечаем как обработанный
            processed_ids.add(node_id)
            nodes_processed_now += 1
            
            # === CHECKPOINT: сохраняем граф после КАЖДОГО узла ===
            save_checkpoint(graph, output_path, processed_ids)
            
            # Прогресс в консоль
            node_timestamp = datetime.now(utc3_tz).strftime("%H:%M:%S")
            print(
                f"[{node_timestamp}] NODE     | ✅ {i + 1:03d}/{len(nodes_to_process):03d} | "
                f"{node_id} | +{added} edges | total_edges={len(graph['edges'])}"
            )
        
        # === Финальная статистика ===
        elapsed = int(time.time() - start_time)
        minutes, seconds = divmod(elapsed, 60)
        end_timestamp = datetime.now(utc3_tz).strftime("%H:%M:%S")
        
        # Обновляем итоговые метаданные
        if "_meta" not in graph:
            graph["_meta"] = {}
        graph["_meta"]["refiner_longrange"] = {
            "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "mode": "isolated_nodes",
            "config": {
                "model": refiner_config["model"],
                "sim_threshold": refiner_config["sim_threshold"],
                "max_pairs_per_node": refiner_config["max_pairs_per_node"],
            },
            "stats": {
                "total_isolated": len(isolated_nodes),
                "processed_this_run": nodes_processed_now,
                "failed_this_run": nodes_failed,
                "edges_added_this_run": total_edges_added,
                "total_processed_ever": len(processed_ids),
            },
            "processed_isolated_ids": sorted(list(processed_ids)),
        }
        
        # Финальное сохранение
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(graph, f, ensure_ascii=False, indent=2)
        
        print(
            f"[{end_timestamp}] END      | Done | "
            f"processed={nodes_processed_now} | edges_added={total_edges_added} | "
            f"time={minutes}m {seconds}s"
        )
        print(
            f"           | Graph: {total_nodes} nodes, "
            f"{total_edges_before} → {len(graph['edges'])} edges"
        )
        
        return EXIT_SUCCESS
    
    except KeyboardInterrupt:
        print("\n[INTERRUPT] Processing stopped by user - progress saved")
        return EXIT_RUNTIME_ERROR
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return EXIT_RUNTIME_ERROR


if __name__ == "__main__":
    sys.exit(main())