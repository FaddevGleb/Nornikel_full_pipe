#!/usr/bin/env python3
"""Tests for normalize_node_types in graph2metrics."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from viz.graph2metrics import normalize_node_types


class TestNormalizeNodeTypes(unittest.TestCase):
    def test_empty_type_uses_ontology_class(self):
        graph_data = {
            "nodes": [
                {"id": "c1", "type": "", "ontology_class": "Material"},
                {"id": "c2", "ontology_class": "Property"},
            ]
        }
        updated, skipped = normalize_node_types(graph_data)
        self.assertEqual(updated, 2)
        self.assertEqual(skipped, 0)
        self.assertEqual(graph_data["nodes"][0]["type"], "Material")
        self.assertEqual(graph_data["nodes"][1]["type"], "Property")

    def test_existing_type_with_ontology_class_is_synced(self):
        graph_data = {
            "nodes": [{"id": "c1", "type": "Concept", "ontology_class": "SynthesisMethod"}]
        }
        normalize_node_types(graph_data)
        self.assertEqual(graph_data["nodes"][0]["type"], "SynthesisMethod")

    def test_missing_both_defaults_to_concept(self):
        graph_data = {"nodes": [{"id": "c1"}]}
        normalize_node_types(graph_data)
        self.assertEqual(graph_data["nodes"][0]["type"], "Concept")

    def test_chunk_type_without_ontology_class_is_kept(self):
        graph_data = {"nodes": [{"id": "chunk1", "type": "Chunk"}]}
        updated, skipped = normalize_node_types(graph_data)
        self.assertEqual(updated, 0)
        self.assertEqual(skipped, 1)
        self.assertEqual(graph_data["nodes"][0]["type"], "Chunk")


if __name__ == "__main__":
    unittest.main()
