interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      <img src="/brand/lenta.svg" alt="" className="ui-empty-lenta" aria-hidden="true" />
      <p className="ui-empty-title">{title}</p>
      {description && <p className="ui-empty-desc">{description}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}
