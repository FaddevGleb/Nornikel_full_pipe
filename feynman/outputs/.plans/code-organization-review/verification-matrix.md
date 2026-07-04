# Verification Matrix

## Final Verification For This Change

Clean-room Daytona sandbox: `feynman-architecture-1782215750`.

Passed on 2026-06-23:

| Area | Check | Result |
| --- | --- | --- |
| Clean install | `npm ci` | Passed, 365 packages, 0 vulnerabilities. |
| Architecture guard | `npm run architecture:check` | Passed, checked 115 source files and reported known debt only. |
| Root test suite | `npm test` | Passed, 323/323. |
| Types | `npm run typecheck` | Passed. |
| Build | `npm run build` | Passed when run alone. A parallel build+typecheck attempt hit Daytona memory pressure with status 137, then the isolated build passed. |
| Root audit | `npm audit --omit=dev` | Passed, 0 vulnerabilities. |
| Diff hygiene | `git diff --check` | Passed. |
| Website install | `npm --prefix website ci` | Passed, 0 vulnerabilities. Node 25 emitted the expected website engine warning because website declares `<25`. |
| Website lint | `npm run lint` in `website/` | Passed. |
| Website types | `npm run typecheck` in `website/` | Passed, 0 errors/warnings/hints. |
| Website build | `npm run build` in `website/` | Passed, 33 static pages. |
| Website audit | `npm audit --omit=dev` in `website/` | Passed, 0 vulnerabilities. |
| Rendered links | Node HTML walker over `website/dist` | Passed, 33 HTML files, 0 missing internal links. |
| Package dry run | `npm pack --dry-run` | Passed, 133 files, 50.9 MB package, shasum `85d92d0cffb5f01296a0599b45ac93b6b2771b62`. |
| Runtime alias speed fix | `ls -l .feynman/npm/node_modules/@mariozechner` after pack prep | Passed, legacy Pi package entries are symlinks to `@earendil-works/*`, not duplicate installs. |

## ResearchRun Product-Contract Verification

Disposable clean-room Daytona sandbox: `feynman-researchrun-e2e` (created from an 18 MB trimmed local context, then deleted after verification).

Passed on 2026-06-24:

| Area | Check | Result |
| --- | --- | --- |
| Local root tests | `npm test` | Passed, 325/325. |
| Local types | `npm run typecheck` | Passed. |
| Local architecture guard | `npm run architecture:check` | Passed, checked 118 source files and reported known debt only. |
| Local build | `npm run build` | Passed. |
| Local root audit | `npm audit --omit=dev` | Passed, 0 vulnerabilities. |
| Diff hygiene | `git diff --check` | Passed. |
| Website lint | `npm --prefix website run lint` | Passed. |
| Website types | `npm --prefix website run typecheck` | Passed, 0 errors/warnings/hints. |
| Website build | `npm --prefix website run build` | Passed, 33 static pages. |
| Website audit | `npm --prefix website audit --omit=dev` | Passed, 0 vulnerabilities. |
| Rendered links | Node HTML walker over `website/dist` | Passed, 33 HTML files, 0 missing internal links. |
| Local package dry run | `npm pack --dry-run` | Passed after final manifest completion-marker ordering fix, 135 files, 52.3 MB package, shasum `0442fe1352718f10b347c53b182b84d335713451`. |
| Local installed-tarball E2E | Fresh temp `npm install --omit=dev /tmp/feynman-pack-e2e/companion-ai-feynman-0.3.4.tgz`, then installed `feynman rank ... --json` | Passed. Installed binary returned `0.3.4`, ranked 4 papers, top paper `WFOUNDATION`, emitted `feynman.researchRun.v1`, wrote 11 artifacts, and kept `rawFullTextStored: false`. Temp install audited 365 packages with 0 vulnerabilities. |
| Daytona clean install | `npm ci` | Passed, 365 packages, 0 vulnerabilities. |
| Daytona architecture guard | `npm run architecture:check` | Passed, checked 118 source files and reported known debt only. |
| Daytona root test suite | `npm test` | Passed, 325/325. |
| Daytona types | `npm run typecheck` | Passed. |
| Daytona build | `npm run build` | Passed. |
| Daytona root audit | `npm audit --omit=dev` | Passed, 0 vulnerabilities. |
| Daytona package dry run | `npm pack --dry-run` | Passed, 135 files, 51.2 MB package, shasum `887a878a609b651fd1d1b67077c1c48e8d4c8f0f`. |

Install-speed note: local installed-tarball install took about 3 minutes with npm's allow-scripts warnings; Daytona clean `npm ci` took 15 seconds. The package works, and the remaining speed target is the 51-52 MB vendored runtime archive and 417-package runtime prep path.

## Before Any Product Code Change

| Area | Check | Evidence Needed |
| --- | --- | --- |
| Worktree safety | `git status --short --branch` | Confirm dirty files and avoid reverting user work. |
| Pi version | `node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` | Must match docs/source being used. Current read returned `0.79.10`. |
| Baseline tests | `npm test` | Establish current red/green before refactor. |
| Baseline types | `npm run typecheck` | Establish TypeScript state before extraction. |
| Baseline build | `npm run build` | Establish dist build before extraction. |
| Architecture guard | `npm run architecture:check` | Must pass while naming existing debt; added in this pass. |

## PaperRank Extraction

| Module | Contract Tests |
| --- | --- |
| `src/papers/openalex.ts` | Fixture OpenAlex works normalize to stable IDs, DOI/arXiv/PMID/PMCID extraction, safe URLs. |
| `src/papers/access.ts` | Legal access candidates rank in expected order; no raw full text in JSON output by default. |
| `src/papers/full-text.ts` | AlphaXiv and Europe PMC fixture content extracts bounded sections and source status. |
| `src/evidence/graph.ts` | Citation graph edge counts, PageRank monotonicity for simple fixtures, citation expansion cap. |
| `src/rank/scoring.ts` | Missing signals excluded from denominator; methodology/reproducibility signal uses rubric evidence. |
| `src/rank/calibration.ts` | Preference file validates and produces explicit status when overlap is insufficient. |
| `src/rank/reproduction.ts` | Reproduction notes produce reproduced/partial/failed/not_runnable statuses and explicit limits. |
| `src/artifacts/*` | Required report sections, provenance sidecar, score audit path, graph explorer path. |

E2E gate:

```bash
npm test -- tests/paper-rank.test.ts
npm run typecheck
npm run build
```

Add a fixture run that verifies:

- ResearchRun manifest exists at `<slug>-research-run.json`
- ResearchRun manifest validates as `feynman.researchRun.v1`
- ResearchRun manifest names research jobs, sources, tools, artifacts, verification state, constraints, and next actions
- ResearchRun manifest contains no raw full text
- ranked paper count
- top paper ID/title
- graph edge count
- full-text available/missing/error counts
- critique count when `critiqueTop > 0`
- calibration and reproduction status
- provenance sidecar exists and names source accounting

## CLI Split

| Command | Smoke |
| --- | --- |
| `feynman --help` | Help renders from metadata and command modules. |
| `feynman doctor` | Reads settings/auth/session paths and exits without mutating unrelated config. |
| `feynman status` | Current settings/model/search/package status still prints. |
| `feynman model list` | Model catalog still loads and Pro-class policy remains disabled for tests. |
| `feynman search status` | Search provider config still reads. |
| `feynman packages list` | Pi package status still reads. |
| `feynman rank <topic> --source-fixture <fixture> --json` | JSON schema unchanged. |
| `feynman paper <id> --source-fixture <fixture> --json` | JSON schema unchanged. |

## Plugin Validator

Tests:

- Valid manifest with `source_adapters` and Pi skills passes.
- Valid manifest with `entity_extractors` and `experiment_runners` passes.
- Missing `research_jobs` fails.
- Unknown slot fails.
- Path traversal in plugin name/path fails.
- Absolute path fails unless explicitly allowed for local dev mode.
- Manifest version above supported fails with actionable update message.
- Invalid plugin does not prevent valid sibling plugin from being listed, matching Codex's per-server error pattern (`codex-mcp/src/plugin_config.rs:58-82`).

Smoke:

```bash
feynman plugins validate ./fixtures/plugins/scholar-inbox
feynman plugins list
```

## MCP Server

Do not ship before these pass:

- Unit tests for tool schemas.
- MCP smoke using a local client that calls `resolve_paper`, `rank_papers`, and `get_research_artifact`.
- Bounded-output tests for full text and graph results.
- Telemetry redaction test proves prompts/tool args/full text/file paths are not emitted.

## Architecture Guard

Added in this pass:

```bash
npm run architecture:check
```

Suggested rules:

- Warn at source files over 800 LoC, fail over 1,200 LoC unless allowlisted with written reason.
- Domain modules cannot import from `src/cli`, `src/commands`, or `src/ui`.
- Artifact modules cannot fetch network sources.
- Source adapter modules cannot write artifacts.
- Plugin modules cannot import command handlers.

This mirrors Codex's large-module guardrail (`codex/AGENTS.md:50-60`) while fitting TypeScript/Feynman.

Current verified output:

- Known debt: `src/cli.ts`, `src/rank/paper-rank.ts`, `tests/paper-rank.test.ts`.
- Warning zones: `scripts/patch-embedded-pi.mjs`, `src/model/commands.ts`.
- Checked 114 source files.

## Research Recipe Artifact

Add after PaperRank extraction:

- Fixture where a paper has methodology/result/dataset/code signals should produce one recipe row with evidence spans.
- Fixture with missing dataset/code should produce explicit `missing` or `not_checked`, not hallucinated links.
- Recipe Markdown should escape untrusted provider text.
- Recipe JSON should not include raw full text.
- Recipe artifact should be referenced from the main PaperRank report and provenance sidecar.
