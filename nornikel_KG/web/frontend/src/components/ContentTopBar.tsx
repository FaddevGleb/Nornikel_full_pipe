import { useTranslation } from 'react-i18next';
import { ModeIndicator } from './ModeIndicator';
import type { ConfigStatus } from '../utils/modeLabel';

interface ContentTopBarProps {
  config: ConfigStatus;
  onToggleNav: () => void;
  navOpen: boolean;
}

export function ContentTopBar({ config, onToggleNav, navOpen }: ContentTopBarProps) {
  const { t } = useTranslation();

  return (
    <header className="content-topbar">
      <button
        type="button"
        className="nav-burger"
        onClick={onToggleNav}
        aria-expanded={navOpen}
        aria-controls="app-sidebar"
        aria-label={t('nav.toggle_menu')}
      >
        <span />
        <span />
        <span />
      </button>
      <ModeIndicator config={config} />
    </header>
  );
}
