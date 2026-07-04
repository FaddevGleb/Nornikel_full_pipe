import theme from '../../../../viz/shared/ontology_theme.json';

export type EdgeStyle = { color: string; dashed: boolean };

export const NODE_TYPE_COLORS: Record<string, string> = theme.nodeColors;
export const EDGE_TYPE_STYLES: Record<string, EdgeStyle> = theme.edgeStyles;
export const ONTOLOGY_LABELS_RU = theme.labelsRu;

export function resolveNodeColor(type: string | undefined | null): string {
  const key = type?.trim() || 'Unknown';
  return NODE_TYPE_COLORS[key] ?? NODE_TYPE_COLORS.default;
}

export function resolveEdgeStyle(type: string | undefined | null): EdgeStyle {
  const key = type?.trim() || 'default';
  return EDGE_TYPE_STYLES[key] ?? EDGE_TYPE_STYLES.default;
}

export function mergeNodeColors(apiColors?: Record<string, string> | null): Record<string, string> {
  return { ...NODE_TYPE_COLORS, ...(apiColors ?? {}) };
}

/** @deprecated use NODE_TYPE_COLORS */
export const DEFAULT_COLORS = NODE_TYPE_COLORS;

/** @deprecated use EDGE_TYPE_STYLES */
export const EDGE_STYLES = EDGE_TYPE_STYLES;
