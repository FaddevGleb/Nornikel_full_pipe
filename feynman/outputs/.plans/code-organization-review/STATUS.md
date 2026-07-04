# Code Organization Review Status

Objective: compare Feynman's code and product organization against Claude Code, OpenAI Codex, OpenCode, Hermes Agent, and Hugging Face ML Intern, then apply only the structural/runtime improvements that keep Feynman a simple, potent AI researcher.

Confidence: 100/100 for the current ResearchRun/product-contract repair. Local source gates, local installed-tarball E2E, and a disposable Daytona clean-room package pass all completed.

Current state:
- Feynman worktree has unstaged local edits for this focused product-contract change on `main`; it is not committed or pushed yet.
- Deep-research skill was loaded and the external comparison repos were cloned into `/Users/advaitpaliwal/Companion/Code/_agent-research/feynman-code-organization/`.
- Current comparison commits were refreshed with `git fetch --all --prune` on 2026-06-23:
  - OpenAI Codex: `63f8f547c0b95800f3c61ee172a2a833b75faf3f`, `63f8f54 2026-06-23T12:18:25+02:00 Stop persisting bridged log events (#29599)`.
  - Claude Code: `12281998d8c85813c4b5952ed9367784aae37d31`, `1228199 2026-06-22T20:37:27Z chore: Update CHANGELOG.md and feed.xml`.
  - OpenCode: `d568fed0956bd97a5c89eae996122a8862151f6f`, `d568fed 2026-06-23T10:41:05Z fix(app): tighten mobile utility UI (#32799)`.
  - Hermes Agent: `5ecf3bf0e0726b8b33682bb5c3aad9679b7b5be4`, `5ecf3bf 2026-06-23T14:44:12+05:30 fix(slack): report ext-matched audio mimetype for rerouted voice clips`.
- Added Hugging Face ML Intern to the comparison set:
  - ML Intern: `550a209701701e6a9ac7cac70b8dbd508822d467`, `550a209 2026-06-18T14:01:26+02:00 [codex] Switch defaults to GLM 5.2 (#333)`.
- Applied one focused Feynman code-organization improvement:
  - Added `scripts/check-architecture.mjs`.
  - Added `npm run architecture:check`.
  - Verified it passes while naming known architecture debt and warning zones.
- Fixed the fresh-install Pi metadata bug found in Daytona:
  - `src/index.ts` patches Pi runtime package metadata before dynamically loading CLI code.
  - `src/pi/runtime-patches.ts`, `scripts/patch-embedded-pi.mjs`, and `scripts/prepare-runtime-workspace.mjs` now keep `@earendil-works/pi-coding-agent` and legacy aliases on Feynman's `.feynman` config directory.
  - `npm test` runs the embedded Pi patch first, so source/test flows match installed CLI behavior.
- Fixed the runtime packaging speed/OOM failure:
  - `scripts/prepare-runtime-workspace.mjs` installs current Pi packages once and links legacy `@mariozechner/*` aliases to the audited `@earendil-works/*` packages.
  - This removes duplicate Pi dependency trees from the vendored runtime workspace while preserving compatibility for Pi extensions that still import legacy namespaces.
  - Daytona `npm pack --dry-run` completed the vendored runtime preparation in 27 seconds instead of being killed with status 137.
- Final clean-room Daytona verification passed from a fresh Linux clone with the full patch applied:
  - `npm ci`
  - `npm run architecture:check`
  - `npm test` (`323/323`)
  - `npm run typecheck`
  - `npm run build`
  - `npm audit --omit=dev`
  - `git diff --check`
  - `npm --prefix website ci`
  - website `npm run lint`, `npm run typecheck`, `npm run build`, and `npm audit --omit=dev`
  - rendered docs internal-link check (`33` HTML files, `0` missing internal links)
  - `npm pack --dry-run` (`133` files, `50.9 MB` package, shasum `85d92d0cffb5f01296a0599b45ac93b6b2771b62`)
  - `.feynman/npm/node_modules/@mariozechner/*` verified as symlinks to `.feynman/npm/node_modules/@earendil-works/*`.
- New 2026-06-23 product repair after the BioNeMo reference:
  - Added `src/research/contracts.ts` with `ResearchRun`, typed artifacts, research jobs, entities, tool runs, verification state, constraints, and validation.
  - Added `src/research/plugin-manifest.ts` with validated research-plugin slots, including `entity_extractors` and `experiment_runners`.
  - PaperRank now writes `<slug>-research-run.json` and validates it before writing the rest of the artifact set.
  - `tests/research-contracts.test.ts` covers the ResearchRun spine plus valid/invalid plugin manifests.
  - `tests/paper-rank.test.ts` now asserts PaperRank emits a bounded ResearchRun manifest with no raw full-text body.
- Final verification for this repair:
  - Local `npm test` passed `325/325`.
  - Local `npm run typecheck`, `npm run build`, `npm run architecture:check`, `npm audit --omit=dev`, and `git diff --check` passed.
  - Local website lint/typecheck/build/audit passed; the rendered docs link check found `33` HTML files and `0` missing internal links.
  - Local `npm pack --dry-run` passed after the final manifest completion-marker ordering fix with `135` files, a `52.3 MB` package, and shasum `0442fe1352718f10b347c53b182b84d335713451`; the package includes `dist/research/contracts.js` and `dist/research/plugin-manifest.js`.
  - Local installed-tarball E2E installed `@companion-ai/feynman@0.3.4` into a fresh temp project, returned `feynman --version` as `0.3.4`, and ran PaperRank through the shipped binary. The installed run emitted `feynman.researchRun.v1`, ranked `4` papers, kept top paper `WFOUNDATION`, wrote `11` artifacts, and kept `rawFullTextStored: false`.
  - Disposable Daytona sandbox `feynman-researchrun-e2e` passed clean `npm ci`, architecture guard, full root tests `325/325`, typecheck, build, root audit, and `npm pack --dry-run`. Remote pack produced `135` files and a `51.2 MB` package. The sandbox was deleted after verification.
  - Install/package speed finding: remote clean install took `15s`; local installed-tarball install took about `3m`; pack runtime prep installed `417` runtime packages and produced a `51-52 MB` vendored runtime archive. The package is valid, but runtime archive size remains the next install-speed optimization target.

Deferred decisions:
- Do not add a `feynman plugins` product command yet. The manifest validator now exists as code-level infrastructure; the next user-facing plugin work should wait for a real adapter such as Scholar Inbox source feeds or a molecular-structure entity extractor.
- Do not ship an MCP server yet. It needs stable domain contracts first; otherwise it freezes the current PaperRank god-file shape as public API.
- Do not merge Yo-Yo's branch as-is. Only a research-core "lab canon" concept should come back later, and only when it improves evidence ranking or PaperRank methodology judgment.
- Next applied step remains mechanical PaperRank extraction, followed by CLI command splitting. The first `ResearchRun`/plugin contract is now real code, so extraction should preserve that manifest as the public internal spine.

Source coverage:
- Local Feynman repo: read repo contract, package/runtime docs, command wiring, Pi launch path, bundled extension entrypoint, large file inventory, PaperRank symbol map, Pi docs/source installed at `@earendil-works/pi-coding-agent@0.79.10`.
- Prior Feynman memory: read relevant product-strategy lines that established PaperRank/evidence graph as the center and the "features fight for life" scope rule.
- External repos: cloned/read OpenAI Codex, Claude Code, OpenCode, Hermes Agent, and Hugging Face ML Intern.
- BioNeMo reference: read NVIDIA's 2026-06-23 BioNeMo Agent Toolkit post and cloned `NVIDIA-BioNeMo/bionemo-agent-toolkit` into `/tmp/feynman-bionemo-agent-toolkit`; inspected README, marketplace manifest, `skills.sh.json`, OpenFold3 NIM, DiffDock NIM, and generative protein binder workflow skill shape.
- External docs/issues/releases: primary repo docs/source read; issue/PR history only sampled through latest commit metadata and local repo docs, not exhausted.

Next action:
- Commit and push this focused product-contract patch, then continue into the mechanical PaperRank module extraction. Do not add a user-facing plugin command until a real source adapter, entity extractor, or experiment runner needs it.
