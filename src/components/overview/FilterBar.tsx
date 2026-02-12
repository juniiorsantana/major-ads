import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Clock, Check, BarChart3 } from 'lucide-react';
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

// ==========================================
// Period Options (Facebook standard order)
// ==========================================

const ALL_PERIOD_OPTIONS: { value: DatePeriodPreset; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'today_and_yesterday', label: 'Hoje e Ontem' },
    { value: 'last_7_days', label: 'Últimos 7 dias' },
    { value: 'last_14_days', label: 'Últimos 14 dias' },
    { value: 'last_28_days', label: 'Últimos 28 dias' },
    { value: 'this_week', label: 'Essa semana' },
    { value: 'last_week', label: 'Última semana' },
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

// ==========================================
// Recently Used (localStorage)
// ==========================================

const RECENT_STORAGE_KEY = 'major_ads_recent_periods';
const MAX_RECENTS = 3;

function getRecentPeriods(): DatePeriodPreset[] {
    try {
        const stored = localStorage.getItem(RECENT_STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as DatePeriodPreset[];
    } catch {
        return [];
    }
}

function addRecentPeriod(preset: DatePeriodPreset): void {
    if (preset === 'custom') return; // Don't track custom
    const recents = getRecentPeriods().filter(p => p !== preset);
    recents.unshift(preset);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

// ==========================================
// FilterBar Component
// ==========================================

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showCustomDates, setShowCustomDates] = useState(filters.period === 'custom');
    const [recentPeriods, setRecentPeriods] = useState<DatePeriodPreset[]>(getRecentPeriods());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePeriodChange = useCallback((period: DatePeriodPreset) => {
        let grouping: GroupingMode = filters.grouping;
        if (period === 'today' || period === 'yesterday') {
            grouping = 'hour';
        } else if (period === 'today_and_yesterday' || period === 'last_7_days' || period === 'this_week' || period === 'last_week') {
            grouping = 'day';
        } else if (period === 'last_14_days' || period === 'last_28_days' || period === 'this_month' || period === 'last_month') {
            grouping = 'day';
        }

        if (period === 'custom') {
            setShowCustomDates(true);
            onFiltersChange({ ...filters, period, grouping });
        } else {
            setShowCustomDates(false);
            addRecentPeriod(period);
            setRecentPeriods(getRecentPeriods());
            onFiltersChange({ ...filters, period, grouping });
        }

        setIsDropdownOpen(false);
    }, [filters, onFiltersChange]);

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
        if (filters.period === 'today_and_yesterday' || filters.period === 'last_7_days' || filters.period === 'this_week' || filters.period === 'last_week') {
            return ['day'];
        }
        if (filters.period === 'last_14_days' || filters.period === 'last_28_days' || filters.period === 'this_month' || filters.period === 'last_month') {
            return ['day', 'week'];
        }
        return ['day', 'week', 'month'];
    };

    const availableGroupings = getAvailableGroupings();
    const currentPeriodLabel = ALL_PERIOD_OPTIONS.find(o => o.value === filters.period)?.label || 'Período';

    // Separate recently used from all options
    const recentOptions = recentPeriods
        .map(p => ALL_PERIOD_OPTIONS.find(o => o.value === p))
        .filter(Boolean) as { value: DatePeriodPreset; label: string }[];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                {/* Period Selector (Custom Dropdown) */}
                <div className="relative" ref={dropdownRef}>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Período</label>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 pl-3 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg
                                   text-sm font-medium text-slate-700 cursor-pointer min-w-[180px]
                                   hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                   transition-all duration-150"
                    >
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="flex-1 text-left truncate">{currentPeriodLabel}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1
                                        animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                            {/* Recently Used Section */}
                            {recentOptions.length > 0 && (
                                <>
                                    <div className="px-3 py-1.5 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Usados Recentemente</span>
                                    </div>
                                    {recentOptions.map(option => (
                                        <button
                                            key={`recent-${option.value}`}
                                            onClick={() => handlePeriodChange(option.value)}
                                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between
                                                        hover:bg-blue-50 hover:text-blue-700 transition-colors
                                                        ${filters.period === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                        >
                                            <span>{option.label}</span>
                                            {filters.period === option.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                        </button>
                                    ))}
                                    <div className="h-px bg-slate-100 mx-3 my-1" />
                                </>
                            )}

                            {/* All Options */}
                            <div className="max-h-[280px] overflow-y-auto">
                                {ALL_PERIOD_OPTIONS.map(option => {
                                    const isCustomOpt = option.value === 'custom';
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handlePeriodChange(option.value)}
                                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between
                                                        hover:bg-blue-50 hover:text-blue-700 transition-colors
                                                        ${isCustomOpt ? 'border-t border-slate-100 mt-1' : ''}
                                                        ${filters.period === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isCustomOpt && <Calendar className="w-3.5 h-3.5 text-slate-400" />}
                                                {option.label}
                                            </span>
                                            {filters.period === option.value && !isCustomOpt && (
                                                <Check className="w-3.5 h-3.5 text-blue-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom Date Inputs */}
                {showCustomDates && (
                    <div className="flex items-end gap-2">
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">De</label>
                            <input
                                type="date"
                                value={filters.customStartDate || ''}
                                onChange={(e) => onFiltersChange({ ...filters, customStartDate: e.target.value })}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <span className="text-slate-400 pb-2">—</span>
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">Até</label>
                            <input
                                type="date"
                                value={filters.customEndDate || ''}
                                onChange={(e) => onFiltersChange({ ...filters, customEndDate: e.target.value })}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />

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
            </div>
        </div>
    );
};

export default FilterBar;
