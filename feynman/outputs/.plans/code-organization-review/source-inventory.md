# Source Inventory

## Local Sources

- `AGENTS.md:31-46` — repo-level feature scope: Feynman is an AI researcher, every feature must fight for its life, adjacent funding/proposal/admin lanes are rejected by default, and new commands/tools/extensions need a named core research job.
- `AGENTS.md:50-53` — Pi runtime change contract: read installed Pi package docs/source before changing telemetry, tools, extensions, runtime setup, model handoff, or child env; search existing Pi packages/extensions before writing local shims.
- `README.md` — current public CLI/workflow surface.
- `package.json:60-70` — Feynman currently exposes Pi resources through `pi.extensions`, `pi.prompts`, and `pi.skills`.
- `package.json:43-52` — current validation scripts are `build`, `test`, and `typecheck`; there is no architecture/size boundary check.
- `website/src/content/docs/reference/package-stack.md:8-12` — public docs state Feynman is built on Pi and ships a bundled research extension, with Pi packages/docs as upstream source.
- `website/src/content/docs/reference/package-stack.md:28-44` — bundled research extension contains AlphaXiv, Hugging Face, and Feynman commands; optional packages include memory, hindsight, and session-search.
- `website/src/content/docs/reference/cli-commands.md` — current command surface.
- `prompts/*.md` — workflow contracts and subagent usage expectations.
- `src/cli.ts:1-95` — CLI entrypoint imports environment loading, alpha login, Pi launch/session, package ops, PaperRank, model config, search, update, setup, telemetry, UI, and command metadata.
- `src/cli.ts:814-850` — `main()` owns telemetry lifecycle around the entire command.
- `src/cli.ts:860-905` — one global `parseArgs` declaration covers top-level, model, PaperRank, paper access, setup, session, and score threshold flags.
- `src/cli.ts:967-1036` — command dispatch lives as a long inline chain for setup/doctor/status/model/search/packages/update/alpha/rank.
- `src/cli.ts:1035-1160` — rank command parses product options, blocks Pro-class model selection, creates telemetry, calls `runPaperRank`, and serializes JSON output in the same function.
- `src/rank/paper-rank.ts` — `wc -l` reports 6,482 lines; symbol scan shows it contains types, OpenAlex fetch, access planning, citation graph, scoring, critiques, field map, calibration, reproduction, next actions, model synthesis, full-text fetchers, PaperRank orchestration, paper access resolution, artifact rendering, graph explorer HTML/CSS/JS, provenance, serialization, and escaping helpers.
- `extensions/research-tools.ts:1-28` — bundled extension is a clean registry entrypoint for AlphaXiv, Hugging Face, discovery commands, model/service-tier controls, help/init/outputs, and header installation.
- `src/pi/launch.ts:22-74` — launch path patches Pi runtime modules, resolves Pi paths, creates command shim, and spawns the Pi child with built args/env.
- `src/pi/package-ops.ts:1-180` — package ops currently mixes package manager process wiring, native-package filtering, npm source parsing, runtime peer resolution, and Pi runtime patching concerns.
- `src/model/commands.ts:1-105` — model command module mixes OAuth discovery, API-key provider catalog, setup prompts, registry integration, and shell/browser auth.
- `node_modules/@earendil-works/pi-coding-agent/package.json` — installed Pi coding-agent version is `0.79.10`.
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md:3-17` — Pi extensions can register tools, subscribe to events, add commands, persist state, prompt users, customize UI, and render messages/tool results.
- `node_modules/@earendil-works/pi-coding-agent/docs/packages.md:155-172` — Pi package convention loads `extensions/`, `skills/`, `prompts/`, and `themes/`; dependencies and peer dependency rules are documented.
- `node_modules/@earendil-works/pi-coding-agent/docs/packages.md:189-219` — Pi package resources can be filtered and enabled/disabled through config.
- `node_modules/@earendil-works/pi-coding-agent/docs/usage.md:147-159` — Pi package CLI supports install/remove/update/list/config.
- `node_modules/@earendil-works/pi-coding-agent/docs/usage.md:202-224` — Pi CLI supports tool allowlists/exclusions plus explicit extension/skill/prompt/theme resource loading.
- `node_modules/@earendil-works/pi-coding-agent/docs/settings.md:221-260` — Pi settings load packages, extensions, skills, prompts, and themes from user/project settings with glob filters.

## External Sources

### OpenAI Codex

- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/README.md:1-8` — Codex CLI is local; IDE/Desktop/Web are adjacent surfaces, not one monolithic runtime.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/AGENTS.md:50-60` — avoid large modules; prefer new modules; target Rust modules under 500 LoC; if a file exceeds roughly 800 LoC, add new functionality elsewhere and move tests/docs with extracted code.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/AGENTS.md:73-84` — resist adding to the bloated `codex-core`; add new crates/modules for new concepts.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/AGENTS.md:92-102` — model-visible context must be bounded, no history rewrite, and injected fragments must be typed.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/AGENTS.md:113-132` — agent logic changes need integration tests and large changes should be split.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/codex-rs/Cargo.toml:1-124` — Codex organizes major concepts into separate workspace crates, including protocol, core-plugins, core-skills, codex-mcp, mcp-server, tools, state, tui, and plugin.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/codex-rs/plugin/src/manifest.rs:8-24` — plugin manifest has name/version/description/keywords plus paths for skills, MCP servers, apps, and hooks.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/codex-rs/plugin/src/manifest.rs:40-58` — plugin manifest includes UI/model-facing metadata.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/codex-rs/plugin/src/provider.rs:93-124` — plugin resource resolution is root-bound and inert; resolve does not activate components.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/codex-rs/codex-mcp/src/plugin_config.rs:58-82` — bad plugin MCP servers return per-server errors while valid siblings survive.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/codex/codex-rs/codex-mcp/src/plugin_config.rs:122-175` — relative plugin cwd must remain under plugin root; local/remote env var sources are validated.

### Claude Code

- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/claude-code/README.md:48-50` — public repo includes plugins for custom commands and agents.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/claude-code/plugins/README.md:1-9` — Claude Code plugins extend slash commands, specialized agents, hooks, and MCP servers; they are shareable across projects/teams.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/claude-code/plugins/README.md:13-27` — official plugin examples are workflow bundles with commands, agents, skills, hooks, and MCP integration.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/claude-code/plugins/README.md:47-61` — standard plugin structure has `.claude-plugin/plugin.json`, commands, agents, skills, hooks, `.mcp.json`, and README.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/claude-code/plugins/code-review/.claude-plugin/plugin.json:1-9` — example plugin manifest is intentionally tiny: name, description, version, author.

### OpenCode

- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/README.md:100-113` — OpenCode separates `build` and read-only `plan` agents and includes a general subagent for complex searches.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/AGENTS.md:21-32` — OpenCode prefers inline simple logic and extracts only when reusable/complex/independently named.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/AGENTS.md:95-116` — complex logic should keep the main function as happy path with validation/support helpers below; prefer schema helpers over manual JSON parse.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/AGENTS.md:138-147` — avoid mocks and test actual implementation from package directories.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/AGENTS.md:148-158` — V2 session core separates prompt admission from execution and keeps runner/model/tool registry/permissions/filesystem location-scoped.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/package.json:8-23` — root `test` intentionally fails with "do not run tests from root"; repo scripts steer tests to the right package context.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/package.json:24-35` — OpenCode is a workspace with packages, consoles, stats, SDK, and Slack packages.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/packages/plugin/src/index.ts:56-80` — plugin input carries client/project/directory/worktree/serverUrl/shell, and plugin module has a typed server function.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/packages/plugin/src/index.ts:222-335` — plugin hooks include events, config, tools, auth/provider, chat message/params/headers, permission ask, command/tool before/after, shell env, and experimental transforms.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/packages/plugin/src/tool.ts:3-20` — tool context exposes session, message, agent, directory, worktree, abort, metadata, and ask.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/opencode/packages/plugin/src/tool.ts:45-52` — plugin tools are declared with description, zod args, and execute function.

### Hermes Agent

- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/AGENTS.md:7-14` — Hermes runs one agent core across CLI/gateway/TUI/desktop and is extended primarily through plugins and skills.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/AGENTS.md:19-27` — prompt caching is sacred and core is a narrow waist; most capability should arrive as CLI command + skill, service-gated tool, or plugin.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/AGENTS.md:65-74` — Hermes explicitly wants god-file refactors and prefers existing code, CLI command + skill, service-gated tool, plugin, MCP catalog, then new core tool.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/AGENTS.md:96-125` — Hermes rejects speculative hooks, non-secret env vars for behavior, unnecessary core tools, lazy-reading escape hatches, telemetry without opt-in, and plugins that touch core files.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/AGENTS.md:171-200` — Footprint Ladder defines least-footprint capability placement and requires a generic interface/orchestrator when multiple PRs target the same category.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/hermes_cli/plugins_cmd.py:1-8` — Hermes plugins install from Git repos into `~/.hermes/plugins/`, support URL and `owner/repo` shorthand, and can show after-install docs.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/hermes_cli/plugins_cmd.py:81-135` — plugin names are sanitized to avoid traversal and escaping the plugin directory.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/hermes_cli/plugins_cmd.py:219-245` — plugin subdirectories are resolved inside the clone root and path traversal is rejected.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/hermes_cli/plugins_cmd.py:262-315` — plugin manifest reads `plugin.yaml` and supports required environment declarations.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/hermes_cli/plugins_cmd.py:448-632` — plugin install clones to temp, resolves subdir, validates manifest version, refuses overwrite without force, moves into plugin dir, prompts for env, enables/disables, and instructs gateway restart.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/plugins/*` — bundled plugins include context engine, cron, Google Meet, memory, model providers, security guidance, Spotify, Teams pipeline, and web.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/hermes-agent/pyproject.toml:24-44` — Hermes pins core dependencies exactly and keeps provider-specific deps out of core extras/lazy install paths to reduce supply-chain blast radius.

### Hugging Face ML Intern

- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/README.md:10-13` — ML Intern positions itself as an autonomous ML researcher/engineer with deep access to docs, papers, datasets, and cloud compute.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/README.md:57-69` — CLI supports sandbox tools, max iterations, model selection, and hosted inference billed through the active HF user.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/README.md:104-126` — default CLI tools run on the local filesystem; sandbox tools are opt-in and create private HF Spaces when remote execution is needed.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/README.md:128-161` — sessions auto-upload to a private user-owned HF dataset in Claude Code JSONL format, with public/private controls and opt-out config.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/README.md:213-283` — architecture diagram separates operation queue, event queue, submission loop, session, context manager, tool router, doom-loop detector, and iterative tool execution.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/README.md:321-330` — events include processing, ready, assistant chunks/messages, stream end, and tool calls.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/AGENTS.md:20-24` — required checks before commit are Ruff lint and format check.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/AGENTS.md:36-46` — PR/deploy flow keeps GitHub PRs separate from Hugging Face Space deploys and warns that local PAT scopes can hide production OAuth scope gaps.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/README.md:7-21` — agent architecture is queue-based; `agent_loop.py`, `session.py`, `tools.py`, `context_manager`, `config.py`, and `main.py` have explicit responsibilities.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/session.py:80-97` — operations and events are typed (`OpType`, `Event`).
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/session.py:103-180` — `Session` owns model config, context manager, tool router, event queue, IDs, plan state, sandbox/job state, notifications, usage thresholds, and local trajectory logging.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/tools.py:112-154` — tool system has `ToolSpec` and `ToolRouter`, with a registry for built-in and MCP tools.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/tools.py:156-230` — MCP tools are dynamically registered, denied by name when needed, OpenAPI tool loading is best-effort, and total tool count is logged.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/context_manager/manager.py:77-117` — compaction and restore prompts preserve decisions, tool trail, artifacts, and next steps for continuity.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/papers_tool.py:1-7` — papers tool covers trending, search, paper details, paper reading, datasets/models/collections/resources, citation graph, snippet search, and recommendation.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/papers_tool.py:24-29` — paper output is bounded through explicit limit constants for list length, summary, section previews, and section text.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/dataset_tools.py:1-6` — dataset inspection combines validity, splits, info, first rows, and parquet endpoints into one comprehensive call.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/dataset_tools.py:50-111` — dataset structure/content API calls are parallelized for speed.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/research_tool.py:1-8` — research subagent is isolated from main context so focused research does not pollute the main conversation.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/research_tool.py:98-121` — research prompt starts from papers, crawls citations, reads methodology/experiments/results, validates datasets, and then finds code/docs.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/research_tool.py:196-220` — output must be a ranked recipe table: paper, result, datasets, method, what made it work, code patterns, recommendations, SOTA landscape, essential references.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/tools/plan_tool.py:19-87` — plan tool validates todos, keeps exactly structured status, stores session plan state, and emits `plan_update`.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/session_persistence.py:1-6` — durable persistence is optional; CLI works without MongoDB.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/session_persistence.py:39-58` — persistence replaces oversized/invalid messages with explicit markers instead of failing whole snapshots.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/session_uploader.py:1-16` — session uploader runs separately, supports row and Claude Code JSONL trace formats, and avoids blocking the main agent.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/session_uploader.py:73-89` — uploader scrubs tokens/API keys before upload.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/hub_artifacts.py:19-31` — generated Hub artifacts carry an ML Intern tag, provenance marker, collection naming, and session artifact tracking.
- `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern/agent/core/hub_artifacts.py:207-231` — artifact README augmentation adds metadata, provenance, and usage sections.

## Command Evidence

- `git status --short --branch` showed `main...origin/main [ahead 3]` and a large dirty candidate diff.
- `wc -l src/cli.ts src/rank/paper-rank.ts src/pi/package-ops.ts src/model/commands.ts src/telemetry/posthog.ts extensions/research-tools.ts extensions/research-tools/header.ts tests/paper-rank.test.ts` returned:
  - `src/cli.ts`: 1,322 lines.
  - `src/rank/paper-rank.ts`: 6,482 lines.
  - `src/pi/package-ops.ts`: 734 lines.
  - `src/model/commands.ts`: 1,036 lines.
  - `src/telemetry/posthog.ts`: 569 lines.
  - `tests/paper-rank.test.ts`: 2,350 lines.
- `node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` returned `0.79.10`.
- `git -C /Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/ml-intern rev-parse HEAD` returned `550a209701701e6a9ac7cac70b8dbd508822d467`.
- `npm run architecture:check` passed after adding `scripts/check-architecture.mjs`; it checked 114 files, listed `src/cli.ts`, `src/rank/paper-rank.ts`, and `tests/paper-rank.test.ts` as known architecture debt, and warned on `scripts/patch-embedded-pi.mjs` plus `src/model/commands.ts`.
