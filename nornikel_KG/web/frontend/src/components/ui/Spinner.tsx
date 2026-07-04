import { useTranslation } from 'react-i18next';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <div className="ui-spinner" role="status" aria-live="polite">
      <span className="ui-spinner-ring" aria-hidden="true" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}
