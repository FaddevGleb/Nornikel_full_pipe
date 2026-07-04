import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, subscribeGraphStream } from '../api/client';

interface GraphRefreshContextValue {
  revision: number;
  bumpRevision: () => void;
  refreshGraph: (runMetrics?: boolean) => Promise<void>;
}

const GraphRefreshContext = createContext<GraphRefreshContextValue | null>(null);

export function GraphRefreshProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);

  const bumpRevision = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  const refreshGraph = useCallback(async (runMetrics = false) => {
    await api.syncGraph(runMetrics);
    bumpRevision();
  }, [bumpRevision]);

  useEffect(() => {
    const cleanup = subscribeGraphStream({
      onUpdate: () => bumpRevision(),
    });
    return cleanup;
  }, [bumpRevision]);

  const value = useMemo(
    () => ({ revision, bumpRevision, refreshGraph }),
    [revision, bumpRevision, refreshGraph],
  );

  return (
    <GraphRefreshContext.Provider value={value}>
      {children}
    </GraphRefreshContext.Provider>
  );
}

export function useGraphRefresh() {
  const ctx = useContext(GraphRefreshContext);
  if (!ctx) {
    throw new Error('useGraphRefresh must be used within GraphRefreshProvider');
  }
  return ctx;
}
