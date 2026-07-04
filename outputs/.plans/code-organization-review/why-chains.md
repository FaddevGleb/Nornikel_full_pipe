# Why-Chains

Pending. This file will trace observed evidence to architecture recommendations.
# Why Chains

## 1. The Main Defect Is Compression, Not Missing Features

Symptom: Every new research idea feels like it should become a command, prompt, extension, package, dashboard, or subagent.

Evidence:
- Feynman's own contract says every feature must fight for its life and belong to a core research job (`AGENTS.md:31-46`).
- `src/rank/paper-rank.ts` is 6,482 lines and contains domain types, source fetching, access planning, scoring, citation graph logic, field map, critiques, calibration, reproduction evidence, next actions, model synthesis, full-text extraction, PaperRank orchestration, paper access resolution, artifact rendering, graph explorer code, provenance, serialization, and escaping helpers.
- `src/cli.ts` imports nearly every major concern in one entrypoint (`src/cli.ts:1-95`) and inline-dispatches setup, doctor, status, model, search, packages, update, alpha, rank, and paper flows (`src/cli.ts:967-1036`).
- Codex explicitly warns that files beyond roughly 800 LoC should stop growing and that extracted tests/docs should move with ownership (`codex/AGENTS.md:50-60`).
- Hermes explicitly wants god-file refactors and treats that as wanted work even when the diff is mechanical (`hermes-agent/AGENTS.md:65-70`).

Mechanism: When domain boundaries are hidden inside one large file, the smallest implementation path for a new idea is to add one more branch to that file. That makes every proposal look cheap and every rollback hard.

Decision: First improve module boundaries around the research loop; do not add more features until the narrow waist exists.

Rejected alternatives:
- "Add a plugin system first." Rejected because plugin slots need stable domain interfaces. Without those, plugins either patch internals or duplicate PaperRank logic.
- "Copy Hermes plugins now." Rejected because Hermes is a personal agent and Feynman is a research agent; the useful pattern is its footprint ladder, not its gateway/plugin catalog.

## 2. Feynman Needs A Research Narrow Waist

Symptom: PaperRank, paper access, source adapters, artifact generation, and model synthesis are coupled through one orchestration file.

Evidence:
- PaperRank source scan shows separately nameable concepts already exist: `PaperRecord`, `FullTextAccessPlan`, `CitationGraph`, `FieldMap`, `PaperScore`, `ScoreCalibration`, `ReproductionEvidenceLedger`, `NextResearchActions`, `ModelSynthesisPacket`, `PaperRankRunResult`, and `PaperAccessResult`.
- Codex separates major concepts into workspace crates including protocol, core plugins, core skills, tools, MCP, state, TUI, and plugin (`codex-rs/Cargo.toml:1-124`).
- OpenCode's V2 session core separates prompt admission, execution, runner, model/tool registry, permissions, and filesystem placement (`opencode/AGENTS.md:148-158`).
- Hermes calls the core a narrow waist and pushes capability to CLI command + skill, service-gated tool, plugin, or MCP before core (`hermes-agent/AGENTS.md:19-27`, `hermes-agent/AGENTS.md:171-200`).

Mechanism: A narrow waist makes extensions attach to stable research objects instead of importing whole command implementations.

Decision: Feynman's internal waist should be:
- `PaperCandidate`
- `ResolvedPaper`
- `PaperContent`
- `EvidenceSpan`
- `EvidenceGraph`
- `RankSignal`
- `RankedPaper`
- `ResearchArtifact`
- `ProvenanceRecord`
- `ResearchRun`

Rejected alternatives:
- "Expose every PaperRank helper." Rejected because it turns the current god-file into a public API.
- "Expose no plugin API, only Pi packages." Rejected because Pi packages load resources, but Feynman still needs domain-specific adapter slots for sources, scorers, access resolvers, and artifact exporters.

## 3. Plugins Are Allowed, But Only As Research Adapters

Symptom: The user is right that Feynman's surface is large enough that people will want plugins.

Evidence:
- Claude Code packages commands, agents, skills, hooks, and MCP servers under a standard plugin structure (`claude-code/plugins/README.md:47-61`).
- Codex plugin manifests include skills, MCP servers, apps, hooks, and UI/model metadata (`codex-rs/plugin/src/manifest.rs:8-24`, `codex-rs/plugin/src/manifest.rs:40-58`).
- Codex resolves plugin package roots into inert descriptors before activation and bounds resources to package roots (`codex-rs/plugin/src/provider.rs:93-124`).
- OpenCode exposes typed plugin inputs, tool definitions, hooks, and worktree-aware tool context (`opencode/packages/plugin/src/index.ts:56-80`, `opencode/packages/plugin/src/tool.ts:3-20`, `opencode/packages/plugin/src/index.ts:222-335`).
- Hermes installs plugins from Git repos into a user plugin dir, sanitizes names, rejects traversal, validates manifests, prompts for env, and enables/disables explicitly (`hermes_cli/plugins_cmd.py:1-8`, `hermes_cli/plugins_cmd.py:81-135`, `hermes_cli/plugins_cmd.py:219-315`, `hermes_cli/plugins_cmd.py:448-632`).
- Pi already supports packages, extensions, skills, prompts, config filtering, and explicit resource loading (`packages.md:155-172`, `packages.md:189-219`, `usage.md:147-159`, `usage.md:202-224`).

Mechanism: A Feynman plugin system that ignores Pi becomes duplicate runtime infrastructure. A Feynman plugin system that only wraps Pi without domain slots cannot prevent generic productivity bloat.

Decision: Feynman plugins should be a thin research manifest and validator on top of Pi packages:
- Plugins may provide Pi resources: `extensions`, `skills`, `prompts`, `themes`, `mcp`.
- Plugins may register Feynman research slots: `source_adapters`, `access_resolvers`, `rank_scorers`, `artifact_exporters`, `visualizers`, `subagents`.
- Plugins must declare `research_jobs` from the allowed AGENTS list.
- Plugins cannot patch core files or inject arbitrary hooks until there is a concrete consumer.

Rejected alternatives:
- "Marketplace now." Rejected. Start with local/Git install and validation; a marketplace needs signing/review/update policy.
- "General hooks now." Rejected. Hermes rejects speculative hooks because removing them after plugins depend on them is hard (`hermes-agent/AGENTS.md:96-101`).
- "Core tools for every source." Rejected. Hermes and Pi both push optional capability to packages/plugins; Feynman should not bloat every session's tool surface.

## 4. MCP Is A Host Surface, Not The Core

Symptom: Feynman can be useful inside other agents/editors, but making every Feynman operation a model tool bloats core.

Evidence:
- Claude plugin structure includes optional `.mcp.json` (`claude-code/plugins/README.md:47-61`).
- Codex has dedicated `codex-mcp` and `mcp-server` crates and validates plugin MCP config while preserving valid siblings (`codex-rs/Cargo.toml:66-67`, `codex-mcp/src/plugin_config.rs:58-82`).
- Hermes Footprint Ladder prefers an MCP catalog entry over a new core tool for structured I/O that is not core-fundamental (`hermes-agent/AGENTS.md:185-195`).
- Pi can load extension/custom tools and resource packages, but Feynman command-line artifacts are already a natural boundary (`usage.md:202-224`).

Mechanism: MCP lets Claude/Codex/OpenCode/Hermes call Feynman's research capabilities without copying the implementation into each host.

Decision: Ship `feynman mcp` only after extracting stable domain modules. The first MCP surface should be small:
- `resolve_paper`
- `rank_papers`
- `get_research_artifact`
- `list_research_outputs`
- `inspect_evidence_graph`

Rejected alternatives:
- "Expose every CLI command as MCP." Rejected because setup/update/model auth/package management are operator commands, not research tools.
- "Put plugin installation through MCP." Rejected because plugin installation mutates local executable surface and belongs to CLI with explicit trust/validation.

## 5. Tests Need To Move From Output Snapshots Toward Invariants

Symptom: A large PaperRank refactor can break behavior invisibly if tests only assert artifact text or happy path output.

Evidence:
- Codex requires integration tests for agent-logic changes and avoids test-only helpers in main implementation (`codex/AGENTS.md:113-124`).
- OpenCode says avoid mocks and test actual implementation (`opencode/AGENTS.md:138-147`).
- Hermes says behavior contracts over snapshots and E2E validation for config/security/file/network boundaries (`hermes-agent/AGENTS.md:80-87`).
- Feynman's `tests/paper-rank.test.ts` is already 2,350 lines, so test extraction should move with module extraction.

Mechanism: Module extraction without invariant tests creates a false sense of safety. The right test unit is the research object contract: input papers -> graph -> scores -> artifacts -> provenance.

Decision: Add contract tests per extracted module and one end-to-end PaperRank fixture test that verifies research behavior, not exact prose:
- rank order changes only for explained signals
- citation graph edge counts match fixture
- full-text access status is bounded and provenance-recorded
- missing calibration/reproduction inputs produce explicit status
- artifact sidecars list source accounting

Rejected alternatives:
- "Snapshot the rendered report." Rejected as the primary safety net; report text should be covered only for required sections/links, not exact wording.

## 6. ML Intern's Useful Shape Is Research Recipes And Run Traces, Not More Compute Buttons

Symptom: "Take inspiration from Hugging Face ML Intern" could be misread as adding HF Jobs, sandboxes, Slack, trace upload, dataset upload, and frontend chat to Feynman.

Evidence:
- ML Intern positions itself as an autonomous ML researcher/engineer with deep access to docs, papers, datasets, and compute (`ml-intern/README.md:10-13`).
- Its architecture separates operations, events, submission loop, session, context manager, tool router, doom-loop detector, and iterative tool execution (`ml-intern/README.md:213-283`).
- Its papers/data/code research prompt requires starting from papers, crawling citation graphs, reading methodology/experiments/results, validating datasets, and then finding code/docs (`ml-intern/agent/tools/research_tool.py:98-121`).
- Its output format requires a ranked recipe table with paper, result, dataset, method, what made it work, code patterns, recommendations, SOTA landscape, and essential references (`ml-intern/agent/tools/research_tool.py:196-220`).
- It bounds long paper output with explicit maximums (`ml-intern/agent/tools/papers_tool.py:24-29`) and combines dataset structure/content checks in one parallel tool call (`ml-intern/agent/tools/dataset_tools.py:1-6`, `ml-intern/agent/tools/dataset_tools.py:50-111`).
- Its session uploader and artifact card logic make traces/artifacts inspectable, private by default, scrubbed, and provenance-marked (`ml-intern/README.md:128-161`, `ml-intern/agent/core/session_uploader.py:1-16`, `ml-intern/agent/core/session_uploader.py:73-89`, `ml-intern/agent/core/hub_artifacts.py:207-231`).

Mechanism: ML Intern works because it links research evidence to implementation decisions: paper result -> dataset -> method -> code pattern -> recommendation. Feynman already has paper ranking and access, but it lacks a first-class "research recipe" artifact contract that forces synthesis to preserve that chain.

Decision: Add ML Intern's shape to Feynman's future `ResearchRun` contract:
- source inventory
- ranked papers
- evidence graph
- datasets/resources/code links
- method/result extraction
- recipe table
- verification plan
- artifacts/provenance
- bounded run trace

Rejected alternatives:
- "Add HF Jobs UI or sandbox controls as a Feynman feature." Rejected. Feynman already has Docker/Modal/RunPod/HF inspection paths; more compute surface only belongs when a reproduction run needs it.
- "Copy ML Intern's agent loop." Rejected. Pi owns Feynman's loop. Feynman should expose research runs/artifacts on top of Pi, not replace Pi.
- "Add Slack/gateway notifications." Rejected unless a real long-running research run needs status callbacks; it is not core AI-researcher value by default.

## 7. The First Applied Fix Is An Architecture Guard

Symptom: The reference research keeps saying the same thing from different systems: core should not keep growing, and module boundaries should be executable, not just a note.

Evidence:
- Codex explicitly sets large-module guidance around 500/800 LoC and says to add new functionality in a new module once files are large (`codex/AGENTS.md:50-60`).
- Hermes explicitly wants god-file refactors and says core tools are last resort (`hermes-agent/AGENTS.md:65-74`, `hermes-agent/AGENTS.md:171-200`).
- OpenCode says complex logic should keep main paths clear and avoid premature helpers, which implies extraction only when concepts are real (`opencode/AGENTS.md:95-116`).
- Feynman currently has `src/rank/paper-rank.ts` at 6,482 lines, `tests/paper-rank.test.ts` at 2,350 lines, and `src/cli.ts` at 1,322 lines.

Mechanism: A written architecture plan does not stop the next edit from growing the same files. A check in `npm run architecture:check` makes the desired shape visible and enforceable.

Decision: Add `scripts/check-architecture.mjs` and `architecture:check`.

Current behavior:
- Allows known oversized files only with explicit debt reasons.
- Warns above 800 LoC.
- Fails new unallowlisted files above 1,200 LoC.
- Fails domain modules under future `src/rank`, `src/papers`, `src/evidence`, and `src/artifacts` if they import CLI/commands/setup/UI modules.

Rejected alternatives:
- "Immediately split PaperRank in this dirty tree." Rejected for this step because the existing release candidate is already large and staged. The guard is the smallest safe applied improvement; extraction follows as the next coherent PR.
