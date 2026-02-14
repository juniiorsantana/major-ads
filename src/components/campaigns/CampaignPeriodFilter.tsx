/**
 * CampaignPeriodFilter — Filtro de período reutilizado do Dashboard
 *
 * [REDESIGN] Componente wrapper que reaproveita a lógica visual de seleção de período
 * do FilterBar (Dashboard), mas expõe APENAS o seletor de período e datas customizadas.
 * Comparação e Agrupamento são omitidos pois não são relevantes para a listagem de campanhas.
 *
 * Reutiliza: mesmos presets, mesma lógica de recentes, mesma UI.
 * Não cria filtro novo — apenas simplifica o existente para o contexto de campanhas.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Clock, Check } from 'lucide-react';
import { DatePeriodPreset } from '../../types';

// ==========================================
// Props — simplificadas em relação ao FilterBar
// ==========================================

interface CampaignPeriodFilterProps {
    period: DatePeriodPreset;
    customStartDate?: string;
    customEndDate?: string;
    onPeriodChange: (period: DatePeriodPreset, startDate?: string, endDate?: string) => void;
}

// ==========================================
// Period Options (mesmos do FilterBar do Dashboard)
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

// ==========================================
// Recently Used (mesma lógica do FilterBar)
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
    if (preset === 'custom') return;
    const recents = getRecentPeriods().filter(p => p !== preset);
    recents.unshift(preset);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

// ==========================================
// Component
// ==========================================

const CampaignPeriodFilter: React.FC<CampaignPeriodFilterProps> = ({
    period,
    customStartDate,
    customEndDate,
    onPeriodChange,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showCustomDates, setShowCustomDates] = useState(period === 'custom');
    const [recentPeriods, setRecentPeriods] = useState<DatePeriodPreset[]>(getRecentPeriods());
    const [localStartDate, setLocalStartDate] = useState(customStartDate || '');
    const [localEndDate, setLocalEndDate] = useState(customEndDate || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePeriodChange = useCallback((newPeriod: DatePeriodPreset) => {
        if (newPeriod === 'custom') {
            setShowCustomDates(true);
            onPeriodChange(newPeriod, localStartDate, localEndDate);
        } else {
            setShowCustomDates(false);
            addRecentPeriod(newPeriod);
            setRecentPeriods(getRecentPeriods());
            onPeriodChange(newPeriod);
        }
        setIsDropdownOpen(false);
    }, [onPeriodChange, localStartDate, localEndDate]);

    const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setLocalStartDate(value);
            onPeriodChange('custom', value, localEndDate);
        } else {
            setLocalEndDate(value);
            onPeriodChange('custom', localStartDate, value);
        }
    };

    const currentPeriodLabel = ALL_PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Período';

    const recentOptions = recentPeriods
        .map(p => ALL_PERIOD_OPTIONS.find(o => o.value === p))
        .filter(Boolean) as { value: DatePeriodPreset; label: string }[];

    return (
        // [REDESIGN] Filtro de período reutilizado do Dashboard, posicionado acima dos tabs
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                {/* Period Selector — mesma UI visual do FilterBar */}
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
                            {/* Recently Used */}
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
                                  ${period === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                        >
                                            <span>{option.label}</span>
                                            {period === option.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
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
                                  ${period === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isCustomOpt && <Calendar className="w-3.5 h-3.5 text-slate-400" />}
                                                {option.label}
                                            </span>
                                            {period === option.value && !isCustomOpt && (
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
                                value={localStartDate}
                                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <span className="text-slate-400 pb-2">—</span>
                        <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">Até</label>
                            <input
                                type="date"
                                value={localEndDate}
                                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignPeriodFilter;
