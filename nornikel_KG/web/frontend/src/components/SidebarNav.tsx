import { useTranslation } from 'react-i18next';
import { NornickelLogo } from './NornickelLogo';
import type { ViewId } from './CommandPalette';

export interface NavGroup {
  id: string;
  labelKey: string;
  items: ViewId[];
}

export const NAV_GROUPS: NavGroup[] = [
  { id: 'workspace', labelKey: 'nav.group_workspace', items: ['dashboard'] },
  { id: 'data', labelKey: 'nav.group_data', items: ['pipeline', 'graph'] },
  { id: 'analytics', labelKey: 'nav.group_analytics', items: ['accelmat', 'feynman'] },
  { id: 'system', labelKey: 'nav.group_system', items: ['diagnostics', 'audit'] },
];

const VIEW_LABEL_KEYS: Record<ViewId, string> = {
  dashboard: 'nav.dashboard',
  pipeline: 'nav.pipeline',
  graph: 'nav.graph',
  hypotheses: 'nav.hypotheses',
  accelmat: 'nav.accelmat',
  feynman: 'nav.feynman',
  diagnostics: 'nav.diagnostics',
  audit: 'nav.audit',
};

interface SidebarNavProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  open: boolean;
  onClose: () => void;
}

export function SidebarNav({ view, onNavigate, open, onClose }: SidebarNavProps) {
  const { t } = useTranslation();

  function handleNav(id: ViewId) {
    onNavigate(id);
    onClose();
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`app-sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <NornickelLogo className="sidebar-logo" />
        </div>
        <nav id="app-sidebar" className="sidebar-nav" aria-label={t('nav.main')}>
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="nav-group">
              <span className="nav-group-label">{t(group.labelKey)}</span>
              {group.items.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-item${view === id ? ' active' : ''}`}
                  onClick={() => handleNav(id)}
                  aria-current={view === id ? 'page' : undefined}
                >
                  {t(VIEW_LABEL_KEYS[id])}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
