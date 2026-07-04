# CHANGELOG

Workspace lab notebook for long-running or resumable research work.

Use this file to track chronology, not release notes. Keep entries short, factual, and operational.

### 2026-06-28 18:28 PDT — issue-183-ship-0-3-5

- Objective: Ship the local Pi runtime candidate that fixes #183 instead of leaving it as an unpublished `0.3.4` working tree.
- Changed: Bumped Feynman to `0.3.5`, added `v0.3.5` release notes, kept the Pi runtime line at `0.80.2`, preserved published `v0.3.4` release history, derived legacy `@mariozechner/*` peer aliases from current `@earendil-works/*` runtime metadata, and updated the Pi TUI patcher for the current overflow-check block.
- Checked: Live GitHub had open issues #182 and #183 and zero open PRs at the start of the pass. #183 is fixed and published in `v0.3.5`: packaged/runtime Pi `0.80.2` includes `@earendil-works/pi-ai` `./compat`, `dist/compat.js`, current and legacy extension-loader `/compat` aliases, and the bundled `pi-web-access` package imports successfully through Jiti. #183 was commented and closed as completed after npm/GitHub release verification. #182 remains open and still points at the alphaXiv/Clerk OAuth redirect before Feynman/alpha-hub receives a callback; no Feynman-owned callback fix was proven in this pass.
- Verified: `npm test` passed 326/326; `npm run typecheck`, `npm run build`, `npm run architecture:check`, root `npm audit --omit=dev`, website lint/typecheck/build/audit, rendered website internal-link check, `git diff --check`, release-note extraction for `0.3.5`, `npm pack --dry-run --json`, and real installed-tarball version/help/runtime/`pi-web-access` import/search-status smokes passed. One installed-tarball smoke attempt failed from local `/tmp` ENOSPC while extracting the runtime archive; after removing stale Feynman temp smoke directories, the rerun passed.
- Next: Continue watching #182 for a current callback trace; no open PRs remain.

### 2026-06-27 23:09 PDT — issue-sweep-open-queue-covered

- Objective: Re-run the recurring Feynman intake sweep from the actual dirty local release-candidate tree, preserving unrelated local changes and making no GitHub writes.
- Checked: Live GitHub still has open issues #182 and #183, zero open PRs, latest `main` workflow `Publish and Release` run `28082220040` green at `852a2f1`, latest GitHub release `v0.3.4`, and npm `@companion-ai/feynman@0.3.4`. Contributor branch surfaces remain non-open PRs: `origin/fix/deepresearch-local-model-warning`, `pr4fork/main`, and fetched stale fork branches.
- Decisions: No new product code was needed. #183 is actionable against published `v0.3.4` reports but already covered by the local candidate: Pi runtime `0.80.2` exports `./compat`, packaged `runtime-workspace.tgz` contains `pi-ai/dist/compat.js`, and the extension loader aliases both `@earendil-works/pi-ai/compat` and `@mariozechner/pi-ai/compat`. #182 remains deferred because the current evidence still points at alphaXiv/Clerk OAuth redirect behavior before Feynman/alpha-hub receives a callback; local Feynman code delegates auth to `@companion-ai/alpha-hub@0.1.3` and prints the auth URL.
- Package freshness: Feynman and Pi runtime packages are current; alpha-hub is current. Root non-security drift remains `@clack/prompts`, `posthog-node`, `fast-xml-parser`, and `@types/node`; website non-security drift remains Astro/ESLint/UI-tooling packages. No dependency drift was tied to an open research-loop defect.
- Verified: `npm test` passed 326/326; `npm run typecheck`, `npm run build`, `npm run architecture:check`, website `lint`, website `typecheck`, website `build`, root and website `npm audit --omit=dev`, `git diff --check`, `npm pack --dry-run --json`, and installed-tarball version/help/runtime-archive smoke passed. One temporary installed-tarball smoke attempt failed only because the `npm pack --json` parser consumed prepack log text before the final JSON array; the corrected rerun passed.
- Next: Keep the local release candidate unpushed until explicit commit/push/release authorization; continue watching #182 for a current callback trace and #183 for published-release follow-up after the local candidate is shipped.

### 2026-06-27 16:08 PDT — issue-sweep-current-queue-clean

- Objective: Re-run the recurring Feynman intake sweep against the current dirty release-candidate tree without pushing, merging, closing, or commenting on GitHub.
- Checked: Open GitHub issues are still #182 and #183; open PRs are zero; recent `main` workflow state still ends with green `Publish and Release` run `28082220040` at `852a2f1`; latest GitHub release and npm package are still `v0.3.4` / `0.3.4`; current local package metadata is `@companion-ai/feynman@0.3.4`; Pi runtime packages remain current at `0.80.2`; alpha-hub remains current at `0.1.3`; `origin/fix/deepresearch-local-model-warning` and `pr4fork/main` are stale/non-open branch surfaces, not live PRs.
- Decisions: No new product code was needed. #183 remains covered by the local Pi `0.80.2` candidate because installed and packaged runtime copies include `@earendil-works/pi-ai` `./compat`, `dist/compat.js`, and extension-loader aliases for both current and legacy `/compat` paths. #182 remains deferred because current local code delegates the OAuth callback loop to `@companion-ai/alpha-hub` on `127.0.0.1:9876`, the bundled auth patch exposes the full auth URL, and no current-version callback trace proves a Feynman-owned defect. Outdated ordinary dependencies (`@clack/prompts`, `posthog-node`, `fast-xml-parser`, `@types/node`) were not upgraded because no open issue or validation failure tied them to the research loop.
- Verified: Root `npm test` passed 326/326; `npm run typecheck`, `npm run build`, `npm run architecture:check`, root and website production audits, website lint/typecheck/build, `git diff --check`, `npm pack --dry-run`, and installed-tarball version/help/runtime inspection smoke passed. Installed tarball smoke returned version `0.3.4` and confirmed packaged Pi `0.80.2` compat export/file, current and legacy loader aliases, and alpha auth URL logging.
- Next: Keep the release candidate local-only until explicit commit/push/release authorization; continue watching #182 for a current-version callback trace and #183 for regressions against Pi `/compat`.

### 2026-06-27 09:15 PDT — issue-sweep-no-new-port

- Objective: Re-run the recurring Feynman intake sweep against the current dirty release-candidate tree without disturbing existing local package/runtime work.
- Checked: Open GitHub issues are #182 and #183; open PRs are zero; recent `main` workflows still end with green `Publish and Release` run `28082220040` at `852a2f1`; latest GitHub release and npm package are `v0.3.4` / `0.3.4`; published Pi runtime packages are current at `0.80.2`; refreshed remote branch list has no new contributor PR branch beyond the existing stale branches.
- Decisions: No new product code was needed. #183 remains covered by the local Pi `0.80.2` candidate because installed `@earendil-works/pi-ai` exports `./compat`, `dist/compat.js` exists, and the installed extension loader aliases both current and legacy `/compat` paths. #182 remains deferred because the current local code delegates alpha login to `@companion-ai/alpha-hub` on `127.0.0.1:9876`, and no fresh trace proves a Feynman-owned callback defect.
- Verified: Root `npm test` passed 326/326; `npm run typecheck`, `npm run build`, `npm run architecture:check`, website lint/typecheck/build, root and website production audits, `git diff --check`, `npm pack --dry-run`, and installed-tarball help/packages/PaperRank/paper-access smokes passed. Installed tarball smoke returned version `0.3.4`, ranked 4 fixture papers with 2/2 full text and 2 critiques, and resolved fixture paper access as full text available.
- Next: Keep the release candidate local-only until explicit commit/push/release authorization; continue watching #182 for a current-version failing callback trace.

### 2026-06-26 19:13 PDT — issue-sweep-current-queue-clean

- Objective: Re-run the recurring Feynman intake sweep against the current dirty release-candidate tree.
- Checked: Open GitHub issues are #182 and #183; open PRs are zero; latest `main` workflow is `Publish and Release` run `28082220040` at `852a2f1` and succeeded; latest GitHub release and npm package are still `v0.3.4` / `0.3.4`; the only non-main origin branch is `fix/deepresearch-local-model-warning`.
- Decisions: #183 remains covered by the local Pi `0.80.2` candidate because installed, vendored, and packaged runtime loaders include both `@earendil-works/pi-ai/compat` and legacy `@mariozechner/pi-ai/compat` aliases and `@earendil-works/pi-ai` exports `./compat`. #182 is current-version user-reported but still points at the upstream alphaXiv/Clerk OAuth redirect flow before Feynman/alpha-hub receives a callback; no local fix was ported. The local-model warning branch stays deferred because it is workflow-copy behavior without a current issue-backed research-loop defect.
- Verified: Focused touched-surface tests passed 88/88; `npm run typecheck`, `npm run build`, full `npm test` (326/326), website lint/typecheck/build, root and website `npm audit --omit=dev`, `git diff --check`, `npm pack --dry-run --json`, and installed-tarball help/alpha-help/runtime-archive smoke passed. One installed-tarball smoke attempt failed only in the pack JSON parser because npm prepack logs preceded the JSON payload; the rerun extracted the JSON array deliberately and passed.
- Next: Keep the release candidate local-only until explicit commit/push/release authorization; keep watching #182 for provider-side OAuth changes or a reproducible local callback defect.

### 2026-06-26 09:32 PDT — pi-peer-alias-stability

- Objective: Fix the red package-op gate found after the intake sweep: full `npm test` could fail at `installPackageSources installs Pi runtime peers beside Pi packages`.
- Root cause: `resolveRuntimePeerSpec()` trusted legacy `@mariozechner/*` package roots before resolving the canonical `@earendil-works/*` runtime package. A stale or concurrently-created legacy root in `.feynman/npm/node_modules` could make generated legacy peer aliases use stale runtime metadata instead of the current bundled Pi runtime.
- Changed: Legacy Pi runtime package names now derive their npm alias version from the current canonical `@earendil-works/*` package first, falling back only when canonical metadata is unavailable. The package-op regression now plants stale legacy roots and asserts aliases still follow the current root runtime version.
- Verified: Focused `tests/package-ops.test.ts` passed 10/10. `npm run typecheck`, `npm run build`, full `npm test` (326/326), `git diff --check`, `npm pack --dry-run`, and installed-tarball help smoke passed.
- Next: The package candidate is local-only; commit/push/release still need explicit user authorization.

### 2026-06-25 22:05 PDT — issue-sweep-no-new-port

- Objective: Re-run the Feynman GitHub/release/package/local validation sweep against the current dirty package state.
- Checked: Open GitHub issues remain #182 and #183; open PRs remain zero; latest `main` workflow `Publish and Release` run `28082220040` succeeded; latest GitHub release and npm package remain `v0.3.4` / `0.3.4`; Pi runtime packages remain current at `0.80.2`; contributor branch `origin/fix/deepresearch-local-model-warning` is still unmerged and not an open PR.
- Decision: No new product code was needed. #183 is still covered by the local Pi `0.80.2` runtime/compat changes. #182 stays deferred because the report is on old CLI `0.2.17` and no current-version auth repro was available. The local-model warning branch stays deferred because it is launch-copy behavior without a current issue-backed defect.
- Verified: `npm run typecheck`, `npm run build`, isolated package-op tests, full `npm test` (326/326), root/website production audits, website typecheck/lint/build, `git diff --check`, `npm pack --dry-run`, and installed-tarball help smoke passed. One initial combined focused test command failed a package-op assertion while other validation commands were running; isolated package-op and full-suite reruns passed.
- Next: Commit/push/release only after explicit user authorization; continue watching #182 for a current-version login repro.

### 2026-06-25 20:47 PDT — pi-tui-terminal-overflow

- Objective: Fix Feynman startup/runtime failures when Pi renders a line wider than the current terminal width.
- Changed: Updated the Pi TUI patcher to recognize the current Pi `0.80.2` overflow-check block, where the line clear happens before the width guard. The patch now removes Pi's hard `Rendered line ... exceeds terminal width` throw and truncates the overwide line instead. Rebuilt the vendored runtime workspace so installed and packaged Pi TUI copies carry the fix.
- Verified: The real `node_modules`, vendored workspace, and `runtime-workspace.tgz` Pi TUI files no longer contain `throw new Error(errorMsg)` and do contain `line = sliceByColumn(line, 0, width, true)`. A direct fake-terminal TUI smoke hit the overwide differential-render path without throwing. Focused Pi TUI/runtime patch tests, `npm run typecheck`, `npm run build`, full `npm test` (326/326), `git diff --check`, `npm pack --dry-run`, and installed-tarball help/runtime inspection passed.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-24 18:05 PDT — pi-0-80-2-compat-runtime

- Objective: Sweep live GitHub intake and fix only core AI-researcher reliability defects.
- Changed: Upgraded the bundled Pi runtime package line from `0.79.10` to `0.80.2`, aligned Feynman's fallback/runtime seeding constants, migrated the remaining `getEnvApiKey` import to `@earendil-works/pi-ai/compat`, rebuilt the vendored runtime workspace, and updated release docs/tests to record the `/compat` migration. This addresses the open `pi-web-access` `/compat` loader failure without adding a local shim.
- Verified: GitHub issue/PR sweep found open issues #182 and #183, zero open PRs, and the latest `main` workflow green. The packaged runtime archive now contains `@earendil-works/pi-ai@0.80.2` with `./compat` and loader aliases for both `@earendil-works/pi-ai/compat` and `@mariozechner/pi-ai/compat`. Focused tests passed 52/52 and 72/72; full `npm test` passed 325/325; `npm run typecheck`, `npm run build`, root/website production audits, website typecheck/lint/build, `npm pack --dry-run`, `git diff --check`, and installed-tarball help/runtime smokes passed.
- Next: Commit/push/release only after explicit user authorization; keep #182 deferred until there is a current-version alpha login repro.

### 2026-06-22 15:46 PDT — release-candidate-cleanup

- Objective: Clean the staged AI-researcher release candidate without expanding scope after the Yo-Yo PR intake.
- Changed: Removed stale ignored local artifacts (`firebase-debug.log`, old package tarballs, `outputs/.DS_Store`, and a stale paper log). Kept fresh ignored build artifacts needed for local CLI/package smoke inspection. Reworded the `/lit` publication-corpus guard so rejected non-core workflow terms do not appear in the active prompt surface. Normalized PaperRank report/provenance indentation.
- Verified: Active-surface scan now finds rejected outreach/Bernoulli/contact terms only inside the negative regression. Focused `node --import tsx --test --test-concurrency=1 tests/content-policy.test.ts tests/paper-rank.test.ts` passed 85/85. No tracked files were deleted during the ignored-artifact cleanup.
- Next: Re-run full package gates and keep commit/push/release pending explicit user authorization.

### 2026-06-22 15:41 PDT — yoyo-pr-core-intake

- Objective: Re-evaluate PR #179 and merge only the pieces that strengthen Feynman's core AI-researcher loop.
- Changed: Ported the useful lab-canon idea into `/lit` as a lab/PI/author publication-corpus mode instead of adding a new top-level workflow. Ported the useful summarize idea into `/summarize` by adding Field Context, Technical Hinges, Methodology From Primitives, and Follow-up Questions to the output format while keeping the existing disk-backed RLM ingestion. Left `/paper-outreach`, hardcoded Bernoulli database registration, and standalone `/lab-canon` out of the product surface. Added a regression that the accepted research-core ideas are present and the rejected outreach/database pieces stay absent.
- Verified: Fetched and reviewed PR #179 through GitHub. Focused `tests/content-policy.test.ts` passed 33/33. Full `npm test` passed 321/321. `npm run typecheck`, `npm run build`, website typecheck/lint/build, `git diff --check`, `git diff --cached --check`, `npm pack --dry-run`, and live `FEYNMAN_TELEMETRY=off NO_COLOR=1 node bin/feynman.js help` passed. Posted PR review comment `4548622880` with the intake decision.
- Next: Stage the ported PR slice with the current local release candidate; commit/push/release remains pending explicit user authorization.

### 2026-06-22 05:34 PDT — paperrank-action-pointer-truth

- Objective: Ensure PaperRank's next-action queue points only to artifacts that actually exist for the current run, keeping the workflow useful instead of feature-shaped.
- Changed: Default missing-calibration and missing-reproduction next actions now point to the ranked brief, score audit, graph explorer, scores, and rank-sensitivity artifacts that are always written. Calibration templates, guides, score-calibration JSON, reproduction ledgers, reproduction-note templates, and replication plans are referenced only after a preference file or reproduction notes file causes those artifacts to exist. Added a regression covering the model-synthesis handoff path.
- Verified: Focused PaperRank/content-policy tests passed 78/78. Full `npm test` passed 308/308. `npm run typecheck`, `npm run build`, `git diff --check`, `git diff --cached --check`, root production audit, and `npm pack --dry-run` passed.
- Next: Continue auditing for concrete AI-researcher alignment defects; commit/push/release only after explicit user authorization.

### 2026-06-22 05:32 PDT — paperrank-preference-notes-rename

- Objective: Keep PaperRank calibration and reproduction evidence inside the AI-researcher loop without exposing test-harness language as product surface.
- Changed: Renamed the public PaperRank calibration/reproduction inputs from `--calibration-fixture` and `--reproduction-fixture` to `--preference-file` and `--reproduction-notes`. Renamed exported PaperRank option/type/function names, telemetry keys, generated JSON source fields, generated template schema names, website docs, release docs, and tests from fixture-language to preference/notes-language. Left `--source-fixture` only as test-data plumbing for OpenAlex-shaped fixtures.
- Verified: Focused PaperRank/telemetry/content-policy tests passed 89/89. Full `npm test` passed 308/308. `npm run typecheck`, `npm run build`, website lint/typecheck/build, root and website production audits, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed. Built CLI smoke with `--preference-file` and `--reproduction-notes` produced evaluated calibration and reproduction artifacts with `preferenceSource` and `notesSource`, no `fixtureSource`; old `--calibration-fixture` exited as an unknown option.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-22 05:31 PDT — refreshed-reference-audit-and-fixture-surface-trim

- Objective: Refresh the external reference repos the user named and re-audit the staged package for feature creep before committing anything.
- Changed: Pulled clean reference archives for ML Intern, Claude Code, Codex, Pi, Hermes Agent, OpenClaw, plus local Codex/Hermes/OpenClaw checkouts where clean. Local `pi-mono` was fetched but not pulled because it had pre-existing deleted build artifacts. Removed PaperRank calibration/reproduction fixture flags from the README and command teaser while keeping the advanced evidence features in the PaperRank docs/tests.
- Verified: Current Pi source and npm still report `0.79.10` for the scoped Pi runtime packages, so no newer installable Pi pin exists. Current Pi packages/extensions/security docs still support the Feynman package/extension path and warn that packages/extensions are full-access. Active staged scans found no live `Research Agenda` keys outside negative tests and no `gpt-5.5-pro` slug. Full `npm test` passed 308/308 after the fixture-surface trim.
- Next: Stage the trim/audit notes, then rerun the final non-test package gates before any commit/push/release authorization.

### 2026-06-22 05:03 PDT — final-package-verification-pass

- Objective: Re-run the remaining package, website, and audit gates after the latest scope/model cleanup so the staged AI-researcher package has one coherent verification state.
- Changed: No product behavior changed. Updated this lab notebook with the final verification state.
- Verified: Full `npm test` passed 308/308. `npm pack --dry-run` passed and packed 130 files after rebuilding `dist` and confirming the vendored runtime workspace was current. Website `lint`, `typecheck`, and `build` passed; the website build generated 33 pages. Root and website `npm audit --omit=dev` both reported `found 0 vulnerabilities`. `git diff --check` and `git diff --cached --check` passed.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-22 04:58 PDT — model-pro-edge-guard

- Objective: Make the non-Pro model policy robust even for edge-case provider/model strings, without removing provider catalog entries.
- Changed: `isProClassModel` now evaluates the full `provider/model` spec instead of only the model ID, so provider names carrying a Pro-class marker cannot slip into available/recommended/default paths. Gemini model family ranking now ranks Pro suffixes last instead of treating them as the strongest variant. Added a synthetic catalog regression that Pro-class provider and model strings are excluded from recommendations when a non-Pro OpenAI GPT model is available.
- Verified: Focused model/catalog/settings tests passed 61/61. `npm run typecheck` and `npm run build` passed.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-22 04:56 PDT — compute-surface-scope-tightening

- Objective: Keep Docker, Modal, and RunPod as execution choices for active research experiments instead of marketing them as separate Feynman product lanes.
- Changed: Replaced the separate README tool bullets for Docker, Modal, and RunPod with one gated `Research execution options` bullet tied to explicitly chosen replication, benchmark, or dataset-heavy experiment runs, and added a content-policy regression that those standalone bullets do not return.
- Verified: Focused content/help/package tests passed 42/42. Live `FEYNMAN_TELEMETRY=off NO_COLOR=1 node bin/feynman.js help` showed research-scoped commands and no generic scheduler/process package commands. Live `feynman packages list` showed the lean core package set plus only supported research-continuity optional presets on the current Node runtime, with no remote-compute preset.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-22 04:53 PDT — paperrank-next-actions-contract

- Objective: Remove the remaining default `Research Agenda` feature-shaped label from PaperRank while keeping the useful read/calibrate/reproduce action queue inside the core research loop.
- Changed: Renamed the active PaperRank result, CLI JSON summary, model-synthesis packet, report heading, prompt handoff, telemetry property, and provenance wording from `researchAgenda`/`Research Agenda` to `nextResearchActions`/`Next Research Actions`. Changed generated action IDs from `agenda-*` to `action-*`. Added regression checks that the old JSON/artifact keys stay absent.
- Verified: Focused PaperRank/content-policy/telemetry tests passed 89/89. Full `npm test` passed 307/307. `npm run typecheck` and `npm run build` passed. Live built-CLI smoke with telemetry disabled ran `feynman rank "sparse autoencoders mechanistic interpretability" --limit 2 --expand-citations 1 --full-text-top 1 --critique-top 1 --json`; output had `nextResearchActions`, no `researchAgenda`, no `research-agenda` files, report heading `## Next Research Actions`, 2 scored papers, 9 graph papers, and 9 graph edges.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-22 04:42 PDT — reference-sweep-scope-wording

- Objective: Re-read current external agent references and remove the remaining active wording that made Feynman sound like generic productivity or code optimization instead of an AI researcher.
- Changed: Refreshed/current-read ML Intern, Claude Code, Codex, Hermes Agent, OpenClaw, and Pi references. Kept the useful pattern as scoped research infrastructure: plugins/extensions, skills, traces, sandbox/remote execution, and model choice. Tightened `/summarize`, `/autoresearch`, the autoresearch skill, workflow docs, and slash-command docs so they describe research sources and research experiment loops instead of arbitrary URLs or generic benchmark/code-optimization loops. Added content-policy coverage for those surfaces.
- Verified: `npm test` passed 307/307. `npm run typecheck`, `npm run build`, website lint/typecheck/build, root and website production audits, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Live CLI smokes passed for `feynman help`, `feynman model`, bundled `feynman alpha --json search`, `feynman paper 10.7717/peerj.4375 --fetch-full-text --json`, and `feynman rank "sparse autoencoders mechanistic interpretability" --limit 3 --expand-citations 1 --full-text-top 1 --critique-top 1 --json` with telemetry disabled and temp output. The live rank output wrote the lean default artifact set, generated 16 graph nodes and 20 graph edges, had 3 scored papers, fetched one full text, generated one critique, omitted raw full-text bodies, and produced zero default memo/dashboard/agenda/calibration/template/synthesis/replication-plan files. Active-surface scans found no grant/proposal/admin product lane outside funding-noise filters and negative assertions, and no stale summarize/autoresearch phrases outside the new regression assertion. Built website docs include the research-scoped autoresearch copy.
- Next: Commit/push/release only after explicit user authorization.

### 2026-06-22 04:24 PDT — paperrank-lean-default-artifacts

- Objective: Keep PaperRank simple yet potent: default output should answer what to read first and why, not create a pile of adjacent research-management artifacts.
- Changed: Removed default `research-memo`, `dashboard`, and standalone `research-agenda` artifact generation from PaperRank. Kept the decision-critical ranked brief, score audit, score/data JSONL, rank sensitivity, citation graph, graph explorer, field map, provenance, and optional research critique. Calibration, reproduction/replication, and synthesis artifacts now write only when their existing fixture or synthesis flags are used. Removed dead memo/dashboard renderers, fixed stale artifact pointers, changed release notes, and replaced the Pro-only catalog test fixture with a generic fake Pro ID.
- Verified: Focused PaperRank tests passed 46/46; focused catalog/content-policy tests passed 44/44; focused Pi settings tests passed 13/13. Full `npm test` passed 306/306. `npm run typecheck`, `npm run build`, website lint/typecheck/build, root and website production audits, `npm pack --dry-run`, and `git diff --check` passed. Live `feynman paper 10.7717/peerj.4375 --fetch-full-text` fetched Europe PMC fullTextXML with 70,012 chars and 3 sections. Live `feynman rank "sparse autoencoders mechanistic interpretability" --limit 3 --expand-citations 1 --full-text-top 1 --critique-top 1` produced 10 files, with zero default memo/dashboard/agenda/calibration/reproduction/synthesis fixture files.
- Next: Stage the lean PaperRank cleanup with the AI-researcher package, then inspect the staged diff. Commit/push/release remains unauthorized.

### 2026-06-22 03:48 PDT — pi-0-79-10-published-refresh

- Objective: Keep Feynman's embedded Pi runtime on the latest installable published package, not the older package that was current earlier in the audit.
- Changed: Rechecked npm and found `@earendil-works/pi-coding-agent`, `pi-agent-core`, `pi-ai`, and `pi-tui` are now all published at `0.79.10`. Upgraded all four exact pins, updated Feynman's fallback/runtime-peer seeding constants to `0.79.10`, regenerated the vendored runtime workspace, and updated current release docs. Adjusted the theme resource test for Pi 0.79.10's deduped theme behavior: the synced user theme remains enabled and the duplicate project copy is no longer returned disabled.
- Verified: `npm view` reports `0.79.10` for all four Pi packages, and `package.json`/`package-lock.json` pin all four at `0.79.10`. Read Pi 0.79.10 package changelogs: compaction-event context, safer exact-version update flow, nested-repo `find` fix, OpenAI-compatible `reasoning_details` streaming preservation, and reload/session UI fixes. `node scripts/prepare-runtime-workspace.mjs` rebuilt the vendored runtime. Focused Pi/runtime/model/content tests passed 177/177 across two focused runs. Full `npm test` passed 306/306. `npm run typecheck`, `npm run build`, website lint/typecheck/build, root/website/vendored production audits, and `npm pack --dry-run` passed. Built CLI smokes for `help`, `packages list`, and `model` passed; live negative checks found no Pro, grant/proposal/funding, or removed UI/bulk targets in those command outputs.
- Next: Stage this Pi refresh with the AI-researcher package and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 03:39 PDT — research-review-skill-rename

- Objective: Remove the last active `peer-review` product label from installed skill surfaces while preserving the useful internal research-review workflow.
- Changed: Renamed bundled skill `skills/peer-review/SKILL.md` to `skills/research-review/SKILL.md` and changed its frontmatter name to `research-review`. Updated content-policy coverage to read the renamed skill and assert the old skill name is absent. Updated public release-note wording from peer-review docs to research-review docs.
- Verified: Focused content-policy plus skill-path tests passed 32/32. Active-surface scan found no `skills/peer-review`, `name: peer-review`, `Peer Review`, `peer-review-style`, `peer-review simulation`, `venue-style peer review`, `venue-pass speculation`, `venue readiness`, or `reviewing a paper for a venue` hits outside regression assertions. Full `npm test` passed 306/306. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed; the pack dry-run includes `skills/research-review/SKILL.md` and no `skills/peer-review/SKILL.md`.
- Next: Stage this skill rename with the AI-researcher package and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 03:32 PDT — reviewer-venue-scope-cleanup

- Objective: Keep the reviewer and audit surfaces inside internal research critique instead of venue-decision or external peer-review territory.
- Changed: Removed `venue-style peer review`, `venue readiness`, and `venue-pass speculation` language from the bundled reviewer agent. The reviewer now frames publication-readiness questions as revision risk and evidence quality, explicitly without predicting venue acceptance. The audit workflow docs now say to use `/audit` when evaluating a paper before relying on its claims, not when reviewing a paper for a venue. Added regression guards for those stale phrases.
- Verified: Focused content-policy tests passed 31/31. Active-surface scan found no `venue-style peer review`, `venue-pass speculation`, `venue readiness`, `reviewing a paper for a venue`, or stale peer-review simulation phrases outside regression assertions. Full `npm test` passed 306/306. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed.
- Next: Stage this scope cleanup with the AI-researcher package and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 03:23 PDT — cli-docs-live-surface-scope

- Objective: Keep live CLI guidance and docs navigation aligned with the actual simple AI-researcher surface.
- Changed: Renamed the docs sidebar workflow label from `Peer Review` to `Research Review`, changed alphaXiv docs from peer-review workflow wording to internal research-review wording, and removed the nonexistent `feynman setup model` recommendation from model status guidance. Model guidance now points to real commands: `feynman model login <provider>`, `feynman model list`, and `feynman model set <provider/non-pro-model>`.
- Verified: Focused catalog/content tests passed 44/44. Full `npm test` passed 306/306. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. Active-surface scans found no `feynman setup model`, `Peer Review`, or `workflows like ... peer review` hits outside regression assertions. After rebuilding `dist`, `FEYNMAN_HOME=<temp> FEYNMAN_TELEMETRY=off NO_COLOR=1 node bin/feynman.js model` printed `After auth is in place, rerun \`feynman model list\`.` with no `setup model` guidance.
- Next: Stage this CLI/docs live-surface cleanup with the AI-researcher package and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 03:16 PDT — website-render-scope-and-layout

- Objective: Verify the public site as rendered, not only by source grep, and remove user-facing noise that weakens the simple AI-researcher surface.
- Changed: Fixed homepage accessible H1 text so it reads "The open source AI research agent" instead of `AIresearch`. Constrained the docs wrapper/article/prose/code/table layout so mobile docs pages do not create page-level horizontal overflow; long code and tables keep their own local scroll. Removed the unused Vercel Analytics script and dependency so local preview no longer emits `/_vercel/insights/script.js` 404s; Feynman observability remains PostHog-focused.
- Verified: Focused `tests/content-policy.test.ts` passed 31/31. Full `npm test` passed 305/305. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. Website build passed with 33 pages after a concurrent Vite cache race was rerun sequentially. Browser render probe against local preview checked homepage, PaperRank, paper access, researcher, writer, and configuration pages on desktop 1440px and mobile 390px: all returned 200, stale public-copy hits were 0, console/page errors were 0, failed requests were 0, and document width equaled viewport width. Configuration still has internal table/code scrolling on mobile, but no page-level overflow.
- Next: Stage this website render cleanup with the AI-researcher package, then continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 03:02 PDT — public-agent-docs-scope

- Objective: Keep public agent docs aligned with the scoped research-output contract instead of implying universal citation, full-document reading, or fixed orchestration for every answer.
- Changed: Replaced the homepage "Every answer is cited" line with research-claim citation wording. Narrowed researcher docs from "entire source discovery and extraction pipeline" and default parallel agents to selected-source extraction and broad-task parallelism. Narrowed writer docs from every factual claim and always-last-agent promises to research-claim citation and usually-near-the-end workflow placement. Narrowed verifier docs from every verification result and exact quote wording to traceable completed verification notes with source locations. Narrowed reviewer docs from universal end-to-end document reading to available-artifact review tasks. Added content-policy coverage for these stale public-doc promises.
- Verified: Focused `tests/content-policy.test.ts` passed 31/31. Full `npm test` passed 305/305. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. Active-surface scans found no stale `Every answer is cited`, `handles the entire source discovery`, `Every factual claim is linked`, `It is always the last agent`, or `Every verification result includes` phrases outside regression assertions.
- Next: Stage this public agent-docs cleanup with the AI-researcher package, then continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:55 PDT — public-provenance-promise-scope

- Objective: Keep public provenance claims strong but precise: research outputs and research claims are source-grounded, not every utility response or command output.
- Changed: Narrowed homepage hero/footer copy and README "How it works" copy from absolute `every claim` / `every output` promises to research-claim and research-output provenance. Replaced homepage "right team assembles" orchestration copy with specialist agents joining when the research task needs them, and changed "searches, remembers, and exports work" to source retrieval, research continuity, and artifact rendering. Added content-policy coverage for public absolute-promise wording.
- Verified: Focused `tests/content-policy.test.ts` passed 31/31. Full `npm test` passed 305/305. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. Active-surface scans found no stale `cites every claim`, `every output stays source-grounded`, `Every output is source-grounded`, `right team assembles`, or `searches, remembers, and exports work` phrases outside regression assertions.
- Next: Stage this public promise cleanup with the AI-researcher package, then continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:48 PDT — compute-research-scope-cleanup

- Objective: Keep Docker, Modal, and RunPod positioned as explicit research execution targets, not generic compute/deploy/admin products.
- Changed: Narrowed homepage and README compute copy to explicitly chosen replication, benchmark, and research-experiment runs. Removed Modal deploy/serve/app-list style command copy from the skill, narrowed Modal away from generic training/inference/batch processing, narrowed RunPod to research-run pods, and tightened Docker safe-run wording to Feynman research workflows. Added content-policy coverage for compute scope.
- Verified: Focused `tests/content-policy.test.ts` passed 30/30. Full `npm test` passed 304/304. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. Active-surface scans found no stale generic compute/deploy phrases such as `training and inference`, `batch processing`, `Deploy persistently`, `Serve with hot-reload`, or `List deployed apps` outside regression assertions.
- Next: Stage this compute scope cleanup with the AI-researcher package, then continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:43 PDT — homepage-replication-execution-gate

- Objective: Keep the public homepage aligned with the plan-first replication contract instead of implying Feynman automatically executes experiments.
- Changed: Updated the homepage `/replicate` workflow card, terminal example, and hero copy so replication is described as an environment-gated plan and experiment-planning workflow. Expanded content-policy coverage to include the homepage in the replication execution-gate test.
- Verified: Focused `tests/content-policy.test.ts` passed 29/29. Full `npm test` passed 303/303. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Active-surface scans found no remaining `Replication plan and execution`, `experiment execution`, `runs experiments, and cites every claim`, `Replicate experiments on local or cloud GPUs`, `monitors training runs`, or `suggests reasonable defaults based on common practices` hits outside regression assertions.
- Next: Stage this homepage scope cleanup with the AI-researcher package, then continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:37 PDT — review-authority-language-cleanup

- Objective: Remove the remaining positive "peer-review-style" and "simulated peer review" framing from active review surfaces while preserving the useful internal research critique workflow.
- Changed: Renamed the CLI PaperRank critique summary to `Research critique`, changed review workflow/agent/skill/homepage/README wording to internal research critique or internal research review, and expanded content-policy coverage to scan the homepage, CLI summary source, and release notes for reviewer-branded or peer-review-style wording.
- Verified: Focused `tests/content-policy.test.ts` passed 29/29. Full `npm test` passed 303/303. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Active-surface scans found no remaining `Reviewer critique`, `reviewer-style`, `peer-review-style`, or `simulated peer review` hits outside regression assertions.
- Next: Stage this final language cleanup with the AI-researcher package, then continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:29 PDT — paperrank-research-critique-label

- Objective: Keep PaperRank's optional critique useful while avoiding reviewer-branded or peer-review-adjacent wording in generated ranking artifacts.
- Changed: Renamed PaperRank user-facing critique copy from reviewer-style / Reviewer Critique to Research Critique across README examples, CLI docs, PaperRank workflow docs, generated reports, generated dashboards, critique reports, provenance, and replication/research-agenda text. Expanded content-policy coverage so PaperRank-specific copy cannot reintroduce reviewer-branded critique wording.
- Verified: Focused `tests/content-policy.test.ts` plus `tests/paper-rank.test.ts` passed 75/75. PaperRank-specific scan found no remaining `reviewer` hits in `src/rank/paper-rank.ts`, PaperRank workflow docs, or CLI docs; stale reviewer-branded PaperRank phrases appear only inside regression assertions.
- Next: Run full package verification, stage this label cleanup with the AI-researcher package, and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:23 PDT — review-current-surface-cleanup

- Objective: Finish the `/review` scope cleanup across active model-facing and public command surfaces, not only the workflow page.
- Changed: Updated the Feynman system prompt and slash-command reference so `/review` is framed as internal research review instead of peer-review simulation. Expanded content-policy coverage to include the system prompt and slash-command docs, blocking "simulate a peer review" and "peer-review simulation" from active review surfaces.
- Verified: Focused `tests/content-policy.test.ts` passed 29/29. A direct active-surface scan found stale review-overclaim phrases only inside the regression assertions. A grant/proposal/admin/productivity scan found no active product-lane surface outside npm funding-noise filters and tests.
- Next: Run package-level verification, stage this current-surface cleanup with the AI-researcher package, and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:19 PDT — reference-refresh-pi-npm-boundary

- Objective: Re-check the external agent-tool references after the staged package passed, because the user explicitly asked to pull/read current examples.
- Changed: No product code changed. Refreshed the scratch clones for ML Intern, Codex, Pi, Hermes Agent, and OpenClaw outside the Feynman repo. Codex, Pi, and OpenClaw moved; ML Intern and Hermes Agent were already current. Recorded that Pi source now has tag `v0.79.10`, but `npm view @earendil-works/pi-coding-agent version` still returns `0.79.9` and `@earendil-works/pi-coding-agent@0.79.10` returns npm 404.
- Verified: Current reference HEADs checked: ML Intern `550a209701701e6a9ac7cac70b8dbd508822d467`, Codex `c03742ca0a78a8e54cd881032a2327363678b5aa`, Pi `329dceb5f3806654c59343949768a2973d752036`, Hermes Agent `5ff11a689b561fdb1404aede3fafa543bbbb86bf`, OpenClaw `cb301cd16fc16a75c57acae8a9f4c30641844603`.
- Next: Keep Feynman's packaged Pi runtime on latest published npm `0.79.9` until Pi `0.79.10` is published to npm, then rerun runtime patch and pack verification against that package.

### 2026-06-22 02:17 PDT — review-scope-boundary

- Objective: Keep `/review` as a core research-quality gate without implying Feynman provides external academic peer review or a venue decision.
- Changed: Reframed reviewer docs, README copy, prompt frontmatter, bundled reviewer agent copy, and the peer-review skill as internal peer-review-style research critique. Added content-policy coverage that blocks the old "thorough academic peer review," "academic peer reviewer," "would this pass at venue," and "overall recommendation" phrasing from active review surfaces.
- Verified: Focused `tests/content-policy.test.ts` passed 29/29. A direct stale-phrase scan found the blocked phrases only inside regression assertions. Full `npm test` passed 303/303. `npm run typecheck`, `npm run build`, website typecheck, and website build passed with 33 pages.
- Next: Run final diff/package checks, stage this scope fix with the existing AI-researcher package, and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 02:11 PDT — draft-docs-research-scope

- Objective: Keep `/draft` inside research writing instead of implying a generic writing or content-marketing lane.
- Changed: Narrowed the draft workflow docs from "papers, reports, or blog posts" to "papers, technical reports, or internal research notes." Added content-policy coverage so the public draft docs do not reintroduce generic blog-post positioning.
- Verified: Focused `tests/content-policy.test.ts` passed 28/28. A direct scan found no active docs/prompt/skill promise that `/draft` produces blog posts; remaining `blog posts` hits describe source types that researcher agents may read or classify. Website typecheck/build passed with 33 pages, and `git diff --check` passed.
- Next: Stage this scope fix with the existing AI-researcher package and continue only on defects that simplify or strengthen the research loop.

### 2026-06-22 02:05 PDT — paper-access-cli-route-summary

- Objective: Make single-paper access answer the user's research decision directly instead of reporting only artifact plumbing.
- Changed: Replaced the non-JSON `feynman paper` summary with a route-first output: paper title, best legal access route, candidate count/status, source-specific full-text fetch status, and report/JSON artifact handles. JSON output remains the exhaustive machine-readable surface.
- Verified: Focused `tests/paper-rank.test.ts` passed 46/46, including a CLI regression that normal `paper --fetch-full-text` output names the fetchable best route and no longer prints the old `Paper access wrote`/`Access status`/`Full-text fetch`/`JSON` plumbing labels. Full `npm test` passed 302/302; `npm run typecheck`, `npm run build`, and `git diff --check` passed.
- Next: Stage this paper-access summary fix with the existing AI-researcher package and continue only on defects that simplify or strengthen the core research loop.

### 2026-06-22 01:59 PDT — paperrank-cli-summary-scope

- Objective: Keep PaperRank potent without making the default terminal output feel like a feature dump.
- Changed: Replaced the non-JSON `feynman rank` artifact firehose with a concise decision-first summary: ranked count/report, read-first paper, top evidence reason, citation/full-text/reproduction/calibration state, core inspection handles, and next research actions. Full artifact paths still exist in JSON output and the written report.
- Verified: Focused `tests/paper-rank.test.ts` passed 45/45, including a CLI regression that normal `rank` output stays six lines and does not print internal-only artifact labels such as dashboard, synthesis packet, calibration template, or reproduction notes template. Full `npm test` passed 301/301; `npm run typecheck`, `npm run build`, and `git diff --check` passed.
- Next: Stage this scope-hardening fix with the existing AI-researcher package and continue only on defects that make the research loop simpler, faster, or more auditable.

### 2026-06-22 02:06 PDT — posthog-trace-readback-contract

- Objective: Close the remaining observability ambiguity by reading current PostHog tracing docs and proving which tables/endpoints should be used for Feynman analytics, logs, distributed traces, and Pi AI runtime traces.
- Changed: Clarified the telemetry contract in `.env.example`, README, website configuration docs, package-stack docs, and the telemetry source comment. CLI spans/logs are documented as PostHog distributed tracing/logs (`/i/v1/traces`, `/i/v1/logs`, `posthog.trace_spans`, `logs`); Pi runtime spans are documented as PostHog AI Observability (`/i/v0/ai/otel`, `$ai_*` events, and `posthog.ai_events`). Added content-policy coverage so docs do not point users at bare `traces`, `spans`, or `trace_spans` tables.
- Verified: Current PostHog docs document `/i/v1/traces`, `/i/v0/ai/otel`, `$ai_*` traces/spans, `posthog.ai_events`, and `posthog.trace_spans`. A read-only HogQL probe with the local PostHog personal key confirmed `posthog.trace_spans` compiles, bare `trace_spans` fails, `$ai_%` events are queryable, and `posthog.ai_events` is queryable in an accessible project. Focused telemetry/docs/runtime tests passed 55/55; full `npm test` passed 300/300; root typecheck/build, website lint/typecheck/build, root and website production audits, diff checks, bad-table-name scans, and `npm pack --dry-run` passed. The same local key still returns 403 for Feynman project `479027`, so exact-project trace read-back needs a personal key with access to that project.
- Next: Stage the telemetry docs/contract patch with the broader AI-researcher package; commit/push only after explicit user instruction.

### 2026-06-22 01:41 PDT — model-picker-doc-policy

- Objective: Continue the AI-researcher scope audit by checking whether generated docs still described model selection as a generic/default picker after the non-Pro runtime and help surfaces were fixed.
- Changed: Updated setup, configuration, and slash-command docs so `/feynman-model`, setup selection, main defaults, and subagent overrides are described as non-Pro model choices. Added content-policy coverage for the setup, configuration, slash-command, and command-metadata wording.
- Verified: Focused content/help/model tests passed 76/76. A stale-wording scan for generic model-picker/default-model phrases returned no active hits. Full `npm test` passed 299/299; root typecheck/build, website lint/typecheck/build, root and website production audits, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed.
- Next: Stage the docs/test policy fix with the broader AI-researcher package; commit/push only after explicit user instruction.

### 2026-06-22 01:24 PDT — dynamic-openrouter-model-selection

- Objective: Remove the last stale exact OpenRouter OpenAI model fallback after checking the installed Pi catalog and visible command copy.
- Changed: Replaced the exact `openrouter/openai/gpt-5.1-codex` research fallback with a dynamic OpenRouter OpenAI GPT family matcher. Feynman now ranks the newest non-Pro OpenRouter OpenAI GPT model exposed by Pi instead of carrying a frozen routed model slug. Tightened live help, setup guidance, CLI notices, command metadata, and CLI docs so model-setting/override copy says non-Pro instead of implying arbitrary defaults are acceptable.
- Verified: The installed Pi 0.79.9 registry exposes OpenRouter `openai/gpt-5.5`, proving the old exact fallback was stale. Focused model/content/help tests passed 76/76, including a regression that OpenRouter ranks `openai/gpt-5.5` above older routed GPT IDs, a content guard blocking exact OpenRouter OpenAI GPT pins in `src/model/catalog.ts`, and metadata guards for non-Pro model set/override descriptions. Live `node bin/feynman.js help` now prints `Set the default non-Pro model` and `Force a specific non-Pro model`. Full `npm test` passed 299/299; root typecheck/build, website lint/typecheck/build, root and website production audits, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed.
- Next: Stage the latest source/docs/test/changelog files with the broader AI-researcher package; commit/push only after explicit user instruction.

### 2026-06-22 00:58 PDT — codebase-review-removed-package-update-scope

- Objective: Continue the AI-researcher scope audit by checking whether removed UI/bulk optional package targets still survived through `feynman update` or current release docs.
- Changed: Added an explicit removed-target guard for `ui`, `generative-ui`, `pi-generative-ui`, `npm:pi-generative-ui`, and `all-extras` in package update resolution; removed the dead `pi-generative-ui` install/update failure shim; fixed current release notes to name Pi `0.79.9`, Hindsight research-continuity memory, and removal of the old UI/bulk optional package targets; added content and settings regressions for those boundaries.
- Verified: Focused `node --import tsx --test --test-concurrency=1 tests/pi-settings.test.ts tests/model-harness.test.ts tests/content-policy.test.ts tests/package-ops.test.ts` passed 81/81. Full `npm test` passed 296/296. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed. Built CLI smokes showed `packages list` only exposes research-continuity optional presets, `packages install generative-ui` exits as unknown, and `update generative-ui` exits as a removed optional package target. Source scan found stale runtime/version/memory wording only inside negative regression assertions.
- Next: Stage this cleanup with the broader AI-researcher package; continue from live observability or release-readiness checks if more verification is needed.

### 2026-06-21 19:17 PDT — codebase-review-scheduler-process-prompt-scope

- Objective: Continue the AI-researcher scope review by checking whether model-facing prompts still framed scheduling/process packages as generic productivity capability after the runtime command/tool surfaces were curated.
- Changed: Narrowed `.feynman/SYSTEM.md` so package guidance covers source retrieval, document parsing, memory/session recall, and delegated research subtasks, while scheduling is restricted to recurring research watches and periodic research scans. Narrowed `/jobs` prompt/skill wording to research-run status. Updated slash-command docs so `/help` is described as Feynman's curated live command list, not a raw installed-package command list. Added content-policy coverage for the model-facing boundary.
- Verified: Focused `tests/content-policy.test.ts` passed 26/26. Full `npm test` passed 294/294. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `git diff --check`, and `git diff --cached --check` passed. Source scan found no active generic reminder/admin/process-management/package-command-expansion wording outside the regression assertions.
- Next: Stage the prompt-scope cleanup, then continue from remaining AI-researcher correctness risks.

### 2026-06-21 19:12 PDT — codebase-review-optional-package-scope

- Objective: Continue the simple AI-researcher scope review by checking whether optional package surfaces still advertised broad UI widgets or bulk install behavior as product features.
- Changed: Removed `generative-ui`, `ui`, and `all-extras` from the optional package preset registry and package-install target list while preserving legacy pruning/update compatibility for old configs. Updated package docs, setup docs, install docs, and CLI reference copy to frame optional packages as one-by-one research-continuity additions instead of a generic extras marketplace. Added regression coverage so active docs do not reintroduce UI-widget or bulk-extra package copy.
- Verified: Focused `tests/model-harness.test.ts`, `tests/pi-settings.test.ts`, and `tests/content-policy.test.ts` passed 73/73, including a real CLI smoke where `feynman packages list` hides `generative-ui`/`all-extras` and `feynman packages install generative-ui|all-extras` fails as unknown presets. Full `npm test` passed 295/295. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `git diff --check`, and `git diff --cached --check` passed. Source scan found `generative-ui`/`all-extras` only in removal tests, legacy pruning/update compatibility, and historical release notes.
- Next: Stage the optional-package scope cleanup, then continue from remaining AI-researcher correctness risks.

### 2026-06-21 19:02 PDT — codebase-review-command-surface-scope

- Objective: Continue the simple AI-researcher command-surface review by checking whether Feynman's grouped `/help`, interactive `/commands` browser, or `/tools` browser promoted generic live package utilities as product features.
- Changed: Removed `/ps` and `/schedule-prompt` from the `Live Package Commands` help metadata while preserving workflow-level scheduling/process behavior as visible-tool-gated capability. Changed `/commands` from an all-runtime-command browser into a curated list built from public Feynman prompt specs, public extension specs, and the approved live-package command allowlist. Changed `/tools` from an all-tool browser into a public research-tool browser limited to Feynman-owned extension tools plus approved core research package tools. Added content-policy and runtime command-handler coverage so Feynman does not advertise generic scheduler/process commands or tools through `/help`, `/commands`, or `/tools`.
- Verified: Focused `tests/content-policy.test.ts` passed 25/25. Focused `tests/help-command.test.ts` passed 3/3 against mocked live Pi command/tool sets containing `/ps`, `/schedule-prompt`, `schedule_prompt`, and process-management tools. Full `npm test` passed 293/293, `npm run typecheck`, `npm run build`, website lint/typecheck/build, `git diff --check`, and `git diff --cached --check` passed. Source scan found no active `/schedule-prompt`, `/ps`, `pi-schedule-prompt`, or `pi-processes` user-facing hits outside legacy package-pruning constants, tests, historical release notes, and this lab-notebook entry.
- Next: Restage the command-surface runtime coverage, then continue from remaining AI-researcher correctness risks.

### 2026-06-21 18:56 PDT — codebase-review-alpha-docs-scope

- Objective: Continue the AI-researcher review by checking whether active alphaXiv docs and skills still steer users or agents toward stale bare `alpha` commands after the bundled `feynman alpha` path was verified.
- Changed: Replaced the remaining active bare-alpha auth/annotation copy in `skills/alpha-research/SKILL.md` and `website/src/content/docs/tools/alphaxiv.md` with `feynman alpha ...`, and added content-policy coverage so active alpha docs/skills keep routing shell commands through Feynman's bundled patched alphaXiv client.
- Verified: Focused `tests/content-policy.test.ts` passed 25/25. Full `npm test` passed 290/290, website typecheck/build passed, and `git diff --check` plus `git diff --cached --check` passed. Source scans found no active grant/proposal/admin product lane outside package-manager funding-noise filters and no Pro-model test fixture path outside production non-Pro filtering/rejection code and docs.
- Next: Restage the docs-scope fix, then continue review from remaining research-loop correctness risks.

### 2026-06-21 18:49 PDT — codebase-review-pi-runtime-upgrade

- Objective: Continue the codebase review by checking Pi runtime freshness, telemetry package wiring, alphaXiv live behavior, PaperRank artifact behavior, and production packaging instead of relying on the earlier staged state.
- Changed: Upgraded the Pi runtime package set to `0.79.9`, moved runtime fallback constants to that version, made the ignored runtime workspace hash include `scripts/prepare-runtime-workspace.mjs`, added audited runtime overrides for `pi-otel`/`pi-web-access` transitive dependencies, patched `pi-otel` to use `resourceFromAttributes` on the current OpenTelemetry resources API, and added Pi settings/package/runtime regression coverage. Fixed a browser-found PaperRank graph explorer bug where empty filtered results still showed the first paper detail; empty graph result sets now render the existing "No paper selected" state.
- Verified: `npm view` showed Pi `0.79.9` current while `pi-otel`, `pi-subagents`, `pi-web-access`, and `@companion-ai/alpha-hub` were current; read the installed Pi package docs/source plus Pi `0.79.9` changelog; regenerated the ignored runtime workspace with prune version 7; `.feynman/npm npm audit --omit=dev` passed with 0 vulnerabilities; `pi-otel` import smoke passed against the regenerated runtime; live `alpha --help` and `alpha --json search --mode keyword "sparse autoencoders"` passed; fixture CLI `rank` wrote the full PaperRank artifact set; Playwright opened the generated graph explorer and verified render/search/click/filter/empty-detail behavior; full `npm test` passed 289/289; `npm run typecheck`, `npm run build`, root `npm audit --omit=dev`, website lint/typecheck/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed.
- Next: Stage this verified package; commit/push only after the user explicitly asks for release/publish/PR work.

### 2026-06-21 18:17 PDT — codebase-review-alphaxiv-live-smoke

- Objective: Recheck the named alphaXiv failure mode against the built bundled CLI path, not just unit tests.
- Changed: No code change.
- Verified: `node bin/feynman.js alpha --help` printed Alpha Hub help, not Feynman top-level help. `node bin/feynman.js alpha --json search --mode keyword "sparse autoencoders"` returned 10 structured paper results including arXiv IDs.
- Next: Continue review from remaining live/provider/runtime surfaces; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 18:16 PDT — codebase-review-html-artifact-boundaries

- Objective: Continue the whole-codebase AI-researcher review by checking whether PaperRank's generated HTML inspection views prove safe handling of provider-controlled paper titles and user-controlled topics.
- Changed: Added a regression where a topic and paper title contain `</script><img src=x onerror=alert(1)>`, then asserted the graph explorer script-data payload uses escaped JSON and both graph explorer plus dashboard HTML avoid raw `<img>` or script-breakout markup.
- Verified: Focused `tests/paper-rank.test.ts` passed 44/44, full `npm test` passed 287/287, `npm run typecheck`, `git diff --check`, and `git diff --cached --check` passed.
- Next: Continue review from remaining live/provider/runtime surfaces; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 17:40 PDT — codebase-review-model-fixtures

- Objective: Continue the whole-codebase AI-researcher review by checking whether model-selection tests or fixtures still imply stale or Pro-class models as current choices.
- Changed: Replaced hardcoded `gpt-5.4` model-set/setup fixtures with the current recommended authenticated OpenAI model from the installed Pi catalog, removed Pro-specific test fixtures and rejection tests instead of synthesizing fake Pro models, and kept the runtime arg builder test on a fake model id because it only verifies argument forwarding.
- Verified: Focused model/runtime/PaperRank/content tests passed 123/123 after the Pro-specific test removals. Full `npm test` passed 286/286, `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website lint/typecheck/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Follow-up scans found no explicit Pro-model test fixtures; the only test-tree `pro` hit is `method_repro_heavy`.
- Next: Continue codebase review from remaining runtime/package/provider boundaries; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 17:31 PDT — codebase-review-runtime-cache-inputs

- Objective: Continue the whole-codebase AI-researcher review by checking whether the packaged Pi runtime archive cache is invalidated by the real patch files that shape Feynman's research runtime.
- Changed: Removed the deleted `pi-package-manager-patch.mjs` input from the runtime workspace hash and moved package/runtime seeding guards into `tests/package-seeding.test.ts`, so `npm test` executes them in the normal suite instead of leaving them hidden in `tests/package-ops.test.ts`.
- Verified: Source review found the stale hash input after the package-manager patch had been deleted. `node scripts/prepare-runtime-workspace.mjs` refreshed the vendored runtime workspace, focused package/runtime tests passed 21/21, full `npm test` passed 291/291, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, and `npm pack --dry-run` passed.
- Next: Continue staged review from remaining provider/runtime boundaries and command artifact paths; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 17:24 PDT — codebase-review-cwd-fixture-inputs

- Objective: Continue the whole-codebase AI-researcher review by checking whether `--cwd` truly applies to PaperRank and paper-access input fixtures, not only generated outputs.
- Changed: Added workspace-relative fixture path resolution for `feynman rank` source, calibration, and reproduction fixtures, plus `feynman paper --source-fixture`, so relative fixture paths are resolved under the requested workspace.
- Verified: A direct repro showed `feynman --cwd <workspace> rank ... --source-fixture openalex-rank.json` tried to read the caller directory before the fix. Focused `tests/paper-rank.test.ts` passed 44/44 after adding CLI coverage for workspace-relative rank and paper fixtures under `--cwd`.
- Next: Run broad verification, stage this fix, then continue review from model/runtime and artifact-boundary risks; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 17:19 PDT — codebase-review-otel-env-boundary

- Objective: Continue the whole-codebase AI-researcher review by checking the Pi telemetry handoff for prompt/path/privacy leaks through inherited OpenTelemetry environment variables.
- Changed: Feynman's PostHog OTLP env builder now explicitly masks inherited generic `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, and `OTEL_EXPORTER_OTLP_PROTOCOL` when configuring Pi telemetry, so only the PostHog trace/log-specific variables are passed to the child runtime.
- Verified: Focused telemetry/runtime tests passed 25/25 and runtime patch tests passed 4/4, including a regression where inherited generic OTLP headers contain a private bearer token. Full `npm test` passed 281/281, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, and `npm pack --dry-run` passed.
- Next: Continue staged review from PaperRank artifact boundaries, Pi runtime handoff, and provider command routing; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 17:17 PDT — codebase-review-stale-model-default

- Objective: Continue the whole-codebase AI-researcher review by checking whether the current non-Pro model policy actually prevents stale default model launches.
- Changed: `normalizeFeynmanSettings` now replaces an unavailable stale default model with the current authenticated non-Pro recommendation when one exists, instead of only repairing missing or Pro-class defaults.
- Verified: A direct repro showed `anthropic/claude-opus-1` was preserved despite an authenticated OpenAI non-Pro replacement being available. Focused `tests/pi-settings.test.ts` passed 14/14, focused model/catalog harnesses passed 46/46, full `npm test` passed 281/281, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, and `npm pack --dry-run` passed. A built CLI smoke with a temp `FEYNMAN_HOME` rewrote stale `anthropic/claude-opus-1` to the current OpenAI non-Pro recommendation and `feynman model list` marked it current/recommended.
- Next: Continue the staged review from PaperRank artifact boundaries, Pi runtime handoff, and provider command routing; commit/push only after confirming this staged package is the intended release unit.

### 2026-06-21 17:11 PDT — codebase-review-alpha-cwd-passthrough

- Objective: Continue the whole-codebase AI-researcher review by checking alphaXiv command routing under existing Feynman global flags.
- Changed: Fixed `feynman --cwd <dir> alpha ...` and `feynman --cwd=<dir> alpha ...` so leading `--cwd` is resolved before dispatch and alphaXiv receives its own flags unchanged. The parsed `alpha` path now also launches the bundled alpha CLI from Feynman's resolved working directory.
- Verified: Before the fix, built CLI smokes for `--cwd <tmp> alpha --help` and `--cwd=<tmp> alpha --help` printed Feynman's top-level help instead of Alpha Hub help. After the fix, focused `tests/model-harness.test.ts` passed 34/34, full `npm test` passed 280/280, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, and `npm pack --dry-run` passed. Built CLI smokes for both `--cwd` forms now print `Alpha Hub - search papers and annotate what you learn`.
- Next: Continue the staged codebase review from paper-access, ranking, observability, and Pi runtime boundaries; commit/push only after confirming this staged review package is the intended release unit.

### 2026-06-21 17:05 PDT — codebase-review-doi-identity-boundary

- Objective: Continue the whole-codebase AI-researcher review by checking paper-access DOI/title identity resolution across the CLI, PaperRank resolver, telemetry-safe artifacts, Pi runtime wrapper, package contents, and docs/scope surfaces.
- Changed: Added strict user-input DOI classification so only explicit DOI inputs (`doi:...`, DOI URLs, or bare DOI strings) use the OpenAlex DOI lookup path. Title queries containing DOI-like substrings now remain OpenAlex title searches. Provider DOI normalization for OpenAlex/Europe PMC metadata and canonical DOI URLs remains unchanged.
- Verified: Focused `tests/paper-rank.test.ts` passed 44/44, full `npm test` passed 278/278, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Built CLI smokes passed for `--version`, fixture-backed `rank`, fixture-backed `paper --fetch-full-text`, Pro synthesis override rejection, and `alpha --help`. Live resolver smokes confirmed explicit DOI input uses OpenAlex `filter=doi:https://doi.org/10.7717/peerj.4375`, a DOI-like title uses `search=Retrieval benchmark 10.1234/failure modes`, and explicit `doi: 10.1234/example` uses the DOI filter path.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local and provider smokes.

### 2026-06-21 16:57 PDT — codebase-review-arxiv-identity-boundary

- Objective: Continue the whole-codebase AI-researcher review by checking paper-access identity resolution so title queries, OpenAlex IDs, and arXiv IDs do not cross wires.
- Changed: Tightened arXiv ID extraction to accept bare IDs, explicit `arxiv:`/`arxiv ` prefixes, and arXiv URL paths only, instead of treating any arXiv-shaped number embedded in a title as an arXiv identifier. Added a resolver regression where `Retrieval benchmark 2024.12345 failure modes` remains an OpenAlex title search with `per-page=1` and does not hit arXiv fallback.
- Verified: Focused `tests/paper-rank.test.ts` passed 42/42. Full `npm test` passed 276/276, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Live OpenAlex smokes confirmed `W2741809807` resolves through the OpenAlex-ID path and the title-like numeric query builds a normal OpenAlex search with `per-page=1`.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:52 PDT — codebase-review-synthesis-prompt-boundaries

- Objective: Continue the whole-codebase AI-researcher review by checking the PaperRank model-synthesis handoff and remaining generated Markdown reports for untrusted topic/title/paper-text boundary defects.
- Changed: Hardened the model-synthesis prompt so provider-controlled packet JSON is wrapped in a fence longer than any backtick run in the packet, and added an explicit rule that Evidence Packet values are untrusted data rather than instructions. Escaped the remaining raw topic headings in calibration and critique reports. Replaced double-quoted topic rerun snippets with single-quoted shell arguments in calibration and reproduction templates so newline, quote, and command-substitution characters cannot reshape copy-paste commands.
- Verified: Focused `tests/paper-rank.test.ts` passed 41/41. Full `npm test` passed 275/275, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Raw-topic and legacy double-quoted command scans no longer find unsafe generated Markdown headings or `feynman rank "<topic>"` snippets.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:46 PDT — codebase-review-markdown-artifact-boundaries

- Objective: Continue the whole-codebase AI-researcher review by checking PaperRank and paper-access generated artifacts for provider-controlled Markdown/report-boundary defects.
- Changed: Normalized accepted provider URLs to parsed `URL.href`, rendered generated Markdown links with angle-bracket link targets, escaped/collapsed provider and user-supplied text in headings, tables, provenance, paper URLs, model-synthesis metadata, and research-agenda provenance, and added a regression proving malicious-looking OpenAlex titles/landing URLs cannot inject extra Markdown headings or bare links.
- Verified: Focused `tests/paper-rank.test.ts` passed 40/40. Full `npm test` passed 274/274, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:35 PDT — codebase-review-optional-recall-and-visuals

- Objective: Continue the whole-codebase AI-researcher review by checking remaining docs and subagent prompts for false built-in capability claims and unnecessary workflow promises.
- Changed: Tightened session-search docs and skill wording so recall is documented as an optional live package with a direct JSONL file-search fallback, not a guaranteed automatic memory layer. Replaced inflated "workflow orchestrator"/automatic-dispatch copy with Pi `subagent` tool wording and lead-owned narrow-task boundaries. Removed the summarize and quickstart human-time promises. Fixed the writer subagent's stale `pi-charts`/`pi-generative-ui` instructions so charts or interactive views are used only when visible tools exist and evidence supports them.
- Verified: Focused `tests/content-policy.test.ts` passed 24/24 and focused `tests/pi-settings.test.ts` passed 13/13. Full `npm test` passed 273/273, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Stale-promise grep only finds guarded tests, optional package source, or historical release-note references for the removed package/model phrases.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:28 PDT — codebase-review-replication-and-url-boundaries

- Objective: Continue the whole-codebase AI-researcher review from the staged PaperRank/CLI surface, focusing on false execution promises and unsafe artifact boundaries.
- Changed: Tightened `/replicate` README, prompt, skill, and docs so replication is plan-first and execution-gated on an explicit environment choice; removed stale claims that Feynman simply replicates experiments or monitors training runs. Hardened PaperRank OpenAlex URL normalization so generated reports and HTML inspection views only receive `http`/`https` provider links, while DOI entries are stored as canonical `https://doi.org/...` URLs.
- Verified: Focused `tests/content-policy.test.ts` passed 21/21 and focused `tests/paper-rank.test.ts` passed 39/39. Full `npm test` passed 270/270, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed. Live alphaXiv checks passed: `node bin/feynman.js alpha --help`, `node bin/feynman.js doctor` with alphaXiv auth OK, `node bin/feynman.js alpha --json search --mode keyword "sparse autoencoders"` returning structured paper results, and `node bin/feynman.js alpha get 2309.08600` returning the paper analysis. One alpha detail remains observed but non-blocking: `alpha --json status` still prints human-readable status from the upstream alpha CLI.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:20 PDT — scope-gate-visualization-package-promises

- Objective: Continue the whole-codebase review by checking prompt/system claims against the current lean default runtime package set.
- Changed: Gated chart and visualization instructions on visible chart/rendering tools instead of promising the unshipped `pi-charts` package. `/lit`, `/compare`, and `/draft` now write chart specifications or source-backed tables when no chart tool is visible, while preserving the source-backed quantitative-data requirement for charts and figures.
- Verified: Focused `tests/content-policy.test.ts` passed 20/20. Grep shows no shipped system or prompt references to `pi-charts`, `@walterra/pi-charts`, or generic visualization packages; the only remaining hits are the legacy package-pruning source/test and the content-policy guard. Full `npm test` passed 268/268, and `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `npm pack --dry-run`, `git diff --check`, and `git diff --cached --check` passed.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:15 PDT — scope-gate-live-package-promises

- Objective: Continue the whole-codebase review by checking user-facing workflows for claims about package capabilities that are not in the current default Feynman package set.
- Changed: Gated scheduling, process-management, and preview instructions on visible tools instead of promising unshipped `pi-schedule-prompt`, `pi-processes`, or `pi-markdown-preview` behavior. `/watch` now writes a baseline and marks scheduling blocked when `schedule_prompt` is unavailable; `/jobs` reports visible process/scheduler state plus durable artifacts; Preview docs/skill treat `/preview` as an optional live-package command with shell fallbacks.
- Verified: Focused `tests/content-policy.test.ts` passed 19/19. Full `npm test` passed 267/267. `npm run typecheck`, `npm run build`, website typecheck/lint/build, and stale-promise grep checks passed. Grep shows stale package/background/autoresearch/preview promises are gone from shipped prompts, skills, command docs, README, metadata, and current website docs except for guarded test assertions, one historical release note, and conditional preview command rows.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 16:08 PDT — codebase-review-parser-and-autoresearch-scope

- Objective: Continue the whole-codebase review by checking remaining AI-researcher surfaces for scope drift, false runtime promises, stale model policy, and option-parsing defects.
- Changed: Made PaperRank numeric options and rank synthesis timeout parsing reject partial numeric strings such as `3papers`, `1.5`, and `120000ms` instead of silently accepting the numeric prefix. Tightened `/autoresearch` from an unshipped package/background-job promise into a bounded foreground experiment loop that logs benchmark result, evidence, and decision, and aligned README/website copy with that shipped behavior.
- Verified: Focused `tests/paper-rank.test.ts` passed 38/38, focused `tests/model-harness.test.ts` passed 32/32, and focused `tests/content-policy.test.ts` passed 17/17. Full `npm test` passed 265/265. `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed. Grep checks found no shipped stale OpenAI/Pro model defaults, no grant/proposal/admin feature lane, and no autoresearch background/package promise outside legacy package-pruning source.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is live-use evaluation beyond deterministic local gates.

### 2026-06-21 15:54 PDT — codebase-review-model-and-rank-tightening

- Objective: Continue the full codebase review after the staged AI-researcher core set, specifically checking for feature bloat, stale model policy, and PaperRank reliability gaps.
- Changed: Reframed top-level PaperRank copy around the user outcome of read-first triage instead of artifact inventory. Removed stale user-facing OpenAI model examples from docs and LiteLLM setup fallback. Replaced exact Claude/GPT catalog preference pins with family-ranked selection that uses Pi's current authenticated model list, rejects Pro-class models, and treats Claude date suffixes as build metadata instead of newer semantic versions. Added abortable timeouts for OpenAlex, Europe PMC, and arXiv network fetches in PaperRank/paper-access.
- Verified: Focused model/catalog/settings/content tests passed 72/72 after catching and fixing the Claude date-suffix ranking regression. Focused PaperRank tests passed 38/38 with coverage that provider calls receive abort signals. Focused content policy tests passed 16/16 and now guard against artifact-led PaperRank copy plus stale OpenAI setup pins. Full `npm test` passed 263/263 after fixing a brittle Pi subagent schema patch that had matched an exact upstream model example. `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website typecheck/lint/build/audit, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed.
- Next: Commit/push only after confirming this staged review package is the intended release unit; remaining broad-scope risk is that the AI-researcher goal itself still needs ongoing live-use evaluation beyond deterministic local gates.

### 2026-06-21 15:12 PDT — full-codebase-review-final-fixes

- Objective: Finish the full Feynman AI-researcher codebase review with no Pro-model escape hatch, no feature-inventory bloat, and clean end-to-end validation.
- Changed: Fixed `feynman rank` so `--synthesis-model ...-pro` and `--model ...-pro` are rejected at the CLI boundary before PaperRank writes artifacts. Added a regression test for both rank Pro override paths. Removed duplicate artifact lines from PaperRank provenance. Tightened README/release/CLI reference copy so PaperRank is framed as read-order triage with evidence, not a feature pile. Tightened the alphaXiv docs so they promise source-specific paper text when available, not arbitrary complete-PDF parsing. Hardened command telemetry so unknown prompt text, malformed mode values, and malformed numeric flag values cannot become telemetry labels or properties. Fixed `rank` and `paper` so default/relative artifact output directories resolve under `--cwd`, matching the documented working-directory contract. Updated website overrides from `hono@4.12.23` to `4.12.26` and `vite@7.3.3` to `7.3.5` after the website production audit found current advisories.
- Verified: Focused `tests/paper-rank.test.ts` passed 37/37 and focused `tests/telemetry.test.ts` passed 10/10. Full `npm test` passed 260/260. `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, website lint/typecheck/build, website production audit, `git diff --check`, `git diff --cached --check`, and `npm pack --dry-run` passed. Built CLI smokes passed for `model list`, PaperRank fixture output, paper-access fixture output, raw-full-text omission, duplicate-provenance absence, Pro synthesis override rejection, and `rank`/`paper` default output placement under `--cwd`. Source inspection of the vendored `pi-otel` package confirmed trace-specific OTLP env handling and no `pi.cwd`/`ATTR_PI_CWD` in the patched package.
- Next: Commit/push only after confirming this staged review slice is the intended release unit; remaining non-blocking product risk is that `src/rank/paper-rank.ts` is large and should be split later when doing so reduces complexity without adding surface.

### 2026-06-21 14:58 PDT — staged-ai-researcher-core-set

- Objective: Remove the landing risk where the verified Feynman AI-researcher core existed partly as untracked files and could be omitted from a commit or PR.
- Changed: Staged the full verified AI-researcher change set, including PaperRank, paper access, PostHog/Pi telemetry, Pi OTEL patching, model non-Pro policy, alpha tool routing, fixtures, tests, docs, and release notes. No commit or push was made.
- Verified: `git diff --cached --name-status` now includes the previously untracked core files (`src/rank/paper-rank.ts`, `src/telemetry/posthog.ts`, PaperRank fixtures/tests, telemetry tests, Pi OTEL patch files, and paper workflow docs). `git ls-files --others --exclude-standard` is empty. `git diff --cached --check`, `git diff --check`, `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, and full `npm test` passed 254/254 on the staged state.
- Next: Review the staged diff as the commit/PR unit, then commit/push only after confirming the staged package scope is the intended release slice.

### 2026-06-21 14:51 PDT — arxiv-access-metadata-fallback

- Objective: Continue the full Feynman AI-researcher codebase review by making single-paper arXiv access resolve useful metadata when OpenAlex does not return a validated arXiv match.
- Changed: Widened OpenAlex candidate retrieval for arXiv identifiers from one search hit to ten while keeping strict arXiv identity matching. Added arXiv Atom API fallback metadata enrichment for arXiv IDs so paper-access artifacts can record real title, authors, abstract, year/date, categories, links, and provenance instead of a bare `arXiv <id>` placeholder. Added pinned direct `fast-xml-parser@5.7.3` for structured Atom parsing and deduped it with the existing Pi/AWS runtime dependency instead of shipping a second parser version. Fixed access-candidate provenance so arXiv URLs are labeled as arXiv rather than OpenAlex.
- Verified: Focused `tests/paper-rank.test.ts` passed 34/34, including regressions for multi-candidate arXiv lookup, arXiv API fallback metadata, and arXiv-labeled access candidates. Root `npm run typecheck`, `npm run build`, full `npm test` passed 254/254, `git diff --check` passed, `npm audit --omit=dev` reported `found 0 vulnerabilities`, and `npm pack --dry-run` passed. `npm ls fast-xml-parser fast-xml-builder --all` shows root `fast-xml-parser@5.7.3` plus Pi/AWS `5.7.3` copies with the AWS path deduped to root. Live compiled `node bin/feynman.js paper 2309.08600 --json` now returns title `Sparse Autoencoders Find Highly Interpretable Features in Language Models`, source `arxiv`, source URL `https://export.arxiv.org/api/query?id_list=2309.08600`, arXiv API provenance, and only `alphaXiv`/`arXiv` access candidates for arXiv URLs.
- Next: Continue the codebase review from remaining untracked change risk and evidence/provenance correctness before staging the AI-researcher core set.

### 2026-06-21 14:39 PDT — openalex-secondary-arxiv-identity

- Objective: Continue the full Feynman AI-researcher codebase review by fixing a PaperRank identity gap where OpenAlex arXiv metadata present only in secondary access locations could be used for full-text candidates but missed for paper identity.
- Changed: Changed OpenAlex work normalization to extract arXiv ids from `ids`, primary location, all reported locations, best open-access location, and `open_access.oa_url`. Updated OpenAlex provenance field accounting to include the location/access fields that now drive identity and access decisions.
- Verified: Focused `tests/paper-rank.test.ts` passed 32/32, including new regressions for secondary-location arXiv id extraction and `resolvePaperAccess` preserving the matched OpenAlex paper instead of falling back to an arXiv-only stub. Root `npm run typecheck`, `npm run build`, full `npm test` passed 252/252, `git diff --check` passed, `npm pack --dry-run` passed, and compiled `node bin/feynman.js rank "mechanistic interpretability sparse autoencoders" --limit 3 --source-fixture tests/fixtures/openalex-rank.json --output-dir /tmp/feynman-cli-smoke.Mlc77C --json` passed.
- Next: Continue the codebase review from remaining untracked change risk and any evidence-quality defects, then stage/commit only the simple AI-researcher core set once the final review is done.

### 2026-06-21 14:33 PDT — telemetry-artifact-error-redaction

- Objective: Continue the full Feynman AI-researcher codebase review by fixing places where observability or PaperRank artifacts could leak private prompt, path, provider, or resolver exception text.
- Changed: Changed Feynman telemetry spans to record sanitized OTEL exceptions with only a safe error kind and `error_message_hash`, while event/log properties continue to use hash-only error metadata. Changed CLI telemetry metadata so prompt text after `--` cannot become the telemetry command label. Changed PaperRank model-synthesis and full-text failure paths so durable report/provenance/JSON artifacts store subsystem plus hash instead of raw provider/resolver messages.
- Verified: Focused `tests/telemetry.test.ts` passed 8/8. Focused `tests/paper-rank.test.ts` passed 30/30, including regression coverage for sanitized full-text fetcher failures and sanitized model-synthesis failure artifacts. Root `npm run typecheck`, `npm run build`, full `npm test` passed 250/250, `git diff --check` passed, and `npm pack --dry-run` passed. An isolated compiled CLI smoke with `node bin/feynman.js rank "mechanistic interpretability sparse autoencoders" --limit 3 --source-fixture tests/fixtures/openalex-rank.json --json` passed after `npm pack --dry-run`.
- Failed / learned: The first compiled CLI smoke was run concurrently with `npm pack --dry-run`, whose prepack step removes and rebuilds `dist/`; rerunning the smoke after pack completed passed.
- Next: Continue the AI-researcher review from ranking/evidence correctness and decide whether to stage the untracked core change set before any PR.

### 2026-06-21 14:18 PDT — codebase-review-core-corrections

- Objective: Review the current Feynman codebase for AI-researcher correctness, scope drift, runtime packaging, and end-to-end verification risks.
- Changed: Fixed PaperRank paper-access candidate normalization so each OpenAlex landing/PDF candidate carries its own `isOpenAccess` flag instead of inheriting the paper-level open-access summary from unrelated locations. Added launch-time `pi-otel` patch coverage to `patchPiRuntimeNodeModules` so user-global, agent-local, and vendored runtime installs all honor trace-specific PostHog OTLP env vars. Reworded the slash-command docs from "project management tools" to "research-session utilities" to match the simple AI-researcher feature gate.
- Verified: Focused PaperRank test passed 28/28 and now proves a closed publisher landing candidate remains closed while the repository PDF/landing candidates are open. Focused runtime/otel/telemetry tests passed 12/12 and now cover vendored, user-global, and Pi-agent `pi-otel` installs. Root `npm run typecheck`, `npm run build`, and full `npm test` passed 245/245. Compiled `feynman paper` fixture smoke wrote bounded access artifacts without a raw `fullText` body.
- Review note: Several core additions remain untracked in Git, including PaperRank, telemetry, new tests, and workflow docs. They work in this dirty tree, but they will not land in a commit or PR until staged.
- Next: Run final website/package gates, then decide whether to stage/commit the current AI-researcher change set.

### 2026-06-21 14:10 PDT — openalex-location-access-coverage

- Objective: Improve Feynman paper access coverage by using OpenAlex's full location metadata without adding a new workflow surface.
- Changed: Added OpenAlex `locations` to the selected work fields, normalized every reported location landing/PDF URL into the existing access-candidate plan, and treated any open-access location as open-access evidence. Updated the paper-access docs to state that Feynman uses primary, best open-access, and all reported OpenAlex locations.
- Verified: Read OpenAlex work docs showing `locations` as all unique places where a work lives and location objects carrying `landing_page_url`/`pdf_url`. Focused `tests/paper-rank.test.ts` passed 28/28. Root `npm run typecheck`, `npm run build`, and full `npm test` passed 245/245. Live compiled `feynman paper 10.7717/peerj.4375 --json` wrote an artifact whose OpenAlex source URL selects `locations`, returned 12 access candidates including 9 OpenAlex location landing candidates such as `https://digitalcommons.unl.edu/scholcom/142`, and did not write a raw `fullText` body. `git diff --check`, website typecheck/lint/build, `npm audit --omit=dev`, and `npm pack --dry-run` passed.
- Next: Continue auditing evidence-quality gaps in paper/ranking/reproduction behavior before adding any new surface.

### 2026-06-21 14:04 PDT — pi-otel-posthog-traces-endpoint

- Objective: Keep Feynman observability simple and correct by using Pi's `pi-otel` extension for Pi runtime traces while matching PostHog's current AI OTLP setup guidance.
- Changed: Updated the carried `pi-otel` runtime patch so `pi-otel` resolves `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`, and `OTEL_EXPORTER_OTLP_TRACES_HEADERS` before generic OTLP variables. Changed Feynman's Pi child env to stop setting the generic `OTEL_EXPORTER_OTLP_ENDPOINT` to the PostHog AI endpoint and instead set the trace-specific PostHog AI endpoint. Kept `PI_OTEL_CAPTURE_CONTENT=metadata_only`, logs/metrics disabled for `pi-otel`, and the existing Feynman CLI PostHog events/logs/traces path. Clarified docs that Pi runtime observability is provided by bundled `pi-otel`.
- Verified: Read installed Pi extension docs and bundled `pi-otel` source before editing. Focused telemetry/runtime suite passed 33/33. Full `npm test` passed 244/244. `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, `npm pack --dry-run`, `git diff --check`, website lint, website typecheck, and website build all passed. Rebuilt the vendored runtime workspace; the bundled and archived `pi-otel/dist/config.js` now reads trace-specific OTLP env vars first, and archive inspection found no `ATTR_PI_CWD`, `pi.cwd`, `cfg.cwd`, or `this.opts.cwd` in the patched `pi-otel` runtime files.
- Next: Continue checking Feynman's AI-researcher core by auditing evidence quality and runtime behavior, not by adding adjacent workflow surface.

### 2026-06-21 13:53 PDT — paper-access-correctness-fix

- Objective: Fix the code-review blockers that prevented Feynman paper access and PaperRank from behaving like a reliable AI-researcher core.
- Changed: Made `feynman paper <arxiv-id>` treat the arXiv ID as an identity constraint, accepting OpenAlex only when the returned work carries the same arXiv ID and otherwise falling back to an arXiv-only access record instead of a wrong search hit. Changed the default PaperRank full-text fetcher to call Europe PMC for DOI/PMID-only papers, allowing its existing DOI/PMID-to-PMCID lookup to fetch `fullTextXML`. Aligned `src/pi/package-ops.ts` fallback Pi runtime seeding to `0.79.8` and added tests that pin runtime fallback constants plus installed peer specs to the bundled Pi version.
- Verified: Focused `tests/paper-rank.test.ts` passed 27/27 and includes regressions for DOI-only Europe PMC full-text enrichment plus unrelated OpenAlex hits for arXiv IDs. Focused `tests/package-ops.test.ts` passed 7/7, and the direct `Pi runtime fallback` name-pattern test passed 1/1. Root `npm run typecheck`, `npm run build`, and full `npm test` passed 243/243. Live compiled CLI smoke for `node bin/feynman.js paper 2309.08600 --json` returned source `arxiv`, title `arXiv 2309.08600`, and arXiv ID `2309.08600` instead of the previous unrelated medical OpenAlex hit. Live compiled CLI smoke for DOI `10.7717/peerj.4375 --fetch-full-text` returned PMID `29456894`, PMCID `PMC5815332`, full text source `Europe PMC fullTextXML`, and length `70012`. `npm audit --omit=dev`, `npm pack --dry-run`, `git diff --check`, website lint, website typecheck, and website build all passed.
- Next: Keep rejecting adjacent features; the next useful AI-researcher work should be another correctness or evidence-quality gap in the paper/ranking/reproduction loop, not new workflow surface.

### 2026-06-21 01:32 PDT — paper-access-ai-researcher-workflow

- Objective: Close the useful AI-researcher gaps from the external Feynman feedback without adding decorative or adjacent-product features: single-paper full-text access, source-backed PaperRank enrichment, and speed observability.
- Changed: Added `feynman paper <id-or-title>` with durable `<slug>-paper-access.md` and `<slug>-paper-access.json` artifacts, legal access candidates from OpenAlex/DOI/arXiv/alphaXiv/Europe PMC, optional source-specific `--fetch-full-text`, and raw-full-text omission. Changed PaperRank full-text enrichment to use the shared source-specific resolver instead of alphaXiv-only fetching, including Europe PMC `fullTextXML` for open-access PMC deposits while keeping PDFs as access links rather than arbitrary PDF parsing. Added PaperRank JSON `durationMs` so speed is visible in the product output as well as telemetry. Removed the proposed grants workflow, prompt, command surface, docs, and tests because grant applying is outside Feynman's AI-researcher scope. Added a repo-level `AGENTS.md` feature-scope gate requiring every new command, prompt, tool, extension, dashboard, document page, or release-note item to serve a concrete AI-researcher job.
- Verified: After the grants removal, focused `node --import tsx --test --test-concurrency=1 tests/content-policy.test.ts tests/model-harness.test.ts` passed 43/43, then the feature-bar guard was added and full `npm test` passed 241/241. `npm run typecheck`, `npm run build`, website lint/typecheck/build, production audit with `found 0 vulnerabilities`, `npm pack --dry-run`, and `git diff --check` passed. Help and source smokes found no `feynman grants`, `/grants`, `prompts/grants`, grant-map, or writer-ready proposal workflow surface. Previous compiled CLI smokes showed `node bin/feynman.js model list` as `openai/gpt-5.5 (current, recommended)` and explicit `openai/gpt-5.5-pro` exits with `Pro-class model disabled`. Previous live `node bin/feynman.js paper 10.7717/peerj.4375 --fetch-full-text` resolved OpenAlex work `W2741809807`, DOI `10.7717/peerj.4375`, PMID `29456894`, PMCID `PMC5815332`, selected Europe PMC `fullTextXML`, fetched 70012 chars / 3 sections, and wrote bounded access artifacts without a raw `fullText` body.
- Next: Keep this change set as the current GitHub-ready local candidate; split or stage it only after deciding how to package it against the existing dirty main worktree.

### 2026-06-19 23:24 PDT — daytona-full-gate-and-live-nonpro-smokes

- Objective: Finish the Daytona cross-environment verification, prove the no-Pro model policy with real OpenAI auth, and avoid adding diagram features that do not create a new research job.
- Changed: Re-synced the refreshed dependency patch and untracked PaperRank files into Daytona sandbox `8aa523a3-5a33-479c-9129-49910272c413`. Wrote the local OpenAI auth only inside the sandbox for live CLI smokes. Updated the PaperRank plan to replace the stale Daytona-blocked note with the completed Linux sandbox evidence and to record that extra diagrams are rejected unless they add a new research decision beyond the existing graph explorer and dashboard.
- Verified: Local full gate passed: `npm test` 229/229, root typecheck/build, production audit with `found 0 vulnerabilities`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check`. Daytona full gate passed: remote `npm test` 229/229, remote `npm audit --omit=dev` with `found 0 vulnerabilities`, remote dependency tree showing Pi packages `0.79.8`, `hono@4.12.26`, `protobufjs@7.6.4`, `ws@8.21.0`, and `undici@8.5.0`, remote root typecheck/build, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check`. Remote authenticated smokes showed `openai/gpt-5.5 (current, recommended)`, no `gpt-5.5-pro` in `model list`, `Model: openai/gpt-5.5` and `Recommended model: openai/gpt-5.5` in `status`, one-shot chat returned `OK`, PaperRank synthesis generated with `openai/gpt-5.5`, and Pro chat/env/PaperRank synthesis paths were rejected. Daytona delete returned HTTP 200, and the final sandbox list showed no Feynman-labeled sandboxes.
- Next: Keep the graph/dashboard surfaces as the only diagram additions until a new diagram earns a distinct user job.

### 2026-06-19 23:18 PDT — daytona-audit-runtime-refresh

- Objective: Continue the Daytona clean-room verification and fix any real errors it exposes.
- Changed: Used the valid Daytona API key from the prior local transcript to create sandbox `8aa523a3-5a33-479c-9129-49910272c413`, cloned Feynman, applied the current dirty worktree patch plus untracked PaperRank files, and ran the root suite on Linux Node 25. Daytona exposed a real production audit failure after `npm ci`: vulnerable `hono`, `protobufjs`, `undici`, and `ws` paths through Pi/MCP dependencies. Refreshed all direct Pi runtime packages to `0.79.8`, bumped direct `undici` to `8.5.0`, updated the `hono` override to `4.12.26`, updated the `protobufjs` override to `7.6.4`, and aligned `PI_RUNTIME_FALLBACK_VERSION` to `0.79.8`.
- Verified: Daytona root `npm test` passed 229/229 before the audit fix, proving the patched worktree applied and ran in the sandbox. Local `npm install` and `npm audit --omit=dev` now report `found 0 vulnerabilities`; `npm ls` shows Pi packages at `0.79.8`, `undici@8.5.0`, `hono@4.12.26`, `protobufjs@7.6.4`, and `ws@8.21.0`.
- Next: Re-run the full local validation sweep and re-sync the updated patch to Daytona for production audit, typecheck, build, website, pack, and live CLI smokes; delete the sandbox after capture.

### 2026-06-19 22:50 PDT — daytona-environment-sweep

- Objective: Run or unblock a Daytona cross-environment test for the current Feynman changes.
- Changed: Installed the official Daytona CLI (`daytona` v0.189.0) via Homebrew from the Daytona tap so the machine has the documented sandbox create/list/exec/delete surface available.
- Verified: `daytona --version` returned `Daytona CLI version v0.189.0`; `daytona --help` exposes `create`, `list`, `exec`, and `delete`. The Daytona config at `/Users/advaitpaliwal/Library/Application Support/daytona/config.json` contains no active profile and no profiles. `daytona list` fails before any sandbox operation with `no profiles found. Run \`daytona login\` to authenticate`. Local searches found no `DAYTONA_API_KEY` or Daytona credential in the process environment, shell/config files, the macOS generic-password lookup, 1Password item titles, `/Users/advaitpaliwal/.daytona`, `/Users/advaitpaliwal/.config/daytona`, or the active Daytona application-support config.
- Blockers: Daytona cloud sandbox execution was not run because this Mac has no authenticated Daytona profile or discoverable local API key. The local Feynman test/build/package/browser smokes remain the verified gate for this change set.
- Next: Log in with a Daytona API key, then run the same package/test smoke inside a fresh sandbox and delete the sandbox after capture.

### 2026-06-19 22:32 PDT — tui-header-overflow-178

- Objective: Fix GitHub issue #178, where renaming a session could crash the TUI because a long slash-workflow name overflowed the header column.
- Changed: Made the shared header padding helper clip to visible width before padding, changed wide workflow rows to use clipped command names with an explicit separator before descriptions, and changed the narrow workflow branch to use the same clipped padding path instead of raw `padEnd`.
- Verified: Live GitHub sweep found issue #178 as the only open issue and no open PRs. Added `tests/header.test.ts`, which renders the actual Feynman header with `/gather-context-and-clarify` at 121 and 50 columns and asserts every line fits plus the command name does not glue to the description. Focused header/runtime tests passed 11/11. Full `npm test` passed 229/229. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed after the fix.
- Failed / learned: Running Astro typecheck and build concurrently can race on `website/node_modules/.astro/data-store.json`; the sequential website build passed.
- Next: Continue the Daytona environment sweep.

### 2026-06-19 22:23 PDT — paper-rank-pro-override-block-and-feature-audit

- Objective: Enforce the user's no-Pro constraint everywhere Feynman can choose a model, and audit PaperRank outputs so added artifacts are useful rather than ornamental.
- Changed: Split authenticated model records from non-Pro available records, kept model list/status/setup/model-set on the non-Pro surface, rejected Pro-class IDs in explicit chat `--model`, `FEYNMAN_MODEL`, PaperRank `--synthesis-model`, and PaperRank `--model` synthesis overrides, and made settings normalization replace or clear stale Pro-class defaults. Updated PaperRank/setup/config docs to say explicit overrides are non-Pro only. Added a feature-survival audit to `outputs/.plans/paper-rank-ai-researcher.md` that maps each output to the research job it earns and bars future duplicate/decorative artifacts.
- Verified: Focused validation passed 99/99 with `node --import tsx --test --test-concurrency=1 tests/model-harness.test.ts tests/catalog-snapshot.test.ts tests/pi-settings.test.ts tests/pi-subagents-patch.test.ts tests/paper-rank.test.ts`. Full `npm test` passed 228/228. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Compiled CLI smokes rejected `node bin/feynman.js --model openai/gpt-5.5-pro --prompt noop` and `FEYNMAN_MODEL=openai/gpt-5.5-pro node bin/feynman.js --prompt noop` with `Pro-class model disabled`; fixture PaperRank with `--synthesis-model openai/gpt-5.5-pro` reported synthesis `failed` without using Pro while preserving deterministic artifacts; fixture PaperRank with `--synthesis-model openai/gpt-5.5` generated synthesis with `modelSelection.reason: explicit non-Pro CLI override`. `node bin/feynman.js model list` showed `openai/gpt-5.5 (current, recommended)` and no standalone Pro IDs; `node bin/feynman.js status` showed `Model: openai/gpt-5.5`, `Model valid: yes`, and `Recommended model: openai/gpt-5.5`.
- Next: Continue the GitHub issue/PR and Daytona environment sweep.

### 2026-06-18 17:51 PDT — paper-rank-non-pro-model-selection

- Objective: Correct the model-selection fix after the user rejected `openai/gpt-5.5-pro` as too slow and expensive.
- Changed: Removed OpenAI Pro-class IDs from static research recommendations, changed automatic model preference/default setup to skip standalone `pro` model IDs, filtered Pro-class IDs out of the available-model surface used by model list/status/setup/model-set resolution, changed the LiteLLM fallback and setup/configuration examples to `gpt-5.5`, updated PaperRank synthesis errors to require a non-Pro model for automatic selection, and reset the local Feynman default model from `openai/gpt-5.5-pro` to `openai/gpt-5.5`. Kept Pro-class strings only as negative test fixtures proving they are not automatically recommended.
- Verified: Focused validation passed with 96 tests: `node --import tsx --test --test-concurrency=1 tests/model-harness.test.ts tests/catalog-snapshot.test.ts tests/pi-settings.test.ts tests/pi-subagents-patch.test.ts tests/paper-rank.test.ts`. Full `npm test` passed 225/225. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. The model tests now assert OpenAI-only recommendation and first-run default use `openai/gpt-5.5`, available-model records contain `openai/gpt-5.5` and no standalone `pro` IDs, automatic recommendations skip Pro-class IDs, and PaperRank fixture E2E still writes bounded synthesis/model-selection artifacts without raw full text. A source-level local settings check confirmed `/Users/advaitpaliwal/.feynman/agent/settings.json` resolves to `openai/gpt-5.5`; after `npm run build`, `node bin/feynman.js model list` showed `openai/gpt-5.5 (current, recommended)` with no Pro-class IDs listed, and `node bin/feynman.js status` showed `Model: openai/gpt-5.5` and `Recommended model: openai/gpt-5.5`. Live OpenAlex/alphaXiv/model-synthesis smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full texts available, 2 deterministic paper reviews, calibration `insufficient_overlap`, reproduction evidence `insufficient_overlap`, research agenda 4 actions, and generated synthesis from `openai/gpt-5.5`; graph explorer, dashboard, provenance, synthesis Markdown, and synthesis packet checks passed with no raw full-text leakage. Headless Chrome loaded the live dashboard and graph explorer, searched graph nodes, clicked a detail row, verified ReadFirst/citation graph detail text, and captured `/tmp/feynman-rank-nonpro-dashboard.png` plus `/tmp/feynman-rank-nonpro-graph-explorer.png`.
- Failed / learned: The previous pass treated the local Pro-suffixed default as a better current model. That was the wrong product decision because it optimized for "newest/strongest" instead of the user's cost/latency constraint.
- Next: Collect filled researcher preference fixtures and completed reproduction notes across multiple topics; the local implementation and non-Pro model policy are verified.

### 2026-06-18 13:40 PDT — paper-rank-research-agenda-and-model-provenance

- Objective: Address the stale-model complaint by making rank model selection visible and turn PaperRank from a scored-paper surface into an explicit next-action AI-researcher loop.
- Changed: Added model-selection metadata to optional model synthesis, including recommended-vs-explicit source, requested model, resolved model, and reason; surfaced the resolved model in CLI output, generated synthesis Markdown, JSON summary, and provenance. Renamed the critique CLI line to `2 deterministic paper reviews` so deterministic reviewer critique is not confused with model-generated critique. Added always-written `<slug>-research-agenda.md` and `<slug>-research-agenda.json`, with agenda status, recommended score profile, prioritized next actions, replication/calibration action counts, evidence basis, and limits. Wired the research agenda into the main report, research memo, replication plan, dashboard, provenance, synthesis packet, synthesis prompt, CLI JSON summary, README, website docs, command metadata, release notes, and tests.
- Verified: Local model state showed default provider/model `openai`/`gpt-5.5-pro`; `feynman model list` showed `openai/gpt-5.5-pro (current, recommended)`; diagnostic `chooseRecommendedModel` returned `openai/gpt-5.5-pro`. Focused model tests passed 29/29. Focused PaperRank tests passed 21/21. Full `npm test` passed 223/223. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. A live no-explicit-model synthesis smoke printed `Model synthesis: generated by openai/gpt-5.5-pro (recommended current research model; resolved openai/gpt-5.5-pro)` and wrote the same selection into model-synthesis and provenance artifacts. A full fixture-backed rank/model smoke returned 4 ranked papers, 3 graph edges, calibration `evaluated`, reproduction evidence `evaluated`, agenda `ready` with 6 actions and 3 high-priority actions, and generated synthesis from `openai/gpt-5.5-pro`. Agenda Markdown/JSON, report, research memo, dashboard, provenance, and model synthesis were checked for agenda/profile/model-selection content.
- Failed / learned: The root defect behind the model complaint was output opacity, not the actual current default: current/recommended was already `openai/gpt-5.5-pro`, but normal rank output only said `Model synthesis: generated` and reviewer critique output could be misread as two model-written critiques. The Playwright wrapper binary was unavailable, and Chrome GUI inspection was blocked by the locked Mac screen, so browser verification used a temporary HTTP server plus headless Chrome/CDP.
- Browser verification: Headless Chrome rendered the live dashboard screenshot at `/tmp/feynman-rank-dashboard-headless.png` with score matrix, citation graph snapshot, `Agenda actions` metric, and `Research agenda ready; 3 high-priority action(s)`. Headless Chrome rendered the graph explorer screenshot at `/tmp/feynman-rank-graph-headless.png`; CDP set graph search to `attention`, found one result, clicked it, and verified the detail panel selected `Interpreting Attention Layer Outputs with Sparse Autoencoders` with read-first score and citation graph text. Dashboard CDP verified title text, `6\nAgenda actions`, and `Research agenda\nready; 3 high-priority action(s)`.
- Blockers: None for the deterministic PaperRank AI-researcher workflow. Real calibration and reproduction quality still require filled researcher preference fixtures and completed experiment notes across real topics.
- Next: Collect cross-topic filled calibration fixtures and completed reproduction notes, compare agenda quality and profile recommendations, then decide whether PaperRank should automatically recommend topic-specific weight profiles or schedule actual replication runs.

### 2026-06-18 13:11 PDT — paper-rank-reproduction-ledger

- Objective: Finish the AI-researcher PaperRank slice by separating completed reproduction evidence from planned replication checks and removing stale model selection from model synthesis.
- Changed: Added a default `<slug>-reproduction-ledger.json` and `<slug>-reproduction-notes-template.json`, wired `--reproduction-fixture` through the CLI/env path, report, research memo, replication plan, synthesis packet, dashboard, provenance, README, website docs, command metadata, release notes, and tests. The ledger records externally supplied `reproduced`, `partially_reproduced`, `failed`, and `not_runnable` notes, counts out-of-run notes as ignored, and does not execute experiments or embed raw full text. Fixed the research model selector so current same-family Pro/newer-version models outrank older hardcoded aliases; local Feynman default is now `openai/gpt-5.5-pro`.
- Verified: Focused PaperRank test passed 21/21. Model selector focused tests passed 50/50. Full `npm test` passed 222/222. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, `git diff --check`, and CLI help smoke passed. Rebuilt `feynman model list` showed `openai/gpt-5.5-pro (current, recommended)`. A live OpenAlex/alphaXiv/model-synthesis smoke for `mechanistic interpretability sparse autoencoders` returned 3 ranked papers, 16 graph papers, 20 graph edges, 2 critiques, 1/1 full texts available, calibration `insufficient_overlap`, reproduction evidence `insufficient_overlap` with 0 evaluated and 3 ignored notes, and generated model synthesis from `openai/gpt-5.5-pro`; ledger/template/packet/report/plan/dashboard/provenance checks passed with no raw full-text leakage. Chromium rendered the live dashboard and graph explorer, filtered graph search, clicked a graph detail, and captured screenshots at `/tmp/feynman-rank-live-dashboard.png` and `/tmp/feynman-rank-live-graph-explorer.png`.
- Failed / learned: The Playwright skill wrapper and `@playwright/test` runner did not resolve their binaries/modules in this environment, so browser verification used the cached `playwright` package through `NODE_PATH`. The first browser assertion guessed the wrong visible title and selector; the actual rendered strings/selectors were `FEYNMAN PAPERRANK DASHBOARD` and `.node-button[data-id]`.
- Blockers: None for this PaperRank AI-researcher slice. Real reproduction evidence still depends on researcher-run experiments supplied through filled reproduction fixtures.
- Next: Use filled researcher read-order fixtures and completed reproduction notes across multiple topics to calibrate weighting profiles and decide whether PaperRank should recommend topic-specific weights or schedule actual replication runs.

### 2026-06-18 10:59 PDT — paper-rank-field-map

- Objective: Move PaperRank from ranked papers toward a local research map that shows field structure and relative paper roles.
- Changed: Added a default `<slug>-field-map.json` artifact with OpenAlex topic/concept clusters across seed and citation-neighborhood papers, plus ranked seed-paper roles such as foundation, frontier, bridge, methodology anchor, reproducibility anchor, and candidate lead. Wired the field map into run results, CLI output, the main report, research memo, dashboard, provenance, README, website docs, release notes, and tests. The field map uses score, citation-degree, graph-prestige, recency, methodology, and reproducibility evidence while omitting raw full-text bodies.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 215/215, including field-map cluster/role generation, field-map artifact creation, report/memo/dashboard/provenance links, JSON artifact path output, and raw full-text omission checks. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. A live isolated `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --expand-citations 1 --full-text-top 1 --critique-top 3 --json` smoke returned 5 ranked seed papers, 36 graph papers, 31 expanded nodes, 45 graph edges, 1/1 full texts available, 3/3 critiques generated, 12 field-map clusters, 5 ranked-paper roles, foundation and bridge roles present, report/memo/dashboard field-map sections present, no raw full text in `papers.jsonl`, no known full-text body copied into the field map, and 0 false `code` markers from `autoencoder` text.
- Blockers: None for deterministic field-map generation. Remaining research-quality gaps are a model-backed synthesis layer over the same evidence contract and richer interactive graph exploration.
- Next: Add a model-backed synthesis layer over the same evidence contract or a richer interactive graph exploration surface.

### 2026-06-18 10:50 PDT — paper-rank-research-memo

- Objective: Move PaperRank from ranked evidence and critique cards toward an AI-researcher decision memo that explains what to read, what to verify, and why.
- Changed: Added a default `<slug>-research-memo.md` artifact with bottom-line read order, run confidence, evidence snapshot, per-paper verification checks, cross-paper signal/gap patterns, next research actions, scientific basis, and limits. Wired the memo into artifact paths, the main report, dashboard artifact list, provenance, CLI output, README, website docs, release notes, and fixture tests. The memo uses score, citation graph, critique, source-span, and rubric evidence while omitting raw full-text bodies.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 214/214, including memo artifact creation, report/dashboard/provenance links, JSON artifact path output, read-order/checks/next-action sections, scientific-basis section, triage caveat, and raw full-text omission checks. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. A live isolated `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --expand-citations 1 --full-text-top 1 --critique-top 3 --json` smoke returned 5 ranked seed papers, 36 graph papers, 31 expanded nodes, 45 graph edges, 1/1 full texts available, 3/3 critiques generated, memo bottom-line/read-order/next-action/scientific-basis sections present, memo triage caveat present, report/dashboard memo links present, no raw full text in `papers.jsonl`, no known full-text body copied into the memo, and 0 false `code` markers from `autoencoder` text.
- Blockers: None for deterministic memo generation. Remaining research-quality gaps are a model-backed synthesis layer over the same evidence contract and richer graph exploration.
- Next: Add a model-backed synthesis layer over the same evidence contract or a richer graph exploration surface.

### 2026-06-18 10:58 PDT — paper-rank-dashboard

- Objective: Make PaperRank inspectable as an end-to-end AI-researcher cockpit instead of scattered Markdown/JSONL outputs.
- Changed: Added a default `<slug>-dashboard.html` artifact with summary metrics, score component bars, critique gaps, a bounded SVG citation graph snapshot, scientific-basis links, and artifact links. Wired dashboard artifact paths into report/provenance/CLI output/docs/release notes and added fixture tests that assert the dashboard exists while omitting raw full-text fields/body text.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 214/214, including dashboard artifact creation, score matrix/graph/critique sections, JSON artifact path output, and raw full-text omission checks. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. A live isolated `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --expand-citations 1 --full-text-top 1 --critique-top 3 --json` smoke returned 5 ranked seed papers, 36 graph papers, 31 expanded nodes, 45 graph edges, 1/1 full texts available, 3/3 critiques generated, dashboard marker/score matrix/SVG graph/critique sections present, no raw full text in `papers.jsonl`, no known full-text body copied into the dashboard, and 0 false `code` markers from `autoencoder` text.
- Blockers: None for the static dashboard artifact. Remaining research-quality gaps are a model-written critique layer over the same evidence contract and richer graph exploration.
- Next: Add a model-written critique layer over the same evidence contract or a richer graph exploration surface.

### 2026-06-18 10:40 PDT — paper-rank-reviewer-critique

- Objective: Move PaperRank from ranked evidence tables toward an AI-researcher review loop by adding reviewer-style strengths, concerns, and follow-up questions grounded in the existing score evidence.
- Changed: Added `--critique-top N`, deterministic PaperRank critique generation, `<slug>-critique.md`, critique entries in the main report/provenance, JSON summary counts, CLI/help/docs/release-note updates, and fixture-backed tests for critique generation plus sidecar artifacts. The critique uses PaperRank scores, warnings, source spans, and NeurIPS-style rubric gaps; it does not claim to be an external peer-review decision.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 214/214, including critique generation, critique sidecar artifact creation, JSON summary counts, report/provenance entries, and CLI fixture E2E with `--critique-top`. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. A live isolated `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --expand-citations 1 --full-text-top 1 --critique-top 3 --json` smoke against OpenAlex/alphaXiv returned 5 ranked seed papers, 36 graph papers, 31 expanded nodes, 45 graph edges, 1/1 full texts available, 3/3 critiques generated, reviewer critique sections and follow-up questions present, no raw full text in `papers.jsonl`, and 0 false `code` markers from `autoencoder` text.
- Blockers: None for deterministic reviewer critique. Remaining research-quality gaps are a model-written critique layer over the same evidence contract and a dashboard.
- Next: Add a dashboard or a model-written critique layer over the same evidence contract.

### 2026-06-18 10:18 PDT — paper-rank-citation-expansion

- Objective: Make PaperRank's PageRank-style graph less myopic by expanding beyond the initial search result set while keeping ranked seed papers and expanded graph-context papers separate.
- Changed: Added `--expand-citations N`, OpenAlex batch fetch by work ID, incoming citation fetches with `cites:<work>`, fixture-backed citation expansion, seed/expanded graph node roles, citation expansion summary fields in JSON/report/provenance/graph artifacts, and deterministic fixture papers for outgoing-reference and incoming-citation expansion. Tightened evidence-marker matching to require word/phrase boundaries so `code` no longer matches inside `autoencoders`. Updated README, website docs, release notes, and the PaperRank plan artifact.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 213/213, including outgoing/incoming citation expansion, graph node roles, expanded graph artifacts, marker-boundary regression coverage, and CLI fixture E2E with `--expand-citations`. `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. A live isolated `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --expand-citations 1 --full-text-top 1 --json` smoke against OpenAlex/alphaXiv returned 5 ranked seed papers, 36 graph papers, 31 expanded nodes, 45 graph edges, 1/1 full texts available, all 5 top-paper rubric items evaluated, no raw full text in `papers.jsonl`, and 0 false `code` markers from `autoencoder` text.
- Failed / learned: OpenAlex rejected `sort=-cited_by_count` for citing-work fetches; `sort=cited_by_count:desc` is the working syntax for the live `cites:<work>` endpoint. The first live smoke also exposed substring evidence matching, which is now fixed with boundary-aware marker matching.
- Blockers: None for bounded citation-neighborhood expansion. Remaining research-quality gaps are LLM critique over extracted evidence spans and a dashboard.
- Next: Add LLM critique over extracted evidence spans or a dashboard.

### 2026-06-18 10:08 PDT — paper-rank-section-rubric

- Objective: Move PaperRank from full-text marker matching toward a more legible AI-researcher audit by extracting paper sections and answering checklist-style rubric items.
- Changed: Added canonical full-text section extraction with absolute offsets, section-specific `full_text:<section>` spans, deterministic rubric answers for limitations, reproducibility path, experimental details, statistical significance, and compute resources, rubric-backed methodology/reproducibility scoring, report rendering for section rubric findings, and JSONL/`papers.jsonl` serialization that keeps section boundaries without writing raw section bodies. Updated fixture full text, tests, docs, release notes, and the PaperRank plan artifact.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 211/211, including section extraction, rubric answers, durable artifacts, and fixture CLI E2E. `npm run typecheck`, `npm run build`, `npm --prefix website run lint`, `npm --prefix website run typecheck`, `npm --prefix website run build`, and `npm pack --dry-run` passed. An isolated live `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --full-text-top 1 --json` smoke returned five papers, enriched 1/1 requested full texts, wrote the rubric section, produced 25 rubric answers, produced three section-specific full-text spans, and serialized three full-text section boundaries.
- Blockers: None for deterministic section-aware rubric screening. The remaining research-quality gap is LLM critique over the extracted spans and broader citation expansion beyond the first OpenAlex candidate set.
- Next: Run typecheck/build/website/package/live smoke, then add citation expansion or a dashboard slice.

### 2026-06-18 10:00 PDT — paper-rank-full-text-enrichment

- Objective: Move PaperRank closer to an AI researcher by letting the ranking inspect full-paper content for top arXiv candidates instead of relying only on metadata and abstracts.
- Changed: Added `--full-text-top N` to `feynman rank`, pre-ranking from OpenAlex metadata, fetching full text for top arXiv candidates through the bundled alphaXiv client, recording per-paper full-text status, rescoring with `full_text` source spans, and omitting raw paper bodies from `papers.jsonl` while keeping `fullTextLength` and score evidence spans. Updated README, CLI help metadata, website docs, release notes, fixture data, tests, and the PaperRank plan artifact.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 209/209, including deterministic fixture CLI full-text enrichment; `npm run typecheck`, `npm run build`, `npm --prefix website run lint`, `npm --prefix website run typecheck`, `npm --prefix website run build`, and `npm pack --dry-run` passed. `node bin/feynman.js help | rg "full-text-top|Rank papers"` showed the new help line. An isolated live `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --full-text-top 1 --json` smoke returned five papers, enriched 1/1 requested full texts, and wrote artifacts with 51 span-backed evidence entries including 31 `full_text` spans.
- Failed / learned: An earlier live smoke failed only because it ran concurrently with `npm pack --dry-run`, whose prepack step cleans and rebuilds `dist/`; the isolated rerun passed.
- Blockers: None for optional full-text enrichment. The remaining research-quality gap is section-aware extraction and rubric answers over cited full-paper spans.
- Next: Add citation expansion beyond the first OpenAlex candidate set, section-aware extraction, rubric answers over full-paper spans, and a local dashboard.

### 2026-06-18 09:50 PDT — paper-rank-source-spans

- Objective: Make PaperRank methodology and reproducibility scoring explainable with concrete source text, not only marker counts.
- Changed: Added source-span extraction for methodology and reproducibility markers, preserved span objects in score evidence (`source`, `field`, `marker`, start/end offsets, and surrounding text), surfaced top evidence snippets in the Markdown report, and updated PaperRank docs/plan language to describe span-backed screening.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 208/208, including span extraction and CLI artifact assertions; `npm run typecheck`, `npm run build`, website lint/typecheck/build, and `npm pack --dry-run` passed. A live `feynman rank "mechanistic interpretability sparse autoencoders" --limit 5 --json` smoke wrote artifacts whose report contains the evidence section and whose scores JSONL contained 20 span-backed evidence entries.
- Failed / learned: Running website `astro check` and `astro build` in parallel caused a transient `.astro/data-store.json` rename race; rerunning typecheck by itself passed.
- Blockers: None for metadata/abstract source spans. Full-text methodology review still requires an AlphaXiv/full-paper pass with section-level spans.
- Next: Add optional full-text enrichment for top-ranked arXiv papers, then move from marker screening to rubric answers grounded in extracted paper sections.

### 2026-06-18 09:43 PDT — paper-rank-ai-researcher

- Objective: Move Feynman from research strategy toward a tested end-to-end AI researcher by shipping a first PaperRank workflow for transparent paper ranking.
- Changed: Added `feynman rank <topic>` backed by OpenAlex-shaped work metadata, normalized paper records, local citation-graph construction, PageRank-style graph prestige, citation impact/velocity, deterministic methodology and reproducibility screening, and durable artifacts (`<slug>-paper-rank.md`, `<slug>-papers.jsonl`, `<slug>-scores.jsonl`, `<slug>-citation-graph.json`, `<slug>-rank.provenance.md`). Added docs, release notes, command registry wiring, fixture data, unit tests, and a CLI fixture e2e test.
- Verified: `npm test` passed 207/207; `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `node bin/feynman.js help | rg 'feynman rank|PaperRank|Rank papers'` passed. A live `node bin/feynman.js rank "mechanistic interpretability sparse autoencoders" --limit 5 --json` run against OpenAlex returned five papers and wrote all five artifacts in a temp output directory.
- Failed / learned: A help smoke run failed once while `npm pack --dry-run` was deleting and rebuilding `dist/`; rerunning after pack passed. The live 5-paper OpenAlex set had no candidate-to-candidate citation edges and missing abstract-visible methodology evidence for the top paper, and PaperRank correctly marked those components unavailable instead of fabricating them.
- Blockers: None for the first PaperRank slice. Full methodology peer review still requires a later full-text/AlphaXiv evidence-span pass rather than abstract-only screening.
- Next: Extend PaperRank with citation expansion, full-text methodology extraction, source-span-backed rubric answers, and a dashboard.

### 2026-06-18 09:30 PDT — alphaxiv-cli-repair

- Objective: Fix broken alphaXiv access end to end, including the Feynman agent shell path that was resolving an old global `feynman` binary.
- Changed: Added `feynman alpha ...` pass-through to Feynman's bundled patched alphaXiv client, documented the full alpha command surface, updated bundled prompts/skills/agent guidance to avoid the user's bare global `alpha` binary, patched the user's global alpha-hub install on this machine, and added a per-Feynman-home `bin/feynman` shim so Pi bash sessions resolve this repo's CLI before stale global installs.
- Verified: `npm test` passed 200/200; root `npm run typecheck`, root `npm run build`, website `npm --prefix website run lint`, website `npm --prefix website run typecheck`, website `npm --prefix website run build`, and `npm pack --dry-run` passed. Live smokes passed for `node bin/feynman.js --version`, `node bin/feynman.js alpha status`, bundled `feynman alpha search "transformer scaling laws" --mode semantic --json`, bundled `feynman alpha get 2001.08361 --json`, and global `/Users/advaitpaliwal/.npm-global/bin/alpha search "transformer scaling laws" --mode keyword --json`. A forced one-shot agent bash test ran `feynman alpha search "transformer scaling laws" --mode semantic --json` and returned `RESULT_COUNT=10 FIRST_ID=2411.06646`.
- Failed / learned: Direct package-local alpha-hub already worked; the user-visible failure came from stale global alpha-hub search fallback and, separately, from Pi bash resolving global `feynman 0.2.49` instead of the current repo CLI.
- Blockers: Remote CI and release publication were not run from this local repair pass.
- Next: Publish the pending `0.3.4` refresh when ready, then run the remote end-to-end install workflow against the packaged release.

### 2026-06-16 00:00 PDT — feynman-ai-researcher

- Objective: Research how to convert Feynman into a deeper AI researcher and whether to build a PageRank-style paper-importance/methodology scoring product.
- Changed: Wrote a source-backed strategy package: `outputs/.plans/feynman-ai-researcher.md`, `outputs/.drafts/feynman-ai-researcher-research-direct.md`, `outputs/.drafts/feynman-ai-researcher-cited.md`, `outputs/.drafts/feynman-ai-researcher-verification.md`, `outputs/feynman-ai-researcher.md`, and `outputs/feynman-ai-researcher.provenance.md`.
- Verified: Local Feynman README/AGENTS/prompts/skills/extensions/docs were read; external sources were opened for Semantic Scholar, OpenAlex, Elicit, ResearchRabbit, Litmaps, Consensus, SciSpace, Undermind, PaperQA2, OpenScholar, Agent Laboratory, AI Scientist, Eigenfactor, time-aware PageRank, PRISMA, EQUATOR, Cochrane RoB 2/ROBINS-I, GRADE, and NeurIPS/ML reproducibility checklists. Artifact existence and key final sections were checked with `stat` and `rg`.
- Failed / learned: Scite pages were sparse behind JavaScript in this environment and were not used for final claims. Live OpenAlex/Semantic Scholar API limits and pricing were not smoke-tested, so implementation must re-check provider limits before coding.
- Blockers: None for the research artifact. The PaperRank score weights remain a product hypothesis that need empirical validation against real paper-selection tasks.
- Next: Implement `feynman rank <topic>` as the first product slice: normalized paper records, local citation graph, component scoring, methodology/reproducibility rubrics with source spans, JSONL outputs, and a local dashboard.

### 2026-06-14 11:23 PDT — daily-issue-sweep

- Objective: Re-check live GitHub issues/PRs, dependency/audit freshness, CI/release status, and repo-local validation against the pending `0.3.4` refresh.
- Changed: No open GitHub issues or PRs required product fixes. Updated the remaining stale website devDependency `eslint-plugin-react-refresh` from `^0.5.2` to `^0.5.3`, preserving the existing pending `0.3.4` maintenance refresh.
- Verified: `gh issue list --state open ...` returned `[]`; `gh pr list --state open ...` returned `[]`; `gh run list --limit 15 ...` still shows latest successful `Publish and Release` run `27438650693` and latest successful `End-to-End Install Tests` run `27394423414`; `gh release list --limit 10` and `npm view @companion-ai/feynman version` still show `v0.3.3` / `0.3.3` latest while the local package is `0.3.4`. Root and website `npm outdated --json` now return `{}`; root and website `npm audit --omit=dev` both report zero vulnerabilities. `npm test` passed 198/198, root `npm run typecheck`, root `npm run build`, website `npm run lint`, website `npm run typecheck`, website `npm run build`, `npm pack --dry-run`, and `node bin/feynman.js --version` all passed.
- Failed / learned: The only new actionable item was the website lint-plugin patch update; no new issue, PR, audit, CI, or local validation failure required a code-path fix.
- Blockers: None for this local sweep.
- Next: Push the pending `0.3.4` maintenance refresh when ready, then let release CI publish and rerun e2e.

### 2026-06-14 03:56 PDT — daily-issue-sweep

- Objective: Re-check live GitHub issues/PRs, dependency/audit freshness, CI/release status, and repo-local validation after the prior pending `0.3.4` maintenance refresh.
- Changed: No product code changes. No open GitHub issues or PRs required action, and the pending `0.3.4` dependency/runtime refresh remained the only local code change set.
- Verified: `gh issue list --state open ...` returned `[]`; `gh pr list --state open ...` returned `[]`; `gh run list --limit 20 ...` still shows latest successful `Publish and Release` run `27438650693` and latest successful `End-to-End Install Tests` run `27394423414`; `gh release list --limit 10` still shows `v0.3.3` latest. Root and website `npm outdated --json` returned `{}`; root and website `npm audit --omit=dev` both reported `found 0 vulnerabilities`. `npm test` passed 198/198, root `npm run typecheck`, root `npm run build`, website `npm run typecheck`, website `npm run build`, `npm pack --dry-run`, and `node bin/feynman.js --version` all passed. `npm ls esbuild` confirms `esbuild@0.28.1` under root `tsx` and website Astro/Vite.
- Failed / learned: No new actionable remote issue, PR, dependency, audit, CI, release, or local validation failure was present in this sweep.
- Blockers: None for this local sweep.
- Next: Push the pending `0.3.4` maintenance refresh when ready, then let release CI publish and rerun e2e.

### 2026-06-12 — windows-agent-npm-subagent-root

- Objective: Make the Windows subagent spawn work from the published package and prove it with the multi-OS e2e workflow.
- Changed: Added regression coverage for launch-time pi-subagents patching in both the Feynman npm-global package root and Pi's `<agentDir>/npm/node_modules` package root; bumped the package to `0.3.3` for a release containing the already-committed `<agentDir>/npm/node_modules` runtime patch.
- Verified: Run `27392984208` failed only on Windows live subagent smoke; its instrumentation showed `D:\a\_temp\feynman-home\.feynman\agent\npm\node_modules\pi-subagents` existed with `patched(wrapperPiCliPath): false`, while the failure still imported `D:\a\feynman\feynman\--mode` through Feynman's wrapper. Focused local patch tests, `npm test` (198/198), `npm run typecheck`, `npm run build`, `node bin/feynman.js --version`, and a local live subagent smoke returning `RESULT=PONG` passed.
- Failed / learned: The 0.3.2 fix covered the npm-global copy but not Pi 0.79's own agent-local package install root after `FEYNMAN_HOME` is set.
- Blockers: Need publish confirmation, e2e green on all six jobs, diagnostics cleanup, and a final green e2e run.
- Next: Push `0.3.3`, verify npm latest, and dispatch e2e.

### 2026-06-13 — daily-issue-sweep

- Objective: Re-run the daily issue/PR, dependency freshness, CI/release, audit, and local validation sweep against the current checkout.
- Changed: No open GitHub issues or PRs required action. Advanced the pending `0.3.4` maintenance refresh from Pi `0.79.2` to `0.79.3`, kept the runtime fallback constants aligned, and updated website in-range stale packages (`@tailwindcss/vite`, `tailwindcss`, `lucide-react`, `eslint`). Preserved the existing `esbuild: 0.28.1` audit overrides.
- Verified: `gh issue list --state open ...` returned `[]`; `gh pr list --state open ...` returned `[]`; `gh run list --branch main --limit 10 ...` still shows latest successful `Publish and Release` run `27438650693` and latest successful `End-to-End Install Tests` run `27394423414`; `gh release list --limit 10` still shows `v0.3.3` latest. Root and website `npm outdated --json` now return `{}`; root and website `npm audit --omit=dev` both report `found 0 vulnerabilities`. `npm test` passed 198/198, root `npm run typecheck`, root `npm run build`, website `npm run typecheck`, website `npm run build`, `npm pack --dry-run`, and `node bin/feynman.js --version` all passed. `npm ls esbuild` confirms `esbuild@0.28.1` under root `tsx` and website Astro/Vite. Runtime archive inspection confirms all four bundled Pi packages lock to `0.79.3`.
- Failed / learned: The first archive inspection used the wrong extracted root path; the archive top-level is `npm/`, and the rerun against that path passed.
- Blockers: None for this local sweep.
- Next: Push the pending `0.3.4` maintenance refresh when ready, then let release CI publish and rerun e2e.

### 2026-06-12 13:24 PDT — daily-issue-sweep

- Objective: Sweep live GitHub issue/PR state, dependency/audit freshness, CI/release status, and repo-local validation for safe actionable fixes.
- Changed: No open GitHub issues or PRs required action. Refreshed the bundled Pi runtime from `0.79.1` to `0.79.2` across direct deps plus the packaged runtime fallback constants, added a root `esbuild: 0.28.1` override to clear the new `tsx -> esbuild 0.28.0` advisory, added the same website override for Astro/Vite's `esbuild <0.28.1` advisory path, and bumped the package version to `0.3.4` with release notes.
- Verified: `gh issue list --state open --json ...` returned `[]`; `gh pr list --state open --json ...` returned `[]`; `gh run list --limit 12 --json ...` still shows the latest successful `Publish and Release` run `27438650693` and `End-to-End Install Tests` run `27394423414`; `gh release list --limit 10` still shows `v0.3.3` as latest before this local bump. `npm outdated --json` is now `{}`. Root `npm install` and website `npm install` both ended with `found 0 vulnerabilities`. Root `npm audit --json` first exposed `esbuild` advisory `GHSA-gv7w-rqvm-qjhr` through `tsx@4.22.4`; after the override, root `npm audit --omit=dev`, `npm test` (198/198), `npm run typecheck`, `npm run build`, `npm pack --dry-run`, `node bin/feynman.js --version`, and `npm ls esbuild` all passed. Website `npm audit --omit=dev`, `npm run typecheck`, `npm run build`, and `npm ls esbuild` also passed with `esbuild@0.28.1` forced under Astro/Vite.
- Failed / learned: A concurrent `node bin/feynman.js --version` run failed once because `npm pack --dry-run` intentionally deletes and rebuilds `dist/` during `prepack`; rerunning it after the pack step passed, so that was a validation race, not a repo defect.
- Blockers: None.
- Next: Push the `0.3.4` maintenance refresh when ready so release CI can publish the Pi/runtime-security sweep.

### 2026-06-12 13:22 PDT — daily-issue-sweep

- Objective: Refresh live GitHub issue/PR state, dependency/audit freshness, CI/release status, and repo-local validation for any safe actionable fix.
- Changed: No product code changes; recorded that the repo currently has no open GitHub issues or PRs and that the latest publish/e2e flows for `main` are green after `v0.3.3`.
- Verified: `gh issue list --state open --json ...` returned `[]`; `gh pr list --state open --json ...` returned `[]`; `gh run list --limit 12 --json ...` shows latest successful `Publish and Release` run `27438650693` on 2026-06-12 19:38Z and latest successful `End-to-End Install Tests` run `27394423414` on 2026-06-12 04:25Z; `gh release list --limit 10` shows `v0.3.3` as latest; root `npm outdated --json` returned `{}`; root and website `npm audit --omit=dev` found `0` vulnerabilities; `npm test` passed `198/198`; `npm run typecheck`; `npm run build`; `npm pack --dry-run`; `node bin/feynman.js --version`; and `cd website && npm run build` all passed.
- Failed / learned: No actionable remote issue, PR, dependency, audit, CI, release, or local validation failure was present in this sweep.
- Blockers: None.
- Next: On the next sweep, only dig deeper if a new issue/PR opens, a workflow regresses, or one of the validation commands starts failing.

### 2026-06-12 06:22 PDT — daily-issue-sweep

- Objective: Sweep live GitHub issues/PRs, dependency/audit freshness, CI/release state, and repo-local validation for safe actionable fixes.
- Changed: No repo code changes; recorded that there are still no open GitHub issues, PR `#173`'s Windows `explorer` hardening is already present in `src/system/open-url.ts` plus `tests/open-url.test.ts`, and PR `#175`'s MiniMax M3 preference is already present in `src/model/catalog.ts`.
- Verified: `gh issue list --json ...` returned `[]`; `gh pr list` still shows only `#173`, `#175`, and `#176`; `gh run list --limit 12` shows the latest `Publish and Release` and `End-to-End Install Tests` runs succeeded on 2026-06-12; `gh release list --limit 10` shows `v0.3.3` as latest; root `npm outdated --json` returned `{}`; root and website `npm audit --omit=dev` both found `0` vulnerabilities; `npm test` passed `198/198`; `npm run typecheck`; `npm run build`; `npm pack --dry-run`; `node bin/feynman.js --version`; and `cd website && npm run build` all passed.
- Failed / learned: PR `#176` is still the only open change not reflected in `main`, but its diff only adds README sponsorship copy plus `atlascloud` labels/setup-list entries. It still lacks repo-local runtime proof that Atlas Cloud is a validated Feynman provider contract rather than an OpenAI-compatible custom-provider marketing claim.
- Blockers: Need actual Atlas runtime evidence for `#176` such as a docs-backed API contract plus a real `models.json` or setup-path verification before it is safe to merge or port.
- Next: Keep `#173` and `#175` treated as stale/superseded by `main`; require concrete provider integration evidence before touching `#176`.

### 2026-06-11 23:18 PDT — daily-issue-sweep

- Objective: Sweep live GitHub issues/PRs plus local dependency, CI, release, and validation health for actionable safe fixes.
- Changed: No repo code changes; recorded that `main` already contains the Windows `open-url` hardening and the MiniMax M3 research preference that open PRs `#173` and `#175` propose.
- Verified: `gh issue list` showed no open issues; `gh pr list` showed only `#173`, `#175`, and `#176`; `gh run list` showed the latest `Publish and Release` and `End-to-End Install Tests` runs green for `v0.3.3`; `gh release list` shows `v0.3.3` as latest; `npm audit --omit=dev` returned zero vulns; `npm outdated --json` returned `{}`; `npm test` passed `198/198`; `npm run typecheck`; `npm run build`; `npm pack --dry-run`; and `node bin/feynman.js --version` returned `0.3.3`.
- Failed / learned: PR `#176` is the only still-open change not already present in `main`, but the current PR evidence only shows label/sort-order/API-key-list docs wiring; it does not show a verified Atlas Cloud runtime path or model-catalog proof beyond README marketing copy.
- Blockers: Need actual provider integration evidence for `#176` before treating it as safe to merge or port.
- Next: Either close `#173` and `#175` as stale/superseded, or comment with `main` evidence; ask `#176` for a real runtime repro or docs-backed provider contract before merging.

## Entry template

### YYYY-MM-DD HH:MM TZ — [slug or objective]

- Objective: ...
- Changed: ...
- Verified: ...
- Failed / learned: ...
- Blockers: ...
- Next: ...

### 2026-06-11 19:54 PDT — pi-subagents-userdir

- Objective: Fix the `userDir is not defined` Pi subagent launch failure and make Feynman's pi-subagents patcher fail closed when upstream patch anchors drift.
- Changed: Made grouped pi-subagents source edits transactional, stopped rewriting the current upstream `getAgentDir()` agents path shape, repaired already half-patched current `agents.ts` inputs, and updated runtime/patch regression fixtures.
- Verified: `npm test`, `npm run typecheck`, focused patch tests, and live/tarball pi-subagents patch invariant checks passed.
- Failed / learned: Current upstream `pi-subagents@0.28.0` already honors `PI_CODING_AGENT_DIR`, and Feynman already sets it alongside `FEYNMAN_CODING_AGENT_DIR`; the old agents path rewrite is unnecessary for that shape and caused the mixed-state failure.
- Blockers: None.
- Next: Release when ready; do not re-enable current-shape agents path rewrites unless upstream stops honoring `PI_CODING_AGENT_DIR`.

### 2026-05-16 17:43 PDT — hindsight-memory-preset

- Objective: Address issue `#166` by making Hindsight memory installable through Feynman's optional package preset system.
- Changed: Added a `hindsight` optional preset for `@luxusai/pi-hindsight`, added `hindsight` and `pi-hindsight` update aliases, bumped the package to `0.2.58`, and updated release, package-stack, and setup docs.
- Verified: Live npm metadata and README for Hindsight Pi packages were checked; full root tests, typecheck, root build, root and website production audits, website build, package dry-run, package-list smoke, and a temp-home `feynman packages install hindsight` smoke passed locally.
- Failed / learned: The issue body was empty, but live npm package research found multiple Hindsight Pi packages; `@luxusai/pi-hindsight` is the most current docs-backed fit for Feynman's newer Pi runtime namespace while remaining optional.
- Blockers: Need commit, push, release workflow confirmation, npm latest verification, and issue update.
- Next: Push `main`, watch release CI, verify npm latest, then update and close `#166`.

### 2026-05-15 03:07 PDT — editor-input-contrast

- Objective: Fix issue `#165`, where macOS/iTerm users could not read typed text in Feynman's dark interactive input box.
- Changed: Centralized the Pi TUI editor/theme patch, added an explicit editor input foreground, applied the patch to package-local Pi files, launch-time runtime patching, and the vendored runtime archive path; bumped the package to `0.2.57`; added release notes; and updated the website lockfile `devalue` transitive to `5.8.1` after audit flagged the older release.
- Verified: Focused Pi TUI tests, full root tests, typecheck, root build, root production audit, website production audit, website build, runtime archive content inspection, package dry-run, packed tarball inspection, and clean installed-tarball `feynman --version` plus `feynman doctor` passed locally.
- Failed / learned: The placeholder was readable because it already used a themed foreground; typed input inherited the terminal default foreground after Feynman added the dark editor background.
- Blockers: Need commit, push, release workflow confirmation, npm latest verification, and issue closure.
- Next: Push `main`, watch release CI, verify npm latest, then close `#165`.

### 2026-05-13 11:55 PDT — audit-detail-sweep

- Objective: Tighten the current Feynman release line after a broad detail sweep.
- Changed: Bumped the root `protobufjs` override to `7.5.8`, refreshed the lockfile, added `0.2.56` release notes, and kept the package line publishable with a new patch version.
- Verified: Tracker and PR lists were empty; root tests, typecheck, build, root and website production audits, website build, diff whitespace check, package dry-run, and clean installed-tarball `feynman --version` plus `feynman doctor` passed after the override refresh.
- Failed / learned: The first root production audit exposed a new `protobufjs <=7.5.5` advisory from the existing override, so `0.2.55` needed a follow-up security patch rather than a no-op sweep.
- Blockers: Need commit, push, release workflow confirmation, and npm latest verification for `0.2.56`.
- Next: Push `main`, watch release CI, then verify npm latest.

### 2026-05-09 16:20 PDT — skills-install-targets

- Objective: Make standalone skills installs unambiguous for Codex, Claude/agent repo-local use, and OpenCode.
- Changed: Added explicit Codex installer scopes, documented target-specific commands, and added Codex smoke coverage.
- Verified: Focused installer tests, full root test suite, root typecheck, root build, package dry-run, diff whitespace check, website typecheck, and website build passed locally.
- Failed / learned: The existing default was already Codex, but the named scopes did not expose that clearly.
- Blockers: None.
- Next: Push `0.2.50` and answer issue #161 with the Codex, repo-local, and OpenCode commands.

### 2026-05-09 17:05 PDT — pi-package-peer-deps

- Objective: Address the missing peer-runtime dependency class reported as a follow-up on issue #80 and stop the issue monitor from missing new comments.
- Changed: Updated the issue heartbeat to include new comments; changed Pi package npm installs/updates to install the pinned Pi runtime peer packages beside Pi packages; bumped to `0.2.51`.
- Verified: Focused package-manager tests, full root test suite, root typecheck, root build, package dry-run, diff whitespace check, website typecheck, and website build passed locally.
- Failed / learned: The pasted `@earendil-works/pi-coding-agent` imports do not match the current npm tarballs for `pi-btw@0.3.7` or `pi-markdown-preview@0.9.7`, which currently import `@mariozechner/*`; the real Feynman-side bug is legacy peer dependency mode leaving peer-only runtime packages absent.
- Blockers: None.
- Next: Push `0.2.51`, watch release CI, and report the monitor/fix status.

### 2026-05-07 15:05 PDT — node24-core-researcher

- Objective: Fix the Node 24 regression from the default Pi package set while keeping Feynman focused on the core AI researcher path.
- Changed: Restored Node 24 support, slimmed default packages to alphaXiv/subagents/doc parsing/web access, moved memory and session search to optional presets, and upgraded the website stack to patched Astro 6/Vite 7 with the current content-layer config.
- Verified: Root build, typecheck, full tests, package dry-run, native bundle build, website build/typecheck/lint, and production audits passed locally.
- Failed / learned: The native bundle and website build still had stale assumptions: native validation expected `better-sqlite3`, and the Astro 6 upgrade needed the Vite override lifted to Vite 7 before static pages rendered.
- Blockers: None.
- Next: Push `main` and use release CI to publish `0.2.49`.

### 2026-05-07 04:00 PDT — pi-runtime-refresh

- Objective: Run another broad Feynman health sweep and take useful dependency/runtime fixes without bloating the wrapper.
- Changed: Updated `@mariozechner/pi-ai` and `@mariozechner/pi-coding-agent` to `0.73.0`; updated `@clack/prompts` to `1.3.0`; bumped the package to `0.2.45`; added release notes.
- Verified: Working tree started clean; open GitHub issues and PRs were empty; latest main release workflow was green; `npm test` passed with 154/154; typecheck, root build, website build, `feynman doctor`, `npm audit --omit=dev`, and `npm pack --dry-run` passed; JSONL RPC `get_state` plus `bash` returned `FEYNMAN_RPC_OK`; release CI published npm `0.2.45`, built native bundles, and created the GitHub release; global `feynman@0.2.45` installed and passed doctor plus RPC smoke.
- Failed / learned: TypeScript `6.0.3` is available as a major upgrade, but this pass intentionally did not take that compiler jump because the runtime wrapper benefit is low relative to release risk.
- Blockers: None for the runtime refresh.
- Next: Keep TypeScript 6 as a separate deliberate migration, not part of a runtime refresh.

### 2026-05-07 05:20 PDT — ml-recipe-workflow

- Objective: Review and finish the pending ML recipe workflow instead of leaving it as unverified local drift.
- Changed: Added the `/recipe` workflow, read-only Hugging Face Hub inspection tools, researcher recipe-mode guidance, docs, and focused Hugging Face tool tests; bumped the package to `0.2.46`.
- Verified: Context7 docs for Hugging Face.js confirm the Hub list/download model; live Hub checks returned HTTP 200 for dataset metadata, dataset tree, model tree, and README reads; mocked unit tests cover tool registration, auth, encoded URLs, limits, and truncation; `npm test` passed with 156/156; typecheck, root build, website build, CLI help, and `git diff --check` passed.
- Failed / learned: The global `0.2.45` release correctly did not include the pending recipe workflow, so this needs its own versioned release instead of being described under `0.2.45`.
- Blockers: Need post-bump pack/audit validation, commit, push, release workflow confirmation, and global install update to `0.2.46`.
- Next: Run final validation, push `main`, watch release CI, then install `@companion-ai/feynman@0.2.46` globally.

### 2026-05-07 05:35 PDT — docs-test-cleanup

- Objective: Clear the remaining local doc/test corrections without pushing a duplicate package version.
- Changed: Linked upstream Pi and Hugging Face docs from README and website docs; clarified Hugging Face binary-file refusal behavior; tightened the binary-refusal test assertion; bumped the package to `0.2.47`.
- Verified: Pending final validation before push.
- Failed / learned: `0.2.46` released successfully, so any further pushed changes need a new package version to keep the release workflow green.
- Blockers: Need validation, push, release workflow confirmation, and global install update to `0.2.47`.
- Next: Run tests/build/audit/pack, push `main`, watch release CI, then install latest globally.

### 2026-05-06 19:04 PDT — audit-cleanup

- Objective: Run a broad maintenance pass after tracker cleanup and fix anything that materially helps Feynman.
- Changed: Updated transitive dependency override pins for `basic-ftp`, `hono`, `express-rate-limit`, `ip-address`, AWS XML parsing dependencies, and MCP SDK resolution; bumped the package to `0.2.44`; added release notes.
- Verified: Open GitHub issues and PRs were both empty; installed CLI and npm latest were `0.2.43` before this pass; full `npm test` passed with 154/154; typecheck, root build, website build, `feynman doctor`, and production `npm audit --omit=dev` passed.
- Failed / learned: The remaining audit issues were caused by repo-level overrides pinning vulnerable transitive versions; local npm `min-release-age=7` required disabling the delay to install newly patched Hono.
- Blockers: Need final post-bump validation, commit, push, release workflow confirmation, and installed CLI update.
- Next: Re-run validation after the version bump, push `main`, watch release CI, then install `@companion-ai/feynman@0.2.44` globally.

### 2026-05-06 03:34 PDT — web-search-config-perms

- Objective: Integrate the remaining open PR for web-search credential file permissions and ship it through the npm release path.
- Changed: Restricted `.feynman/web-search.json` to `0600` after writes, added POSIX regression coverage, bumped the package to `0.2.43`, and added release notes.
- Verified: Focused `pi-web-access` test passed; final post-bump `npm test` passed with 154/154; typecheck, build, diff check, package-lock version check, and `npm pack --dry-run` passed.
- Failed / learned: A code-only commit would not publish because `0.2.42` was already on npm, so this fix needs a version bump.
- Blockers: Need push, GitHub Actions release confirmation, and PR #154 closure.
- Next: Push `main`, watch the release workflow, then close PR #154 as integrated.

### 2026-05-06 00:00 local — github-issues-150-153

- Objective: Read the current Feynman GitHub issues and fix the open tracker items end to end.
- Changed: Fixed bundled package seeding so copied runtime packages satisfy startup package checks; seeded bundles before interactive setup reports missing packages; restricted Feynman and sqlite-backed native package support to Node 22; moved release CI to Node 22; restored token-based npm publishing; made GitHub native releases independent of the npm publish result; applied the biomedical literature review docs from PR #152; bumped the package to `0.2.41`.
- Verified: Ran `npm test` with 151/151 passing, `npm run typecheck`, `npm run build`, `cd website && npm run build`, `node bin/feynman.js --version`, and a fresh `FEYNMAN_HOME` package-detection smoke that reported zero missing startup packages.
- Failed / learned: The package seeding bug was not just missing files; copied bundled packages were present but not counted as seeded because the check only recognized symlink targets.
- Blockers: npm publish is still blocked by registry credentials returning 404 for `@companion-ai/feynman@0.2.41`; GitHub native release still needs observation.
- Next: Confirm the follow-up release run publishes the GitHub native bundles, then close/comment issues #150, #151, #153 and PR #152.

### 2026-04-12 00:00 local — capital-france

- Objective: Run an unattended deep-research workflow for the question "What is the capital of France?"
- Changed: Created plan artifact at `outputs/.plans/capital-france.md`; scoped the workflow as a narrow fact-verification run with direct lead-agent evidence gathering instead of researcher subagents.
- Verified: Read existing `CHANGELOG.md` and recalled prior saved plan memory for `capital-france` before finalizing the new run plan.
- Failed / learned: None yet.
- Blockers: Need at least two current independent authoritative sources and a quick ambiguity check before drafting.
- Next: Collect current official/public sources, resolve any legal nuance, then draft and verify the brief.

### 2026-04-12 00:20 local — capital-france

- Objective: Complete evidence gathering and ambiguity check for the capital-of-France workflow.
- Changed: Wrote `notes/capital-france-research-web.md` and `notes/capital-france-legal-context.md`; identified Insee (2024) and a Sénat report as the two main corroborating sources.
- Verified: Cross-read current public French sources that explicitly describe Paris as the capital/capital city of France; found no current contradiction.
- Failed / learned: The Presidency homepage was useful contextual support but not explicit enough to carry the core claim alone.
- Blockers: Need citation pass and final review pass before promotion.
- Next: Draft the brief, then run verifier and reviewer passes.

### 2026-04-12 00:35 local — capital-france

- Objective: Move from gathered evidence to a citable draft.
- Changed: Wrote `outputs/.drafts/capital-france-draft.md` and updated the plan ledger to mark drafting complete.
- Verified: Kept the core claim narrowly scoped to what the Insee and Sénat sources explicitly support; treated the Élysée page as contextual only.
- Failed / learned: None.
- Blockers: Need verifier URL/citation pass and reviewer verification pass before final promotion.
- Next: Run verifier on the draft, then review and promote the final brief.

### 2026-04-12 00:50 local — capital-france

- Objective: Complete citation, verification, and final promotion for the capital-of-France workflow.
- Changed: Produced `outputs/capital-france-brief.md`, ran verification into `notes/capital-france-verification.md`, promoted the final brief to `outputs/capital-france.md`, and wrote `outputs/capital-france.provenance.md`.
- Verified: Reviewer found no FATAL or MAJOR issues. Core claim remains backed by two independent French public-institution sources, with Insee as the primary explicit source and the Sénat report as corroboration.
- Failed / learned: The runtime did not expose a named `verifier` subagent, so I used an available worker in a verifier-equivalent role and recorded that deviation in the plan.
- Blockers: None.
- Next: If needed, extend the brief with deeper legal-historical sourcing, but the narrow factual question is sufficiently answered.

### 2026-04-12 10:05 local — capital-france

- Objective: Run the citation-verification pass on the capital-of-France draft and promote a final cited brief.
- Changed: Verified the three draft source URLs were live (HTTP 200 at check time), added numbered inline citations, downgraded unsupported phrasing around the Élysée/context and broad ambiguity claims, and wrote `outputs/capital-france-brief.md`.
- Verified: Confirmed Insee explicitly says Paris is the capital of France; confirmed the Sénat report describes Paris’s capital status and the presence of national institutions; confirmed the Élysée homepage is contextual only and not explicit enough to carry the core claim.
- Failed / learned: The draft wording about the Presidency being seated in Paris was not directly supported by the cited homepage, so it was removed rather than carried forward.
- Blockers: Reviewer pass still pending if the workflow requires an adversarial final check.
- Next: If needed, run a final reviewer pass; otherwise use `outputs/capital-france-brief.md` as the canonical brief.

### 2026-04-12 10:20 local — capital-france

- Objective: Close the workflow with final review, final artifact promotion, and provenance.
- Changed: Ran a reviewer pass recorded in `notes/capital-france-verification.md`; promoted the cited brief into `outputs/capital-france.md`; wrote `outputs/capital-france.provenance.md`; updated the run plan to mark all tasks complete.
- Verified: Reviewer verdict was PASS WITH MINOR REVISIONS only; those minor wording fixes were applied before delivery.
- Failed / learned: The runtime did not expose a project-named `verifier` agent, so the citation pass used an available worker agent as a verifier-equivalent step.
- Blockers: None.
- Next: Optional only — produce a legal memorandum on the basis of Paris's capital status if requested.

### 2026-04-14 12:00 local — capital-belgium

- Objective: Run a deep-research workflow for the question "What is the capital of Belgium?"
- Changed: Created plan artifact at `outputs/.plans/capital-belgium.md`; gathered evidence into `notes/capital-belgium-research-web.md` from Belgium.be, FPS Foreign Affairs, Britannica, and a Belgian Senate constitution check.
- Verified: Found two explicit current Belgian government statements that Brussels is the federal capital of Belgium, plus independent Britannica corroboration; no conflicting nuance surfaced in the consulted legal text.
- Failed / learned: This is narrow enough that researcher subagents would add overhead without increasing evidence quality.
- Blockers: Need draft, citation/URL verification pass, final review pass, and promotion.
- Next: Draft the brief, run verifier-equivalent and reviewer passes, then promote final output with provenance.

### 2026-04-14 12:25 local — capital-belgium

- Objective: Complete citation, verification, and final promotion for the capital-of-Belgium workflow.
- Changed: Wrote `outputs/.drafts/capital-belgium-draft.md`; produced cited brief `outputs/capital-belgium-brief.md`; ran verification into `notes/capital-belgium-verification.md`; promoted final output to `outputs/capital-belgium.md`; wrote `outputs/capital-belgium.provenance.md`; updated the plan ledger and verification log.
- Verified: Core claim is now backed by Belgium.be, Belgian Foreign Affairs, Britannica, and direct constitutional text from Senate-hosted Article 194 stating that Brussels is the capital of Belgium and the seat of the federal government.
- Failed / learned: The runtime did not expose a named `verifier` subagent, so a worker performed a verifier-equivalent citation/URL check; reviewer surfaced a stronger constitutional source than the first draft had emphasized.
- Blockers: None.
- Next: Optional only — if requested, expand this into a legal-historical note on Brussels’s capital status and the distinction between city, region, and federal institutions.

### 2026-03-25 00:00 local — scaling-laws

- Objective: Set up a deep research workflow for scaling laws.
- Changed: Created plan artifact at `outputs/.plans/scaling-laws.md`; defined 4 disjoint researcher dimensions and acceptance criteria.
- Verified: Read `CHANGELOG.md` and checked prior memory for related plan `scaling-laws-implications`.
- Failed / learned: No prior run-specific changelog entries existed beyond the template.
- Blockers: Waiting for user confirmation before launching researcher round 1.
- Next: On confirmation, spawn 4 parallel researcher subagents and begin evidence collection.

### 2026-03-25 00:30 local — scaling-laws (T4 inference/time-scale pass)

- Objective: Complete T4 on inference/test-time scaling and reasoning-time compute, scoped to 2023–2026.
- Changed: Wrote `notes/scaling-laws-research-inference.md`; updated `outputs/.plans/scaling-laws.md` to mark T4 done and log the inference-scaling verification pass.
- Verified: Cross-read 13 primary/official sources covering Tree-of-Thoughts, PRMs, repeated sampling, compute-optimal test-time scaling, provable laws, o1, DeepSeek-R1, s1, verifier failures, Anthropic extended thinking, and OpenAI reasoning API docs.
- Failed / learned: OpenAI blog fetch for `learning-to-reason-with-llms` returned malformed content, so the note leans on the o1 system card and API docs instead of that blog post.
- Blockers: T2 and T5 remain open before final synthesis; no single unified law for inference-time scaling emerged from public sources.
- Next: Complete T5 implications synthesis, then reconcile T3/T4 with foundational T2 before drafting the cited brief.

### 2026-03-25 11:20 local — scaling-laws (T6 draft synthesis)

- Objective: Synthesize the four research notes into a single user-facing draft brief for the scaling-laws workflow.
- Changed: Wrote `outputs/.drafts/scaling-laws-draft.md` with an executive summary, curated reading list, qualitative meta-analysis, core-paper comparison table, explicit training-vs-inference distinction, and numbered inline citations with direct-URL sources.
- Verified: Cross-checked the draft against `notes/scaling-laws-research-foundations.md`, `notes/scaling-laws-research-revisions.md`, `notes/scaling-laws-research-inference.md`, and `notes/scaling-laws-research-implications.md` to ensure the brief explicitly states the literature is too heterogeneous for a pooled effect-size estimate.
- Failed / learned: The requested temp-run `context.md` and `plan.md` were absent, so the synthesis used `outputs/.plans/scaling-laws.md` plus the four note files as the working context.
- Blockers: Citation/claim verification pass still pending; this draft should be treated as pre-verification.
- Next: Run verifier/reviewer passes, then promote the draft into the final cited brief and provenance sidecar.

### 2026-03-25 11:28 local — scaling-laws (final brief + pdf)

- Objective: Deliver a paper guide and qualitative meta-analysis on AI scaling laws.
- Changed: Finalized `outputs/scaling-laws.md` and sidecar `outputs/scaling-laws.provenance.md`; rendered preview PDF at `outputs/scaling-laws.pdf`; updated plan ledger and verification log in `outputs/.plans/scaling-laws.md`.
- Verified: Ran a reviewer pass recorded in `notes/scaling-laws-verification.md`; spot-checked key primary papers via alpha-backed reads for Kaplan 2020, Chinchilla 2022, and Snell 2024; confirmed PDF render output exists.
- Failed / learned: A pooled statistical meta-analysis would be misleading because the literature mixes heterogeneous outcomes, scaling axes, and evaluation regimes; final deliverable uses a qualitative meta-analysis instead.
- Blockers: None for this brief.
- Next: If needed, extend into a narrower sub-survey (e.g. only pretraining laws, only inference-time scaling, or only post-Chinchilla data-quality revisions).

### 2026-03-25 14:52 local — skills-only-install

- Objective: Let users download the Feynman research skills without installing the full terminal runtime.
- Changed: Added standalone skills-only installers at `scripts/install/install-skills.sh` and `scripts/install/install-skills.ps1`; synced website-public copies; documented user-level and repo-local install flows in `README.md`, `website/src/content/docs/getting-started/installation.md`, and `website/src/pages/index.astro`.
- Verified: Ran `sh -n scripts/install/install-skills.sh`; ran `node scripts/sync-website-installers.mjs`; ran `cd website && npm run build`; executed `sh scripts/install/install-skills.sh --dir <tmp>` and confirmed extracted `SKILL.md` files land in the target directory.
- Failed / learned: PowerShell installer behavior was not executed locally because PowerShell is not installed in this environment.
- Blockers: None for the Unix installer flow; Windows remains syntax-only by inspection.
- Next: If users want this exposed more prominently, add a dedicated docs/reference page and a homepage-specific skills-only CTA instead of a text link.

### 2026-03-26 18:08 PDT — installer-release-unification

- Objective: Remove the moving `edge` installer channel and unify installs on tagged releases only.
- Changed: Updated `scripts/install/install.sh`, `scripts/install/install.ps1`, `scripts/install/install-skills.sh`, and `scripts/install/install-skills.ps1` so the default target is the latest tagged release, latest-version resolution uses public GitHub release pages instead of `api.github.com`, and explicit `edge` requests now fail with a removal message; removed the `release-edge` job from `.github/workflows/publish.yml`; updated `README.md` and `website/src/content/docs/getting-started/installation.md`; re-synced `website/public/install*`.
- Verified: Ran `sh -n` on the Unix installer copies; confirmed `sh scripts/install/install.sh edge` and `sh scripts/install/install-skills.sh edge --dir <tmp>` fail with the intended removal message; executed `sh scripts/install/install.sh` into temp dirs and confirmed the installed binary reports `0.2.14`; executed `sh scripts/install/install-skills.sh --dir <tmp>` and confirmed extracted `SKILL.md` files; ran `cd website && npm run build`.
- Failed / learned: The install failure was caused by unauthenticated GitHub API rate limiting on the `edge` path, so renaming channels without removing the API dependency would not have fixed the root cause.
- Blockers: `npm run build` still emits a pre-existing duplicate-content warning for `getting-started/installation`; the build succeeds.
- Next: If desired, remove the now-unused `stable` alias too and clean up the duplicate docs-content warning separately.

### 2026-03-27 11:58 PDT — release-0.2.15

- Objective: Make the non-Anthropic subagent/auth fixes and contributor-guide updates releasable to tagged-install users instead of leaving them only on `main`.
- Changed: Bumped the package version from `0.2.14` to `0.2.15` in `package.json` and `package-lock.json`; updated pinned installer examples in `README.md` and `website/src/content/docs/getting-started/installation.md`; aligned the local-development docs example to the npm-based root workflow; added `CONTRIBUTING.md` plus the bundled `skills/contributing/SKILL.md`.
- Verified: Confirmed the publish workflow keys off `package.json` versus the currently published npm version; confirmed local `npm test`, `npm run typecheck`, and `npm run build` pass before the release bump.
- Failed / learned: The open subagent issue is fixed on `main` but still user-visible on tagged installs until a fresh release is cut.
- Blockers: Need the GitHub publish workflow to finish successfully before the issue can be honestly closed as released.
- Next: Push `0.2.15`, monitor the publish workflow, then update and close the relevant GitHub issue/PR once the release is live.

### 2026-03-28 15:15 PDT — pi-subagents-agent-dir-compat

- Objective: Debug why tagged installs can still fail subagent/auth flows after `0.2.15` when users are not on Anthropic.
- Changed: Added `scripts/lib/pi-subagents-patch.mjs` plus type declarations and wired `scripts/patch-embedded-pi.mjs` to rewrite vendored `pi-subagents` runtime files so they resolve user-scoped paths from `PI_CODING_AGENT_DIR` instead of hardcoded `~/.pi/agent`; added `tests/pi-subagents-patch.test.ts`.
- Verified: Materialized `.feynman/npm`, inspected the shipped `pi-subagents@0.11.11` sources, confirmed the hardcoded `~/.pi/agent` paths in `index.ts`, `agents.ts`, `artifacts.ts`, `run-history.ts`, `skills.ts`, and `chain-clarify.ts`; ran `node scripts/patch-embedded-pi.mjs`; ran `npm test`, `npm run typecheck`, and `npm run build`.
- Failed / learned: The earlier `0.2.15` fix only proved that Feynman exported `PI_CODING_AGENT_DIR` to the top-level Pi child; it did not cover vendored extension code that still hardcoded `.pi` paths internally.
- Blockers: Users still need a release containing this patch before tagged installs benefit from it.
- Next: Cut the next release and verify a tagged install exercises subagents without reading from `~/.pi/agent`.

### 2026-03-28 21:46 PDT — release-0.2.16

- Objective: Ship the vendored `pi-subagents` agent-dir compatibility fix to tagged installs.
- Changed: Bumped the package version from `0.2.15` to `0.2.16` in `package.json` and `package-lock.json`; updated pinned installer examples in `README.md` and `website/src/content/docs/getting-started/installation.md`.
- Verified: Re-ran `npm test`, `npm run typecheck`, and `npm run build`; ran `cd website && npm run build`; ran `npm pack` and confirmed the `0.2.16` tarball includes the new `scripts/lib/pi-subagents-patch.*` files.
- Failed / learned: An initial local `build:native-bundle` check failed because `npm pack` and `build:native-bundle` were run in parallel, and `prepack` intentionally removes `dist/release`; rerunning `npm run build:native-bundle` sequentially succeeded.
- Blockers: None in the repo; publishing still depends on the GitHub workflow running on the bumped version.
- Next: Push the `0.2.16` release bump and monitor npm/GitHub release publication.

### 2026-03-31 10:45 PDT — pi-maintenance-issues-prs

- Objective: Triage open Pi-related issues/PRs, fix the concrete package update regression, and refresh Pi dependencies against current upstream releases.
- Changed: Pinned direct package-manager operations (`feynman update`, `feynman packages install`) to Feynman's npm prefix by exporting `FEYNMAN_NPM_PREFIX`, `NPM_CONFIG_PREFIX`, and `npm_config_prefix` before invoking Pi's `DefaultPackageManager`; bumped `@mariozechner/pi-ai` and `@mariozechner/pi-coding-agent` from `0.62.0` to `0.64.0`; adapted `src/model/registry.ts` to the new `ModelRegistry.create(...)` factory; integrated PR #15's `/feynman-model` command on top of current `main`.
- Verified: Ran `npm test`, `npm run typecheck`, and `npm run build` successfully after the dependency bump and PR integration; confirmed upstream `pi-coding-agent@0.64.0` still uses `npm install -g` for user-scope package updates, so the Feynman-side prefix fix is still required.
- Failed / learned: PR #14 is a stale branch with no clean merge path against current `main`; the only user-facing delta is the ValiChord prompt/skill addition, and the branch also carries unrelated release churn plus demo-style material, so it was not merged in this pass.
- Blockers: None in the local repo state; remote merge/push still depends on repository credentials and branch policy.
- Next: If remote write access is available, commit and push the validated maintenance changes, then close issue #22 and resolve PR #15 as merged while leaving PR #14 unmerged pending a cleaned-up, non-promotional resubmission.

### 2026-03-31 12:05 PDT — pi-backlog-cleanup-round-2

- Objective: Finish the remaining high-confidence open tracker items after the Pi 0.64.0 upgrade instead of leaving the issue list half-reconciled.
- Changed: Added a Windows extension-loader patch helper so Feynman rewrites Pi extension imports to `file://` URLs on Windows before interactive startup; added `/commands`, `/tools`, and `/capabilities` discovery commands and surfaced `/hotkeys` plus `/service-tier` in help metadata; added explicit service-tier support via `feynman model tier`, `--service-tier`, status/doctor output, and a provider-payload hook that passes `service_tier` only to supported OpenAI/OpenAI Codex/Anthropic models; added Exa provider recognition to Feynman's web-search status layer and vendored `pi-web-access`.
- Verified: Ran `npm test`, `npm run typecheck`, and `npm run build`; smoke-imported the modified vendored `pi-web-access` modules with `node --import tsx`.
- Failed / learned: The remaining ValiChord PR is still stale and mixes a real prompt/skill update with unrelated branch churn; it is a review/triage item, not a clean merge candidate.
- Blockers: No local build blockers remain; issue/PR closure still depends on the final push landing on `main`.
- Next: Push the verified cleanup commit, then close issues fixed by the dependency bump plus the new discoverability/service-tier/Windows patches, and close the stale ValiChord PR explicitly instead of leaving it open indefinitely.

### 2026-04-09 09:37 PDT — windows-startup-import-specifiers

- Objective: Fix Windows startup failures where `feynman` exits before the Pi child process initializes.
- Changed: Converted the Node preload module paths passed via `node --import` in `src/pi/launch.ts` to `file://` specifiers using a new `toNodeImportSpecifier(...)` helper in `src/pi/runtime.ts`; expanded `scripts/patch-embedded-pi.mjs` so it also patches the bundled workspace copy of Pi's extension loader when present.
- Verified: Added a regression test in `tests/pi-runtime.test.ts` covering absolute-path to `file://` conversion for preload imports; ran `npm test`, `npm run typecheck`, and `npm run build`.
- Failed / learned: The raw Windows `ERR_UNSUPPORTED_ESM_URL_SCHEME` stack is more consistent with Node rejecting the child-process `--import C:\\...` preload before Pi starts than with a normal in-app extension load failure.
- Blockers: Windows runtime execution was not available locally, so the fix is verified by code path inspection and automated tests rather than an actual Windows shell run.
- Next: Ask the affected user to reinstall or update to the next published package once released, and confirm the Windows REPL now starts from a normal PowerShell session.

### 2026-04-09 11:02 PDT — tracker-hardening-pass

- Objective: Triage the open repo backlog, land the highest-signal fixes locally, and add guardrails against stale promotional workflow content.
- Changed: Hardened Windows launch paths in `bin/feynman.js`, `scripts/build-native-bundle.mjs`, and `scripts/install/install.ps1`; set npm prefix overrides earlier in `scripts/patch-embedded-pi.mjs`; added a `pi-web-access` runtime patch helper plus `FEYNMAN_WEB_SEARCH_CONFIG` env wiring so bundled web search reads the same `~/.feynman/web-search.json` that doctor/status report; taught `src/pi/web-access.ts` to honor the legacy `route` key; fixed bundled skill references and expanded the skills-only installers/docs to ship the prompt and guidance files those skills reference; added regression tests for config paths, catalog snapshot edges, skill-path packaging, `pi-web-access` patching, and blocked promotional content.
- Verified: Ran `npm test`, `npm run typecheck`, and `npm run build` successfully after the full maintenance pass.
- Failed / learned: The skills-only install issue was not just docs drift; the shipped `SKILL.md` files referenced prompt paths that only made sense after installation, so the repo needed both path normalization and packaging changes.
- Blockers: Remote issue/PR closure and merge actions still depend on the final reviewed branch state being pushed.
- Next: Push the validated fixes, close the duplicate Windows/reporting issues they supersede, reject the promotional ValiChord PR explicitly, and then review whether the remaining docs-only or feature PRs should be merged separately.

### 2026-04-09 10:28 PDT — verification-and-security-pass

- Objective: Run a deeper install/security verification pass against the post-cleanup `0.2.17` tree instead of assuming the earlier targeted fixes covered the shipped artifacts.
- Changed: Reworked `extensions/research-tools/header.ts` to use `@mariozechner/pi-tui` width-aware helpers for truncation/wrapping so wide Unicode text does not overflow custom header rows; changed `src/pi/launch.ts` to stop mirroring child crash signals back onto the parent process and instead emit a conventional exit code; added `FEYNMAN_INSTALL_SKILLS_ARCHIVE_URL` overrides to the skills installers for pre-release smoke testing; aligned root and website dependency trees with patched transitive versions using npm `overrides`; fixed `src/pi/web-access.ts` so `search status` respects `FEYNMAN_HOME` semantics instead of hardcoding the current shell home directory; added `tests/pi-launch.test.ts`.
- Verified: Ran `npm test`, `npm run typecheck`, `npm run build`, `cd website && npm run build`, `npm run build:native-bundle`; smoke-tested `scripts/install/install.sh` against a locally served `dist/release/feynman-0.2.17-darwin-arm64.tar.gz`; smoke-tested `scripts/install/install-skills.sh` against a local source archive; confirmed installed `feynman --version`, `feynman --help`, `feynman doctor`, and packaged `feynman search status` work from the installed bundle; `npm audit --omit=dev` is clean in the root app and website after overrides.
- Failed / learned: The first packaged `search status` smoke test still showed the user home path because the native bundle had been built before the `FEYNMAN_HOME` path fix; rebuilding the native bundle resolved that mismatch.
- Blockers: PowerShell runtime was unavailable locally, so Windows installer execution remained code-path validated rather than actually executed.
- Next: Push the second-pass hardening commit, then keep issue `#46` and issue `#47` open until users on the affected Linux/CJK environments confirm whether the launcher/header fixes fully resolve them.

### 2026-04-09 10:36 PDT — remaining-tracker-triage-pass

- Objective: Reduce the remaining open tracker items by landing the lowest-risk missing docs/catalog updates and a targeted Cloud Code Assist compatibility patch instead of only hand-triaging them.
- Changed: Added MiniMax M2.7 recommendation preferences in `src/model/catalog.ts`; documented model switching, authenticated-provider visibility, and `/feynman-model` subagent overrides in `website/src/content/docs/getting-started/configuration.md` and `website/src/content/docs/reference/slash-commands.md`; added a runtime patch helper in `scripts/lib/pi-google-legacy-schema-patch.mjs` and wired `scripts/patch-embedded-pi.mjs` to normalize JSON Schema `const` into `enum` for the legacy `parameters` field used by Cloud Code Assist Claude models.
- Verified: Ran `npm test`, `npm run typecheck`, `npm run build`, and `cd website && npm run build` after the patch/helper/docs changes.
- Failed / learned: The MiniMax provider catalog in Pi already uses canonical IDs like `MiniMax-M2.7`, so the only failure during validation was a test assertion using the wrong casing rather than a runtime bug.
- Blockers: The Cloud Code Assist fix is validated by targeted patch tests and code-path review rather than an end-to-end Google account repro in this environment.
- Next: Push the tracker-triage commit, close the docs/MiniMax PRs as superseded by main, close the support-style model issues against the new docs, and decide whether the remaining feature requests should be left open or closed as not planned/upstream-dependent.

### 2026-04-10 10:22 PDT — web-access-stale-override-fix

- Objective: Fix the new `ctx.modelRegistry.getApiKeyAndHeaders is not a function` / stale `search-filter.js` report without reintroducing broad vendor drift.
- Changed: Removed the stale `.feynman/vendor-overrides/pi-web-access/*` files and removed `syncVendorOverride` from `scripts/patch-embedded-pi.mjs`; kept the targeted `pi-web-access` runtime config-path patch; added `feynman search set <provider> [api-key]` and `feynman search clear` commands with a shared save path in `src/pi/web-access.ts`.
- Verified: Ran `npm test`, `npm run typecheck`, `npm run build`; ran `node scripts/patch-embedded-pi.mjs`, confirmed the installed `pi-web-access/index.ts` has no `search-filter` / condense helper references, and smoke-imported `./.feynman/npm/node_modules/pi-web-access/index.ts`; ran `npm pack --dry-run` and confirmed stale `vendor-overrides` files are no longer in the package tarball.
- Failed / learned: The public Linux installer Docker test was attempted but Docker Desktop became unresponsive even for simple `docker run node:22-bookworm node -v` commands; the earlier Linux npm-artifact container smoke remains valid, but this specific public-installer run is blocked by the local Docker daemon.
- Blockers: Issue `#54` is too underspecified to fix directly without logs; public Linux installer behavior still needs a stable Docker daemon or a real Linux shell to reproduce the user's exact npm errors.
- Next: Push the stale-override fix, close PR `#52` and PR `#53` as superseded/merged-by-main once pushed, and ask for logs on issue `#54` instead of guessing.

### 2026-04-10 10:49 PDT — rpc-and-website-verification-pass

- Objective: Exercise the Feynman wrapper's RPC mode and the website quality gates that were not fully covered by the prior passes.
- Changed: Added `--mode <text|json|rpc>` pass-through support in the Feynman wrapper and skipped terminal clearing in RPC mode; added `@astrojs/check` to the website dev dependencies, fixed React Refresh lint violations in the generated UI components by exporting only components, and added safe website dependency overrides for dev-audit findings.
- Verified: Ran a JSONL RPC smoke test through `node bin/feynman.js --mode rpc` with `get_state`; ran `npm test`, `npm run typecheck`, `npm run build`, `cd website && npm run lint`, `cd website && npm run typecheck`, `cd website && npm run build`, full root `npm audit`, full website `npm audit`, and `npm run build:native-bundle`.
- Failed / learned: Website typecheck was previously a no-op prompt because `@astrojs/check` was missing; installing it exposed dev-audit findings that needed explicit overrides before the full website audit was clean.
- Blockers: Docker Desktop remained unreliable after restart attempts, so this pass still does not include a second successful public-installer Linux Docker run.
- Next: Push the RPC/website verification commit and keep future Docker/public-installer validation separate from repo correctness unless Docker is stable.

### 2026-04-12 09:32 PDT — pi-0.66.1-upgrade-pass

- Objective: Update Feynman from Pi `0.64.0` to the current `0.66.1` packages and absorb any downstream SDK/runtime compatibility changes instead of leaving the repo pinned behind upstream.
- Changed: Bumped `@mariozechner/pi-ai` and `@mariozechner/pi-coding-agent` to `0.66.1` plus `@companion-ai/alpha-hub` to `0.1.3` in `package.json` and `package-lock.json`; updated `extensions/research-tools.ts` to stop listening for the removed `session_switch` extension event and rely on `session_start`, which now carries startup/reload/new/resume/fork reasons in Pi `0.66.x`.
- Verified: Ran `npm test`, `npm run typecheck`, and `npm run build` successfully after the upgrade; smoke-ran `node bin/feynman.js --version`, `node bin/feynman.js doctor`, and `node bin/feynman.js status` successfully; checked upstream package diffs and confirmed the breaking change that affected this repo was the typed extension lifecycle change in `pi-coding-agent`, while `pi-ai` mainly brought refreshed provider/model catalog code including Bedrock/OpenAI provider updates and new generated model entries.
- Failed / learned: `ctx7` resolved Pi correctly to `/badlogic/pi-mono`, but its docs snapshot was not release-note oriented; the concrete downstream-impact analysis came from the actual `0.64.0` → `0.66.1` package diffs and local validation, not from prose docs alone.
- Failed / learned: The first post-upgrade CLI smoke test failed before Feynman startup because `@companion-ai/alpha-hub@0.1.2` shipped a zero-byte `src/lib/auth.js`; bumping to `0.1.3` fixed that adjacent runtime blocker.
- Blockers: `npm install` reports two high-severity vulnerabilities remain in the dependency tree; this pass focused on the Pi upgrade and did not remediate unrelated audit findings.
- Next: Push the Pi upgrade, then decide whether to layer the pending model-command fixes on top of this branch or land them separately to keep the dependency bump easy to review.

### 2026-04-12 13:00 PDT — model-command-and-bedrock-fix-pass

- Objective: Finish the remaining user-facing model-management regressions instead of stopping at the Pi dependency bump.
- Changed: Updated `src/model/commands.ts` so `feynman model login <provider>` resolves both OAuth and API-key providers; `feynman model logout <provider>` clears either auth mode; `feynman model set` accepts both `provider/model` and `provider:model`; ambiguous bare model IDs now prefer explicitly configured providers from auth storage; added an `amazon-bedrock` setup path that validates the AWS credential chain with the AWS SDK and stores Pi's `<authenticated>` sentinel so Bedrock models appear in `model list`; synced `src/cli.ts`, `metadata/commands.mjs`, `README.md`, and the website docs to the new behavior.
- Verified: Added regression tests in `tests/model-harness.test.ts` for `provider:model`, API-key provider resolution, and ambiguous bare-ID handling; ran `npm test`, `npm run typecheck`, `npm run build`, and `cd website && npm run build`; exercised command-level flows against throwaway `FEYNMAN_HOME` directories: interactive `node bin/feynman.js model login google`, `node bin/feynman.js model set google:gemini-3-pro-preview`, `node bin/feynman.js model set gpt-5.4` with only OpenAI configured, and `node bin/feynman.js model login amazon-bedrock`; confirmed `model list` shows Bedrock models after the new setup path; ran a live one-shot prompt `node bin/feynman.js --prompt "Reply with exactly OK"` and got `OK`.
- Failed / learned: The website build still emits duplicate-id warnings for a handful of docs pages, but it completes successfully; those warnings predate this pass and were not introduced by the model-command edits.
- Blockers: The Bedrock path is verified with the current shell's AWS credential chain, not with a fresh machine lacking AWS config; broader upstream Pi behavior around IMDS/default-profile autodiscovery without the sentinel is still outside this repo.
- Next: Commit and push the combined Pi/model/docs maintenance branch, then decide whether to tackle the deeper search/deepresearch hang issues separately or leave them for focused repro work.

### 2026-04-12 13:35 PDT — workflow-unattended-and-search-curator-fix-pass

- Objective: Fix the remaining workflow deadlocks instead of leaving `deepresearch` and terminal web search half-functional after the maintenance push.
- Changed: Updated the built-in research workflow prompts (`deepresearch`, `lit`, `review`, `audit`, `compare`, `draft`, `watch`) so they present the plan and continue automatically rather than blocking for approval; extended the `pi-web-access` runtime patch so Feynman rewrites its default workflow from browser-based `summary-review` to `none`; added explicit `workflow: "none"` persistence in `src/search/commands.ts` and `src/pi/web-access.ts`, plus surfaced the workflow in doctor/status-style output.
- Verified: Reproduced the original `deepresearch` failure mode in print mode, where the run created `outputs/.plans/capital-france.md` and then stopped waiting for user confirmation; after the prompt changes, reran `deepresearch "What is the capital of France?"` and confirmed it progressed beyond planning and produced `outputs/.drafts/capital-france-draft.md`; inspected `pi-web-access@0.10.6` and confirmed the exact `waiting for summary approval...` string and `summary-review` default live in that package; added regression tests for the new `pi-web-access` patch and workflow-none status handling; reran `npm test`, `npm run typecheck`, and `npm run build`; smoke-tested `feynman search set exa exa_test_key` under a throwaway `FEYNMAN_HOME` and confirmed it writes `"workflow": "none"` to `web-search.json`.
- Failed / learned: The long-running deepresearch session still spends substantial time in later reasoning/writing steps for even a narrow query, but the plan-confirmation deadlock itself is resolved; the remaining slowness is model/workflow behavior, not the original stop-after-plan bug.
- Blockers: I did not install and execute the full optional `pi-session-search` package locally, so the terminal `summary approval` fix is validated by source inspection plus the Feynman patch path and config persistence rather than a local end-to-end package install.
- Next: Commit and push the workflow/search fix pass, then close or answer the remaining deepresearch/search issues with the specific root causes and shipped fixes.

### 2026-04-12 14:05 PDT — final-artifact-hardening-pass

- Objective: Reduce the chance of unattended research workflows stopping at intermediate artifacts like `<slug>-brief.md` without promoting the final deliverable and provenance sidecar.
- Changed: Tightened `prompts/deepresearch.md` so the agent must verify on disk that the plan, draft, cited brief, promoted final output, and provenance sidecar all exist before stopping; tightened `prompts/lit.md` so it explicitly checks for the final output plus provenance sidecar instead of stopping at an intermediate cited draft.
- Verified: Cross-read the current deepresearch/lit deliver steps after the earlier unattended-run reproductions and confirmed the missing enforcement point was the final on-disk artifact check, not the naming convention itself.
- Failed / learned: This is still prompt-level enforcement rather than a deterministic post-processing hook, so it improves completion reliability but does not provide the same guarantees as a dedicated artifact-finalization wrapper.
- Blockers: I did not rerun a full broad deepresearch workflow end-to-end after this prompt-only hardening because those runs are materially longer and more expensive than the narrow reproductions already used to isolate the earlier deadlocks.
- Next: Commit and push the prompt hardening, then, if needed, add a deterministic wrapper around final artifact promotion instead of relying only on prompt adherence.

### 2026-04-14 09:30 PDT — wsl-login-and-uninstall-docs-pass

- Objective: Fix the remaining WSL setup blocker and close the last actionable support issue instead of leaving the tracker open after the earlier workflow/model fixes.
- Changed: Added a dedicated alpha-hub auth patch helper and tests; extended the alphaXiv login patch so WSL uses `wslview` when available and falls back to `cmd.exe /c start`, while also printing the auth URL explicitly for manual copy/paste if browser launch still fails; documented standalone uninstall steps in `README.md` and `website/src/content/docs/getting-started/installation.md`.
- Verified: Added regression tests for the alpha-hub auth patch, reran `npm test`, `npm run typecheck`, and `npm run build`, and smoke-checked the patched alpha-hub source rewrite to confirm it injects both the WSL browser path and the explicit auth URL logging.
- Failed / learned: This repo can patch alpha-hub's login UX reliably, but it still does not ship a destructive `feynman uninstall` command; the practical fix for the support issue is documented uninstall steps rather than a rushed cross-platform remover.
- Blockers: I did not run a true WSL shell here, so the WSL fix is validated by the deterministic source patch plus tests rather than an actual Windows-hosted browser-launch repro.
- Next: Push the WSL/login pass and close the stale issues and PRs that are already superseded by `main`.

### 2026-04-14 09:35 PDT — review-findings-and-audit-cleanup

- Objective: Fix the remaining concrete issues found in the deeper review pass instead of stopping at tracker cleanup.
- Changed: Updated the `pi-web-access` patch so Feynman defaults search workflow to `none` without disabling explicit `summary-review`; softened the research workflow prompts so only unattended/one-shot runs auto-continue while interactive users still get a chance to request plan changes; corrected uninstall docs to mention `~/.ahub` alongside `~/.feynman`; bumped the root `basic-ftp` override from `5.2.1` to `5.2.2`.
- Verified: Ran `npm test`, `npm run typecheck`, `npm run build`, `cd website && npm run build`, and `npm audit`; root audit is now clean.
- Failed / learned: Astro still emits a duplicate-content-id warning for `website/src/content/docs/getting-started/installation.md`, but the website build succeeds and I did not identify a low-risk repo-side fix for that warning in this pass.
- Blockers: The duplicate-id warning remains as a build warning only, not a failing correctness gate.
- Next: If desired, isolate the Astro duplicate-id warning separately with a minimal reproduction rather than mixing it into runtime/CLI maintenance.

### 2026-04-14 10:55 PDT — summarize-workflow-restore

- Objective: Restore the useful summarization workflow that had been closed in PR `#69` without being merged.
- Changed: Added `prompts/summarize.md` as a top-level CLI workflow so `feynman summarize <source>` is available again; kept the RLM-based tiering approach from the original proposal and aligned Tier 3 confirmation behavior with the repo's unattended-run conventions.
- Verified: Confirmed `feynman summarize <source>` appears in CLI help; ran `node bin/feynman.js summarize /tmp/feynman-summary-smoke.txt` against a local smoke file and verified it produced `outputs/feynman-summary-smoke-summary.md` plus the raw fetched note artifact under `outputs/.notes/`.
- Failed / learned: None in the restored Tier 1 path; broader Tier 2/Tier 3 behavior still depends on runtime/model/tool availability, just like the other prompt-driven workflows.
- Blockers: None for the prompt restoration itself.
- Next: If desired, add dedicated docs for `summarize` and decide whether to reopen PR `#69` for historical continuity or leave it closed as superseded by the landed equivalent on `main`.

### 2026-05-11 09:17 PDT — issue-162-163-runtime-followup

- Objective: Fix the current actionable GitHub reports after the org migration and keep issue checking on a daily repair loop.
- Changed: Updated the `check-new-issues` heartbeat to run daily and attempt actionable fixes; added a final alphaXiv REST fast-search fallback after the removed MCP search tools and `discover_papers`; aliased `@earendil-works/*` Pi runtime imports to the same initialized bundled runtime as `@mariozechner/*`; wired that loader patch into the vendored runtime archive path; bumped Feynman to `v0.2.53`.
- Verified: Focused alpha-hub and Pi extension-loader regression tests passed locally; full `npm test`, `npm run typecheck`, root `npm run build`, `node scripts/prepare-runtime-workspace.mjs`, package dry-run, and website build with Node 24 passed; the packaged runtime archive contains the alphaXiv REST fallback and dual namespace loader aliases; GitHub release `v0.2.53` built all native assets.
- Failed / learned: The previous `v0.2.52` search patch was too narrow because it assumed `discover_papers` was always present when the older search tools disappeared. The first `v0.2.53` publish workflow failed at npm publish with `ENEEDAUTH` after the org move, while GitHub native release assets succeeded.
- Blockers: npm `latest` remains `0.2.52` until the npm trusted publisher is updated for `companion-inc/feynman` or an `NPM_TOKEN` secret is provided.
- Next: Re-run the publish workflow after npm auth is fixed, then report release evidence on issues `#162` and `#163`.

### 2026-05-11 09:50 PDT — packed-install-e2e

- Objective: Run a true packed-install E2E for the latest Feynman runtime fixes.
- Changed: Fixed packed npm installs that hoist dependencies outside Feynman's package root by falling back to the vendored `.feynman/npm` Pi runtime; patched both package-local and vendored runtime node_modules; bumped Feynman to `v0.2.54`.
- Verified: Focused runtime tests, full `npm test`, `npm run typecheck`, root build, runtime workspace prep, packed tarball install into a clean temp prefix/home, `feynman doctor`, prompt launch past Pi resolution, issue-specific installed runtime patch inspection, `node bin/feynman.js --version`, diff whitespace check, and website build with Node 24 passed.
- Failed / learned: The first packed-install E2E showed `feynman --mode json --prompt ...` failed before Pi launch with `Pi CLI not found` because runtime resolution only checked package-local `node_modules`.
- Blockers: npm publishing is still externally blocked until npm trusted publishing or `NPM_TOKEN` is updated for `companion-inc/feynman`.
- Next: Push `v0.2.54`, watch release CI, and rerun npm publish after npm trust/secret access is fixed.

### 2026-04-12 13:20 PDT — capital-france (citation verification brief)

- Objective: Verify citations in the capital-of-France draft and produce a cited verifier brief.
- Changed: Read `outputs/.drafts/capital-france-draft.md`, `notes/capital-france-research-web.md`, and `notes/capital-france-legal-context.md`; fetched the three draft URLs directly; wrote `notes/capital-france-brief.md` with inline numbered citations and a numbered direct-URL sources list.
- Verified: Confirmed the Insee, Sénat, and Élysée URLs were reachable on 2026-04-12; confirmed Insee and Sénat support the core claim that Paris is the capital of France; marked the Élysée homepage as contextual-only support.
- Failed / learned: The Élysée homepage does not explicitly state the core claim, so it should not be used as sole evidence for capital status.
- Blockers: None for the verifier brief; any stronger legal memo would still need a more direct constitutional/statutory basis if that specific question is asked.
- Next: Promote the brief into the final output or downgrade/remove any claim that leans on the Élysée URL alone.

### 2026-04-20 17:25 PDT — gemini-browser-fallback-opt-in

- Objective: Stop `/deepresearch` web search from reaching Chromium cookie access by default after users reported macOS Keychain prompts from Gemini Web fallback.
- Changed: Updated the `pi-web-access` runtime patch so `isGeminiWebAvailable` returns unavailable unless `web-search.json` explicitly sets `geminiBrowser`/`allowBrowserAuth`/`browserAuth` true; changed search status output and docs to report Gemini browser fallback as disabled by default; made `feynman search set` and `feynman search clear` write `geminiBrowser: false`; corrected web-search docs to recommend Exa, Perplexity, or Gemini API keys for `/deepresearch`.
- Verified: Added regression coverage for the browser fallback opt-in patch and status output; ran focused web-access/search-command tests, full `npm test`, `npm run typecheck`, root `npm run build`, and website `npm run build`.
- Failed / learned: Website build still emits duplicate-content-id warnings for docs pages, but it completes; this pass did not address the pre-existing Astro warning.
- Blockers: Did not run a live `/deepresearch` smoke test because the risk being fixed is source-level keychain probing, which is covered by the deterministic `pi-web-access` patch tests.
- Next: Release the runtime patch and answer the security concern by explaining that browser-cookie access is now explicit opt-in rather than the default fallback.

### 2026-05-03 21:19 PDT — github-issues-e2e

- Objective: Read all currently open GitHub issues, separate concrete regressions from feature-scale requests, and finish the scoped fixes with source, CLI, installer, runtime, and RPC verification.
- Changed: Added a reusable `pi-tui` patch that truncates overwide rendered lines with `sliceByColumn` instead of crashing; wired that patch into startup node_modules patching and vendored runtime preparation; added explicit OpenCode skills installer support for `.opencode/skills/feynman` on Unix and PowerShell; synced README, website docs, and public website installer copies; wrote `outputs/.plans/github-issues-e2e.md` as the run ledger.
- Verified: Checked current Pi and OpenCode docs through Context7; confirmed latest upstream `pi-tui` still has the terminal-width throw so upgrading alone would not fix `#148`; ran focused patch/installer tests, full `npm test` (146 tests), `npm run typecheck`, root `npm run build`, and website `npm run build`; ran `node scripts/prepare-runtime-workspace.mjs` and extracted `.feynman/runtime-workspace.tgz` to verify the packaged `pi-tui` patch and `pruneVersion: 5`; smoke-tested `feynman --help`, `feynman search status`, and `--mode rpc` with a temp custom model plus JSONL `get_state`.
- Failed / learned: A direct CLI smoke with `/usr/local/bin/node` failed because that shell resolves Node `20.17.0`, below Feynman's `>=20.19.0` floor; rerunning with the bundled supported Node `24.14.0` passed. The first RPC smoke from the repo cwd loaded project-local optional packages and hit the existing `pi-web-access` source parse issue, so the accepted RPC smoke used an isolated `--cwd` and temp settings to test the RPC protocol itself.
- Blockers: Issues `#135`-`#139` are larger provider/runtime backend feature proposals, not safe one-pass bug fixes; they were read and classified but not implemented here.
- Next: Close or respond to `#148` and `#143` with the shipped fixes and test evidence, then decide separately whether the provider/runtime proposals belong in a roadmap issue or implementation specs.

### 2026-05-03 23:40 PDT — pi-upstream-alignment

- Objective: Keep Feynman as a thin wrapper over upstream Pi runtime behavior while preserving the curated package stack and Feynman research/theme surface.
- Changed: Upgraded direct Pi packages to `@mariozechner/pi-ai@0.72.1` and `@mariozechner/pi-coding-agent@0.72.1`; restored the curated core package stack with `@devkade/pi-opentelemetry`; extended `pi-web-access` patches for current upstream `gemini-web-config.ts` and older `gemini-web.ts`; wired `pi-web-access` and `pi-tui` patches into the vendored runtime archive path; bumped runtime archive `pruneVersion` to `6`; documented the run in `outputs/.plans/pi-upstream-alignment.md`.
- Verified: Ran Context7 against current Pi docs; ran `npm test` (147 tests), `npm run typecheck`, root `npm run build`, and website `npm run build`; rebuilt `.feynman/runtime-workspace.tgz` with bundled Node `24.14.0`; extracted the archive and verified the packaged `pi-tui`, `pi-web-access`, and manifest patches; ran live one-shot prompts via stored Anthropic OAuth and received `OK` and `42`; reran `feynman model list` and confirmed Anthropic models; ran isolated RPC `get_state` successfully with a temp custom model; ran `feynman search status` and confirmed Gemini browser fallback remains disabled.
- Failed / learned: The packaging script initially omitted the `pi-web-access` patch path, so the local installed package was fixed but the release archive was not; wiring the patch into `prepare-runtime-workspace.mjs` fixed the packaged path. No env API keys were present for OpenAI, Anthropic, Gemini, Google, Exa, Perplexity, Mistral, or OpenRouter, so live non-Anthropic provider/API-search checks remain blocked.
- Blockers: Live web search through Exa/Perplexity/Gemini API could not be tested without keys; browser-cookie Gemini fallback is intentionally disabled by default. `/usr/local/bin/node` remains below Feynman's Node floor, so supported runtime smokes used the bundled Node.
- Next: Review/stage the intended subset, then split unrelated pre-existing local changes if needed before commit/release.

### 2026-05-04 01:45 PDT — pi-thin-wrapper-live-e2e

- Objective: Finish the Pi-thin-wrapper cleanup with local credentials, live providers, RPC, and packaged runtime verification instead of relying only on unit tests.
- Changed: Removed the Feynman-only Anthropic model overlay so `createModelRegistry` now trusts upstream Pi's model catalog; moved the `pi-web-access` `/search` to `/web-results` rename into the shared patch path so local and archived runtimes match; removed the stale Google legacy schema patch that no longer matches `@mariozechner/pi-ai@0.72.1`.
- Verified: Used local credentials without printing secret values; live Feynman one-shots passed for Anthropic OAuth, Anthropic API key, OpenAI API key, Gemini API key, and OpenRouter API key; direct `pi-web-access` smokes passed for Exa no-key MCP fallback and Gemini API search; Perplexity correctly reported unavailable because no key was found; final RPC `get_state` and `get_available_models` passed through `feynman --mode rpc`; rebuilt and extracted `.feynman/runtime-workspace.tgz` and verified packaged `web-results`, `FEYNMAN_WEB_SEARCH_CONFIG`, Gemini browser opt-in aliases, escaped Gemini messaging, `pi-tui` truncation, `pruneVersion: 6`, Pi `0.72.1`, and `@devkade/pi-opentelemetry`; ran full `npm test` (144 tests), `npm run typecheck`, root `npm run build`, and website `npm run build` with the bundled Node `24.14.0`.
- Failed / learned: OpenCode OAuth stores for Anthropic, Google, and OpenAI were expired, while usable API keys existed in project env files; the first OpenAI final sentinel used hyphens while also asking for no punctuation, so the model removed the hyphens and the smoke was rerun with `OAIFINALOK`; Perplexity remains blocked by no local key.
- Blockers: No Perplexity live API check until a real `PERPLEXITY_API_KEY` is provided; `/usr/local/bin/node` is still `20.17.0`, below Feynman's runtime floor.
- Next: Stage the intended repo changes, keep the Feynman theme/package stack, and avoid adding provider aliases or runtime patches unless they are backed by upstream gaps plus packaged-runtime tests.

### 2026-05-04 19:46 PDT — telemetry-noise-removal

- Objective: Remove the default OpenTelemetry package from Feynman so local and public TUI sessions do not show telemetry status noise or invite end-user telemetry setup by default.
- Changed: Removed `@devkade/pi-opentelemetry` from the bundled package stack and user-facing docs; removed default OTEL service env injection; kept a legacy settings prune path so existing default installs that only gained telemetry from the curated stack are normalized back to the current core package list; added startup pruning for stale bundled-package symlinks so upgrades remove the old `@opentelemetry` links from Feynman's managed npm prefix.
- Changed: Reviewed open GitHub issues and PRs, folded in the useful parts of PRs `#133`, `#144`, and `#149`, and left PR `#141` unmerged because the local `geminiBrowser` opt-in path is stricter and already patched into the vendored runtime.
- Verified: Ran `npm test` (150 tests), `npm run typecheck`, root `npm run build`, and website `npm run build`; repacked and globally installed `@companion-ai/feynman@0.2.40`; confirmed the packaged tarball and active settings contain no telemetry package; confirmed the installed startup path removes leftover `@opentelemetry` symlinks; ran a live one-shot through the installed CLI, RPC `get_state`/`get_available_models`, direct Gemini API web search, and an actual TUI launch with no `otel active` footer.
- Failed / learned: Historical changelog entries still mention earlier telemetry verification because those entries describe past runs; the first stale-link check ran before `feynman status` had finished, so it still saw old links until the newly installed startup pruning executed.
- Blockers: None for source removal.
- Next: Commit and push the validated cleanup.

### 2026-05-05 22:17 PDT — rpc-package-sync-fix

- Objective: Re-test the shipped issue fixes through the real installed/RPC path after discovering `v0.2.41` had not been exercised deeply enough.
- Changed: Added an embedded Pi package-manager patch so runtime npm installs include `--legacy-peer-deps`; wired it into packaged runtime preparation; bumped Feynman to `v0.2.42`; documented the release.
- Verified: Reproduced the `v0.2.41` RPC startup failure in the real release binary from the repo cwd: Pi attempted project package sync for `@aliou/pi-processes` and failed on peer dependency resolution before RPC could complete. After the patch, local `0.2.42` RPC accepted a JSONL `prompt`, streamed `Feynman RPC OK`, emitted `turn_end`, and emitted `agent_end`.
- Failed / learned: Running `feynman --mode rpc "prompt"` is not a valid deep RPC smoke; the actual protocol requires JSON-line commands on stdin and keeping stdin open.
- Blockers: Need push `v0.2.42`, wait for native release assets, then re-run the same RPC smoke against the released native asset before closing this loop.
- Next: Commit, push, verify CI/native release, and test the released `v0.2.42` asset end to end.

### 2026-05-09 18:38 PDT — issue-158-160-runtime-sweep

- Objective: Address the current open tracker items rather than only the already-shipped package-peer fix.
- Changed: Added top-of-prompt tool discipline to every workflow; extended the Pi agent-core runtime patch to normalize common hallucinated tool aliases (`search_web` to `web_search`, bare `fetch` / `WebFetch` / `read_url_content` to `fetch_content`); patched bundled alpha-hub search to fall back to `discover_papers` when alphaXiv removes older search tool names; seeded bundled runtime packages before package updates; included `typebox` plus both legacy `@mariozechner/*` and current `@earendil-works/*` Pi runtime peers; applied the Windows docker-probe fix from PR `#157`; bumped to `v0.2.52`.
- Verified: `npm test`, `npm run typecheck`, `npm run build`, root and website production `npm audit`, website typecheck/build, `feynman doctor`, `feynman update`, `npm pack --dry-run`, and runtime archive extraction all passed. The installed Feynman prefix now has bundled links for `typebox` and `@earendil-works/pi-coding-agent`.
- Failed / learned: The public alphaXiv MCP docs still list the older search tools, but issue `#159` reports a live authenticated tools/list response with only `discover_papers`; the fix therefore keeps old-tool calls first and only falls back on specific `Tool ... not found` failures. The comment on issue `#160` cited old `pi-btw` / `pi-markdown-preview` versions, but the current npm tarballs are the ones importing `@earendil-works/*`, so the repair path covers both namespaces.
- Blockers: Push/release and GitHub issue/PR comments are still pending in this run.
- Next: Commit, push `v0.2.52`, wait for the publish workflow, then close/comment the resolved tracker items with exact release evidence.

### 2026-06-08 22:20 PDT — issue-update-sweep

- Objective: Bring Feynman up to date, fold in actionable current GitHub issue/PR fixes, and set up a once-daily repo sweep.
- Changed: Updated root and website dependencies/overrides to current safe in-range versions; made launch-time runtime patching cover package-local and vendored alpha-hub, pi-web-access, pi-subagents, and Pi package-manager modules; added current `pi-subagents@0.28.0` `src/...` patch targets; made normal interactive `feynman` launches pass Pi `--continue` while `--new-session`, RPC/JSON, and prompt/workflow launches stay fresh; switched Windows URL opening to `explorer`; made package installs prefer adjacent `npm-cli.js` on Windows; added MiniMax-M3 to research model preferences; updated regression coverage.
- Verified: `npm install` in root and `website/` reported zero vulnerabilities; `npm test` passed 177 tests; `npm run typecheck`, root `npm run build`, root and website `npm audit --omit=dev`, website `npm run typecheck`, website `npm run build`, and `npm pack --dry-run` all passed. `npm pack --dry-run` rebuilt and included `.feynman/runtime-workspace.tgz`.
- Failed / learned: GitHub issue `#171` has only a title and no reproduction/body, so it remains evidence-blocked rather than patched speculatively. `npm outdated` still reports only major-version jumps outside declared ranges: root `@types/node@25`, and website ESLint/Globals/TypeScript majors.
- Next: Review/stage the intended changes, decide whether to release/comment on issues `#167`-`#173`, and handle `#171` only after a reproducible ByteString source is available.

### 2026-06-08 23:50 PDT — opencode-pi-hermes-sweep

- Objective: Re-check the broader OpenCode, OpenClaw, Pi, and Hermes references before calling the repo current.
- Changed: Promoted OpenCode Zen and OpenCode Go to first-class Feynman model recommendations and provider ordering; centralized settings/model recommendation selection; migrated direct Pi imports and dependencies to `@earendil-works/*@0.74.2`; kept legacy `@mariozechner/*` compatibility through runtime aliases; updated runtime path resolution, patching, embedded patching, pruning, and runtime workspace preparation for both package scopes; updated regression coverage.
- Verified: Official OpenCode docs, Context7 docs lookup, local OpenClaw provider/Hermes migration docs, Pi package docs/registry, npm dist-tags, local Hermes status, live GitHub issues `#167`-`#172`, PRs `#173`-`#175`, and latest `main` GitHub Actions status were checked. Focused model/runtime tests passed 72 tests; full `npm test` passed 184 tests; root typecheck/build/audit, website lint/typecheck/build/audit, `npm pack --dry-run`, runtime archive inspection, `node bin/feynman.js --version`, `doctor`, `search status`, `packages list`, `update`, native bundle build, and extracted native launcher `--version`/`--help` all passed. Direct live/tool smokes passed for patched alphaXiv search and parallel `web_search` with `includeContent: true`.
- Failed / learned: The first runtime archive manifest inspection used the wrong path and was rerun successfully against `npm/.runtime-manifest.json`. Latest Pi `0.79.0` requires Node `>=22.19.0`, so Feynman remains on the `legacy-node20` dist-tag while it declares Node `>=20.19.0 <25`.
- Next: Decide separately whether to raise Feynman's Node floor and move Pi to the latest `0.79.x` line; otherwise stage/release the Node 20-compatible sweep and close/comment the covered tracker items with the validation evidence.

### 2026-06-11 — open-issue fix sweep and v0.2.59 prep

- Objective: Fix all open GitHub issues (#167-#172, #177), test, and release.
- Changed: Patched alpha-hub's `parsePaperSearchResults` to handle the structured JSON payloads alphaXiv search tools now return (#167 — the MCP tools work; the old numbered-text parser silently dropped every result). Closed three web_search hang holes (#169): cancel-then-assign on the shared `pendingCurate` slot so a clobbered parallel curate session resolves instead of leaking (pi-agent-core's Promise.all otherwise withholds every toolResult in the batch), a 90s deadline around each search() call in both execute loops, and a 2-minute browser-connect deadline in the curator watchdog (previously `if (!browserConnected) return` skipped never-connected sessions forever). Made `scripts/check-node-version.mjs` warn-and-continue on too-new Node so npm upgrades stop rolling back and pinning users to old releases (#177); the bin/feynman.js runtime gate still blocks with instructions. Added `src/system/self-update.ts` + a `feynman update` notice when a newer CLI release exists on the registry, with install-type-specific upgrade command. Staged the prior uncommitted sweep (earendil scope migration, pi-subagents src/ patch targets for #172, Windows npm-cli.js spawn for #170, `--continue` resume for #168).
- Verified: 192 tests pass, typecheck, build. Live smokes: all five alpha_search modes return 10 results through the patched parser and end-to-end through the model (RESULT_COUNT=10); two parallel web_search toolCalls with includeContent:true returned toolResults and the turn completed; `feynman update`, `doctor`, `--version` clean; patches apply idempotently to the installed workspace sources and parse as TS.
- Failed / learned: Issue #171 (ByteString 20320 on Chinese Windows) is still evidence-blocked — title-only issue, no stack trace; no header construction in Feynman/alpha-hub/pi-web-access uses OS-identity or user strings, so the throw site is unknown. Asked the reporter for the full trace rather than patching speculatively.
- Next: Push, watch publish workflow for v0.2.59, then comment on the fixed issues with release evidence.

### 2026-06-11 (later) — Node 25, #171 root cause, multi-OS e2e

- Objective: Finish the "fix everything, test everything end to end" pass — verify the Windows fixes on real Windows machines, support Node 25, and root-cause #171.
- Changed: Raised MAX_NODE_MAJOR to 25 / engines to <26 after the full suite and live CLI smokes passed on Node 20.20.2, 24.14.0, and 25.9.0 locally. Reproduced #171 deterministically: a models.json custom provider header containing Chinese characters produces undici's ByteString error verbatim; added scripts/lib/pi-model-registry-patch.mjs which validates header values and API keys at request assembly in Pi's getApiKeyAndHeaders and throws an error naming the provider, header, index, and code point. Added .github/workflows/e2e.yml (workflow_dispatch): installs the published package on ubuntu/macos/windows runners at Node 24 and 25, asserts launch-time patches applied (#167, #172 sources), and runs live model + subagent smokes via an OPENAI_API_KEY repo secret.
- Verified: 194 tests on Node 24 and 25 (192 on Node 20 before the new tests), typecheck/build, live repro before/after shows the cryptic error replaced by the actionable one, clean-provider smoke unaffected. Daytona was considered for Windows access but no API keys exist on this machine and Daytona sandboxes are Linux; GitHub Actions windows-latest runners are the Windows machines.
- Next: Push v0.2.60, dispatch the e2e workflow against the published version, comment on #171/#177 with results.

### 2026-06-11 (e2e findings) — Windows workspace extraction and npm spawn fixes

- Objective: Act on the first multi-OS e2e run's findings.
- Changed: The e2e run proved install/version/update pass on real Windows (Node 24+25) but caught two live Windows bugs in scripts/patch-embedded-pi.mjs: tar extraction of runtime-workspace.tgz fails because GNU tar parses "C:\..." as a remote host, and the npm fallback spawns bare "npm" without a shell (EINVAL) — together these produced the "[feynman] npm failed while setting up bundled packages" loop from #177/#170 reports. Fixed by extracting with cwd-relative paths and invoking npm via the shared scripts/lib/npm-command.mjs helper (node + npm-cli.js); package-ops.ts now imports the same helper. Also patch the workspace alpha-hub copy at launch and tightened the e2e workflow assertions to require the patch on every existing copy.
- Verified: 194 tests, typecheck, build, pack includes the new lib files, bsdtar relative extraction sanity-checked locally.
- Next: Release v0.2.61, re-run e2e workflow, expect all 5 matrix jobs green.

### 2026-06-11 (Pi 0.79 upgrade) — runtime modernization sweep

- Objective: Update everything — Pi runtime to latest, prune dead code/deps, keep e2e green.
- Changed: Pi 0.74.2 → 0.79.1 (all four packages, direct deps now include pi-agent-core/pi-tui/undici; dropped unused dotenv). Node floor 20.19 → 22.19 (Pi requirement; Node 20 is EOL), cap stays 25. OAuth login gained onDeviceCode/onSelect handlers for Pi's new callback contract. pi-tui editor patch rebuilt for the 0.76+ Unicode rework: dual import anchors, upstream IME fix (emitCursorMarker = focused) folded in, and an unknown-layout guard so a future import change can never again produce a render that references an unimported helper. Deleted pi-package-manager-patch (upstreamed in Pi 0.76 as getNpmInstallArgs --legacy-peer-deps). PI_RUNTIME_FALLBACK_VERSION 0.79.1. Model-recommendation tests updated for the 0.79 catalog (opus-4-8, MiniMax-M3). e2e matrix gained ubuntu/node 22. Website in-range dep updates. Kept the extension-loader alias halves (self-deactivating, still cover mixed-scope transitions) and the @mariozechner aliases (upgrade path).
- Verified: 192 tests/typecheck/build/pack on Node 24; tests also green on Node 22 floor logic and 25; workspace rebuilt at 0.79.1; live smokes on 0.79.1 (alpha_search=10, parallel web_search BOTH_OK, subagent SUBAGENT_DONE); patched editor exercised directly via render harness (placeholder/text/narrow/unfocused — no ReferenceError); project-trust audit: headless runs default untrusted without prompting, explicit --extension unaffected.
- Failed / learned: pi-tui 0.76 changed the editor import line, which made the old patch half-apply (render rewritten, import missing) — patches that rewrite a body must fail closed when their import anchor is unknown. Pi upstreamed our --legacy-peer-deps patch in 0.76 (#4907).
- Next: Push v0.3.0, watch publish, dispatch e2e (now incl. node 22), update memory.

### 2026-06-12 — deep e2e in Daytona + remaining upgrades

- Objective: Test everything in depth myself; upgrade what remained.
- Changed: Website dev majors (eslint 10.4, @eslint/js 10, globals 17, typescript 6.0) after dropping the stale global brace-expansion@1.1.13 override that forced the v1 API onto eslint's minimatch (CVE fixed in-range on both major lines; audit clean). publish.yml artifact actions v4 → upload v7 / download v8. e2e workflow: auth fixture corrected to Pi's `type: "api_key"` (was "key", which AuthStorage silently ignores) and a text-mode model smoke added — json mode tolerates a malformed credential, text/interactive does not, so CI previously could not catch interactive auth breakage.
- Verified (Daytona clean-room, published 0.3.0): interactive TUI via tmux — patched editor rendered, typed prompt answered, token/cost status bar live; `/quit` + relaunch resumed the session (model recalled a number from the prior session, #168 end to end); full `feynman lit` workflow produced outputs/lora-paper.md + provenance record; both npm-global and standalone-installer installs; both json and text one-shot modes. Local: website lint/typecheck/build green on the new majors, 192 root tests pass.
- Failed / learned: my interactive "No API key" scare was my own malformed auth fixture, not a product bug — Pi stores API keys as `type: "api_key"`; json-mode one-shots resolve keys leniently while interactive is strict, which had masked the bad fixture in every earlier CI smoke. Local sandboxed Bash cannot allocate ptys (tmux/script fail) — interactive testing needs the Daytona box.
- Next: Push, verify CI, dispatch e2e with the new text-mode smoke.

### 2026-06-12 — windows-subagent-spawn

- Objective: Root-cause and fix the Windows-only subagent spawn regression in published `@companion-ai/feynman@0.3.0` without pushing.
- Changed: Upgraded the `pi-subagents` `pi-spawn.ts` patch to recover the real Pi CLI from the Feynman wrapper's `argv2` main-module argument when `argv1` is `pi-cli-wrapper.js`; made `pi-cli-wrapper.ts` stamp `FEYNMAN_PI_CLI_PATH` from `piMainPath` if the env var is missing; added regression coverage for fresh and already-patched `pi-spawn.ts` sources.
- Verified: Extracted the published `0.3.0` tarball and runtime workspace into `/tmp/codex-172`, wrote `/tmp/codex-172/FINDINGS.md`, confirmed the earlier green Windows run was actually `0.2.61` while the failing run was `0.3.0`, ran focused patch/runtime tests (32 passed), full `npm test` (194 passed), `npm run typecheck`, and `git diff --check`.
- Failed / learned: The exact first trigger that bypassed `FEYNMAN_PI_CLI_PATH` inside the Windows child is not directly logged; the proven failure is wrapper invocation without the required Pi main-module argument, causing `--mode` to be imported as a module path.
- Next: Review/stage the intended fix, then publish and rerun the Windows e2e smoke from the released package.

### 2026-06-12 (codex-assisted) — Windows subagent spawn recurrence fixed (v0.3.1)

- Objective: Root-cause the Windows-only return of the #172 --mode failure caught by the e2e run on 0.3.0.
- Changed: Dispatched the investigation to codex (gpt-5.5 xhigh) with a full spec; it audited the published 0.3.0 tarball + runtime workspace and proved the defect: with FEYNMAN_PI_CLI_PATH absent/unusable in the child, pi-spawn skips the wrapper argv1 but the fallback chain can still land back on the wrapper without the Pi main path. Fix (codex, reviewed here): pi-spawn now derives cli.js from argv[2] (the real Pi main module the wrapper was launched with) when argv1 is the wrapper, and pi-cli-wrapper.ts self-heals FEYNMAN_PI_CLI_PATH from its piMainPath. I caught and fixed one flaw in codex's patch: the SpawnDeps argv2 interface insertion wasn't idempotent (re-appended on every launch); guarded + regression test added. Also corrected the record: the "passing 0.3.0" comparison run was actually 0.2.61 — and the earlier 0.3.0 e2e pass on Windows used the malformed auth fixture, so its subagent smoke was weaker evidence than it appeared.
- Verified: 195 tests, typecheck, build; patch applies idempotently to the live workspace source; e2e workflow on 0.3.1 (esp. windows subagent smoke) is the deterministic gate.
- Failed / learned: codex exec hangs without stdin EOF in background shells — pipe the spec via stdin. Patch modules that append interface members must guard against re-application.

### 2026-06-12 (evidence-driven) — npm-global patch root closes #172 for real (v0.3.2)

- Objective: Kill the recurring Windows --mode failure with runtime evidence instead of theory.
- Changed: CI instrumentation (console.error injected into getPiSpawnCommand on the runner) proved the patched pi-spawn NEVER EXECUTES on Windows — "NO DIAG LINES". The executing copy is Pi's user-scope package root at ~/.feynman/npm-global/lib/node_modules/pi-subagents: a symlink into the patched workspace on macOS/Linux, but a real unpatched directory on Windows when junction creation falls back or `feynman update` reinstalls. Added that root to patchPiRuntimeNodeModules (now takes feynmanAgentDir) and to patch-embedded-pi's pi-subagents loop (realpath-deduped so the symlinked case isn't double-patched). Also shipped codex's agents.ts userDir repair + transactional patch groups, and hardened the e2e subagent smoke to require RESULT=PONG relayed from the child.
- Verified: 197 tests/typecheck/build; launcher patches the npm-global copy locally; local subagent returns RESULT=PONG live.
- Failed / learned: three releases patched the right code in the wrong place — the lesson is to instrument the failing runtime and let it tell you WHICH file executes before patching anything. CI asserts that check "a patched copy exists" are weaker than "the loaded copy is patched".

### 2026-06-18 — paper-rank-ai-researcher model synthesis handoff

- Objective: Continue the PaperRank AI-researcher workflow toward model-backed synthesis while preserving deterministic evidence and auditability.
- Changed: Added default `<slug>-synthesis-packet.json` and `<slug>-synthesis-prompt.md` artifacts, `--synthesis-top`, and optional `--synthesize` model synthesis that writes `<slug>-model-synthesis.md`. The model bridge now uses Feynman's recommended available research model by default instead of inheriting a stale chat default; `--synthesis-model` or `--model` still explicitly overrides it. Added default `<slug>-score-audit.md` so each paper has user-readable component scores, normalized applied weights, contribution math, field role, critique status, source excerpts, missing evidence, and rubric checks. The packet includes ranked-paper score explanations, field roles, critique summaries, rubric gaps, bounded source-span excerpts, source references, and verification limits while omitting raw full-text bodies. The report, memo, dashboard, provenance, CLI JSON summary, README, website docs, release notes, and plan now expose the model handoff and score-audit state.
- Verified: Focused PaperRank/root test run passed 216 tests, including bounded packet/prompt assertions, deterministic injected model-synthesis artifact generation, CLI fixture E2E, and raw full-text omission checks. After the stale-default bug was caught, `npm test -- tests/model-harness.test.ts tests/paper-rank.test.ts` passed 217 tests with a regression asserting no-explicit-model synthesis resolves to `openai/gpt-5.5` instead of stale `openai/gpt-4.1-mini`. After the score-audit addition, `npm test -- tests/paper-rank.test.ts` passed 217 tests with assertions for the score-audit artifact, applied weights, contribution math, why-rank section, rubric checks, report/dashboard/provenance links, CLI JSON path, and raw full-text omission. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. A live no-explicit-model `feynman rank "mechanistic interpretability sparse autoencoders" --limit 2 --source-fixture tests/fixtures/openalex-rank.json --synthesize --json` smoke generated model synthesis from `openai/gpt-5.5`, wrote packet/prompt/model-synthesis artifacts, and omitted raw full text from the synthesis packet. A live OpenAlex/alphaXiv `feynman rank "mechanistic interpretability sparse autoencoders" --limit 3 --expand-citations 1 --full-text-top 1 --critique-top 2 --synthesis-top 3 --json` smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full text available, 2 critiques, and a score-audit artifact with applied weights, contribution math, why-rank, rubric checks, source evidence, report/dashboard/provenance links, and no raw full-text field.
- Next: Consider a richer interactive graph exploration surface or empirical score calibration against real researcher read-order decisions.

### 2026-06-18 — paper-rank-sensitivity

- Objective: Make PaperRank show whether the read order is robust to the scoring weights rather than treating the default weight vector as absolute.
- Changed: Added default `<slug>-rank-sensitivity.json` with balanced, influence-heavy, method/reproducibility-heavy, frontier-heavy, and topic-heavy profiles. The artifact reruns the same score signals with the same missing-component normalization, records per-profile rank/score/applied weights, rank range, score range, stable/sensitive/volatile labels, and drivers for each paper. The report, research memo, dashboard, provenance, CLI JSON summary, README, website docs, release notes, and plan now expose rank-sensitivity state.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 218 tests with fixture assertions for sensitivity generation, profile counts, per-paper profile ranks, report/dashboard/provenance links, JSON summary counts/path, and raw full-text omission. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Live OpenAlex/alphaXiv smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full text available, 2 critiques, 5 sensitivity profiles, 3 sensitivity papers, report/dashboard/provenance sensitivity links, score-audit contribution math, and no raw full-text leakage. A no-explicit-model synthesis smoke generated with `openai/gpt-5.5`, wrote model synthesis plus sensitivity artifacts, and omitted raw full text.
- Next: Consider a richer interactive graph exploration surface or empirical score calibration against real researcher read-order decisions.

### 2026-06-18 — paper-rank-score-calibration

- Objective: Make PaperRank distinguish uncalibrated product weights from empirically checked read-order preferences.
- Changed: Added always-written `<slug>-score-calibration.json`, `--calibration-fixture`, and `FEYNMAN_RANK_CALIBRATION_FIXTURE`. The fixture accepts `rankedPaperIds` and pairwise `preferences`, derives pairwise order checks, evaluates default and sensitivity-profile agreement rates, counts out-of-run preferences as ignored, and records `not_provided` when no fixture exists. Report, research memo, dashboard, provenance, CLI JSON summary, README, website docs, release notes, command metadata, and plan now expose calibration status.
- Verified: `npm test -- tests/paper-rank.test.ts` passed 220 tests with fixture assertions for evaluated calibration, default agreement, ignored preferences, CLI `--calibration-fixture`, default `not_provided` artifact state, report/dashboard/provenance links, JSON summary counts/path, and raw full-text omission. `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Live OpenAlex/alphaXiv calibration smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full text available, 2 critiques, calibration status `insufficient_overlap`, 7 ignored preferences, report/dashboard/provenance calibration links, and no raw full-text leakage.
- Next: Collect real researcher read-order fixtures for empirical weight learning or build a richer interactive graph exploration surface.

### 2026-06-18 12:18 PDT — paper-rank-graph-explorer

- Objective: Make the citation graph inspectable as an AI-researcher surface rather than only a static dashboard snapshot or JSON artifact.
- Changed: Added default `<slug>-graph-explorer.html` with searchable/filterable seed and expanded graph nodes, clickable citation graph nodes, paper detail panel, local citation links, source URLs, score summaries, field roles, critique verdicts, graph degree/PageRank values, and explicit limits. Wired the artifact into report, dashboard, provenance, CLI output/JSON artifacts, README, website docs, release notes, command metadata, tests, and the durable PaperRank plan. The explorer embeds bounded graph metadata and omits raw full-text bodies.
- Verified: `node --import tsx --test --test-concurrency=1 tests/paper-rank.test.ts` passed 19 tests with graph-explorer artifact/path/link/no-raw-full-text assertions. `npm test` passed 220 tests; `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Live OpenAlex/alphaXiv smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full text available, 2 critiques, calibration status `insufficient_overlap`, explorer/report/dashboard/provenance links present, and no raw full-text leakage. Chrome headless opened the generated explorer and verified search/filter/click-detail interaction over 16 graph nodes. A no-explicit-model synthesis smoke generated with `openai/gpt-5.5`, wrote model synthesis plus graph explorer, and kept raw full text out of the synthesis packet and explorer.
- Next: Collect real researcher read-order fixtures for empirical weight learning and use them to decide whether PaperRank should alter its default weight profiles.

### 2026-06-18 12:27 PDT — paper-rank-calibration-template

- Objective: Give PaperRank a safe path from transparent scoring hypotheses to empirical researcher read-order data.
- Changed: Added default `<slug>-calibration-template.json` and `<slug>-calibration-guide.md`. The template uses the same `source`, `rankedPaperIds`, and `preferences` fields consumed by `--calibration-fixture`, but leaves `rankedPaperIds` and `preferences` empty by default so an unchanged template cannot validate PaperRank against its own order. It includes candidate paper summaries and pairwise questions for data collection. The guide explains how to fill the fixture and re-run calibration. Report, dashboard, provenance, CLI output/JSON artifacts, README, website docs, release notes, command metadata, tests, and the durable plan now expose the calibration handoff.
- Verified: `node --import tsx --test --test-concurrency=1 tests/paper-rank.test.ts` passed 19 tests with calibration-template and calibration-guide artifact/path/link/schema/empty-field/pairwise/no-raw-full-text assertions. `npm test` passed 220 tests; `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. Live OpenAlex/alphaXiv smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full text available, 2 critiques, calibration status `insufficient_overlap`, an empty-safe calibration template with 3 candidate papers and 2 pairwise questions, calibration guide instructions, report/dashboard/provenance links, and no raw full-text leakage.
- Next: Collect filled researcher preference fixtures across multiple topics and use them to compare or recommend topic-specific weighting profiles.

### 2026-06-18 12:40 PDT — paper-rank-replication-plan

- Objective: Turn PaperRank from read-order triage into an actionable AI-researcher workflow that tells the user what to verify next.
- Changed: Added default `<slug>-replication-plan.md`. The plan turns ranked papers, reviewer concerns, rubric gaps, source-span markers, field roles, rank sensitivity, calibration status, graph context, and model-synthesis state into priority reproduction targets, evidence already found, checks to perform, acceptance criteria, artifact pointers, and cross-paper verification gates. Report, dashboard, provenance, CLI output/JSON artifacts, README, website docs, release notes, command metadata, tests, and the durable plan now expose the replication plan. The artifact explicitly says it is not a completed replication and omits raw full-text bodies.
- Verified: `node --import tsx --test --test-concurrency=1 tests/paper-rank.test.ts` passed 19 tests with replication-plan artifact/path/link/content/no-raw-full-text assertions. `npm test` passed 220 tests; `npm run typecheck`, `npm run build`, website lint/typecheck/build, `npm pack --dry-run`, and `git diff --check` passed. CLI help shows the replication-plan description. Live OpenAlex/alphaXiv/model-synthesis smoke returned 3 ranked papers, 16 graph papers, 13 expanded papers, 1/1 full text available, 2 critiques, synthesis status `generated` with `openai/gpt-5.5`, calibration status `insufficient_overlap`, replication-plan report/dashboard/provenance links, priority targets, acceptance criteria, cross-paper checks, and no raw full-text leakage.
- Next: Use filled preference fixtures and completed reproduction notes to decide whether PaperRank should recommend topic-specific weight profiles or schedule actual replication runs.

### 2026-06-20 08:13 PDT — posthog-telemetry

- Objective: Create a Feynman PostHog project and route useful analytics, logs, and traces into it.
- Changed: Created PostHog workspace/project `Feynman` with project ID `478873` after the existing Companion org hit its 6-project limit. Added first-party telemetry in `src/telemetry/posthog.ts`: `posthog-node` events, OpenTelemetry logs, OpenTelemetry traces, CLI command lifecycle events, PaperRank run events, PaperRank model-synthesis events, hashed error metadata, and Pi child OTLP env propagation. Telemetry avoids raw prompts, rank topics, filesystem paths, paper text, and model prompt bodies.
- Verified: `npm run typecheck`, focused telemetry/runtime tests, `npm run build`, and `npm test` passed with 234 tests. Live fixture smoke wrote a PaperRank result with temp `FEYNMAN_HOME`. PostHog Activity showed `feynman_command_started`, `feynman_paperrank_started`, `feynman_command_completed`, and `feynman_paperrank_completed`; Logs showed the Feynman command/PaperRank log messages; Tracing showed `feynman.cli.command` and `feynman.paperrank.run` spans with OK status.
- Next: Add model-synthesis cost/token properties only after the model layer exposes reliable usage numbers.

### 2026-06-20 10:37 PDT — posthog-companion-project

- Objective: Move Feynman telemetry into the existing Companion PostHog organization and clean up the stale project slot.
- Changed: Put stale Companion PostHog project `prod` (`169469`) into PostHog pending-deletion state after verifying it was superseded by active projects. Renamed `Companion Web` (`389330`) to `Companion`, `Companion Web Staging` (`391525`) to `Companion Staging`, and `Companion Web Dev` (`391691`) to `Companion Dev`; project IDs and tokens are unchanged. Created `Feynman` inside the Companion organization as project `479027` and repointed Feynman defaults from the temporary standalone project `478873` to `479027`.
- Verified: PostHog project-list API showed the renamed Companion projects and new Companion-org `Feynman` project. `prod` loaded `Project Pending Deletion` after confirmation. `npm run typecheck`, focused telemetry/Pi tests, `npm run build`, and `npm test` passed with 234 tests. Live fixture smoke emitted into project `479027`; PostHog showed Feynman event definitions/events, 4 logs, and 2 OK spans for `feynman-cli`.

### 2026-06-20 11:18 PDT — posthog-pi-otel

- Objective: Wire Pi plugin/runtime observability through an existing Pi telemetry package instead of a custom Feynman extension.
- Changed: Added `pi-otel` to the core Pi package set and bundled settings; configured Pi child env for PostHog's AI OTLP endpoint with metadata-only content capture; kept first-party Feynman events/logs/traces on the existing PostHog project defaults.
- Verified: `npm run typecheck`, `npm run build`, and full `npm test` passed with 236 tests. Rebuilt/checked the vendored runtime archive and verified bundled `pi-otel` has a Pi extension manifest plus no `pi.cwd`/cwd attributes. A live bundled-extension smoke wired `pi-otel` to PostHog AI OTLP with `metadata_only` capture, then PostHog AI Observability showed trace `067f310b5c0b579459c57407eaed45de` with `pi.interaction`, `pi.turn`, `pi.llm_request`, and `pi.tool.read_file`; trace detail/raw views did not contain the smoke prompt/output/tool/path sentinel strings or `pi.cwd`. A normal fixture `rank` smoke emitted fresh Activity events, Logs, and Tracing spans in project `479027`. Follow-up audit narrowed the `pi-otel` patch from a broad HTTPS bypass to a `probeEndpoint()` default-port fix, rebuilt the runtime archive, and verified trace `fa86a360ccd9a5d9eec6d5b10f17c85a` with raw privacy checks clean.
- Next: Delete the temporary standalone Feynman organization/project only after an explicit confirmation, since project deletion is irreversible and the code no longer points to it.

### 2026-06-22 01:14 PDT — telemetry-off-and-readback

- Objective: Verify the PostHog route after the reference audit and close the inherited-telemetry leak when telemetry is disabled.
- Changed: `getPostHogOtelEnv()` now clears Feynman/PostHog, generic OTLP, Pi OTel, and OTel service env keys before returning child-process telemetry env. When `FEYNMAN_TELEMETRY=off`, Pi child processes no longer inherit a parent shell's private collectors or content-capture settings.
- Verified: Focused telemetry/runtime tests passed 31/31. A live smoke emitted `feynman_telemetry_smoke` into PostHog project `479027`; HogQL read-back with a personal key returned that event at `2026-06-22T08:04:27.907Z`. The same smoke emitted one PostHog log row at `2026-06-22T08:04:27.468Z` for service `feynman-cli-smoke` with body `feynman telemetry smoke`. Querying the project token against the private HogQL API returned `403 authentication_failed`, matching PostHog's private-API boundary; the local CLI credential returned `permission_denied` for project `479027`, while the Companion staging personal key could read the Feynman project.
- Failed / learned: Generic `traces` and `spans` HogQL tables are not exposed under those names for this project, and this synthetic smoke did not create `$ai_` rows in `posthog.ai_events` because it did not execute an LLM/provider call. Prior Pi OTel live UI traces remain the trace-side proof for agent/model spans.
- Next: Use the Companion PostHog personal key, not the project token or old CLI token, for future read-back checks on project `479027`.

### 2026-06-22 05:58 PDT — paper-access-pmid-pmcid

- Objective: Tighten the single-paper access resolver for the AI-researcher loop instead of adding another adjacent workflow.
- Changed: `feynman paper` now treats explicit PMID and PMCID inputs as first-class paper identifiers, routes them through OpenAlex exact `pmid`/`pmcid` filters, and keeps title searches from accidentally matching PMID/PMCID substrings. Public CLI metadata, README, website docs, and release notes now name PMID/PMCID support on the existing paper-access surface.
- Verified: Focused PaperRank/content-policy tests passed 81/81 with exact OpenAlex ID, PMID, and PMCID routing regressions. Full `npm test` passed 311/311; `npm run typecheck`, `npm run build`, website lint/typecheck/build, production audits, `npm pack --dry-run`, and diff checks passed. A live compiled binary smoke for `feynman paper pmid:29456894 --fetch-full-text --json` resolved OpenAlex `W2741809807`, found PMCID `PMC5815332`, fetched Europe PMC fullTextXML, and generated artifacts without a raw full-text string field. Live compiled binary smokes for short and URL OpenAlex IDs resolved the same work through the packaged entrypoint.
- Next: Keep paper-access improvements inside exact identifier/source routing unless a real researcher task proves a broader retrieval connector is necessary.

### 2026-06-22 06:03 PDT — paper-access-title-match

- Objective: Prevent a weak title query from silently anchoring a research run on the wrong OpenAlex result.
- Changed: `feynman paper <title>` now asks OpenAlex for multiple candidates, scores title overlap, accepts the best sufficiently related title, and rejects unrelated title-search results instead of blindly taking the first provider hit. Exact DOI, arXiv ID, OpenAlex ID, PMID, and PMCID paths remain exact-filter lookups.
- Verified: Focused PaperRank/content-policy tests passed 83/83 with regressions for matching title candidates, rejecting unrelated title hits, and preserving exact identifier routes. Full `npm test` passed 313/313; root typecheck/build, website lint/typecheck/build, root/website production audits, `npm pack --dry-run`, and diff checks passed. A live compiled binary smoke for the title `Sparse Autoencoders Find Highly Interpretable Features in Language Models` resolved OpenAlex `W4386839891`, DOI `10.48550/arxiv.2309.08600`, and arXiv `2309.08600` through the packaged entrypoint. A live compiled binary PMID full-text smoke still resolved OpenAlex `W2741809807`, found PMCID `PMC5815332`, fetched Europe PMC fullTextXML, and generated artifacts without a raw full-text string field.
- Next: Keep title search as a guarded resolver path; use `feynman rank` for broad discovery.

### 2026-06-22 06:13 PDT — non-pro-model-surface-wording

- Objective: Keep the visible model setup surface aligned with the no-Pro policy after the reference audit.
- Changed: The successful `feynman model set` message now says it set the non-Pro default model, and the installation docs post-install setup handoff now says setup selects a non-Pro default model. Added regressions for the command output string and installation-doc wording.
- Verified: Focused model/content-policy tests passed 66/66. A stale generic-model wording scan found only the new regression assertions and corrected source string for `Non-Pro default model set to`.
- Next: Run the broad package gates again, then stage the wording fix with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 06:23 PDT — paperrank-provenance-product-language

- Objective: Keep generated PaperRank provenance as a real research audit trail, not a test-fixture-shaped artifact.
- Changed: Default PaperRank provenance now says calibration artifacts require a preference file and reproduction artifacts require reproduction notes. Removed the stale `reproduction fixture` / `needs repair` wording from generated provenance and added a default-run regression.
- Verified: Focused PaperRank/content-policy tests passed 83/83. Full `npm test` passed 313/313. `npm run typecheck`, `npm run build`, website lint/typecheck/build, website build, root/website production audits, `npm pack --dry-run`, and diff checks passed. A compiled `bin/feynman.js rank ... --json` smoke generated provenance with `preference file is supplied` and `reproduction notes are supplied`, and no stale fixture wording.
- Next: Keep reviewing generated artifacts for decision-corrupting wording or broken pointers; commit/push/release remains unauthorized.

### 2026-06-22 06:31 PDT — paperrank-review-boundary-language

- Objective: Keep generated PaperRank artifacts framed as research triage and source inspection, not academic peer-review authority.
- Changed: Replaced the remaining generated `peer-review verdict` boundary text in the score audit and provenance with claim-validation/reproduction language. Added regressions so the phrase does not return in PaperRank copy or generated default artifacts.
- Verified: Focused PaperRank/content-policy tests passed 83/83 and the stale active-surface scan found the old phrases only in negative regression assertions. Full `npm test` passed 313/313. `npm run typecheck`, `npm run build`, website lint/typecheck/build, website build, root/website production audits, diff checks, and `npm pack --dry-run` passed. Rendered website internal-link check passed with 33 HTML files and 0 missing links. A compiled `bin/feynman.js rank ... --json` smoke generated score-audit/provenance artifacts with no stale `peer-review verdict` or fixture wording.
- Next: Stage the final PaperRank wording patch with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 06:44 PDT — paperrank-peer-review-frame-removal

- Objective: Remove the remaining peer-review frame from PaperRank, which is a read-first ranking and verification-planning workflow rather than a review workflow.
- Changed: Replaced PaperRank methodology, report, synthesis-prompt, replication-plan, and workflow-doc mentions of peer review with claim-validation/reproduction language. Added regressions so PaperRank source/docs and generated score audit, report, synthesis prompt, and replication plan do not reintroduce `peer review`.
- Verified: Focused PaperRank/content-policy tests passed 83/83. Targeted scans found `peer review` in PaperRank files only inside negative regression assertions; remaining active mentions are review-workflow boundary text or biomedical evidence-type labels. Full `npm test` passed 313/313. `npm run typecheck`, `npm run build`, website lint/typecheck/build, website build, root/website production audits, diff checks, and `npm pack --dry-run` passed. Rendered website internal-link check passed with 33 HTML files and 0 missing links. A compiled no-model `bin/feynman.js rank ... --json` smoke checked generated report, score audit, provenance, and replication plan for stale peer-review/fixture wording. A parallel compiled smoke with `--synthesize` was stopped before using it as evidence because it entered the model path; synthesis-prompt wording is covered by focused tests.
- Next: Stage the final PaperRank peer-review frame removal with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 06:58 PDT — paperrank-release-artifact-truth

- Objective: Keep public release docs aligned with PaperRank's lean default artifact boundary.
- Changed: Fixed the website release note that still claimed every PaperRank run writes an empty-safe reproduction notes template. It now says reproduction ledgers, notes templates, and replication plans are written only when `--reproduction-notes` supplies completed reproduction evidence. Added a content-policy guard for the stale sentence.
- Verified: Focused content-policy tests passed 32/32. Full `npm test` passed 313/313. `npm run typecheck` passed. Website build passed and generated 33 pages. Rendered website internal-link check passed with 33 HTML files and 0 missing links. Active stale-sentence scan found the removed reproduction-template claim only in the new negative regression assertion.
- Next: Stage the release-doc artifact-boundary fix with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 07:28 PDT — source-access-promise-boundary

- Objective: Keep source-access docs honest and bounded so Feynman reads available evidence instead of implying arbitrary complete web or paper access.
- Changed: Tightened web-search docs from complete page content to provider-available page text, and tightened alphaXiv docs from broad full-text access to citation metadata, discussion threads, and source-specific paper text when available. Added content-policy guards for the stale phrases.
- Verified: Focused content-policy tests passed 32/32. Full `npm test` passed 313/313. `npm run typecheck`, website typecheck, and website build passed; website build generated 33 pages. Rendered website internal-link check passed with 33 HTML files and 0 missing links. Active scan found the removed complete-content/full-text-access phrases only in negative regression assertions.
- Next: Stage the source-access promise-boundary fix with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 07:43 PDT — session-search-session-dir-fix

- Objective: Make the optional session-search package actually recall Feynman research sessions instead of looking in upstream Pi's default session directory.
- Changed: Added a carried `pi-session-search` patch that makes its indexer prefer `FEYNMAN_SESSION_DIR` or `PI_SESSION_DIR` before falling back to `~/.pi/agent/sessions`. Wired the patch through runtime startup, vendored runtime workspace preparation, and the embedded postinstall patch script. Added direct patch tests and runtime-root coverage for package-local, vendored, user-global, and Pi-agent npm installs. Also tightened preview docs so optional preview rendering is described as renderer-dependent, not guaranteed perfect LaTeX/table rendering.
- Verified: `npm view` still reports `0.79.10` for all four scoped Pi runtime packages. Focused package/runtime/content tests passed 75/75. Full `npm test` passed 315/315. `npm run typecheck`, `npm run build`, website typecheck, and website build passed; website build generated 33 pages. Rendered website internal-link check passed with 33 HTML files and 0 missing links. Root and website production audits reported 0 vulnerabilities. `npm pack --dry-run` passed and packed 132 files, including the new session-search patch helper.
- Next: Stage the session-search runtime fix with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 07:47 PDT — package-install-runtime-patch

- Objective: Make optional Pi package installs and updates leave Feynman's patched research runtime correct immediately, not only after a later launch-time patch pass.
- Changed: `installPackageSources` and `updateConfiguredPackages` now run the runtime patch pass after successful installs or updates, so freshly installed Pi packages in Feynman's user npm prefix are patched before the command returns. Added regressions that simulate supported Node 22 session-search installs/updates and inspect the installed `@kaiserlich-dev/pi-session-search/extensions/indexer.ts` file for Feynman's session directory handoff.
- Verified: Focused package/runtime/content tests passed 84/84, including package install and update regressions for the patched session-search indexer. Full `npm test` passed 317/317. `npm run typecheck`, `npm run build`, website lint/typecheck/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets.
- Next: Stage the package-operation patch with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 07:52 PDT — paperrank-generated-fixture-language

- Objective: Keep generated PaperRank artifacts in researcher-facing product language instead of leaking stale test-fixture terminology.
- Changed: Replaced generated synthesis-packet wording from `explicit fixture` to `explicit reproduction notes file`, and replaced the calibration-guide limit from `small fixture` to `small preference file`. Added regressions covering both generated artifacts and the active PaperRank source/docs surface.
- Verified: Focused PaperRank/content-policy tests passed 83/83. Targeted stale-language scan now finds the removed fixture phrases only in negative regression assertions. Full `npm test` passed 317/317. `npm run typecheck`, `npm run build`, website lint/typecheck/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets.
- Next: Stage the generated-artifact wording fix with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 08:01 PDT — telemetry-child-env-scrub

- Objective: Keep Feynman's observability useful without leaking or inheriting private parent-shell OTEL/Pi telemetry settings into the research runtime.
- Changed: The PostHog OTEL child-env builder now starts from a scrubbed telemetry environment and clears inherited OTEL logs/metrics routes, resource attributes, exporter controls, Pi OTEL disable/service overrides, and OTEL log level before setting Feynman's PostHog trace/log routes. Added regressions for enabled and disabled telemetry paths.
- Verified: Focused telemetry/runtime/content tests passed 57/57. Full `npm test` passed 318/318. `npm run typecheck`, `npm run build`, website typecheck/lint/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets; pack dry-run included 132 files.
- Next: Stage the telemetry scrub with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 08:07 PDT — paper-access-source-label-escaping

- Objective: Keep single-paper access reports safe when provider or test fetchers return source labels, so generated Markdown cannot be shaped by untrusted labels.
- Changed: Escaped the full-text source label in paper-access Markdown reports and added a regression with a provider label containing a pipe, newline heading, and Markdown link syntax.
- Verified: Focused PaperRank/content-policy tests passed 84/84. Full `npm test` passed 319/319. `npm run typecheck`, `npm run build`, website typecheck/lint/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets; pack dry-run included 132 files.
- Next: Stage the generated-artifact boundary fix with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-22 08:14 PDT — paperrank-markdown-html-escaping

- Objective: Keep PaperRank and paper-access Markdown artifacts structurally trustworthy when provider-controlled paper titles, source labels, or evidence text contain HTML-like input.
- Changed: The shared Markdown escape helper now entity-escapes `&`, `<`, and `>` before Markdown control characters, so paper/provider text cannot render as raw HTML in generated reports. Extended paper-access regressions with hostile title and full-text source labels containing raw HTML tags.
- Verified: Focused PaperRank/content-policy tests passed 84/84. Full `npm test` passed 319/319. `npm run typecheck`, `npm run build`, website typecheck/lint/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets; pack dry-run included 132 files.
- Next: Stage the Markdown/HTML escaping hardening with the existing AI-researcher package and continue the generated-artifact audit. Commit/push/release remains unauthorized.

### 2026-06-22 08:18 PDT — paperrank-provenance-source-meta-fence

- Objective: Keep PaperRank provenance auditable when source metadata contains Markdown backticks, headings, or HTML-like text.
- Changed: Provenance now writes source metadata as a fenced JSON block using the existing adaptive fence helper instead of an inline code span. Added a regression where fixture metadata contains a triple-backtick sequence, injected heading text, and script-like markup, then asserted the metadata stays under the source-meta fence.
- Verified: Focused PaperRank/content-policy tests passed 84/84. Full `npm test` passed 319/319. `npm run typecheck`, `npm run build`, website typecheck/lint/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets; pack dry-run included 132 files.
- Next: Stage the provenance fence fix with the existing AI-researcher package and continue artifact-boundary review. Commit/push/release remains unauthorized.

### 2026-06-22 08:22 PDT — paperrank-model-synthesis-html-escape

- Objective: Keep model-generated PaperRank synthesis readable while preventing raw HTML from rendering inside the audit artifact.
- Changed: `*-model-synthesis.md` now escapes raw HTML characters in model synthesis text while preserving line breaks and Markdown structure. Extended the generated-synthesis regression with model output containing raw `<script>` and `<img>` tags, and asserted the artifact renders escaped text instead of raw tags.
- Verified: Focused PaperRank/content-policy tests passed 84/84. Full `npm test` passed 319/319. `npm run typecheck`, `npm run build`, website typecheck/lint/build, root and website production audits, rendered website internal-link check, `npm pack --dry-run`, and diff checks passed. Website build generated 33 pages; rendered link check found 0 missing internal targets; pack dry-run included 132 files.
- Next: Stage the synthesis HTML escape with the existing AI-researcher package and continue artifact-boundary review. Commit/push/release remains unauthorized.

### 2026-06-22 08:31 PDT — installed-tarball-e2e-research-smoke

- Objective: Prove the staged package works as an installed user-facing research CLI, not only through source tests.
- Changed: No product code changed. Ran a clean tarball install under `/tmp/feynman-e2e.kvlIB5`, then exercised the installed `feynman` binary with fresh `FEYNMAN_HOME` directories and telemetry disabled.
- Verified: `npm pack` produced `@companion-ai/feynman@0.3.4` with 132 files; clean temp `npm install --omit=dev` installed 364 packages with 0 vulnerabilities; installed `feynman --version` returned `0.3.4`. Installed CLI smokes passed for top-level help, bundled `feynman alpha --help`, PaperRank fixture run with citation expansion/full-text/critique (`4` ranked papers, `6` graph papers, `2/2` full-text available, `2` critiques, `10` artifacts), and paper-access fixture run with full text available. Live provider smokes passed: `feynman paper 10.7717/peerj.4375 --fetch-full-text --json` resolved via OpenAlex with `12` access candidates and available full text, and `feynman alpha search "sparse autoencoders"` returned `10` parsed result rows.
- Next: Keep the package staged as the current local release candidate; commit/push/release remains unauthorized.

### 2026-06-23 04:50 PDT — code-organization-reference-pass

- Objective: Deeply compare Feynman's shape against Codex, Claude Code, OpenCode, Hermes Agent, and Hugging Face ML Intern, then apply only the structural improvements that keep Feynman a simple, potent AI researcher.
- Changed: Added a durable code-organization research handbook under `outputs/.plans/code-organization-review/`, cloned/read the reference repos in `_agent-research/feynman-code-organization/`, and added `scripts/check-architecture.mjs` plus `npm run architecture:check`. The guard names existing oversized debt (`src/rank/paper-rank.ts`, `tests/paper-rank.test.ts`, `src/cli.ts`), warns on files nearing core debt (`src/model/commands.ts`, `scripts/patch-embedded-pi.mjs`), and blocks new unallowlisted oversized files or domain modules importing CLI/UI/setup layers.
- Verified: `npm run architecture:check` passed and checked 114 source files. No user-facing feature surface was added; the next recommended implementation step is mechanical PaperRank/CLI extraction, followed by a `ResearchRun`/research-recipe artifact contract.
- Next: Split PaperRank into papers/evidence/rank/artifact modules without changing ranking behavior, then split CLI command handlers and keep the architecture guard green.

### 2026-06-22 08:48 PDT — contributor-pr-intake-and-legacy-alias-fix

- Objective: Turn contributor intake into a repeatable AI-researcher product loop and port only the PR changes that fix real package reliability.
- Changed: Reactivated the existing Codex automation `check-new-issues` as `Feynman AI researcher intake sweep`, with explicit PR/issue classification rules, feature-fight criteria, and no push/merge/comment authority. Evaluated open PRs: `#179` is not mergeable as-is because it adds a separate Bernoulli prompt tree and outreach/admin workflow; `#181` fixes issue `#180`, so ported its root-cause package fix. `resolveRuntimePeerSpec` now reads both `name` and `version` from installed runtime package manifests and emits `npm:` alias specs when legacy `@mariozechner/*` directories contain current `@earendil-works/*` package names.
- Verified: Focused package/runtime tests passed 27/27. Full `npm test` passed 320/320. `npm run typecheck`, `npm run build`, root production audit, `npm pack --dry-run`, diff checks, and clean installed-tarball smoke passed. The installed tarball returned `0.3.4` and `feynman packages list` rendered the core/optional package surface from a fresh temp install.
- Next: Stage the alias fix and automation notebook entry with the existing AI-researcher package. Commit/push/release remains unauthorized.

### 2026-06-23 05:31 PDT — code-organization-daytona-hardening

- Objective: Finish the deep code-organization pass with clean install/runtime proof, keep Feynman focused on AI research, and remove the Daytona pack/install failure.
- Changed: Added the architecture guard and durable code-organization notes; patched Pi package metadata before CLI import so fresh source installs use Feynman's `.feynman` config; made runtime workspace preparation install current Pi packages once and symlink legacy `@mariozechner/*` aliases to `@earendil-works/*` instead of installing duplicate dependency trees.
- Verified: Daytona fresh clone passed `npm ci`, `npm run architecture:check`, `npm test` (`323/323`), `npm run typecheck`, isolated `npm run build`, root production audit, diff checks, website install/lint/typecheck/build/audit, rendered internal-link check (`33` HTML files, `0` missing links), and `npm pack --dry-run` (`133` files, `50.9 MB`, shasum `85d92d0cffb5f01296a0599b45ac93b6b2771b62`). The vendored runtime package prep completed in 27 seconds and legacy Pi namespace entries were verified as symlinks.
- Next: Commit and push this release candidate, then split PaperRank into source/access/evidence/rank/artifact modules before adding any plugin or MCP public surface.

### 2026-06-23 14:08 PDT — research-run-product-spine

- Objective: Turn the BioNeMo-style lesson into a Feynman product repair without adding a random life-science workflow.
- Changed: Added the first code-level `ResearchRun` contract and validator, added research-plugin manifest validation with `entity_extractors` and `experiment_runners`, and made PaperRank emit `<slug>-research-run.json` as the typed spine for sources, papers, tools, artifacts, verification state, constraints, and next actions. Updated PaperRank docs and the architecture handbook to treat molecular diagram parsing as an entity extractor and BioNeMo-style model calls as experiment runners.
- Verified: Full local root suite passed `325/325`; local typecheck, build, architecture guard, root audit, diff check, website lint/typecheck/build/audit, rendered docs link check (`33` HTML files, `0` missing internal links), and `npm pack --dry-run` passed. After the final manifest completion-marker ordering fix, local root tests, typecheck, build, architecture guard, diff check, and package dry-run were rerun; final pack shasum is `0442fe1352718f10b347c53b182b84d335713451`. Local installed-tarball E2E installed the package into a fresh temp project, returned version `0.3.4`, ran PaperRank through the shipped binary, and verified the emitted `feynman.researchRun.v1` manifest with `4` papers, top paper `WFOUNDATION`, `11` artifacts, and `rawFullTextStored: false`. Daytona sandbox `feynman-researchrun-e2e` passed clean `npm ci`, architecture guard, `npm test` (`325/325`), typecheck, build, root audit, and `npm pack --dry-run`; sandbox was deleted after verification.
- Next: Commit and push this focused product-architecture patch, then continue into mechanical PaperRank module extraction. The next install-speed target is reducing the 51-52 MB vendored runtime archive and 417-package runtime prep path.
