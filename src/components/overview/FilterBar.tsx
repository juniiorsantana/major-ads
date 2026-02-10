import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, BarChart3, Filter } from 'lucide-react';
import {
    DatePeriodPreset,
    ComparisonMode,
    GroupingMode,
    FilterState
} from '../../types';

interface FilterBarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

const PERIOD_OPTIONS: { value: DatePeriodPreset; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'last_7_days', label: 'Últimos 7 dias' },
    { value: 'last_30_days', label: 'Últimos 30 dias' },
    { value: 'last_90_days', label: 'Últimos 90 dias' },
    { value: 'this_month', label: 'Este mês' },
    { value: 'last_month', label: 'Mês passado' },
    { value: 'custom', label: 'Personalizado' },
];

const COMPARISON_OPTIONS: { value: ComparisonMode; label: string }[] = [
    { value: 'previous_period', label: 'Período anterior' },
    { value: 'same_period_last_year', label: 'Mesmo período ano passado' },
    { value: 'none', label: 'Sem comparação' },
];

const GROUPING_OPTIONS: { value: GroupingMode; label: string }[] = [
    { value: 'hour', label: 'Por hora' },
    { value: 'day', label: 'Por dia' },
    { value: 'week', label: 'Por semana' },
    { value: 'month', label: 'Por mês' },
];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handlePeriodChange = (period: DatePeriodPreset) => {
        let grouping: GroupingMode = filters.grouping;
        if (period === 'today' || period === 'yesterday') {
            grouping = 'hour';
        } else if (period === 'last_7_days') {
            grouping = 'day';
        } else if (period === 'last_30_days' || period === 'this_month' || period === 'last_month') {
            grouping = 'day';
        } else if (period === 'last_90_days') {
            grouping = 'week';
        }
        onFiltersChange({ ...filters, period, grouping });
    };

    const handleComparisonChange = (comparison: ComparisonMode) => {
        onFiltersChange({ ...filters, comparison });
    };

    const handleGroupingChange = (grouping: GroupingMode) => {
        onFiltersChange({ ...filters, grouping });
    };

    const getAvailableGroupings = (): GroupingMode[] => {
        if (filters.period === 'today' || filters.period === 'yesterday') {
            return ['hour'];
        }
        if (filters.period === 'last_7_days') {
            return ['day'];
        }
        if (filters.period === 'last_30_days' || filters.period === 'this_month' || filters.period === 'last_month') {
            return ['day', 'week'];
        }
        if (filters.period === 'last_90_days') {
            return ['day', 'week', 'month'];
        }
        return ['day', 'week', 'month'];
    };

    const availableGroupings = getAvailableGroupings();

    // Get current period label for collapsed state
    const currentPeriodLabel = PERIOD_OPTIONS.find(o => o.value === filters.period)?.label || '';

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            {/* Collapsed Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Filtros</span>
                    {!isExpanded && (
                        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {currentPeriodLabel}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <span className="text-xs text-slate-400">Clique para expandir</span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-1">
                    {/* Period Selector */}
                    <div className="relative">
                        <label className="text-xs font-medium text-slate-500 block mb-1">Período</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={filters.period}
                                onChange={(e) => handlePeriodChange(e.target.value as DatePeriodPreset)}
                                className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg 
                                           text-sm font-medium text-slate-700 cursor-pointer
                                           hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {PERIOD_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Comparison Selector */}
                    <div className="relative">
                        <label className="text-xs font-medium text-slate-500 block mb-1">Comparar com</label>
                        <div className="relative">
                            <select
                                value={filters.comparison}
                                onChange={(e) => handleComparisonChange(e.target.value as ComparisonMode)}
                                className="appearance-none px-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg 
                                           text-sm font-medium text-slate-700 cursor-pointer
                                           hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {COMPARISON_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Grouping Selector */}
                    <div className="relative">
                        <label className="text-xs font-medium text-slate-500 block mb-1">Agrupar</label>
                        <div className="relative">
                            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={filters.grouping}
                                onChange={(e) => handleGroupingChange(e.target.value as GroupingMode)}
                                className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg 
                                           text-sm font-medium text-slate-700 cursor-pointer
                                           hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={availableGroupings.length <= 1}
                            >
                                {GROUPING_OPTIONS.filter((opt) => availableGroupings.includes(opt.value)).map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Date Range Display (for custom period) */}
                    {filters.period === 'custom' && (
                        <div className="flex items-center gap-2 ml-auto">
                            <input
                                type="date"
                                value={filters.customStartDate || ''}
                                onChange={(e) => onFiltersChange({ ...filters, customStartDate: e.target.value })}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                            <span className="text-slate-400">até</span>
                            <input
                                type="date"
                                value={filters.customEndDate || ''}
                                onChange={(e) => onFiltersChange({ ...filters, customEndDate: e.target.value })}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;

