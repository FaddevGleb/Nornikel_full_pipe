#!/usr/bin/env python3
"""
iText2KG Concepts - извлечение концептов из текстовых слайсов с помощью LLM.
Поддерживает incremental режим с чекпоинтами:
- Загружает существующий ConceptDictionary
- Обрабатывает только новые (необработанные) слайсы
- Сохраняет прогресс после каждого успешного слайса
- При прерывании - можно продолжить с места остановки
"""
from dotenv import load_dotenv
load_dotenv()

import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from src.utils.config import load_config
from src.utils.console_encoding import setup_console_encoding
from src.utils.exit_codes import (
    EXIT_CONFIG_ERROR, EXIT_INPUT_ERROR, EXIT_IO_ERROR,
    EXIT_RUNTIME_ERROR, EXIT_SUCCESS,
)
from src.utils.llm_providers import LLMClientFactory
from src.utils.validation import (
    ValidationError,
    validate_concept_dictionary_invariants,
    validate_json,
)

setup_console_encoding()

CONFIG_PATH = Path(__file__).parent / "config.toml"
PROMPTS_DIR = Path(__file__).parent / "prompts"
SCHEMAS_DIR = Path(__file__).parent / "schemas"
STAGING_DIR = Path(__file__).parent.parent / "data" / "staging"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "out"
LOGS_DIR = Path(__file__).parent.parent / "logs"
EXTRACTION_PROMPT_FILE = "itext2kg_concepts_extraction.md"

# Разрешённые онтологические классы
ALLOWED_ONTOLOGY_CLASSES = {
    "Material", "Property", "SynthesisMethod", "CharacterizationMethod",
    "Mechanism", "Condition", "FailureMode", "Application", "KPI_Target",
    "Source", "Concept",
}


class ProcessingStats:
    def __init__(self):
        self.total_slices = 0
        self.processed_slices = 0
        self.skipped_slices = 0
        self.total_concepts = 0
        self.total_tokens_used = 0
        self.start_time = datetime.now()


class SliceData:
    def __init__(self, id, order, source_file, slug, text, slice_token_start, slice_token_end):
        self.id = id
        self.order = order
        self.source_file = source_file
        self.slug = slug
        self.text = text
        self.slice_token_start = slice_token_start
        self.slice_token_end = slice_token_end


class SliceProcessor:
    def __init__(self, config, incremental=False):
        self.config = config["itext2kg_concepts"]
        self.full_config = config
        self.incremental = incremental
        self.llm_client = LLMClientFactory.create_client(self.config)
        self.logger = self._setup_logger()
        self.stats = ProcessingStats()

        # Словарь концептов
        self.concept_dictionary = {"concepts": []}
        self.concept_id_map = {}

        # === CHECKPOINT: список уже обработанных слайсов ===
        self.processed_slice_ids = set()

        self.previous_response_id = None
        self.api_usage = {
            "total_requests": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
        }

        # Загружаем существующие данные в incremental режиме
        if self.incremental:
            self._load_existing_state()

        self.extraction_prompt = self._load_extraction_prompt()

    def _load_existing_state(self):
        """Загружает существующий словарь и список обработанных слайсов."""
        dict_path = OUTPUT_DIR / "ConceptDictionary.json"

        if not dict_path.exists():
            self.logger.warning("No existing ConceptDictionary found, starting fresh")
            self.incremental = False
            return

        try:
            with open(dict_path, encoding="utf-8") as f:
                data = json.load(f)

            self.concept_dictionary = {"concepts": data.get("concepts", [])}

            # Строим lookup
            for idx, concept in enumerate(self.concept_dictionary["concepts"]):
                concept_id = concept.get("concept_id")
                if concept_id:
                    self.concept_id_map[concept_id] = idx

            # Загружаем список обработанных слайсов из метаданных
            meta = data.get("_meta", {}).get("itext2kg_concepts", {})
            self.processed_slice_ids = set(meta.get("processed_slice_ids", []))

            self.stats.total_concepts = len(self.concept_dictionary["concepts"])

            self.logger.info(
                f"Loaded existing state: {len(self.concept_dictionary['concepts'])} concepts, "
                f"{len(self.processed_slice_ids)} processed slices"
            )
            print(
                f"Incremental mode: loaded {len(self.concept_dictionary['concepts'])} concepts, "
                f"{len(self.processed_slice_ids)} already processed slices"
            )

        except Exception as e:
            self.logger.error(f"Failed to load existing dictionary: {e}")
            self.logger.warning("Starting with empty dictionary")
            self.incremental = False

    def _format_tokens(self, tokens):
        if tokens < 1000:
            return str(tokens)
        elif tokens < 1_000_000:
            return f"{tokens / 1000:.2f}k"
        else:
            return f"{tokens / 1_000_000:.2f}M"

    def _setup_logger(self):
        logger = logging.getLogger("itext2kg_concepts")
        logger.setLevel(getattr(logging, self.config["log_level"].upper()))

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        log_file = LOGS_DIR / f"itext2kg_concepts_{timestamp}.log"
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(file_handler)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(
            logging.Formatter("[%(asctime)s] %(levelname)-8s | %(message)s", datefmt="%H:%M:%S")
        )
        logger.addHandler(console_handler)

        return logger

    def _load_extraction_prompt(self):
        prompt_path = PROMPTS_DIR / EXTRACTION_PROMPT_FILE
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

        prompt_content = prompt_path.read_text(encoding="utf-8")
        concept_schema_path = SCHEMAS_DIR / "ConceptDictionary.schema.json"
        concept_schema = json.loads(concept_schema_path.read_text(encoding="utf-8"))
        prompt_content = prompt_content.replace(
            "{concept_dictionary_schema}", json.dumps(concept_schema, indent=2)
        )
        return prompt_content

    def _load_slice(self, slice_file):
        try:
            data = json.loads(slice_file.read_text(encoding="utf-8"))
            return SliceData(
                id=data["id"], order=data["order"], source_file=data["source_file"],
                slug=data["slug"], text=data["text"],
                slice_token_start=data["slice_token_start"],
                slice_token_end=data["slice_token_end"],
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Invalid slice file {slice_file}: {e}") from e

    def _format_slice_input(self, slice_data):
        input_data = {
            "ConceptDictionary": self.concept_dictionary,
            "Slice": {
                "id": slice_data.id, "order": slice_data.order,
                "source_file": slice_data.source_file, "slug": slice_data.slug,
                "text": slice_data.text,
                "slice_token_start": slice_data.slice_token_start,
                "slice_token_end": slice_data.slice_token_end,
            },
        }
        return json.dumps(input_data, ensure_ascii=False, indent=2)

    def _normalize_concepts(self, concepts):
        """Приводит неизвестные ontology_class к 'Concept'."""
        for concept in concepts:
            ontology_class = concept.get("ontology_class", "")
            if ontology_class and ontology_class not in ALLOWED_ONTOLOGY_CLASSES:
                self.logger.warning(
                    f"Unknown ontology_class '{ontology_class}' in concept "
                    f"'{concept.get('concept_id', '?')}' → replacing with 'Concept'"
                )
                concept["ontology_class"] = "Concept"
        return concepts

    def _update_concept_dictionary(self, concepts_added):
        """Добавляет новые концепты или обновляет алиасы существующих."""
        for new_concept in concepts_added:
            concept_id = new_concept["concept_id"]

            if concept_id in self.concept_id_map:
                # Обновляем только алиасы
                idx = self.concept_id_map[concept_id]
                existing_concept = self.concept_dictionary["concepts"][idx]
                primary = existing_concept["term"].get("primary", "")
                primary_lower = primary.lower() if primary else None

                existing_aliases = existing_concept["term"].get("aliases", [])
                existing_lower_map = {}
                for alias in existing_aliases:
                    alias_lower = alias.lower()
                    if alias_lower != primary_lower:
                        existing_lower_map[alias_lower] = alias

                new_aliases = new_concept["term"].get("aliases", [])
                added_aliases = []
                for new_alias in new_aliases:
                    alias_lower = new_alias.lower()
                    if alias_lower not in existing_lower_map and alias_lower != primary_lower:
                        existing_lower_map[alias_lower] = new_alias
                        added_aliases.append(new_alias)

                if added_aliases:
                    existing_concept["term"]["aliases"] = sorted(existing_lower_map.values())
                    self.logger.debug(
                        json.dumps({
                            "timestamp": datetime.now().isoformat(),
                            "level": "DEBUG", "event": "concept_update",
                            "concept_id": concept_id,
                            "action": "added_aliases",
                            "new_aliases": sorted(added_aliases),
                        })
                    )
            else:
                # Новый концепт
                primary = new_concept.get("term", {}).get("primary", "")
                aliases = new_concept.get("term", {}).get("aliases", [])

                if aliases and primary:
                    primary_lower = primary.lower()
                    seen_lower = {primary_lower: True}
                    unique_aliases = []
                    for alias in aliases:
                        alias_lower = alias.lower()
                        if alias_lower not in seen_lower:
                            seen_lower[alias_lower] = True
                            unique_aliases.append(alias)
                    new_concept["term"]["aliases"] = unique_aliases
                elif aliases:
                    seen_lower = {}
                    unique_aliases = []
                    for alias in aliases:
                        alias_lower = alias.lower()
                        if alias_lower not in seen_lower:
                            seen_lower[alias_lower] = True
                            unique_aliases.append(alias)
                    new_concept["term"]["aliases"] = unique_aliases

                self.concept_dictionary["concepts"].append(new_concept)
                self.concept_id_map[concept_id] = len(self.concept_dictionary["concepts"]) - 1
                self.stats.total_concepts += 1

                self.logger.debug(
                    json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "level": "DEBUG", "event": "concept_added",
                        "concept_id": concept_id,
                    })
                )

    def _process_llm_response(self, response_text, slice_id):
        """Парсит JSON из ответа LLM с нормализацией ontology_class."""
        try:
            response_data = json.loads(response_text)

            if "concepts_added" not in response_data:
                raise ValueError("Missing required field 'concepts_added'")

            concepts_added = response_data["concepts_added"].get("concepts", [])

            # Нормализация ontology_class ПЕРЕД валидацией
            concepts_added = self._normalize_concepts(concepts_added)
            response_data["concepts_added"]["concepts"] = concepts_added

            validate_json({"concepts": concepts_added}, "ConceptDictionary")
            return True, response_data

        except (json.JSONDecodeError, ValueError, ValidationError) as e:
            self.logger.error(
                json.dumps({
                    "timestamp": datetime.now().isoformat(),
                    "level": "ERROR",
                    "event": "response_validation_failed",
                    "slice_id": slice_id, "error": str(e),
                })
            )
            return False, None

    def _save_checkpoint(self):
        """
        Сохраняет текущее состояние словаря и прогресс на диск.
        Вызывается после каждого успешно обработанного слайса.
        Атомарная запись через .tmp → rename.
        """
        concept_path = OUTPUT_DIR / "ConceptDictionary.json"

        concepts_with_aliases = 0
        total_aliases = 0
        for concept in self.concept_dictionary.get("concepts", []):
            aliases = concept.get("term", {}).get("aliases", [])
            if aliases:
                concepts_with_aliases += 1
                total_aliases += len(aliases)

        total_concepts = len(self.concept_dictionary.get("concepts", []))
        avg_aliases = round(total_aliases / total_concepts, 2) if total_concepts > 0 else 0

        end_time = datetime.now()

        metadata = {
            "_meta": {
                "itext2kg_concepts": {
                    "generated_at": end_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "mode": "incremental" if self.incremental else "full",
                    "config": {
                        "model": self.config.get("model"),
                        "temperature": self.config.get("temperature"),
                        "max_output_tokens": self.config.get("max_completion"),
                        "reasoning_effort": self.config.get("reasoning_effort"),
                    },
                    "api_usage": {
                        "total_requests": self.api_usage["total_requests"],
                        "total_input_tokens": self.api_usage["total_input_tokens"],
                        "total_output_tokens": self.api_usage["total_output_tokens"],
                        "total_tokens": self.api_usage["total_input_tokens"] + self.api_usage["total_output_tokens"],
                    },
                    "concepts_stats": {
                        "total_concepts": total_concepts,
                        "concepts_with_aliases": concepts_with_aliases,
                        "total_aliases": total_aliases,
                        "avg_aliases_per_concept": avg_aliases,
                    },
                    # === CHECKPOINT: список обработанных слайсов ===
                    "processed_slice_ids": sorted(list(self.processed_slice_ids)),
                    "last_checkpoint_at": end_time.strftime("%Y-%m-%d %H:%M:%S"),
                }
            }
        }

        output_data = {**metadata, **self.concept_dictionary}

        # Атомарная запись
        temp_path = concept_path.with_suffix(".json.tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        temp_path.replace(concept_path)

    def _save_bad_response(self, slice_id, original_response, error, repair_response=None):
        bad_response_file = LOGS_DIR / f"{slice_id}_bad.json"
        bad_data = {
            "slice_id": slice_id, "timestamp": datetime.now().isoformat(),
            "original_response": original_response, "validation_error": error,
            "repair_response": repair_response,
        }
        bad_response_file.write_text(
            json.dumps(bad_data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def _save_temp_dumps(self, reason):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_concept_path = LOGS_DIR / f"ConceptDictionary_temp_{reason}_{timestamp}.json"

        if self.concept_dictionary and self.concept_dictionary.get("concepts"):
            temp_concept_path.write_text(
                json.dumps(self.concept_dictionary, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"Temporary ConceptDictionary saved to: {temp_concept_path}", file=sys.stderr)

        stats_path = LOGS_DIR / f"processing_stats_{reason}_{timestamp}.json"
        stats_data = {
            "timestamp": datetime.now().isoformat(), "reason": reason,
            "stats": {
                "total_slices": self.stats.total_slices,
                "processed_slices": self.stats.processed_slices,
                "skipped_slices": self.stats.skipped_slices,
                "total_concepts": self.stats.total_concepts,
                "total_tokens_used": self.stats.total_tokens_used,
                "processing_time": str(datetime.now() - self.stats.start_time),
            },
        }
        stats_path.write_text(json.dumps(stats_data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Processing stats saved to: {stats_path}", file=sys.stderr)

    def _process_single_slice(self, slice_file):
        """Обрабатывает один слайс с механизмом повтора."""
        try:
            slice_data = self._load_slice(slice_file)
        except Exception as e:
            self.logger.error(
                json.dumps({
                    "timestamp": datetime.now().isoformat(),
                    "level": "ERROR", "event": "slice_load_error",
                    "slice_file": str(slice_file), "error": str(e),
                })
            )
            return False

        # === CHECKPOINT: пропускаем уже обработанные слайсы ===
        if slice_data.id in self.processed_slice_ids:
            self.stats.skipped_slices += 1
            return True

        self.logger.info(
            json.dumps({
                "timestamp": datetime.now().isoformat(),
                "level": "INFO", "event": "slice_start",
                "slice_id": slice_data.id, "order": slice_data.order,
                "total": self.stats.total_slices,
            })
        )

        input_data = self._format_slice_input(slice_data)
        max_retries = self.config.get("max_retries", 3)
        last_error_type = None
        start_time = time.time()

        for attempt in range(max_retries + 1):
            try:
                if attempt == 0:
                    response_text, response_id, usage = self.llm_client.create_response(
                        instructions=self.extraction_prompt, input_data=input_data,
                        previous_response_id=self.previous_response_id,
                    )
                else:
                    current_time = datetime.now().strftime("%H:%M:%S")
                    print(f"[{current_time}] REPAIR   | 🔧 Attempt {attempt}/{max_retries} after {last_error_type}...")

                    repair_hint = ""
                    if last_error_type == "json":
                        repair_hint = (
                            "\nCRITICAL: Return ONLY a valid JSON object. "
                            "No markdown formatting, no explanations."
                        )
                    elif last_error_type == "timeout":
                        repair_hint = "\nIMPORTANT: Be concise to avoid timeout."

                    response_text, response_id, usage = self.llm_client.create_response(
                        instructions=self.extraction_prompt + repair_hint,
                        input_data=input_data,
                        previous_response_id=self.previous_response_id,
                    )

                self.api_usage["total_requests"] += 1
                self.api_usage["total_input_tokens"] += usage.input_tokens
                self.api_usage["total_output_tokens"] += usage.output_tokens

                success, parsed_data = self._process_llm_response(response_text, slice_data.id)

                if not success:
                    last_error_type = "json"
                    if attempt == max_retries:
                        self._save_bad_response(
                            slice_data.id, response_text,
                            f"JSON validation failed after {max_retries} retries",
                        )
                        current_time = datetime.now().strftime("%H:%M:%S")
                        print(
                            f"[{current_time}] ERROR    | ❌ "
                            f"{slice_data.order:03d}/{self.stats.total_slices:03d} | "
                            f"{slice_data.id} | JSON validation failed after {max_retries} retries"
                        )
                        # Не падаем — сохраняем прогресс и пропускаем проблемный слайс
                        self._save_checkpoint()
                        return False
                    continue

                # Успех! Применяем концепты
                self.llm_client.confirm_response()
                concepts_to_add = parsed_data["concepts_added"].get("concepts", [])
                self._update_concept_dictionary(concepts_to_add)
                self.previous_response_id = response_id
                self.stats.total_tokens_used += usage.total_tokens

                # === CHECKPOINT: отмечаем слайс и сохраняем на диск ===
                self.processed_slice_ids.add(slice_data.id)
                self._save_checkpoint()

                duration_sec = round(time.time() - start_time, 0)
                current_time = datetime.now().strftime("%H:%M:%S")
                tokens_used = self._format_tokens(self.stats.total_tokens_used)
                tokens_current = self._format_tokens(usage.total_tokens)
                tokens_info = f"tokens_used={tokens_used} | tokens_current={tokens_current}"

                if usage.reasoning_tokens > 0:
                    reasoning = self._format_tokens(usage.reasoning_tokens)
                    tokens_info += f" incl. reasoning={reasoning}"

                print(
                    f"[{current_time}] SLICE    | ✅ "
                    f"{slice_data.order:03d}/{self.stats.total_slices:03d} | "
                    f"{tokens_info} | {duration_sec}s | "
                    f"concepts={len(self.concept_dictionary['concepts'])}"
                )
                return True

            except TimeoutError as e:
                last_error_type = "timeout"
                current_time = datetime.now().strftime("%H:%M:%S")
                if attempt == max_retries:
                    print(f"[{current_time}] ERROR    | ❌ Timeout after {max_retries} retries")
                    self._save_checkpoint()
                    return False
                wait_time = 30 * (attempt + 1)
                print(f"[{current_time}] REPAIR   | ⏳ Timeout, waiting {wait_time}s...")
                time.sleep(wait_time)

            except Exception as e:
                current_time = datetime.now().strftime("%H:%M:%S")
                error_str = str(e)
                if "429" in error_str or "rate limit" in error_str.lower():
                    last_error_type = "rate_limit"
                    if attempt == max_retries:
                        self._save_checkpoint()
                        return False
                    time.sleep(30 * (attempt + 1))
                else:
                    self.logger.error(f"Unexpected error: {e}")
                    print(f"[{current_time}] ERROR    | ❌ Unexpected: {type(e).__name__}")
                    self._save_checkpoint()
                    return False

        return False

    def run(self):
        """Основной цикл обработки слайсов."""
        try:
            slice_files = sorted(STAGING_DIR.glob("*.slice.json"))
            if not slice_files:
                self.logger.error("No slice files found in staging directory")
                return EXIT_INPUT_ERROR

            self.stats.total_slices = len(slice_files)

            # Источник
            self.total_source_tokens = 0
            self.source_slug = "unknown"
            if slice_files:
                try:
                    first = json.loads(slice_files[0].read_text(encoding="utf-8"))
                    self.source_slug = first.get("slug", "unknown")
                    last = json.loads(slice_files[-1].read_text(encoding="utf-8"))
                    self.total_source_tokens = last.get("slice_token_end", 0)
                except Exception:
                    pass

            self._print_start_status()

            # === INCREMENTAL: фильтруем уже обработанные ===
            if self.incremental and self.processed_slice_ids:
                original_count = len(slice_files)
                slice_files = [
                    sf for sf in slice_files
                    if self._get_slice_id(sf) not in self.processed_slice_ids
                ]
                skipped = original_count - len(slice_files)
                if skipped > 0:
                    self.stats.skipped_slices = skipped
                    self.logger.info(f"Skipping {skipped} already processed slices")

            if not slice_files:
                print("No new slices to process - ConceptDictionary is up to date")
                return EXIT_SUCCESS

            # Обработка
            for slice_file in slice_files:
                try:
                    success = self._process_single_slice(slice_file)
                    if success:
                        self.stats.processed_slices += 1
                    else:
                        # Слайс не обработался, но прогресс сохранён
                        # Продолжаем со следующим слайсом (не падаем)
                        self.logger.warning(
                            f"Slice {slice_file.stem} failed, continuing with next"
                        )
                        self.stats.processed_slices += 1

                except KeyboardInterrupt:
                    self.logger.warning("Processing interrupted by user")
                    if self.stats.processed_slices > 0:
                        print(f"Progress saved: {self.stats.processed_slices} slices processed")
                    return EXIT_RUNTIME_ERROR

                except Exception as e:
                    self.logger.error(f"Unexpected error processing {slice_file}: {e}")
                    # Сохраняем прогресс даже при ошибке
                    self._save_checkpoint()

            return self._finalize_and_save()

        except Exception as e:
            self.logger.error(f"Critical error in run(): {e}")
            try:
                self._save_temp_dumps("critical_error")
            except Exception:
                pass
            return EXIT_RUNTIME_ERROR

    def _get_slice_id(self, slice_file):
        try:
            data = json.loads(slice_file.read_text(encoding="utf-8"))
            return data.get("id", "")
        except Exception:
            return ""

    def _print_start_status(self):
        current_time = datetime.now().strftime("%H:%M:%S")
        mode = "incremental" if self.incremental else "full"
        print(
            f"[{current_time}] START    | {self.stats.total_slices} slices | "
            f"model={self.config['model']} | mode={mode} | "
            f"concepts={len(self.concept_dictionary['concepts'])}"
        )

    def _finalize_and_save(self):
        """Финальное сохранение с полными метаданными."""
        try:
            # Лёгкая валидация (не падаем)
            try:
                validate_json(self.concept_dictionary, "ConceptDictionary")
            except ValidationError as e:
                self.logger.warning(f"Validation warning: {e}")

            concepts_with_aliases = 0
            total_aliases = 0
            for concept in self.concept_dictionary.get("concepts", []):
                aliases = concept.get("term", {}).get("aliases", [])
                if aliases:
                    concepts_with_aliases += 1
                    total_aliases += len(aliases)

            total_concepts = len(self.concept_dictionary.get("concepts", []))
            avg_aliases = round(total_aliases / total_concepts, 2) if total_concepts > 0 else 0

            end_time = datetime.now()
            duration_minutes = (end_time - self.stats.start_time).total_seconds() / 60

            metadata = {
                "_meta": {
                    "itext2kg_concepts": {
                        "generated_at": end_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "mode": "incremental" if self.incremental else "full",
                        "config": {
                            "model": self.config.get("model"),
                            "temperature": self.config.get("temperature"),
                            "max_output_tokens": self.config.get("max_completion"),
                            "reasoning_effort": self.config.get("reasoning_effort"),
                        },
                        "source": {
                            "total_slices": self.stats.total_slices,
                            "processed_slices": self.stats.processed_slices,
                            "skipped_slices": self.stats.skipped_slices,
                            "total_tokens": self.total_source_tokens,
                            "slug": self.source_slug,
                        },
                        "api_usage": {
                            "total_requests": self.api_usage["total_requests"],
                            "total_input_tokens": self.api_usage["total_input_tokens"],
                            "total_output_tokens": self.api_usage["total_output_tokens"],
                            "total_tokens": self.api_usage["total_input_tokens"] + self.api_usage["total_output_tokens"],
                        },
                        "concepts_stats": {
                            "total_concepts": total_concepts,
                            "concepts_with_aliases": concepts_with_aliases,
                            "total_aliases": total_aliases,
                            "avg_aliases_per_concept": avg_aliases,
                        },
                        "processing_time": {
                            "start": self.stats.start_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "end": end_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "duration_minutes": round(duration_minutes, 2),
                        },
                        "processed_slice_ids": sorted(list(self.processed_slice_ids)),
                    }
                }
            }

            output_data = {**metadata, **self.concept_dictionary}
            concept_path = OUTPUT_DIR / "ConceptDictionary.json"
            concept_path.write_text(
                json.dumps(output_data, ensure_ascii=False, indent=2), encoding="utf-8"
            )

            self._print_end_status()

            current_time = datetime.now().strftime("%H:%M:%S")
            print(f"[{current_time}] SUCCESS  | ✅ Results saved to /data/out/ConceptDictionary.json")
            return EXIT_SUCCESS

        except Exception as e:
            self.logger.error(f"Failed to save: {e}")
            self._save_temp_dumps("io_error")
            return EXIT_IO_ERROR

    def _print_end_status(self):
        current_time = datetime.now().strftime("%H:%M:%S")
        duration = datetime.now() - self.stats.start_time
        minutes, seconds = divmod(int(duration.total_seconds()), 60)
        print(
            f"[{current_time}] END      | Done | "
            f"slices={self.stats.processed_slices} (+{self.stats.skipped_slices} skipped) | "
            f"concepts={len(self.concept_dictionary['concepts'])} | "
            f"time={minutes}m {seconds}s"
        )


def main():
    try:
        config = load_config(CONFIG_PATH)

        # === АВТООПРЕДЕЛЕНИЕ INCREMENTAL РЕЖИМА ===
        dict_path = OUTPUT_DIR / "ConceptDictionary.json"
        incremental = dict_path.exists()
        if incremental:
            print("Auto-detected: incremental mode (existing ConceptDictionary found)")
            print("  Delete ConceptDictionary.json to force full rebuild")

        processor = SliceProcessor(config, incremental=incremental)
        return processor.run()

    except FileNotFoundError as e:
        print(f"Configuration file not found: {e}")
        return EXIT_CONFIG_ERROR
    except ValueError as e:
        print(f"Configuration error: {e}")
        return EXIT_CONFIG_ERROR
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return EXIT_RUNTIME_ERROR


if __name__ == "__main__":
    sys.exit(main())