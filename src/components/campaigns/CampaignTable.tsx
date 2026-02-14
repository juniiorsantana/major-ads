import React, { useState, useMemo } from 'react';
import { Campaign, CampaignSortBy } from '../../types';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
    Pause,
    Play,
    TrendingUp,
    TrendingDown,
    Loader2,
    Copy,
    Edit3,
    MessageCircle,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
// [REDESIGN] Helper reutilizável para detecção de campanhas de mensagem
import { isMessageCampaign, getMessageConversations } from '../../utils/campaignHelpers';

interface CampaignTableProps {
    campaigns: Campaign[];
    onView?: (id: string) => void;
    onToggleStatus?: (id: string) => void;
    onEditBudget?: (campaign: Campaign) => void;
    onDuplicate?: (campaign: Campaign) => void;
    togglingIds?: Set<string>;
    duplicatingIds?: Set<string>;
}

type SortDirection = 'asc' | 'desc';

const STATUS_BADGE = {
    ACTIVE: { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700' },
    PAUSED: { label: 'Pausada', className: 'bg-amber-100 text-amber-700' },
    ARCHIVED: { label: 'Encerrada', className: 'bg-slate-100 text-slate-600' },
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
};

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
    const color =
        percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <span className="text-xs text-slate-500 w-8">{percent}%</span>
        </div>
    );
};

const CampaignTable: React.FC<CampaignTableProps> = ({
    campaigns,
    onView,
    onToggleStatus,
    onEditBudget,
    onDuplicate,
    togglingIds = new Set(),
    duplicatingIds = new Set(),
}) => {
    const [sortBy, setSortBy] = useState<CampaignSortBy>('spend');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');

    const handleSort = (column: CampaignSortBy) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('desc');
        }
    };

    const sortedCampaigns = useMemo(() => {
        return [...campaigns].sort((a, b) => {
            let aVal: number, bVal: number;

            switch (sortBy) {
                case 'roas':
                    aVal = a.roas ?? 0;
                    bVal = b.roas ?? 0;
                    break;
                case 'spend':
                    aVal = a.spend;
                    bVal = b.spend;
                    break;
                case 'performance':
                    aVal = a.ctr ?? 0;
                    bVal = b.ctr ?? 0;
                    break;
                case 'date':
                    aVal = a.start_time ? new Date(a.start_time).getTime() : 0;
                    bVal = b.start_time ? new Date(b.start_time).getTime() : 0;
                    break;
                default:
                    return 0;
            }

            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [campaigns, sortBy, sortDir]);

    const SortHeader: React.FC<{ column: CampaignSortBy; label: string }> = ({
        column,
        label,
    }) => (
        <button
            onClick={() => handleSort(column)}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
        >
            <span>{label}</span>
            {sortBy === column ? (
                sortDir === 'asc' ? (
                    <ArrowUp size={14} />
                ) : (
                    <ArrowDown size={14} />
                )
            ) : (
                <ArrowUpDown size={14} className="opacity-50" />
            )}
        </button>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Nome
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <SortHeader column="spend" label="Investido" />
                            </th>
                            {/* [REDESIGN] Header da coluna ROAS agora inclui "/ Conversas" */}
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <SortHeader column="roas" label="ROAS / Conversas" />
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Impressões
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <SortHeader column="performance" label="CTR" />
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Conversões
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]">
                                Budget
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedCampaigns.map((campaign) => {
                            const status = STATUS_BADGE[campaign.status];
                            const roas = campaign.roas ?? 0;
                            const isToggling = togglingIds.has(campaign.id);
                            const isDuplicating = duplicatingIds.has(campaign.id);
                            // [REDESIGN] Detecção de campanha de mensagem
                            const isMsgCampaign = isMessageCampaign(campaign);
                            const msgConversations = isMsgCampaign ? getMessageConversations(campaign) : 0;
                            // [REDESIGN] Indicador ROAS: <1.0 alerta, ≥1.0 check
                            const roasIndicator = roas < 1.0 ? 'alert' : 'ok';

                            return (
                                <tr
                                    key={campaign.id}
                                    className="hover:bg-slate-50 transition-colors group"
                                >
                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </td>

                                    {/* [REDESIGN] Nome — com badge 📱 para campanhas de mensagem */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="font-medium text-slate-900 max-w-[200px] truncate">
                                                {campaign.name}
                                            </div>
                                            {isMsgCampaign && (
                                                <span
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
                                                    style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                                                >
                                                    📱
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {campaign.objective}
                                        </div>
                                    </td>

                                    {/* Investido */}
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {formatCurrency(campaign.spend)}
                                    </td>

                                    {/* [REDESIGN] ROAS / Conversas — lógica condicional */}
                                    <td className="px-4 py-3">
                                        {isMsgCampaign ? (
                                            // Campanha de mensagem: mostra ícone chat + número de conversas
                                            <div className="flex items-center gap-1.5">
                                                <MessageCircle size={14} className="text-blue-500" />
                                                <span className="font-medium text-slate-900">
                                                    {formatNumber(msgConversations)}
                                                </span>
                                            </div>
                                        ) : (
                                            // Campanha normal: mostra ROAS + indicador visual
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium text-slate-900">
                                                    {roas.toFixed(1)}x
                                                </span>
                                                {roasIndicator === 'alert' ? (
                                                    <AlertTriangle size={14} className="text-orange-500" />
                                                ) : (
                                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Impressões */}
                                    <td className="px-4 py-3 text-slate-700">
                                        {formatNumber(campaign.impressions)}
                                    </td>

                                    {/* CTR */}
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {(campaign.ctr ?? 0).toFixed(2)}%
                                    </td>

                                    {/* Conversões */}
                                    <td className="px-4 py-3 text-slate-700">
                                        {campaign.conversions ?? 0}
                                    </td>

                                    {/* Budget */}
                                    <td className="px-4 py-3">
                                        <ProgressBar percent={campaign.budget_spent_percent ?? 0} />
                                    </td>

                                    {/* Ações — preservadas do CRUD existente */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onView?.(campaign.id)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => onToggleStatus?.(campaign.id)}
                                                disabled={isToggling || campaign.status === 'ARCHIVED'}
                                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${campaign.status === 'ACTIVE'
                                                    ? 'hover:bg-amber-50 text-amber-500 hover:text-amber-600'
                                                    : 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600'
                                                    }`}
                                                title={campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                                            >
                                                {isToggling ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : campaign.status === 'ACTIVE' ? (
                                                    <Pause size={16} />
                                                ) : (
                                                    <Play size={16} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => onEditBudget?.(campaign)}
                                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
                                                title="Editar Budget"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDuplicate?.(campaign)}
                                                disabled={isDuplicating}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                                                title="Duplicar"
                                            >
                                                {isDuplicating ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Copy size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {campaigns.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    Nenhuma campanha encontrada
                </div>
            )}
        </div>
    );
};

export default CampaignTable;
