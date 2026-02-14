import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import KpiCard from './KpiCard';
import KpiCardSelector from './KpiCardSelector';
import { useKpiConfig } from '../../hooks/useKpiConfig';
import { KpiMetricKey, KpiMetricConfig, KpiCardData } from '../../types';

// Metric configurations
export const KPI_METRICS: KpiMetricConfig[] = [
    { key: 'spend', label: 'Gasto Total', format: 'currency', color: '#4B46ED' }, // Brand Blue (Logo)
    { key: 'impressions', label: 'Impressões', format: 'number', color: '#8b5cf6' },
    { key: 'cpm', label: 'CPM', format: 'currency', color: '#06b6d4' },
    { key: 'cpc', label: 'CPC', format: 'currency', color: '#f59e0b' },
    { key: 'ctr', label: 'CTR', format: 'percentage', color: '#10b981' },
    { key: 'clicks', label: 'Cliques', format: 'number', color: '#ec4899' },
    { key: 'conversions', label: 'Conversões', format: 'number', color: '#14b8a6' },
    { key: 'messages_initiated', label: 'Msgs Iniciadas', format: 'number', color: '#22c55e' },
    { key: 'conversion_rate', label: 'Taxa Conv.', format: 'percentage', color: '#a855f7' },
    { key: 'roas', label: 'ROAS', format: 'decimal', color: '#eab308' },
];

interface KpiCardsSectionProps {
    data: Record<KpiMetricKey, KpiCardData>;
}

const KpiCardsSection: React.FC<KpiCardsSectionProps> = ({ data }) => {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [draggedKey, setDraggedKey] = useState<KpiMetricKey | null>(null);

    const {
        reorderCards,
        getTopCardsOrdered,
        moveToSidebar,
    } = useKpiConfig();

    const topCards = getTopCardsOrdered();

    const handleDragStart = (key: KpiMetricKey) => {
        setDraggedKey(key);
    };

    const handleDragOver = (targetKey: KpiMetricKey) => {
        if (draggedKey && draggedKey !== targetKey) {
            reorderCards(draggedKey, targetKey, 'top');
        }
    };

    const handleDragEnd = () => {
        setDraggedKey(null);
    };

    // Handle drop from sidebar to top
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const key = e.dataTransfer.getData('kpi-key') as KpiMetricKey;
        if (key && !topCards.includes(key)) {
            // Will be handled by moveToTop in SidebarKpiCards
        }
    };

    return (
        <section
            className="space-y-4 mb-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {/* Header - Technical Style */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-brand-500 rounded-full"></div>
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">KPIs Principais</h2>
                </div>

                <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-500 
                     hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 rounded-sm transition-all"
                >
                    <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
                    PERSONALIZAR
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {topCards.map((key) => {
                    const metricConfig = KPI_METRICS.find((m) => m.key === key);
                    const cardData = data[key];

                    if (!metricConfig || !cardData) return null;

                    return (
                        <KpiCard
                            key={key}
                            data={cardData}
                            config={metricConfig}
                            isDragging={draggedKey === key}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onMoveToSidebar={() => moveToSidebar(key)}
                        />
                    );
                })}
            </div>

            {/* Card Selector Modal */}
            <KpiCardSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                allMetrics={KPI_METRICS}
            />
        </section>
    );
};

export default KpiCardsSection;
