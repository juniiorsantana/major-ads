import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import {
    Campaign,
    CampaignViewMode,
    CampaignStatusFilter,
    CampaignSortBy,
} from '../../types';
import {
    CampaignCard,
    CampaignTable,
    CampaignFilters,
} from '../../components/campaigns';
import { metaService } from '../../services/metaService';

const Campaigns: React.FC = () => {
    const [viewMode, setViewMode] = useState<CampaignViewMode>('cards');
    const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('all');
    const [sortBy, setSortBy] = useState<CampaignSortBy>('roas');

    // Data fetching state
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<React.ReactNode | null>(null);

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

            // Fetch ad accounts for all selected BMs
            const allCampaigns: Campaign[] = [];

            for (const bmId of bmIds) {
                try {
                    const adAccounts = await metaService.getAdAccounts(bmId);

                    for (const account of adAccounts) {
                        try {
                            const accountCampaigns = await metaService.getCampaigns(account.id);
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
    }, []);

    // Listen for BM selection changes from Settings page (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'marketing_pro_active_bm_ids') {
                console.log('BM selection changed, refetching campaigns...');
                fetchCampaigns();
            }
        };

        // Also listen to custom storage events from same tab
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

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

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
        // TODO: Navigate to campaign details
    };

    const handleToggleStatus = (id: string) => {
        console.log('Toggle status:', id);
        // TODO: Implement status toggle
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

            {/* Filters */}
            <CampaignFilters
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                counts={counts}
            />

            {/* Loading State - Skeleton Cards */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                </div>
                                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                                    <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                                </div>
                                <div>
                                    <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                                    <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                                </div>
                                <div>
                                    <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                                    <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-slate-200 rounded flex-1"></div>
                                <div className="h-8 w-8 bg-slate-200 rounded"></div>
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
                            />
                        ))}
                    </div>
                ) : (
                    <CampaignTable
                        campaigns={sortedCampaigns}
                        onView={handleView}
                        onToggleStatus={handleToggleStatus}
                    />
                )
            )}

            {/* Empty State */}
            {!loading && !error && sortedCampaigns.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <Plus size={24} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                        Nenhuma campanha encontrada
                    </h3>
                    <p className="text-slate-500 mb-4">
                        Crie sua primeira campanha para começar
                    </p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                        <Plus size={16} />
                        <span>Nova Campanha</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
