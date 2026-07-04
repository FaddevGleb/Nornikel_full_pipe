"""
Module for JSON Schema validation and knowledge graph invariants.
Soft-validation mode: logs warnings but never drops data.
"""
import json
import logging
from pathlib import Path

import jsonschema
from jsonschema import ValidationError

from src.utils.ontology_config import ONTOLOGY_CONSTRAINTS, VALID_EDGE_TYPES, VALID_NODE_TYPES

__all__ = [
    "ValidationError",
    "GraphInvariantError",
    "validate_json",
    "validate_graph_invariants",
    "validate_graph_invariants_intermediate",
    "validate_concept_dictionary_invariants",
]

logger = logging.getLogger(__name__)


class GraphInvariantError(ValidationError):
    """Graph invariant error."""
    pass


_SCHEMA_CACHE = {}


def _load_schema(schema_name):
    if schema_name in _SCHEMA_CACHE:
        return _SCHEMA_CACHE[schema_name]

    schema_path = Path(__file__).parent.parent / "schemas" / f"{schema_name}.schema.json"

    if not schema_path.exists():
        raise FileNotFoundError(f"JSON Schema not found: {schema_path}")

    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)
        jsonschema.Draft202012Validator.check_schema(schema)
        _SCHEMA_CACHE[schema_name] = schema
        return schema
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON in schema {schema_name}: {e}")
    except jsonschema.SchemaError as e:
        raise ValidationError(f"Invalid JSON Schema {schema_name}: {e}")


def validate_json(data, schema_name):
    """
    Validates data against JSON Schema.
    Soft mode: logs warning instead of raising on schema mismatch.
    """
    try:
        schema = _load_schema(schema_name)
    except (FileNotFoundError, ValidationError) as e:
        logger.warning(f"Schema '{schema_name}' not available, skipping validation: {e}")
        return

    try:
        jsonschema.validate(data, schema)
    except jsonschema.ValidationError as e:
        error_path = " -> ".join(str(p) for p in e.absolute_path) if e.absolute_path else "root"
        logger.warning(
            f"Schema validation warning '{schema_name}' in field '{error_path}': {e.message}"
        )


def validate_graph_invariants(graph_data):
    """
    Checks knowledge graph invariants.
    Soft mode: accepts ANY node type and ANY edge type.
    Only checks structural integrity (IDs exist, no self-loops, no duplicate edges).
    """
    validate_json(graph_data, "LearningChunkGraphNORNIKEL")

    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])

    node_registry = {}
    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type", "Unknown")
        if not node_id:
            logger.warning("Found node without ID, skipping")
            continue
        if node_id in node_registry:
            logger.warning(f"Duplicate node ID: {node_id} (keeping first)")
            continue
        node_registry[node_id] = node_type

    edge_keys = set()
    for i, edge in enumerate(edges):
        source = edge.get("source")
        target = edge.get("target")
        edge_type = edge.get("type", "UNKNOWN")

        if source not in node_registry:
            logger.warning(f"Edge {i}: source '{source}' not found in nodes")
            continue
        if target not in node_registry:
            logger.warning(f"Edge {i}: target '{target}' not found in nodes")
            continue

        if source == target:
            logger.warning(f"Edge {i}: Self-loop forbidden ({edge_type}) on '{source}'")
            continue

        edge_key = (source, target, edge_type)
        if edge_key in edge_keys:
            logger.warning(f"Edge {i}: duplicate edge {source} -> {target} ({edge_type})")
            continue
        edge_keys.add(edge_key)


def validate_graph_invariants_intermediate(graph_data):
    """
    Soft intermediate validation. Removes structural problems in-place.
    Never drops nodes/edges due to type — accepts everything.
    Returns True always.
    """
    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])
    valid_nodes = []
    valid_edges = []

    node_registry = {}
    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type", "Unknown")
        if not node_id:
            continue
        if node_id in node_registry:
            continue
        node_registry[node_id] = node_type
        valid_nodes.append(node)

    edge_keys = set()
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        edge_type = edge.get("type", "UNKNOWN")

        if source not in node_registry or target not in node_registry:
            continue
        if source == target:
            continue

        edge_key = (source, target, edge_type)
        if edge_key in edge_keys:
            continue
        edge_keys.add(edge_key)
        valid_edges.append(edge)

    graph_data["nodes"] = valid_nodes
    graph_data["edges"] = valid_edges
    return True


def validate_concept_dictionary_invariants(concept_data):
    """Soft concept dictionary validation."""
    validate_json(concept_data, "ConceptDictionary")

    concepts = concept_data.get("concepts", [])
    concept_ids = set()

    for i, concept in enumerate(concepts):
        concept_id = concept.get("concept_id")
        if concept_id in concept_ids:
            logger.warning(f"Concept {i}: duplicate concept_id '{concept_id}'")
        concept_ids.add(concept_id)

        term = concept.get("term", {})
        primary = term.get("primary")
        aliases = term.get("aliases", [])

        if primary:
            if primary.lower() in [a.lower() for a in aliases]:
                logger.warning(f"Concept {i}: primary '{primary}' duplicated in aliases")

        alias_set = set()
        for alias in aliases:
            alias_lower = alias.lower()
            if alias_lower in alias_set:
                logger.warning(f"Concept {i}: duplicate alias '{alias}'")
            alias_set.add(alias_lower)