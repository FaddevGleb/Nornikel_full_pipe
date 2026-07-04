# Handoff

Pending.
# Handoff

## What I Did

- Loaded the repo-level AGENTS instructions and deep-research skill.
- Refreshed and read the current comparison repos:
  - OpenAI Codex at `63f8f547c0b95800f3c61ee172a2a833b75faf3f`.
  - Claude Code at `12281998d8c85813c4b5952ed9367784aae37d31`.
  - OpenCode at `d568fed0956bd97a5c89eae996122a8862151f6f`.
  - Hermes Agent at `5ecf3bf0e0726b8b33682bb5c3aad9679b7b5be4`.
  - Hugging Face ML Intern at `550a209701701e6a9ac7cac70b8dbd508822d467`.
- Read installed Pi docs/source for `@earendil-works/pi-coding-agent@0.79.10`.
- Read local Feynman hotspots and wrote this source-backed architecture plan.
- Applied one code-organization guard: `scripts/check-architecture.mjs` plus `npm run architecture:check`.

## The Decision

Do not add more product features yet.

First fix the shape:

1. Keep the new architecture check passing.
2. Extract `src/rank/paper-rank.ts` into research-domain modules.
3. Extract `src/cli.ts` into command modules.
4. Add `ResearchRun` plus research recipe artifact contracts.
5. Add a Feynman research-plugin manifest/validator on top of Pi packages.
6. Add `feynman mcp` after stable domain modules exist.

## What To Read First

1. `outputs/.plans/code-organization-review/STATUS.md`
2. `outputs/.plans/code-organization-review/why-chains.md`
3. `outputs/.plans/code-organization-review/architecture.md`
4. `outputs/.plans/code-organization-review/runtime-contracts.md`
5. `src/rank/paper-rank.ts`
6. `src/cli.ts`
7. `extensions/research-tools.ts`

## Implementation Notes

- Start with mechanical extraction. Keep existing exports working from `src/rank/paper-rank.ts` as a compatibility barrel during the first PR.
- Do not change ranking math in the extraction PR.
- Do not add Scholar Inbox, MCP, plugin installation, or new commands in the extraction PR.
- Move or add tests with each extracted module.
- Keep behavior-proving tests based on fixtures and invariants, not broad snapshots.
- Keep model synthesis non-Pro. The current CLI rejects explicit Pro-class model specs for PaperRank synthesis (`src/cli.ts:1039-1043`).

## Accepted Inspiration

- Codex: large-module guardrails, bounded context, small public surfaces, integration tests, plugin manifests with root-bound resources.
- Claude Code: simple plugin directory convention with commands/agents/skills/hooks/MCP and tiny metadata.
- OpenCode: read-only planning mode concept, typed plugin tool context, package-scoped testing, happy-path command organization.
- Hermes Agent: narrow waist, Footprint Ladder, plugins before core, env/config discipline, refactor god-files, reject speculative hooks.
- Hugging Face ML Intern: paper-first research recipe table, bounded paper/dataset tools, evented run shape, private/scrubbed trace upload, provenance-marked artifacts.

## Rejected Inspiration

- Hermes personal-agent gateway breadth as a Feynman product lane.
- ML Intern's full cloud jobs/sandbox/frontend/gateway product as a Feynman lane.
- Claude/OpenCode generic workflow plugin examples unless mapped to a research job.
- Arbitrary hooks before a concrete research plugin needs them.
- Core tools for every source/database.
- Grants/outreach/admin/project-management workflows as default Feynman features.

## Remaining Gaps

- Yo-Yo's branch was not re-read in this pass.
- GitHub issue/PR history for the comparison repos was not exhaustively reviewed.
- Current Feynman tests were not run in this pass because no product code changed.
- Plugin install UX needs one concrete first plugin candidate. Scholar Inbox is the best candidate only as a `source_adapter` for conference/topic feeds, not as a general summarizer.
