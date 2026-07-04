/**
 * Russian labels for ontology types (standalone viz, no react-i18next).
 * Populated from window.ontologyTheme.labelsRu when embedded in HTML.
 */
(function () {
    const fallbackLabels = {
        node_types: {
            _empty: 'Без типа',
            Unknown: 'Неизвестный тип',
            Material: 'Материал',
            Property: 'Свойство',
            SynthesisMethod: 'Метод синтеза',
            CharacterizationMethod: 'Метод характеризации',
            Mechanism: 'Механизм',
            FailureMode: 'Режим отказа',
            Condition: 'Условие',
            Application: 'Применение',
            KPI_Target: 'Целевой KPI',
            Source: 'Источник',
            Concept: 'Концепт',
            Chunk: 'Фрагмент',
            Assessment: 'Оценка',
            Equipment: 'Оборудование',
            BusinessMetric: 'Бизнес-метрика',
            Constraint: 'Ограничение',
            InternalExperiment: 'Внутренний эксперимент',
            HypothesisRecord: 'Запись гипотезы',
        },
        edge_types: {
            default: 'Связь',
            IMPROVES: 'Улучшает',
            DEGRADES: 'Ухудшает',
            CAUSES: 'Вызывает',
            MITIGATES: 'Устраняет',
            REQUIRES_CONDITION: 'Требует условие',
            SYNTHESIZED_BY: 'Синтезирован методом',
            CHARACTERIZED_BY: 'Характеризуется методом',
            HAS_FAILURE_MODE: 'Имеет режим отказа',
            APPLIED_IN: 'Применяется в',
            SUPPORTED_BY: 'Подтверждается источником',
            SUBCLASS_OF: 'Подкласс',
            REQUIRES_EQUIPMENT: 'Требует оборудование',
            USES_FEEDSTOCK: 'Использует сырьё',
            IMPACTS_COST: 'Влияет на стоимость',
            HAS_REGULATION: 'Регулируется',
            SUBSTITUTE_FOR: 'Заменяет',
            ANALOGOUS_TO: 'Аналогичен',
            TESTED_BY: 'Проверяется экспериментом',
            CONFIRMS: 'Подтверждает',
            REFUTES: 'Опровергает',
            RELATED_TO: 'Связан с',
            MENTIONS: 'Упоминает',
            PREREQUISITE: 'Предпосылка',
            ELABORATES: 'Детализирует',
            EXAMPLE_OF: 'Пример',
            TESTS: 'Тестирует',
            PARALLEL: 'Параллельная тема',
            REVISION_OF: 'Версия',
            HINT_FORWARD: 'Намёк вперёд',
            REFER_BACK: 'Ссылка назад',
        },
        edge_categories: {
            causal: 'Причинные',
            structural: 'Структурные',
            economic: 'Экономические',
            analogy: 'Аналогии',
            taxonomic: 'Таксономические',
            verification: 'Верификация',
            provenance: 'Прослеживаемость',
            other: 'Прочие',
        },
    };

    function getLabels() {
        return window.ontologyTheme?.labelsRu ?? fallbackLabels;
    }

    function nodeTypeLabel(type) {
        const key = (type || '').trim();
        if (!key) return getLabels().node_types._empty;
        return getLabels().node_types[key] ?? key;
    }

    function edgeTypeLabel(type) {
        const key = (type || '').trim() || 'default';
        return getLabels().edge_types[key] ?? key;
    }

    function edgeCategoryLabel(category) {
        return getLabels().edge_categories[category] ?? category;
    }

    window.OntologyLabels = {
        nodeTypeLabel,
        edgeTypeLabel,
        edgeCategoryLabel,
        getLabels,
    };
})();
