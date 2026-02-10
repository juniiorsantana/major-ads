import React from 'react';
import { Campaign } from '../../types';
import {
    TrendingUp,
    TrendingDown,
    Eye,
    MousePointerClick,
    DollarSign,
    Target,
    Pause,
    Play,
    MoreHorizontal
} from 'lucide-react';

interface CampaignCardProps {
    campaign: Campaign;
    onView?: (id: string) => void;
    onToggleStatus?: (id: string) => void;
}

const STATUS_CONFIG = {
    ACTIVE: {
        label: 'ATIVA',
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/30',
        glowClass: 'shadow-emerald-500/20',
    },
    PAUSED: {
        label: 'PAUSADA',
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-500',
        borderColor: 'border-amber-500/30',
        glowClass: 'shadow-amber-500/20',
    },
    ARCHIVED: {
        label: 'ENCERRADA',
        bgColor: 'bg-slate-400',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-400/30',
        glowClass: 'shadow-slate-400/10',
    },
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

const CampaignCard: React.FC<CampaignCardProps> = ({
    campaign,
    onView,
    onToggleStatus,
}) => {
    const statusConfig = STATUS_CONFIG[campaign.status];
    const budgetPercent = campaign.budget_spent_percent ?? 0;
    const roas = campaign.roas ?? 0;
    const ctr = campaign.ctr ?? 0;
    const conversions = campaign.conversions ?? 0;

    const roasTrend = roas >= 3 ? 'up' : roas >= 2 ? 'neutral' : 'down';

    return (
        <div
            className={`
                bg-white rounded-xl border ${statusConfig.borderColor}
                shadow-lg ${statusConfig.glowClass}
                hover:shadow-xl transition-all duration-300
                hover:-translate-y-1
                overflow-hidden
            `}
        >
            {/* Status Badge Header */}
            <div className={`${statusConfig.bgColor} px-4 py-2 flex items-center justify-between`}>
                <span className="text-white text-xs font-bold tracking-wider">
                    {statusConfig.label}
                </span>
                <button className="text-white/80 hover:text-white transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
                {/* Campaign Name */}
                <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">
                        {campaign.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{campaign.objective}</p>
                </div>

                {/* Investido */}
                <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <DollarSign size={14} />
                        <span>INVESTIDO</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(campaign.spend)}
                    </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* ROAS */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Target size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">ROAS</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-slate-900">{roas.toFixed(1)}x</span>
                            {roasTrend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                            {roasTrend === 'down' && <TrendingDown size={14} className="text-rose-500" />}
                        </div>
                    </div>

                    {/* Impressões */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Eye size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Impressões</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                            {formatNumber(campaign.impressions)}
                        </span>
                    </div>

                    {/* Cliques */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <MousePointerClick size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Cliques</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                            {formatNumber(campaign.clicks)}
                        </span>
                    </div>

                    {/* CTR */}
                    <div className="space-y-1">
                        <span className="text-xs text-slate-500">CTR</span>
                        <span className="text-lg font-bold text-slate-900">{ctr.toFixed(2)}%</span>
                    </div>
                </div>

                {/* Conversões */}
                <div className="text-sm text-slate-600">
                    <span className="font-medium">{conversions}</span> conversões
                </div>

                {/* Budget Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">BUDGET</span>
                        <span className="font-medium text-slate-700">{budgetPercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${budgetPercent >= 90
                                    ? 'bg-rose-500'
                                    : budgetPercent >= 70
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                }`}
                            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                        onClick={() => onView?.(campaign.id)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Ver
                    </button>
                    <button
                        onClick={() => onToggleStatus?.(campaign.id)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${campaign.status === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                    >
                        {campaign.status === 'ACTIVE' ? (
                            <>
                                <Pause size={14} /> Pausar
                            </>
                        ) : (
                            <>
                                <Play size={14} /> Ativar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignCard;
