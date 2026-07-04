/**
 * Knowledge Graph - Edge Styles Module
 * Colors synced with viz/shared/ontology_theme.json
 */

const EDGE_STYLES = {
    // Causal
    IMPROVES: { lineColor: '#27ae60', lineStyle: 'solid', baseWidth: 4, arrow: 'triangle', opacity: 0.85, category: 'causal' },
    DEGRADES: { lineColor: '#c0392b', lineStyle: 'dashed', dashPattern: [8, 4], baseWidth: 4, arrow: 'triangle', opacity: 0.85, category: 'causal' },
    CAUSES: { lineColor: '#e67e22', lineStyle: 'solid', baseWidth: 3.5, arrow: 'triangle', opacity: 0.8, category: 'causal' },
    MITIGATES: { lineColor: '#16a085', lineStyle: 'solid', baseWidth: 3.5, arrow: 'triangle', opacity: 0.8, category: 'causal' },
    HAS_FAILURE_MODE: { lineColor: '#8e44ad', lineStyle: 'dashed', dashPattern: [8, 4], baseWidth: 3, arrow: 'triangle', opacity: 0.75, category: 'causal' },
    REQUIRES_CONDITION: { lineColor: '#7f8c8d', lineStyle: 'dashed', dashPattern: [6, 3], baseWidth: 2, arrow: 'triangle-tee', opacity: 0.6, category: 'causal' },

    // Structural
    SYNTHESIZED_BY: { lineColor: '#2980b9', lineStyle: 'solid', baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'structural' },
    CHARACTERIZED_BY: { lineColor: '#3498db', lineStyle: 'dotted', dashPattern: [3, 3], baseWidth: 2, arrow: 'triangle', opacity: 0.65, category: 'structural' },
    APPLIED_IN: { lineColor: '#1abc9c', lineStyle: 'solid', baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'structural' },
    REQUIRES_EQUIPMENT: { lineColor: '#34495e', lineStyle: 'dashed', dashPattern: [5, 3], baseWidth: 2, arrow: 'triangle-tee', opacity: 0.6, category: 'structural' },
    USES_FEEDSTOCK: { lineColor: '#a1887f', lineStyle: 'solid', baseWidth: 2, arrow: 'triangle', opacity: 0.6, category: 'structural' },

    // Economic
    IMPACTS_COST: { lineColor: '#f39c12', lineStyle: 'dashed', dashPattern: [6, 4], baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'economic' },
    HAS_REGULATION: { lineColor: '#d35400', lineStyle: 'dotted', dashPattern: [2, 4], baseWidth: 2, arrow: 'tee', opacity: 0.6, category: 'economic' },

    // Analogy
    ANALOGOUS_TO: { lineColor: '#6c5ce7', lineStyle: 'dashed', dashPattern: [4, 4], baseWidth: 2, arrow: 'none', opacity: 0.55, category: 'analogy' },
    SUBSTITUTE_FOR: { lineColor: '#9b59b6', lineStyle: 'solid', baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'analogy' },

    // Taxonomic
    SUBCLASS_OF: { lineColor: '#bdc3c7', lineStyle: 'solid', baseWidth: 1.5, arrow: 'triangle', opacity: 0.5, category: 'taxonomic' },

    // Verification
    TESTED_BY: { lineColor: '#2c3e50', lineStyle: 'dashed', dashPattern: [4, 3], baseWidth: 2, arrow: 'triangle', opacity: 0.6, category: 'verification' },
    CONFIRMS: { lineColor: '#00b894', lineStyle: 'solid', baseWidth: 3, arrow: 'triangle', opacity: 0.8, category: 'verification' },
    REFUTES: { lineColor: '#d63031', lineStyle: 'solid', baseWidth: 3, arrow: 'triangle', opacity: 0.8, category: 'verification' },

    // Provenance
    SUPPORTED_BY: { lineColor: '#95a5a6', lineStyle: 'dotted', dashPattern: [2, 4], baseWidth: 1, arrow: 'triangle-tee', opacity: 0.4, category: 'provenance' },
    MENTIONS: { lineColor: '#b2bec3', lineStyle: 'dashed', dashPattern: [4, 4], baseWidth: 1, arrow: 'triangle-tee', opacity: 0.35, category: 'provenance' },
    RELATED_TO: { lineColor: '#636e72', lineStyle: 'dashed', dashPattern: [4, 4], baseWidth: 1.5, arrow: 'triangle', opacity: 0.45, category: 'provenance' },

    // Educational
    PREREQUISITE: { lineColor: '#e17055', lineStyle: 'solid', baseWidth: 4, arrow: 'triangle', opacity: 0.8, category: 'structural' },
    TESTS: { lineColor: '#fdcb6e', lineStyle: 'solid', baseWidth: 4, arrow: 'triangle', opacity: 0.8, category: 'verification' },
    ELABORATES: { lineColor: '#0984e3', lineStyle: 'dashed', dashPattern: [8, 4], baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'structural' },
    EXAMPLE_OF: { lineColor: '#a29bfe', lineStyle: 'dotted', dashPattern: [2, 4], baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'structural' },
    PARALLEL: { lineColor: '#81ecec', lineStyle: 'solid', baseWidth: 2.5, arrow: 'triangle', opacity: 0.6, category: 'structural' },
    REVISION_OF: { lineColor: '#55efc4', lineStyle: 'dashed', dashPattern: [6, 3], baseWidth: 2.5, arrow: 'triangle', opacity: 0.7, category: 'structural' },
    HINT_FORWARD: { lineColor: '#74b9ff', lineStyle: 'dotted', dashPattern: [2, 6], baseWidth: 1, arrow: 'tee', opacity: 0.5, category: 'provenance' },
    REFER_BACK: { lineColor: '#fab1a0', lineStyle: 'dotted', dashPattern: [2, 6], baseWidth: 1, arrow: 'tee', opacity: 0.5, category: 'provenance' },

    UNKNOWN: { lineColor: '#64748b', lineStyle: 'dashed', dashPattern: [3, 3], baseWidth: 1, arrow: 'triangle', opacity: 0.3, category: 'other' },
};

function generateEdgeStyles(options = {}) {
    const { interClusterMultiplier = 1.5 } = options;
    const styles = [];

    styles.push({
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'opacity': 0.6,
            'curve-style': 'bezier',
            'control-point-step-size': 40,
            'transition-property': 'opacity, width',
            'transition-duration': '250ms',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'color': '#4a5568',
            'text-outline-width': 2,
            'text-outline-color': '#ffffff',
        },
    });

    Object.entries(EDGE_STYLES).forEach(([type, config]) => {
        const style = {
            'line-color': config.lineColor,
            'target-arrow-color': config.lineColor,
            'source-arrow-color': config.lineColor,
            'target-arrow-shape': config.arrow,
            'width': config.baseWidth,
            'opacity': config.opacity,
        };
        if (config.lineStyle === 'dashed') {
            style['line-style'] = 'dashed';
            style['line-dash-pattern'] = config.dashPattern || [6, 3];
        } else if (config.lineStyle === 'dotted') {
            style['line-style'] = 'dotted';
            style['line-dash-pattern'] = config.dashPattern || [2, 4];
        } else {
            style['line-style'] = 'solid';
        }
        styles.push({ selector: `edge[type="${type}"]`, style });
        styles.push({
            selector: `edge[type="${type}"][is_inter_cluster_edge]`,
            style: {
                'width': config.baseWidth * interClusterMultiplier,
                'opacity': Math.min(1, config.opacity + 0.1),
                'z-index': 10,
            },
        });
    });

    styles.push(
        { selector: 'edge:not([type])', style: { 'line-color': '#64748b', 'opacity': 0.3, 'width': 1, 'line-style': 'dashed' } },
        { selector: 'edge:selected', style: { 'opacity': 1, 'z-index': 1000, 'line-color': '#f39c12', 'target-arrow-color': '#f39c12' } },
        { selector: 'edge.highlighted', style: { 'opacity': 1, 'z-index': 998 } },
        { selector: 'edge.dimmed', style: { 'opacity': 0.15 } },
    );

    return styles;
}

function getEdgeStyle(type) { return EDGE_STYLES[type] || EDGE_STYLES.UNKNOWN; }
function getEdgeColor(type) { return EDGE_STYLES[type]?.lineColor || '#64748b'; }
function getEdgeCategory(type) { return EDGE_STYLES[type]?.category || 'other'; }
function isCausalEdge(type) { return EDGE_STYLES[type]?.category === 'causal'; }
function isHypothesisRelevantEdge(type) {
    const c = EDGE_STYLES[type]?.category;
    return c === 'causal' || c === 'verification';
}
function isEconomicEdge(type) { return EDGE_STYLES[type]?.category === 'economic'; }
function isStrongRelationship(type) { return (EDGE_STYLES[type]?.baseWidth ?? 0) >= 4; }
function isEducationalEdge(type) {
    return ['PREREQUISITE', 'ELABORATES', 'TESTS', 'EXAMPLE_OF'].includes(type);
}

function getEdgesByCategory() {
    const categories = {};
    Object.entries(EDGE_STYLES).forEach(([type, config]) => {
        const cat = config.category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(type);
    });
    return categories;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EDGE_STYLES, generateEdgeStyles, getEdgeStyle, getEdgeColor, getEdgeCategory,
        isCausalEdge, isHypothesisRelevantEdge, isEconomicEdge, isStrongRelationship,
        isEducationalEdge, getEdgesByCategory,
    };
}
if (typeof window !== 'undefined') {
    window.EdgeStyles = {
        EDGE_STYLES, generateEdgeStyles, getEdgeStyle, getEdgeColor, getEdgeCategory,
        isCausalEdge, isHypothesisRelevantEdge, isEconomicEdge, isStrongRelationship,
        isEducationalEdge, getEdgesByCategory,
    };
}
