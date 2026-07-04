import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type ViewId = 'dashboard' | 'pipeline' | 'graph' | 'hypotheses' | 'accelmat' | 'feynman' | 'diagnostics' | 'audit';

interface CommandItem {
  id: string;
  label: string;
  group: string;
  view?: ViewId;
  action?: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewId) => void;
  onRunPipeline?: () => void;
  onSetMode?: (mode: string) => void;
}

export function CommandPalette({ open, onClose, onNavigate, onRunPipeline, onSetMode }: CommandPaletteProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const commands: CommandItem[] = [
    { id: 'dashboard', label: t('nav.dashboard'), group: t('nav.group_workspace'), view: 'dashboard' },
    { id: 'pipeline', label: t('nav.pipeline'), group: t('nav.group_data'), view: 'pipeline' },
    { id: 'graph', label: t('nav.graph'), group: t('nav.group_data'), view: 'graph' },
    { id: 'accelmat', label: t('nav.accelmat'), group: t('nav.group_analytics'), view: 'accelmat' },
    { id: 'feynman', label: t('nav.feynman'), group: t('nav.group_analytics'), view: 'feynman' },
    { id: 'diagnostics', label: t('nav.diagnostics'), group: t('nav.group_system'), view: 'diagnostics' },
    { id: 'audit', label: t('nav.audit'), group: t('nav.group_system'), view: 'audit' },
    { id: 'run-pipeline', label: t('pipeline.run_full'), group: t('nav.group_actions'), action: onRunPipeline },
    { id: 'mode-online', label: t('mode.switch_online'), group: t('nav.group_actions'), action: () => onSetMode?.('online') },
    { id: 'mode-offline', label: t('mode.switch_offline'), group: t('nav.group_actions'), action: () => onSetMode?.('offline') },
  ].filter((c) => c.view || c.action);

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.group.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setQuery('');
      setSelected(0);
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function execute(item: CommandItem) {
    if (item.view) onNavigate(item.view);
    else item.action?.();
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      execute(filtered[selected]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <dialog ref={dialogRef} className="command-palette" onClose={onClose} aria-label={t('common.command_palette')}>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
        onKeyDown={onKeyDown}
        placeholder={t('common.search_commands')}
        aria-label={t('common.search_commands')}
      />
      <ul role="listbox">
        {filtered.map((item, i) => (
          <li
            key={item.id}
            role="option"
            aria-selected={i === selected}
            className={i === selected ? 'selected' : ''}
            onClick={() => execute(item)}
            onMouseEnter={() => setSelected(i)}
          >
            <strong>{item.label}</strong>
            <small>{item.group}</small>
          </li>
        ))}
        {filtered.length === 0 && <li className="command-empty">{t('common.no_commands')}</li>}
      </ul>
    </dialog>
  );
}
