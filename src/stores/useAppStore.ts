/**
 * App Store - Zustand
 * State management centralizado substituindo localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FilterState, KpiMetricKey, KpiLayoutConfig } from '../types';

interface MetaUser {
    appUserId: string;
    metaUserId: string;
    name: string;
    email: string;
}

// Default top 5 KPIs for main row
const DEFAULT_TOP_CARDS: KpiMetricKey[] = [
    'impressions',
    'cpm',
    'ctr',
    'cpc',
    'clicks',
];

// Default sidebar KPIs
const DEFAULT_SIDEBAR_CARDS: KpiMetricKey[] = [
    'spend',
    'messages_initiated',
    'conversion_rate',
    'roas',
];

interface AppState {
    // Business Manager Selection
    selectedBmIds: string[];
    setSelectedBmIds: (ids: string[]) => void;
    toggleBmSelection: (id: string) => void;
    clearBmSelection: () => void;

    // Meta User Connection
    metaUser: MetaUser | null;
    setMetaUser: (user: MetaUser | null) => void;

    // Filter State
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;

    // KPI Layout
    kpiLayout: KpiLayoutConfig;
    setKpiLayout: (layout: KpiLayoutConfig) => void;
    toggleKpiVisibility: (key: KpiMetricKey) => void;
    moveKpiToTop: (key: KpiMetricKey) => void;
    moveKpiToSidebar: (key: KpiMetricKey) => void;
    reorderKpis: (draggedKey: KpiMetricKey, targetKey: KpiMetricKey, section: 'top' | 'sidebar') => void;
    resetKpiLayout: () => void;
}

const DEFAULT_FILTERS: FilterState = {
    period: 'last_7_days',
    comparison: 'previous_period',
    grouping: 'day',
};

const DEFAULT_KPI_LAYOUT: KpiLayoutConfig = {
    visibleCards: [...DEFAULT_TOP_CARDS, ...DEFAULT_SIDEBAR_CARDS],
    cardOrder: [...DEFAULT_TOP_CARDS, ...DEFAULT_SIDEBAR_CARDS],
    topCards: [...DEFAULT_TOP_CARDS],
    sidebarCards: [...DEFAULT_SIDEBAR_CARDS],
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Business Manager Selection
            selectedBmIds: [],
            setSelectedBmIds: (ids) => set({ selectedBmIds: ids }),
            toggleBmSelection: (id) =>
                set((state) => ({
                    selectedBmIds: state.selectedBmIds.includes(id)
                        ? state.selectedBmIds.filter((bmId) => bmId !== id)
                        : [...state.selectedBmIds, id],
                })),
            clearBmSelection: () => set({ selectedBmIds: [] }),

            // Meta User Connection
            metaUser: null,
            setMetaUser: (user) => set({ metaUser: user }),

            // Filter State
            filters: DEFAULT_FILTERS,
            setFilters: (filters) => set({ filters }),
            updateFilter: (key, value) =>
                set((state) => ({
                    filters: { ...state.filters, [key]: value },
                })),

            // KPI Layout
            kpiLayout: DEFAULT_KPI_LAYOUT,
            setKpiLayout: (layout) => set({ kpiLayout: layout }),

            toggleKpiVisibility: (key) =>
                set((state) => {
                    const isInTop = state.kpiLayout.topCards.includes(key);
                    const isInSidebar = state.kpiLayout.sidebarCards.includes(key);
                    const isVisible = isInTop || isInSidebar;

                    if (isVisible) {
                        // Remove from wherever it is
                        return {
                            kpiLayout: {
                                ...state.kpiLayout,
                                visibleCards: state.kpiLayout.visibleCards.filter((k) => k !== key),
                                topCards: state.kpiLayout.topCards.filter((k) => k !== key),
                                sidebarCards: state.kpiLayout.sidebarCards.filter((k) => k !== key),
                            },
                        };
                    } else {
                        // Add to sidebar by default
                        return {
                            kpiLayout: {
                                ...state.kpiLayout,
                                visibleCards: [...state.kpiLayout.visibleCards, key],
                                sidebarCards: [...state.kpiLayout.sidebarCards, key],
                            },
                        };
                    }
                }),

            moveKpiToTop: (key) =>
                set((state) => {
                    if (state.kpiLayout.topCards.includes(key)) return state;

                    if (state.kpiLayout.topCards.length >= 5) {
                        // If top is full, swap: move last top card to sidebar
                        const lastTopCard = state.kpiLayout.topCards[state.kpiLayout.topCards.length - 1];
                        return {
                            kpiLayout: {
                                ...state.kpiLayout,
                                topCards: [...state.kpiLayout.topCards.slice(0, -1), key],
                                sidebarCards: [lastTopCard, ...state.kpiLayout.sidebarCards.filter((k) => k !== key)],
                            },
                        };
                    }

                    return {
                        kpiLayout: {
                            ...state.kpiLayout,
                            topCards: [...state.kpiLayout.topCards, key],
                            sidebarCards: state.kpiLayout.sidebarCards.filter((k) => k !== key),
                            visibleCards: state.kpiLayout.visibleCards.includes(key)
                                ? state.kpiLayout.visibleCards
                                : [...state.kpiLayout.visibleCards, key],
                        },
                    };
                }),

            moveKpiToSidebar: (key) =>
                set((state) => {
                    if (state.kpiLayout.sidebarCards.includes(key)) return state;
                    return {
                        kpiLayout: {
                            ...state.kpiLayout,
                            topCards: state.kpiLayout.topCards.filter((k) => k !== key),
                            sidebarCards: [...state.kpiLayout.sidebarCards, key],
                            visibleCards: state.kpiLayout.visibleCards.includes(key)
                                ? state.kpiLayout.visibleCards
                                : [...state.kpiLayout.visibleCards, key],
                        },
                    };
                }),

            reorderKpis: (draggedKey, targetKey, section) =>
                set((state) => {
                    if (draggedKey === targetKey) return state;

                    const sourceArray = section === 'top'
                        ? [...state.kpiLayout.topCards]
                        : [...state.kpiLayout.sidebarCards];

                    const draggedIndex = sourceArray.indexOf(draggedKey);
                    const targetIndex = sourceArray.indexOf(targetKey);

                    if (draggedIndex === -1 || targetIndex === -1) return state;

                    // Remove dragged item and insert at target position
                    sourceArray.splice(draggedIndex, 1);
                    sourceArray.splice(targetIndex, 0, draggedKey);

                    return {
                        kpiLayout: {
                            ...state.kpiLayout,
                            [section === 'top' ? 'topCards' : 'sidebarCards']: sourceArray,
                        },
                    };
                }),

            resetKpiLayout: () =>
                set({ kpiLayout: DEFAULT_KPI_LAYOUT }),
        }),
        {
            name: 'meta-ads-app-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                selectedBmIds: state.selectedBmIds,
                metaUser: state.metaUser,
                filters: state.filters,
                kpiLayout: state.kpiLayout,
            }),
        }
    )
);
