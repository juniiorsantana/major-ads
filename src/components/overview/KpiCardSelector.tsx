import React, { useState } from 'react';
import { X, Check, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { KpiMetricKey, KpiMetricConfig } from '../../types';
import { useKpiConfig } from '../../hooks/useKpiConfig';

interface KpiCardSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    allMetrics: KpiMetricConfig[];
}

const KpiCardSelector: React.FC<KpiCardSelectorProps> = ({
    isOpen,
    onClose,
    allMetrics,
}) => {
    const [draggedKey, setDraggedKey] = useState<KpiMetricKey | null>(null);

    const {
        config,
        toggleCardVisibility,
        moveToTop,
        moveToSidebar,
        reorderCards,
        resetToDefaults,
    } = useKpiConfig();

    if (!isOpen) return null;

    const isInTop = (key: KpiMetricKey) => config.topCards.includes(key);
    const isInSidebar = (key: KpiMetricKey) => config.sidebarCards.includes(key);
    const isVisible = (key: KpiMetricKey) => isInTop(key) || isInSidebar(key);

    const handleDragStart = (key: KpiMetricKey) => {
        setDraggedKey(key);
    };

    const handleDragEnd = () => {
        setDraggedKey(null);
    };

    const handleToggle = (key: KpiMetricKey) => {
        toggleCardVisibility(key);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Personalizar Cards</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-slate-500 mb-4">
                        Clique no ✓ para mostrar/ocultar. Use as setas para mover entre seções.
                    </p>

                    {/* Top Cards Section */}
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Principais (máx. 5)
                        </h4>
                        <div className="space-y-2">
                            {config.topCards.map((key) => {
                                const metric = allMetrics.find((m) => m.key === key);
                                if (!metric) return null;
                                const isDragging = draggedKey === key;

                                return (
                                    <div
                                        key={key}
                                        draggable
                                        onDragStart={() => handleDragStart(key)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (draggedKey && draggedKey !== key) {
                                                reorderCards(draggedKey, key, 'top');
                                            }
                                        }}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl border cursor-grab
                                            transition-all duration-150
                                            bg-blue-50 border-blue-200 hover:border-blue-300
                                            ${isDragging ? 'opacity-50 scale-95' : ''}
                                        `}
                                    >
                                        <GripVertical className="w-4 h-4 text-slate-300" />
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: metric.color }}
                                        />
                                        <span className="flex-1 font-medium text-slate-700">
                                            {metric.label}
                                        </span>
                                        <button
                                            onClick={() => moveToSidebar(key)}
                                            className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
                                            title="Mover para secundários"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggle(key)}
                                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar Cards Section */}
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Secundários (lateral)
                        </h4>
                        <div className="space-y-2">
                            {config.sidebarCards.map((key) => {
                                const metric = allMetrics.find((m) => m.key === key);
                                if (!metric) return null;
                                const isDragging = draggedKey === key;

                                return (
                                    <div
                                        key={key}
                                        draggable
                                        onDragStart={() => handleDragStart(key)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (draggedKey && draggedKey !== key) {
                                                reorderCards(draggedKey, key, 'sidebar');
                                            }
                                        }}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl border cursor-grab
                                            transition-all duration-150
                                            bg-slate-50 border-slate-200 hover:border-slate-300
                                            ${isDragging ? 'opacity-50 scale-95' : ''}
                                        `}
                                    >
                                        <GripVertical className="w-4 h-4 text-slate-300" />
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: metric.color }}
                                        />
                                        <span className="flex-1 font-medium text-slate-700">
                                            {metric.label}
                                        </span>
                                        <button
                                            onClick={() => moveToTop(key)}
                                            className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-500 transition-colors"
                                            title="Mover para principais"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggle(key)}
                                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hidden Cards Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Ocultos
                        </h4>
                        <div className="space-y-2">
                            {allMetrics
                                .filter((m) => !isVisible(m.key))
                                .map((metric) => (
                                    <div
                                        key={metric.key}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-slate-100 border-slate-200 opacity-60"
                                    >
                                        <div className="w-4 h-4" /> {/* Spacer */}
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: metric.color }}
                                        />
                                        <span className="flex-1 font-medium text-slate-500">
                                            {metric.label}
                                        </span>
                                        <button
                                            onClick={() => handleToggle(metric.key)}
                                            className="p-1.5 rounded-lg bg-slate-200 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                                            title="Mostrar card"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            {allMetrics.filter((m) => !isVisible(m.key)).length === 0 && (
                                <p className="text-sm text-slate-400 italic text-center py-2">
                                    Nenhum card oculto
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={resetToDefaults}
                        className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                    >
                        Restaurar Padrão
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KpiCardSelector;
