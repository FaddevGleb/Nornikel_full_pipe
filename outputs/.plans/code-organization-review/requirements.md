# Requirements

## User Goal

Figure out better code and product organization for Feynman by studying how Claude Code, OpenAI Codex, OpenCode, and Hermes Agent organize similar agent/CLI/runtime/plugin surfaces.

## Constraints

- Keep Feynman simple yet potent: AI researcher, not a generic productivity bundle.
- Features and abstractions must serve core research jobs.
- Do not mutate product code until the comparison evidence and why-chains are written.
- Do not create a second plugin/runtime system if Pi already supplies the correct layer.
- Treat the dirty local worktree as user-owned candidate work; do not revert unrelated changes.

## Acceptance Criteria

- External repos are cloned or otherwise source-inspected at pinned commits.
- Feynman local architecture is inventoried by module and workflow surface.
- Recommendations are ranked by impact and risk.
- Each recommendation names the smallest absorbing surface: core CLI, prompt, Pi package, extension, plugin SDK, MCP server, docs, or tests.
- The final plan identifies what to build now, what to defer, and what to reject.
# Requirements

## User Goal

Improve Feynman's code and product organization by studying current Claude Code, OpenAI Codex, OpenCode, and Hermes Agent repos, then applying only the patterns that make Feynman a better AI researcher.

## Hard Constraints

- Feynman stays "simple yet potent": it is an AI researcher, not a bundle of adjacent productivity workflows (`AGENTS.md:31-46`).
- Every new feature needs a named core research job and a concrete/testable value before implementation (`AGENTS.md:33-46`).
- Pi runtime changes must be grounded in the installed Pi package version/docs/source, and existing Pi package/extension support must be preferred over local shims (`AGENTS.md:50-53`).
- Do not use Pro-class models in test/default paths; `src/cli.ts:1039-1043` already blocks explicit Pro-class model specs for PaperRank synthesis.
- Do not add features for the sake of parity with Claude/OpenCode/Codex/Hermes. Take architecture discipline, not their whole product surface.
- Do not mutate product code from this research pass until the code-change scope is accepted or a concrete implementation request is made.

## Core Research Jobs Allowed To Grow

- Discovering relevant papers, code, datasets, or prior art.
- Reading, extracting, and understanding paper content.
- Ranking evidence, methods, reproducibility, or citation structure.
- Verifying claims against sources, code, data, or experiments.
- Planning or running reproductions and research experiments.
- Synthesizing research into auditable artifacts.
- Visualizing research structure when the visualization changes a research decision.
- Improving speed, observability, provenance, or reliability of the research loop.

These are copied from the repo contract in `AGENTS.md:35-42`; anything outside that list is rejected unless explicitly scoped to an active research run.

## Acceptance Criteria For The Improvement Plan

- Names the narrow waist Feynman should expose internally.
- Names which current files should be split first and why.
- Defines a plugin/package/MCP direction that fits Pi instead of creating a parallel runtime.
- Separates accepted inspiration from rejected inspiration for Claude Code, Codex, OpenCode, and Hermes.
- Provides a staged implementation order with tests and rollback points.
- Records citations for every factual claim in the handbook.

## Non-Goals

- No grant-mining or proposal-writing expansion in this pass.
- No generic task/project-management product lane.
- No personal-assistant gateway product copied from Hermes.
- No arbitrary plugin hook marketplace before there is a real research-plugin consumer.
- No local path assumptions, outreach workflows, duplicate summarization commands, or Bernoulli-style prompt sprawl from external branches unless mapped through the core research loop.
- No copy of ML Intern's full cloud jobs/sandbox/gateway product. Feynman already has compute workflows; take the research recipe, trace, artifact, and tool-bounding discipline.
