import React, { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, GripVertical } from 'lucide-react';
import Sparkline from './Sparkline';
import { KpiMetricKey, KpiCardData, KpiMetricConfig } from '../../types';

interface KpiCardProps {
    data: KpiCardData;
    config: KpiMetricConfig;
    isDragging?: boolean;
    onDragStart?: (key: KpiMetricKey) => void;
    onDragOver?: (key: KpiMetricKey) => void;
    onDragEnd?: () => void;
    onMoveToSidebar?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
    data,
    config,
    isDragging = false,
    onDragStart,
    onDragOver,
    onDragEnd,
    onMoveToSidebar,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const formatValue = (value: number): string => {
        switch (config.format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(value);
            case 'percentage':
                return `${value.toFixed(2)}%`;
            case 'decimal':
                return value.toFixed(2);
            case 'number':
            default:
                return new Intl.NumberFormat('pt-BR').format(value);
        }
    };

    const getTrendIcon = () => {
        if (data.changePercent > 0) {
            return <TrendingUp className="w-3 h-3" />;
        } else if (data.changePercent < 0) {
            return <TrendingDown className="w-3 h-3" />;
        }
        return <Minus className="w-3 h-3" />;
    };

    const getTrendColor = () => {
        // High contrast trend colors
        const isSpendMetric = data.key === 'spend' || data.key === 'cpc' || data.key === 'cpm';

        if (data.changePercent > 0) {
            return isSpendMetric ? 'text-rose-600 bg-rose-100' : 'text-emerald-600 bg-emerald-100';
        } else if (data.changePercent < 0) {
            return isSpendMetric ? 'text-emerald-600 bg-emerald-100' : 'text-rose-600 bg-rose-100';
        }
        return 'text-neutral-500 bg-neutral-100';
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('kpi-key', data.key);
        e.dataTransfer.setData('source-section', 'top');
        onDragStart?.(data.key);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        onDragOver?.(data.key);
    };

    return (
        <div
            ref={cardRef}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            /* Tech Card Style: Sharp, Bordered, Shadow-Tech */
            className={`
        relative card-tech p-4 cursor-grab active:cursor-grabbing group
        ${isDragging ? 'opacity-40 scale-95 ring-2 ring-brand-500 ring-offset-2' : ''}
      `}
        >
            {/* Drag Handle - Visible on Hover */}
            <div className="absolute top-2 right-2 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-500 transition-all cursor-move">
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Label - Technical Monospace-ish feel */}
            <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: config.color }}></span>
                {config.label}
            </p>

            {/* Value - Massive Display Font */}
            <h3 className="text-2xl font-display font-bold text-neutral-900 mb-3 tracking-tight">
                {formatValue(data.value)}
            </h3>

            {/* Trend Indicator - Pill Shape */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium border border-transparent ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="font-mono">{Math.abs(data.changePercent).toFixed(1)}%</span>
                <span className="text-neutral-400 font-normal ml-0.5">vs ant.</span>
            </div>

            {/* Tooltip with Sparkline - Sharp edges */}
            {showTooltip && data.sparklineData.length > 0 && (
                <div
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 
                     bg-neutral-900 text-white rounded-sm p-3 shadow-tech-xl border border-neutral-700
                     animate-in fade-in zoom-in-95 duration-150 w-48 pointer-events-none"
                >
                    <div className="flex justify-between items-center mb-2 border-b border-neutral-800 pb-1">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Trend 7D</span>
                        <span className="text-[10px] font-mono text-neutral-300">{formatValue(data.previousValue)}</span>
                    </div>

                    <Sparkline
                        data={data.sparklineData}
                        color={config.color} // You might want to override this with a high-contrast color if needed
                        width={180}
                        height={40}
                    />

                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-neutral-900 border-r border-b border-neutral-700 rotate-45 transform translate-y-[-5px]"></div>
                </div>
            )}
        </div>
    );
};

export default KpiCard;
