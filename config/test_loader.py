#!/usr/bin/env python3
import os
import sys
import unittest
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WORKSPACE))
os.environ["NORNIKEL_PROJECT_ROOT"] = str(WORKSPACE)

from config.loader import (  # noqa: E402
    apply_env_from_config,
    get_kg_config,
    get_provider_for_mode,
    get_viz_config,
    get_web_config,
    load_project_config,
)


class ProjectLoaderTest(unittest.TestCase):
    def test_load_project_config(self):
        config = load_project_config(force_reload=True)
        self.assertEqual(config.get("meta", {}).get("version"), 1)
        self.assertIn("kg", config)
        self.assertIn("viz", config)

    def test_kg_paths_resolved(self):
        kg = get_kg_config()
        tokenizer = kg["slicer"]["tokenizer_path"]
        self.assertTrue(Path(tokenizer).is_absolute())
        self.assertFalse("{" in tokenizer)

    def test_viz_sections(self):
        viz = get_viz_config()
        self.assertIn("graph2metrics", viz)

    def test_web_mode(self):
        web = get_web_config()
        self.assertIn(web.get("mode"), ("online", "offline"))

    def test_provider_for_mode(self):
        self.assertEqual(get_provider_for_mode("online"), "openrouter")

    def test_env_injection(self):
        apply_env_from_config()
        self.assertIn("LLM_PROVIDER", os.environ)


if __name__ == "__main__":
    unittest.main()
