import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, AlertCircle, Loader2, Search } from 'lucide-react';
import {
    Campaign,
    CampaignViewMode,
    CampaignStatusFilter,
    CampaignSortBy,
    DatePeriodPreset,
} from '../../types';
import {
    CampaignCard,
    CampaignTable,
    CampaignFilters,
    CampaignPeriodFilter,
    BudgetEditModal,
} from '../../components/campaigns';
import { metaService } from '../../services/metaService';
import { toast } from '../../hooks/useToast';

// ==========================================
// [FIX] Date Helper — converte preset interno para date range
// Usa mesma lógica do useInsightsData.ts para consistência
// ==========================================

function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getDateRangeFromPreset(preset: DatePeriodPreset): { start: string; end: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let start: Date;
    let end: Date = today;

    switch (preset) {
        case 'today':
            start = today;
            break;
        case 'yesterday': {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            start = y;
            end = y;
            break;
        }
        case 'today_and_yesterday': {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            start = y;
            break;
        }
        case 'last_7_days':
            start = new Date(today);
            start.setDate(start.getDate() - 6);
            break;
        case 'last_14_days':
            start = new Date(today);
            start.setDate(start.getDate() - 13);
            break;
        case 'last_28_days':
            start = new Date(today);
            start.setDate(start.getDate() - 27);
            break;
        case 'this_week': {
            const dow = today.getDay();
            const diffMon = dow === 0 ? 6 : dow - 1;
            start = new Date(today);
            start.setDate(start.getDate() - diffMon);
            break;
        }
        case 'last_week': {
            const dow = today.getDay();
            const diffMon = dow === 0 ? 6 : dow - 1;
            const thisMon = new Date(today);
            thisMon.setDate(thisMon.getDate() - diffMon);
            start = new Date(thisMon);
            start.setDate(start.getDate() - 7);
            end = new Date(thisMon);
            end.setDate(end.getDate() - 1);
            break;
        }
        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        default:
            start = today;
    }

    return { start: formatDateForApi(start), end: formatDateForApi(end) };
}

const Campaigns: React.FC = () => {
    const [viewMode, setViewMode] = useState<CampaignViewMode>('cards');
    const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('all');
    const [sortBy, setSortBy] = useState<CampaignSortBy>('roas');

    // [REDESIGN] Estado do filtro de período
    const [period, setPeriod] = useState<DatePeriodPreset>('last_7_days');
    const [customStartDate, setCustomStartDate] = useState<string | undefined>();
    const [customEndDate, setCustomEndDate] = useState<string | undefined>();

    // Data fetching state
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<React.ReactNode | null>(null);

    // Action states
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
    const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(new Set());
    const [budgetEditCampaign, setBudgetEditCampaign] = useState<Campaign | null>(null);

    // [FIX] Computar dateParams a partir do estado de período
    const dateParams = useMemo(() => {
        if (period === 'custom' && customStartDate && customEndDate) {
            return { dateStart: customStartDate, dateEnd: customEndDate };
        }
        const { start, end } = getDateRangeFromPreset(period);
        return { dateStart: start, dateEnd: end };
    }, [period, customStartDate, customEndDate]);

    // Fetch campaigns from all selected BMs
    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Get selected BM IDs from localStorage
            const storedBmIds = localStorage.getItem('marketing_pro_active_bm_ids');
            let bmIds: string[] = [];

            if (storedBmIds) {
                try {
                    bmIds = JSON.parse(storedBmIds);
                } catch {
                    bmIds = [];
                }
            }

            // Fallback to legacy single selection
            if (bmIds.length === 0) {
                const legacyBmId = localStorage.getItem('marketing_pro_active_bm');
                if (legacyBmId) {
                    bmIds = [legacyBmId];
                }
            }

            if (bmIds.length === 0) {
                setError(
                    <>
                        Nenhum Business Manager selecionado.{' '}
                        <a href="/settings" className="underline font-medium hover:text-red-700">
                            Ir para Configurações
                        </a>
                    </>
                );
                setCampaigns([]);
                setLoading(false);
                return;
            }

            // [FIX] Log de debug para verificar parâmetros de data sendo enviados
            console.log('[Campaigns] Fetching with dateParams:', dateParams);

            // Fetch ad accounts for all selected BMs
            const allCampaigns: Campaign[] = [];

            for (const bmId of bmIds) {
                try {
                    const adAccounts = await metaService.getAdAccounts(bmId);

                    for (const account of adAccounts) {
                        try {
                            // [FIX] Passa dateParams para getCampaigns (antes não passava nada)
                            const accountCampaigns = await metaService.getCampaigns(account.id, dateParams);
                            allCampaigns.push(...accountCampaigns);
                        } catch (err) {
                            console.warn(`Failed to fetch campaigns for account ${account.id}:`, err);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to fetch ad accounts for BM ${bmId}:`, err);
                }
            }

            setCampaigns(allCampaigns);
        } catch (err: any) {
            console.error('Error fetching campaigns:', err);
            setError(err.message || 'Erro ao carregar campanhas');
        } finally {
            setLoading(false);
        }
    }, [dateParams]);

    // Listen for BM selection changes from Settings page (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'marketing_pro_active_bm_ids') {
                console.log('BM selection changed, refetching campaigns...');
                fetchCampaigns();
            }
        };

        const handleCustomStorageChange = (e: Event) => {
            if (e instanceof StorageEvent && e.key === 'marketing_pro_active_bm_ids') {
                console.log('BM selection changed (same tab), refetching campaigns...');
                fetchCampaigns();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storage', handleCustomStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storage', handleCustomStorageChange);
        };
    }, [fetchCampaigns]);

    // [FIX] Refetch quando dateParams mudam (via useCallback dependency)
    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // [FIX] Handler para mudança de período — atualiza estado, que trigger o refetch via dateParams
    const handlePeriodChange = useCallback((newPeriod: DatePeriodPreset, startDate?: string, endDate?: string) => {
        console.log('[Campaigns] Period changed:', newPeriod, startDate, endDate);
        setPeriod(newPeriod);
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        // Não precisa chamar fetchCampaigns() aqui — o useMemo de dateParams
        // vai atualizar, o que atualiza fetchCampaigns via useCallback dep, 
        // que por sua vez é chamado pelo useEffect
    }, []);

    // Filter campaigns by status
    const filteredCampaigns = useMemo(() => {
        if (statusFilter === 'all') return campaigns;
        const statusMap: Record<CampaignStatusFilter, Campaign['status']> = {
            all: 'ACTIVE',
            active: 'ACTIVE',
            paused: 'PAUSED',
            archived: 'ARCHIVED',
        };
        return campaigns.filter((c) => c.status === statusMap[statusFilter]);
    }, [campaigns, statusFilter]);

    // Sort campaigns
    const sortedCampaigns = useMemo(() => {
        return [...filteredCampaigns].sort((a, b) => {
            switch (sortBy) {
                case 'roas':
                    return (b.roas ?? 0) - (a.roas ?? 0);
                case 'spend':
                    return b.spend - a.spend;
                case 'performance':
                    return (b.ctr ?? 0) - (a.ctr ?? 0);
                case 'date':
                    return new Date(b.start_time ?? 0).getTime() - new Date(a.start_time ?? 0).getTime();
                default:
                    return 0;
            }
        });
    }, [filteredCampaigns, sortBy]);

    // Count campaigns by status
    const counts = useMemo(
        () => ({
            all: campaigns.length,
            active: campaigns.filter((c) => c.status === 'ACTIVE').length,
            paused: campaigns.filter((c) => c.status === 'PAUSED').length,
            archived: campaigns.filter((c) => c.status === 'ARCHIVED').length,
        }),
        [campaigns]
    );

    const handleView = (id: string) => {
        console.log('View campaign:', id);
    };

    // =====================
    // Toggle Status
    // =====================
    const handleToggleStatus = async (campaignId: string) => {
        const campaign = campaigns.find((c) => c.id === campaignId);
        if (!campaign || campaign.status === 'ARCHIVED') return;

        const newStatus: 'ACTIVE' | 'PAUSED' = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        const actionLabel = newStatus === 'ACTIVE' ? 'ativada' : 'pausada';

        setTogglingIds((prev) => new Set(prev).add(campaignId));
        setCampaigns((prev) =>
            prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus } : c))
        );

        try {
            const success = await metaService.updateCampaignStatus(campaignId, newStatus);
            if (success) {
                toast.success(`Campanha ${actionLabel} com sucesso`);
            } else {
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === campaignId ? { ...c, status: campaign.status } : c))
                );
                toast.error(`Erro ao ${newStatus === 'ACTIVE' ? 'ativar' : 'pausar'} campanha`);
            }
        } catch {
            setCampaigns((prev) =>
                prev.map((c) => (c.id === campaignId ? { ...c, status: campaign.status } : c))
            );
            toast.error(`Erro ao ${newStatus === 'ACTIVE' ? 'ativar' : 'pausar'} campanha`);
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(campaignId);
                return next;
            });
        }
    };

    // =====================
    // Edit Budget
    // =====================
    const handleEditBudget = (campaign: Campaign) => {
        setBudgetEditCampaign(campaign);
    };

    const handleSaveBudget = async (
        campaignId: string,
        budgetType: 'daily_budget' | 'lifetime_budget',
        amountCents: number
    ) => {
        await metaService.updateCampaignBudget(campaignId, budgetType, amountCents);
        toast.success('Budget atualizado com sucesso');
        fetchCampaigns();
    };

    // =====================
    // Duplicate Campaign
    // =====================
    const handleDuplicate = async (campaign: Campaign) => {
        const storedBmIds = localStorage.getItem('marketing_pro_active_bm_ids');
        let adAccountId: string | null = null;

        if (storedBmIds) {
            try {
                const bmIds: string[] = JSON.parse(storedBmIds);
                for (const bmId of bmIds) {
                    try {
                        const accounts = await metaService.getAdAccounts(bmId);
                        for (const account of accounts) {
                            try {
                                const accountCampaigns = await metaService.getCampaigns(account.id);
                                if (accountCampaigns.some((c) => c.id === campaign.id)) {
                                    adAccountId = account.id;
                                    break;
                                }
                            } catch { /* skip */ }
                        }
                        if (adAccountId) break;
                    } catch { /* skip */ }
                }
            } catch { /* skip */ }
        }

        if (!adAccountId) {
            toast.error('Não foi possível identificar a Ad Account desta campanha');
            return;
        }

        setDuplicatingIds((prev) => new Set(prev).add(campaign.id));

        try {
            await metaService.duplicateCampaign(campaign.id, adAccountId);
            toast.success(`Campanha "${campaign.name}" duplicada com sucesso`);
            fetchCampaigns();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao duplicar campanha');
        } finally {
            setDuplicatingIds((prev) => {
                const next = new Set(prev);
                next.delete(campaign.id);
                return next;
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Campanhas</h1>
                    <p className="text-slate-500 mt-1">
                        Gerencie suas campanhas do Meta Ads
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCampaigns}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Atualizar</span>
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md">
                        <Plus size={18} />
                        <span>Nova Campanha</span>
                    </button>
                </div>
            </div>

            {/* [REDESIGN] Filtro de período — reutilizado do Dashboard */}
            <CampaignPeriodFilter
                period={period}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onPeriodChange={handlePeriodChange}
            />

            {/* Filters (tabs de status + view toggle + sort) */}
            <CampaignFilters
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                counts={counts}
            />

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                            <div className="h-10 bg-slate-200" />
                            <div className="p-5 space-y-5">
                                <div>
                                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                                <div className="bg-slate-100 rounded-lg p-3">
                                    <div className="h-3 bg-slate-200 rounded w-20 mb-2" />
                                    <div className="h-7 bg-slate-200 rounded w-28" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((j) => (
                                        <div key={j}>
                                            <div className="h-3 bg-slate-200 rounded w-16 mb-1" />
                                            <div className="h-5 bg-slate-200 rounded w-12" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className="h-3 bg-slate-200 rounded w-12" />
                                        <div className="h-3 bg-slate-200 rounded w-8" />
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full" />
                                </div>
                                <div className="flex gap-2 border-t border-slate-100 pt-2">
                                    <div className="h-9 bg-slate-200 rounded flex-1" />
                                    <div className="h-9 bg-slate-200 rounded flex-1" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-xl border border-red-100">
                    <AlertCircle size={40} className="text-red-500 mb-4" />
                    <p className="text-red-600 font-medium mb-2">Erro ao carregar campanhas</p>
                    <div className="text-red-500 text-sm mb-4">{error}</div>
                    <button
                        onClick={fetchCampaigns}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Content */}
            {!loading && !error && sortedCampaigns.length > 0 && (
                viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sortedCampaigns.map((campaign) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                onView={handleView}
                                onToggleStatus={handleToggleStatus}
                                onEditBudget={handleEditBudget}
                                onDuplicate={handleDuplicate}
                                isToggling={togglingIds.has(campaign.id)}
                                isDuplicating={duplicatingIds.has(campaign.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <CampaignTable
                        campaigns={sortedCampaigns}
                        onView={handleView}
                        onToggleStatus={handleToggleStatus}
                        onEditBudget={handleEditBudget}
                        onDuplicate={handleDuplicate}
                        togglingIds={togglingIds}
                        duplicatingIds={duplicatingIds}
                    />
                )
            )}

            {/* Empty State */}
            {!loading && !error && sortedCampaigns.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                        <Search size={24} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        Nenhuma campanha encontrada neste período
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-md text-center">
                        Tente alterar o período ou filtro de status selecionado, ou crie uma nova campanha para começar.
                    </p>
                    <button
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                        style={{ backgroundColor: '#2563eb' }}
                    >
                        <Plus size={16} />
                        <span>Nova Campanha</span>
                    </button>
                </div>
            )}

            {/* Budget Edit Modal */}
            {budgetEditCampaign && (
                <BudgetEditModal
                    campaign={budgetEditCampaign}
                    onSave={handleSaveBudget}
                    onClose={() => setBudgetEditCampaign(null)}
                />
            )}
        </div>
    );
};

export default Campaigns;
