export interface LoadStatus {
  graphPath: string;
  conceptsPath: string;
  source: 'wow' | 'in' | 'test' | 'error';
  nodeCount: number;
  edgeCount: number;
  nodeTypes: Record<string, number>;
  hasChunkNodes: boolean;
  hasAssessmentNodes: boolean;
  warnings: string[];
}

export interface GraphBundle {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  concepts: { concepts: ConceptEntry[]; _meta?: { mention_index?: Record<string, unknown> } };
  loadStatus: LoadStatus;
}

export interface GraphNode {
  id: string;
  type?: string;
  name?: string;
  text?: string;
  definition?: string;
  metadata?: { is_kpi?: boolean };
  pagerank?: number;
  betweenness_centrality?: number;
  educational_importance?: number;
  prerequisite_depth?: number;
  cluster_id?: number;
  bridge_score?: number;
  [key: string]: unknown;
}

export interface GraphEdge {
  id?: string;
  source?: string;
  target?: string;
  from?: string;
  to?: string;
  type?: string;
  relationship?: string;
  weight?: number;
  attributes?: { confidence_score?: number; evidence_quote?: string };
}

export interface ConceptEntry {
  concept_id: string;
  term: { primary: string; aliases?: string[] };
  definition?: string;
}

export interface Job {
  id: string;
  status: string;
  stage: string | null;
  progress: number;
  logs: { message: string; timestamp: string }[];
  createdAt?: string;
  error?: string;
  diagnosticsReportPath?: string;
}

export interface DiagnosticStep {
  id: string;
  titleKey: string;
  status: 'pass' | 'warn' | 'fail';
  messageKey: string;
  details: Record<string, unknown>;
}

export interface Hypothesis {
  id: string;
  title: string;
  category: string;
  confidence: number;
  summary: string;
  reasoning: string[];
  evidence: unknown[];
  suggestedExperiments: string[];
  relatedNodes: string[];
  relatedConcepts?: string[];
  subgraph?: { nodes: GraphNode[]; edges: GraphEdge[] };
}

const SESSION_KEY = 'k2-18-session-id';

function headers(): HeadersInit {
  const sessionId = localStorage.getItem(SESSION_KEY);
  return {
    'Content-Type': 'application/json',
    ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  if (response.headers.get('Content-Type')?.includes('text/markdown') || response.headers.get('Content-Type')?.includes('application/pdf')) {
    return response as unknown as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  async ensureSession(): Promise<string> {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const check = await fetch(`/api/sessions/${sessionId}`);
      if (check.ok) return sessionId;
    }
    const created = await request<{ session: { id: string } }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ state: {} }),
    });
    sessionId = created.session.id;
    localStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  },

  getConfigStatus: () => request<Record<string, unknown>>('/config/status'),
  setMode: async (mode: string, force = false) => {
    const response = await fetch('/api/config/mode', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ mode, force }),
    });
    if (response.status === 409) throw new Error('mode_switch_warning');
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
    }
    return response.json() as Promise<{ mode: string; provider: string }>;
  },
  getVizConfig: () => request<{ nodeShapes: Record<string, string>; nodeColors: Record<string, string> }>('/viz-config'),
  listFiles: () => request<{ files: { name: string; size: number }[] }>('/files'),
  getGraph: () => request<GraphBundle>('/graph'),
  listJobs: () => request<{ jobs: Job[] }>('/jobs'),
  runPipeline: (stages?: string[], incremental = false) =>
    request<{ job: Job }>('/pipeline/run', {
      method: 'POST',
      body: JSON.stringify({ stages, incremental }),
    }),
  runStage: (stage: string) => api.runPipeline([stage]),
  pauseJob: (jobId: string) => request<{ job: Job }>(`/jobs/${jobId}/pause`, { method: 'POST' }),
  cancelJob: (jobId: string) => request<{ job: Job }>(`/jobs/${jobId}/cancel`, { method: 'POST' }),
  runDiagnostics: () => request<{ steps: DiagnosticStep[]; summary: Record<string, number>; reportPath: string }>('/diagnostics/offline', { method: 'POST' }),
  getLatestDiagnostics: () => request<{ report: { steps: DiagnosticStep[]; summary: Record<string, number> } | null }>('/diagnostics/offline/latest'),
  runFullAudit: () => request<{ rows: { category: string; name: string; status: string; message: string }[]; summary: Record<string, number> }>('/audit/full', { method: 'POST' }),
  getViewerStatus: () => request<{ viewerExists: boolean; graphExists: boolean }>('/generated/viewer/status'),
  generateHypotheses: (body: Record<string, unknown>) =>
    request<{ hypotheses: Hypothesis[] }>('/hypotheses/generate', { method: 'POST', body: JSON.stringify(body) }),
  getAudit: (limit = 100) => request<{ entries: { timestamp: string; event: string }[] }>(`/audit?limit=${limit}`),
  getState: () => request<{ state: Record<string, unknown> }>('/state'),
  updateState: (patch: Record<string, unknown>) =>
    request<{ state: Record<string, unknown> }>('/state', { method: 'PATCH', body: JSON.stringify(patch) }),

  async uploadFiles(files: FileList, mode: string): Promise<void> {
    await api.ensureSession();
    const formData = new FormData();
    for (const file of files) formData.append('documents', file);
    formData.append('mode', mode);
    const sessionId = localStorage.getItem(SESSION_KEY);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: sessionId ? { 'X-Session-Id': sessionId } : {},
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? 'upload_failed');
    }
  },

  async exportHypotheses(format: 'markdown' | 'pdf', body: Record<string, unknown>, labels: Record<string, string>): Promise<Blob> {
    const response = await fetch('/api/hypotheses/export', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ ...body, format, labels }),
    });
    if (!response.ok) throw new Error('export_failed');
    return response.blob();
  },
};

export function subscribeJob(jobId: string, handlers: {
  onUpdate: (job: Job) => void;
  onLog: (entry: { message: string }) => void;
}): () => void {
  const source = new EventSource(`/api/jobs/${jobId}/stream`);
  source.addEventListener('snapshot', (e) => handlers.onUpdate(JSON.parse(e.data)));
  source.addEventListener('update', (e) => handlers.onUpdate(JSON.parse(e.data)));
  source.addEventListener('log', (e) => handlers.onLog(JSON.parse(e.data)));
  return () => source.close();
}
