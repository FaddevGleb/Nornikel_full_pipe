import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './api/client';
import { ContentTopBar } from './components/ContentTopBar';
import { SidebarNav } from './components/SidebarNav';
import { CommandPalette, type ViewId } from './components/CommandPalette';
import { DashboardView, PipelineView } from './components/PipelineDashboard';
import { GraphView } from './components/GraphView';
import { DiagnosticsView, AuditView } from './components/DiagnosticsSettings';
import { HypothesesView } from './components/HypothesesView';
import { AccelmatView } from './components/AccelmatView';
import { FeynmanChat } from './components/FeynmanChat';
import { Toast } from './components/ui';
import { GraphRefreshProvider } from './context/GraphRefreshContext';
import type { ConfigStatus } from './utils/modeLabel';

export default function App() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewId>('dashboard');
  const [config, setConfig] = useState<ConfigStatus>({});
  const [toast, setToast] = useState('');
  const [modeWarning, setModeWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<string | null>(null);
  const [discussContext, setDiscussContext] = useState<{ slug: string; suggestionKey: string; goal: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pipelineRunRequest, setPipelineRunRequest] = useState(0);

  const refreshConfig = useCallback(async () => {
    try {
      const cfg = await api.getConfigStatus();
      setConfig(cfg as ConfigStatus);
    } catch {
      setToast(t('errors.generic'));
    }
  }, [t]);

  useEffect(() => {
    api.ensureSession().catch(() => setToast(t('errors.generic')));
    const theme = 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('k2-18-theme', theme);
    refreshConfig();
  }, [refreshConfig, t]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleDiscussHypothesis(context: { slug: string; suggestionKey: string; goal: string }) {
    setDiscussContext(context);
    setView('feynman');
  }

  async function switchMode(mode: string, force = false) {
    try {
      await api.setMode(mode, force);
      await refreshConfig();
      setModeWarning(false);
      setPendingMode(null);
      showToast(mode === 'offline' ? t('mode.offline') : t('mode.online'));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('mode_switch_warning')) {
        setModeWarning(true);
        setPendingMode(mode);
      } else {
        showToast(t('errors.generic'));
      }
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function navigate(next: ViewId) {
    setView(next);
    setNavOpen(false);
  }

  return (
    <GraphRefreshProvider>
    <div className="app-shell">
      <SidebarNav view={view} onNavigate={navigate} open={navOpen} onClose={() => setNavOpen(false)} />

      <ContentTopBar config={config} onToggleNav={() => setNavOpen((o) => !o)} navOpen={navOpen} />

      <main className={`content${view === 'graph' ? ' content-full-bleed' : ''}`}>
        {view === 'dashboard' && <DashboardView config={config} onConfigRefresh={refreshConfig} />}
        {view === 'pipeline' && <PipelineView runRequest={pipelineRunRequest} />}
        {view === 'graph' && <GraphView active={view === 'graph'} />}
        {view === 'hypotheses' && <HypothesesView />}
        {view === 'accelmat' && <AccelmatView onDiscussHypothesis={handleDiscussHypothesis} />}
        {view === 'feynman' && (
          <FeynmanChat seedContext={discussContext} onNavigateToAccelmat={() => setView('accelmat')} />
        )}
        {view === 'diagnostics' && <DiagnosticsView />}
        {view === 'audit' && <AuditView />}
      </main>

      <footer className="app-footer">{t('brand.footer')}</footer>

      <div className="toast-stack">
        {modeWarning && (
          <Toast variant="warn" message={t('mode.regeneration_warning')}>
            <button
              type="button"
              className="btn-secondary btn-inline"
              onClick={() => pendingMode && switchMode(pendingMode, true)}
            >
              {t('mode.confirm_switch')}
            </button>
          </Toast>
        )}
        {toast && <Toast message={toast} />}
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        onRunPipeline={() => {
          setView('pipeline');
          setPipelineRunRequest((n) => n + 1);
        }}
        onSetMode={(mode) => switchMode(mode)}
      />
    </div>
    </GraphRefreshProvider>
  );
}
