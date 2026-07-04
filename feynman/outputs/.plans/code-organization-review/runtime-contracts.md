# Runtime Contracts

## Research Kernel Contracts

```ts
export type ResearchJob =
  | "discovering_prior_art"
  | "reading_paper_content"
  | "extracting_research_entities"
  | "ranking_evidence"
  | "verifying_claims"
  | "planning_reproduction"
  | "running_research_experiments"
  | "synthesizing_artifacts"
  | "visualizing_research_structure"
  | "improving_research_loop";

export type SourceId =
  | "openalex"
  | "doi"
  | "arxiv"
  | "alphaxiv"
  | "europe_pmc"
  | "huggingface"
  | string;

export type PaperCandidate = {
  source: SourceId;
  sourceId: string;
  title?: string;
  doi?: string;
  arxivId?: string;
  pmid?: string;
  pmcid?: string;
  url?: string;
  provenance: ProvenanceRecord[];
};

export type ResolvedPaper = PaperCandidate & {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  year?: number;
  citationCount?: number;
  concepts: string[];
  urls: Record<string, string | undefined>;
};

export type EvidenceSpan = {
  paperId: string;
  source: SourceId;
  section?: string;
  quote?: string;
  start?: number;
  end?: number;
  provenance: ProvenanceRecord[];
};

export type RankSignal = {
  key: string;
  value: number;
  available: boolean;
  explanation: string;
  evidence: EvidenceSpan[];
};

export type ResearchArtifact = {
  kind: "report" | "json" | "graph" | "audit" | "provenance" | "template";
  path: string;
  summary: string;
};
```

Applied status: `src/research/contracts.ts` now ships the first code-level version of this contract as `feynman.researchRun.v1`, and PaperRank writes `<slug>-research-run.json` for every rank run. The manifest records research jobs, sources, papers, typed artifacts, tools used, verification state, constraints, and next actions. It deliberately stores no raw full-text body.

## Research Recipe Contract

Inspired by ML Intern's required recipe table, but scoped to Feynman research artifacts:

```ts
export type ResearchRecipe = {
  paper: {
    id: string;
    title: string;
    year?: number;
    doi?: string;
    arxivId?: string;
    openAlexId?: string;
  };
  result: {
    claim: string;
    benchmark?: string;
    metric?: string;
    value?: string;
    evidence: EvidenceSpan[];
  };
  dataset: {
    name?: string;
    source?: string;
    hubId?: string;
    availability: "verified" | "candidate" | "missing" | "not_checked";
    evidence: EvidenceSpan[];
  };
  method: {
    summary: string;
    parameters: Record<string, string | number | boolean>;
    evidence: EvidenceSpan[];
  };
  code: {
    repo?: string;
    path?: string;
    url?: string;
    status: "verified" | "candidate" | "missing" | "not_checked";
  };
  whyItWorked: string;
  verificationNext: string[];
};
```

Rules:

- Every non-empty `result`, `dataset`, and `method` field needs an evidence span or an explicit `not_checked`/`missing` status.
- Recipe extraction never outranks deterministic PaperRank by itself; it feeds synthesis and reproduction planning.
- The JSON artifact must be bounded and must not store raw full text.
- The Markdown artifact must be escaped using the existing PaperRank Markdown/HTML escaping discipline.

## Plugin Manifest Contract

```ts
export type FeynmanPluginManifest = {
  manifest_version: 1;
  name: string;
  version?: string;
  description?: string;
  research_jobs: ResearchJob[];
  slots?: {
    source_adapters?: string[];
    access_resolvers?: string[];
    entity_extractors?: string[];
    rank_scorers?: string[];
    experiment_runners?: string[];
    artifact_exporters?: string[];
    visualizers?: string[];
    subagents?: string[];
    mcp_servers?: string[];
  };
  pi?: {
    extensions?: string[];
    skills?: string[];
    prompts?: string[];
    themes?: string[];
  };
  requires_env?: Array<string | { name: string; secret?: boolean; description?: string }>;
};
```

Validation rules:

- `manifest_version` must be `1`.
- `name` must be a package-safe identifier and must not contain `/`, `\`, `..`, absolute paths, or path traversal. Hermes applies equivalent sanitization for plugin dirs (`hermes_cli/plugins_cmd.py:81-135`).
- Every declared path must resolve inside the plugin root. Hermes rejects escaping subdirs (`hermes_cli/plugins_cmd.py:219-245`); Codex does the same for plugin resources and MCP cwd (`provider.rs:93-124`, `plugin_config.rs:122-139`).
- `research_jobs` is required and must be non-empty.
- At least one `slots` or `pi` resource must be present.
- Unknown top-level keys warn in v1; unknown slot keys fail.
- `requires_env.secret === false` is allowed only for provider-required values that are genuinely env-based. Behavioral config belongs in Feynman settings, following Hermes' non-secret config rule (`hermes-agent/AGENTS.md:102-107`).

Applied status: `src/research/plugin-manifest.ts` validates this shape in code. It allows `entity_extractors` for paper/figure/table/code entity extraction and `experiment_runners` for bounded reproduction/model execution. It rejects unknown slots, unsupported research jobs, absolute paths, path traversal, and plugin names that behave like paths.

## Plugin Slot Contracts

### Source Adapter

```ts
export type SourceAdapter = {
  id: string;
  label: string;
  researchJobs: ResearchJob[];
  search(input: {
    topic: string;
    limit: number;
    since?: string;
    conference?: string;
    signal?: AbortSignal;
  }): Promise<PaperCandidate[]>;
};
```

Use for Scholar Inbox, OpenReview, conference feeds, PubMed, Semantic Scholar, arXiv, and private corpora.

### Access Resolver

```ts
export type AccessResolver = {
  id: string;
  label: string;
  resolve(input: {
    paper: ResolvedPaper;
    fetchFullText: boolean;
    signal?: AbortSignal;
  }): Promise<{
    candidates: FullTextAccessCandidate[];
    content?: PaperContent;
    provenance: ProvenanceRecord[];
  }>;
};
```

Use for legal access resolution only. No scraping bypasses or paywall evasion.

### Rank Scorer

```ts
export type RankScorer = {
  id: string;
  label: string;
  score(input: {
    paper: ResolvedPaper;
    graph: EvidenceGraph;
    content?: PaperContent;
    topic: string;
  }): Promise<RankSignal>;
};
```

Scorers add signals; they do not rewrite core score weights unless a named score profile opts in.

### Entity Extractor

```ts
export type EntityExtractor = {
  id: string;
  label: string;
  extract(input: {
    run: ResearchRun;
    artifactPaths: string[];
    entityKinds?: string[];
  }): Promise<ResearchEntity[]>;
};
```

Use for molecular structure diagrams, protein/gene/ligand extraction, table/equation extraction, dataset and benchmark extraction, and code/method entity extraction. Extractors write candidates with evidence and confidence; they do not claim validation by themselves.

### Experiment Runner

```ts
export type ExperimentRunner = {
  id: string;
  label: string;
  run(input: {
    run: ResearchRun;
    entityIds: string[];
    outputDir: string;
  }): Promise<ResearchArtifact[]>;
};
```

Use for bounded reproduction or model calls such as BioNeMo-style folding, docking, sequence search, molecule generation, benchmark reruns, or code execution. Runners must write artifacts plus caveats and may not silently mutate ranking semantics.

### Artifact Exporter

```ts
export type ArtifactExporter = {
  id: string;
  label: string;
  export(input: {
    run: ResearchRun;
    outputDir: string;
  }): Promise<ResearchArtifact[]>;
};
```

Use for conference summaries, lab briefs, graph exports, and machine-readable packets.

## MCP Contract

MCP tools must call stable kernel functions and return bounded artifacts/paths, not raw full text:

- `resolve_paper` returns access candidates, metadata, content summary, and artifact paths.
- `rank_papers` returns top scores, artifact paths, provenance path, and graph summary.
- `get_research_artifact` returns bounded file content with type and path.
- `inspect_evidence_graph` returns graph metrics and selected nodes/edges, not full graph dumps unless bounded.

The raw full text boundary follows prior Feynman paper-access guidance: artifacts should carry source metadata, lengths, section counts, and access status, not unbounded raw full text.

## Telemetry Contract

- Emit metadata-only spans/events.
- Never emit prompts, tool arguments, paper full text, file paths containing user-private project names, or raw source content.
- Preserve existing PostHog/Pi telemetry split: Feynman CLI spans around commands; Pi lifecycle/tool/model spans through `pi-otel`.
- New plugin/MCP telemetry reports plugin name, slot type, duration, status, counts, and error class only.

This follows Feynman's Pi observability rule in `AGENTS.md:53` and the package-stack docs that describe metadata-only spans (`website/src/content/docs/reference/package-stack.md:10`).
