import React from 'react';
import {
    CampaignViewMode,
    CampaignStatusFilter,
    CampaignSortBy,
} from '../../types';
import { LayoutGrid, Table2, ChevronDown } from 'lucide-react';

interface CampaignFiltersProps {
    viewMode: CampaignViewMode;
    onViewModeChange: (mode: CampaignViewMode) => void;
    statusFilter: CampaignStatusFilter;
    onStatusFilterChange: (filter: CampaignStatusFilter) => void;
    sortBy: CampaignSortBy;
    onSortByChange: (sort: CampaignSortBy) => void;
    counts: {
        all: number;
        active: number;
        paused: number;
        archived: number;
    };
}

const STATUS_TABS: { key: CampaignStatusFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'active', label: 'Ativas' },
    { key: 'paused', label: 'Pausadas' },
    { key: 'archived', label: 'Encerradas' },
];

const SORT_OPTIONS: { key: CampaignSortBy; label: string }[] = [
    { key: 'roas', label: 'ROAS' },
    { key: 'spend', label: 'Gasto' },
    { key: 'performance', label: 'Performance' },
    { key: 'date', label: 'Data' },
];

const CampaignFilters: React.FC<CampaignFiltersProps> = ({
    viewMode,
    onViewModeChange,
    statusFilter,
    onStatusFilterChange,
    sortBy,
    onSortByChange,
    counts,
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {STATUS_TABS.map((tab) => {
                    const isActive = statusFilter === tab.key;
                    const count = counts[tab.key];

                    return (
                        <button
                            key={tab.key}
                            onClick={() => onStatusFilterChange(tab.key)}
                            className={`
                                px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                                flex items-center gap-1.5
                                ${isActive
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }
                            `}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`
                                    text-xs px-1.5 py-0.5 rounded-full
                                    ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50 text-slate-500'}
                                `}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
                {/* Sort Select */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortByChange(e.target.value as CampaignSortBy)}
                        className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.key} value={option.key}>
                                Ordenar: {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => onViewModeChange('cards')}
                        className={`
                            p-2 rounded-md transition-all duration-200
                            ${viewMode === 'cards'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }
                        `}
                        title="Visualização em Cards"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('table')}
                        className={`
                            p-2 rounded-md transition-all duration-200
                            ${viewMode === 'table'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }
                        `}
                        title="Visualização em Tabela"
                    >
                        <Table2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignFilters;
