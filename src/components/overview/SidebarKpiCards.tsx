import React, { useState } from 'react';
import { TrendingUp, TrendingDown, GripVertical, ArrowUp } from 'lucide-react';
import { KpiMetricKey, KpiCardData, KpiMetricConfig } from '../../types';
import { useKpiConfig } from '../../hooks/useKpiConfig';

interface SidebarKpiCardsProps {
    data: Record<KpiMetricKey, KpiCardData>;
    metrics: KpiMetricConfig[];
}

const formatValue = (value: number, format: string): string => {
    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
        case 'percentage':
            return `${value.toFixed(2)}%`;
        case 'decimal':
            return value.toFixed(2);
        case 'number':
        default:
            return new Intl.NumberFormat('pt-BR').format(Math.round(value));
    }
};

const SidebarKpiCards: React.FC<SidebarKpiCardsProps> = ({ data, metrics }) => {
    const [draggedKey, setDraggedKey] = useState<KpiMetricKey | null>(null);

    const {
        getSidebarCardsOrdered,
        reorderCards,
        moveToTop
    } = useKpiConfig();

    const sidebarCards = getSidebarCardsOrdered();

    if (sidebarCards.length === 0) return null;

    const handleDragStart = (e: React.DragEvent, key: KpiMetricKey) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('kpi-key', key);
        e.dataTransfer.setData('source-section', 'sidebar');
        setDraggedKey(key);
    };

    const handleDragOver = (e: React.DragEvent, targetKey: KpiMetricKey) => {
        e.preventDefault();
        if (draggedKey && draggedKey !== targetKey) {
            reorderCards(draggedKey, targetKey, 'sidebar');
        }
    };

    const handleDragEnd = () => {
        setDraggedKey(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const key = e.dataTransfer.getData('kpi-key') as KpiMetricKey;
        const sourceSection = e.dataTransfer.getData('source-section');

        if (key && sourceSection === 'top') {
            // Move from top to sidebar - handled by moveToSidebar in KpiCardsSection
        }
        setDraggedKey(null);
    };

    return (
        <div
            className="card-tech p-4 h-full"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-2">
                <div className="h-3 w-1 bg-neutral-300 rounded-full"></div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-widest">
                    Outras Métricas
                </h3>
            </div>

            <div className="space-y-2">
                {sidebarCards.map((key) => {
                    const metricConfig = metrics.find((m) => m.key === key);
                    const cardData = data[key];

                    if (!metricConfig || !cardData) return null;

                    const isPositive = cardData.changePercent >= 0;

                    return (
                        <div
                            key={key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, key)}
                            onDragOver={(e) => handleDragOver(e, key)}
                            onDragEnd={handleDragEnd}
                            className={`
                                p-3 rounded-sm bg-neutral-50 border border-neutral-100 
                                hover:border-neutral-300 transition-all duration-200 group
                                cursor-grab active:cursor-grabbing
                                ${draggedKey === key ? 'opacity-50 scale-95 border-brand-300' : ''}
                            `}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-3 h-3 text-neutral-300 group-hover:text-neutral-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                        {metricConfig.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Move to top button */}
                                    <button
                                        onClick={() => moveToTop(key)}
                                        className="p-1 rounded-sm text-neutral-300 hover:text-brand-500 
                                                 hover:bg-brand-50 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Mover para principais"
                                    >
                                        <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <div
                                        className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'
                                            }`}
                                    >
                                        {isPositive ? (
                                            <TrendingUp className="w-3 h-3" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3" />
                                        )}
                                        {Math.abs(cardData.changePercent).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <p className="text-lg font-display font-bold text-neutral-900 pl-5 tracking-tight">
                                {formatValue(cardData.value, metricConfig.format)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarKpiCards;
