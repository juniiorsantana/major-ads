/**
 * useKpiConfig - Wrapper hook for KPI layout configuration
 * Uses Zustand store for shared state across all components
 */

import { useAppStore } from '../stores/useAppStore';

export function useKpiConfig() {
    const kpiLayout = useAppStore((state) => state.kpiLayout);
    const toggleKpiVisibility = useAppStore((state) => state.toggleKpiVisibility);
    const moveKpiToTop = useAppStore((state) => state.moveKpiToTop);
    const moveKpiToSidebar = useAppStore((state) => state.moveKpiToSidebar);
    const reorderKpis = useAppStore((state) => state.reorderKpis);
    const resetKpiLayout = useAppStore((state) => state.resetKpiLayout);

    return {
        config: kpiLayout,
        toggleCardVisibility: toggleKpiVisibility,
        moveToTop: moveKpiToTop,
        moveToSidebar: moveKpiToSidebar,
        reorderCards: reorderKpis,
        resetToDefaults: resetKpiLayout,
        getTopCardsOrdered: () => kpiLayout.topCards,
        getSidebarCardsOrdered: () => kpiLayout.sidebarCards,
        getVisibleCardsOrdered: () => [...kpiLayout.topCards, ...kpiLayout.sidebarCards],
    };
}
