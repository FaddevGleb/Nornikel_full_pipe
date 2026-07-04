import i18n from '../i18n';

export function nodeTypeLabel(type: string | undefined | null): string {
  const trimmed = type?.trim();
  if (!trimmed) {
    return i18n.t('ontology.node_types._empty', { defaultValue: 'Без типа' });
  }
  return i18n.t(`ontology.node_types.${trimmed}`, { defaultValue: trimmed });
}

export function edgeTypeLabel(type: string | undefined | null): string {
  const key = type?.trim() || 'default';
  return i18n.t(`ontology.edge_types.${key}`, { defaultValue: key });
}

export function formatNodeTypesSummary(nodeTypes: Record<string, number>): string {
  return Object.entries(nodeTypes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `${nodeTypeLabel(type)}: ${count}`)
    .join(', ');
}
