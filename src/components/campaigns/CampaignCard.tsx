import React, { useState, useRef, useEffect } from 'react';
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
    MoreHorizontal,
    Loader2,
    Copy,
    Edit3,
    MessageCircle,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
// [REDESIGN] Helper reutilizável para detecção de campanhas de mensagem
import { isMessageCampaign, getMessageConversations } from '../../utils/campaignHelpers';

interface CampaignCardProps {
    campaign: Campaign;
    onView?: (id: string) => void;
    onToggleStatus?: (id: string) => void;
    onEditBudget?: (campaign: Campaign) => void;
    onDuplicate?: (campaign: Campaign) => void;
    isToggling?: boolean;
    isDuplicating?: boolean;
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
    onEditBudget,
    onDuplicate,
    isToggling = false,
    isDuplicating = false,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const statusConfig = STATUS_CONFIG[campaign.status];
    const budgetPercent = campaign.budget_spent_percent ?? 0;
    const roas = campaign.roas ?? 0;
    const ctr = campaign.ctr ?? 0;
    const conversions = campaign.conversions ?? 0;

    // [REDESIGN] Detecção de campanha de mensagem usando helper reutilizável
    const isMsgCampaign = isMessageCampaign(campaign);
    const messageConversations = isMsgCampaign ? getMessageConversations(campaign) : 0;

    // [REDESIGN] Indicador ROAS: <1.0 alerta vermelho, ≥1.0 check verde
    const roasIndicator = roas < 1.0 ? 'alert' : 'ok';

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    return (
        <div
            className={`
                bg-white rounded-xl border ${statusConfig.borderColor}
                shadow-lg ${statusConfig.glowClass}
                hover:shadow-xl transition-all duration-200
                hover:-translate-y-0.5
                overflow-hidden
            `}
        >
            {/* [REDESIGN] Status Badge Header — mantém cor por status, menu "..." maior com hover azul */}
            <div className={`${statusConfig.bgColor} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-bold tracking-wider uppercase">
                        {statusConfig.label}
                    </span>
                    {/* [REDESIGN] Badge "📱 Mensagem" para campanhas de mensagem */}
                    {isMsgCampaign && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                        >
                            📱 Mensagem
                        </span>
                    )}
                </div>
                <div className="relative" ref={menuRef}>
                    {/* [REDESIGN] Menu "..." maior (size={20}) com hover azul */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white/80 hover:text-blue-200 transition-colors p-0.5 rounded-md hover:bg-white/10"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20 min-w-[160px]">
                            <button
                                onClick={() => { onEditBudget?.(campaign); setMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <Edit3 size={14} />
                                Editar Budget
                            </button>
                            <button
                                onClick={() => { onDuplicate?.(campaign); setMenuOpen(false); }}
                                disabled={isDuplicating}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                {isDuplicating ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                                {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* [REDESIGN] Card Body — padding e espaçamento aumentados */}
            <div className="p-5 space-y-5">
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

                {/* [REDESIGN] Métricas Condicionais — normal vs mensagem */}
                {isMsgCampaign ? (
                    // ====================================================
                    // CAMPANHA DE MENSAGEM: Conversas, Impressões, Cliques, CTR
                    // NÃO mostra ROAS nem conversões genéricas
                    // ====================================================
                    <>
                        {/* Conversas iniciadas — métrica principal para campanhas de mensagem */}
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <MessageCircle size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-slate-900">
                                    {formatNumber(messageConversations)}
                                </span>
                                <p className="text-xs text-blue-600 font-medium">conversas iniciadas</p>
                            </div>
                        </div>

                        {/* Grid de métricas — Impressões, Cliques, CTR */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Eye size={14} className="text-slate-400" />
                                    <span className="text-xs text-slate-500">Impressões</span>
                                </div>
                                <span className="text-lg font-bold text-slate-900">
                                    {formatNumber(campaign.impressions)}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <MousePointerClick size={14} className="text-slate-400" />
                                    <span className="text-xs text-slate-500">Cliques</span>
                                </div>
                                <span className="text-lg font-bold text-slate-900">
                                    {formatNumber(campaign.clicks)}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs text-slate-500">CTR</span>
                                <span className="text-lg font-bold text-slate-900">{ctr.toFixed(2)}%</span>
                            </div>
                        </div>
                    </>
                ) : (
                    // ====================================================
                    // CAMPANHA NORMAL: ROAS + indicador, Impressões, Cliques, CTR, Conversões
                    // ====================================================
                    <>
                        {/* Grid de métricas 2 colunas com espaçamento generoso */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* [REDESIGN] ROAS com indicador visual */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Target size={14} className="text-slate-400" />
                                    <span className="text-xs text-slate-500">ROAS</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-bold text-slate-900">{roas.toFixed(1)}x</span>
                                    {/* [REDESIGN] Indicador: <1.0 alerta vermelho/laranja, ≥1.0 check verde */}
                                    {roasIndicator === 'alert' ? (
                                        <AlertTriangle size={16} className="text-orange-500" />
                                    ) : (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    )}
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

                        {/* Conversões — linha separada */}
                        <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                            <span className="font-semibold text-slate-900">{conversions}</span> conversões
                        </div>
                    </>
                )}

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

                {/* Action Buttons — preservados do CRUD existente */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                        onClick={() => onView?.(campaign.id)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Ver
                    </button>
                    <button
                        onClick={() => onToggleStatus?.(campaign.id)}
                        disabled={isToggling || campaign.status === 'ARCHIVED'}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${campaign.status === 'ACTIVE'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                    >
                        {isToggling ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : campaign.status === 'ACTIVE' ? (
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
