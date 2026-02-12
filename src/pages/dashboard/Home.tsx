import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WelcomeModal, shouldShowWelcomeModal } from '../../components/dashboard/WelcomeModal';
import { userProfileService } from '../../services/userProfileService';
import {
    FilterBar,
    KpiCardsSection,
    SidebarKpiCards,
    TemporalChart,
    BudgetDistribution,
    AlertsRecommendations,
    KPI_METRICS,
    AlertItem
} from '../../components/overview';
import {
    FilterState,
    KpiMetricKey,
    KpiCardData,
    ChartDataPoint,
    InsightsTimeseriesPoint,
    AdAccount
} from '../../types';
import { useInsightsData, transformInsightsToKpiCards } from '../../hooks/useInsightsData';
import { metaService } from '../../services/metaService';
import { Loader2, AlertCircle, WifiOff, ChevronDown, RefreshCw } from 'lucide-react';

// ==========================================
// Helpers
// ==========================================

function getSelectedAdAccountId(): string | null {
    const storedBmIds = localStorage.getItem('marketing_pro_active_bm_ids');
    const storedAdAccount = localStorage.getItem('marketing_pro_selected_ad_account');
    return storedAdAccount || null;
}

function setSelectedAdAccountId(id: string): void {
    localStorage.setItem('marketing_pro_selected_ad_account', id);
}

// Transform timeseries to chart data
function timeseriestoChartData(
    timeseries: InsightsTimeseriesPoint[],
    metric: KpiMetricKey
): ChartDataPoint[] {
    return timeseries.map(point => {
        let value = 0;
        switch (metric) {
            case 'spend': value = point.spend; break;
            case 'impressions': value = point.impressions; break;
            case 'clicks': value = point.clicks; break;
            case 'ctr': value = point.ctr; break;
            case 'cpm': value = point.cpm; break;
            case 'cpc': value = point.cpc; break;
            case 'conversions': value = point.conversions; break;
            default: value = point.spend;
        }

        const date = new Date(point.date_start);
        return {
            date: point.date_start,
            label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            value,
        };
    });
}

// Generate empty/zeroed data when no real data available
const generateEmptyKpiData = (): Record<KpiMetricKey, KpiCardData> => {
    const emptyData: Partial<Record<KpiMetricKey, KpiCardData>> = {};

    KPI_METRICS.forEach((metric) => {
        emptyData[metric.key] = {
            key: metric.key,
            value: 0,
            previousValue: 0,
            change: 0,
            changePercent: 0,
            sparklineData: [],
        };
    });

    return emptyData as Record<KpiMetricKey, KpiCardData>;
};

// Mock data for Budget Distribution (to be replaced in next phase)
const MOCK_BUDGET_DATA = {
    byCampaign: [
        { name: 'Campanha Verão', value: 4500, color: '#3b82f6' },
        { name: 'Remarketing', value: 2800, color: '#10b981' },
        { name: 'Prospecção', value: 1700, color: '#f59e0b' },
    ],
    byObjective: [
        { name: 'Conversões', value: 5200, color: '#8b5cf6' },
        { name: 'Tráfego', value: 2300, color: '#06b6d4' },
        { name: 'Alcance', value: 1500, color: '#ec4899' },
    ],
    byPlatform: [
        { name: 'Facebook', value: 65, color: '#1877f2' },
        { name: 'Instagram', value: 30, color: '#e4405f' },
        { name: 'Audience Network', value: 5, color: '#6b7280' },
    ],
    byAudience: [
        { name: '18-24', value: 25, color: '#3b82f6' },
        { name: '25-34', value: 45, color: '#10b981' },
        { name: '35-44', value: 20, color: '#f59e0b' },
        { name: '45+', value: 10, color: '#8b5cf6' },
    ],
};

// Mock alerts data (to be replaced)
const MOCK_ALERTS: AlertItem[] = [
    {
        type: 'critical',
        title: 'CPC Alto',
        description: 'Campanha "Outlet" com CPC 45% acima da média',
        suggestion: 'Revisar segmentação de público',
        campaign: 'Outlet',
    },
    {
        type: 'warning',
        title: 'ROAS em Queda',
        description: 'ROAS da campanha "Vestidos" caiu 15% nos últimos 3 dias',
        suggestion: 'Pausar anúncios com baixo desempenho',
        campaign: 'Vestidos',
    },
    {
        type: 'opportunity',
        title: 'CTR Excepcional',
        description: 'Campanha "Sapatos" com CTR 2x acima da média',
        suggestion: 'Aumentar budget em 20%',
        campaign: 'Sapatos',
    },
];

// ==========================================
// Dashboard Component
// ==========================================

const DashboardHome: React.FC = () => {
    const { user } = useAuth();

    // Welcome Modal state
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [userName, setUserName] = useState('');

    // Filter state
    const [filters, setFilters] = useState<FilterState>({
        period: 'last_7_days',
        comparison: 'previous_period',
        grouping: 'day',
    });

    // Selected metric for chart
    const [selectedChartMetric, setSelectedChartMetric] = useState<KpiMetricKey>('spend');

    // Ad Account state
    const [adAccountId, setAdAccountId] = useState<string | null>(null);
    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const [loadingAdAccount, setLoadingAdAccount] = useState(true);
    const [adAccountError, setAdAccountError] = useState<string | null>(null);

    // Track if connected user exists
    const [hasConnectedUser, setHasConnectedUser] = useState<boolean | null>(null);

    // Check if should show Welcome Modal
    useEffect(() => {
        const checkWelcomeModal = async () => {
            try {
                const connectedUser = await metaService.getConnectedUser();
                const profile = await userProfileService.getProfile();

                if (!connectedUser && shouldShowWelcomeModal() && profile) {
                    setUserName(profile.full_name);
                    setShowWelcomeModal(true);
                }
            } catch (err) {
                console.error('Failed to check welcome modal status:', err);
            }
        };

        checkWelcomeModal();
    }, []);

    // Function to fetch ad account (separated for reuse)
    const fetchAdAccount = async (forceRefresh = false) => {
        setLoadingAdAccount(true);
        setAdAccountError(null);

        try {
            // ALWAYS check if user is connected FIRST (before using cache)
            const connectedUser = await metaService.getConnectedUser();
            setHasConnectedUser(!!connectedUser);
            console.log('[Dashboard] Connected user check:', connectedUser ? connectedUser.name : 'not connected');

            if (!connectedUser) {
                // User not connected - clear any stale cache and show error
                localStorage.removeItem('marketing_pro_selected_ad_account');
                setAdAccountId(null);
                setAdAccountError('Conecte sua conta Meta em Configurações para ver seus dados.');
                setLoadingAdAccount(false);
                return;
            }


            // NOTE: No early-return here — always fetch accounts list for the selector

            // Get selected business managers
            let storedBmIds = localStorage.getItem('marketing_pro_active_bm_ids');

            // If no BMs stored, auto-fetch and save first one
            if (!storedBmIds) {
                console.log('No BMs stored, fetching from API...');
                const businesses = await metaService.getBusinesses();
                if (businesses.length === 0) {
                    setAdAccountError('Nenhum Business Manager encontrado nesta conta.');
                    setLoadingAdAccount(false);
                    return;
                }
                // Auto-save first BM
                const firstId = businesses[0].id;
                localStorage.setItem('marketing_pro_active_bm_ids', JSON.stringify([firstId]));
                storedBmIds = JSON.stringify([firstId]);
            }

            const bmIds: string[] = JSON.parse(storedBmIds);
            if (bmIds.length === 0) {
                setAdAccountError('Selecione um Business Manager em Configurações.');
                setLoadingAdAccount(false);
                return;
            }

            // Clear cached ad account when BM changes
            if (forceRefresh) {
                localStorage.removeItem('marketing_pro_selected_ad_account');
            }

            // Fetch ad accounts from first business manager
            const fetchedAccounts = await metaService.getAdAccounts(bmIds[0]);
            if (fetchedAccounts.length === 0) {
                setAdAccountError('Nenhuma conta de anúncios encontrada neste Business Manager.');
                setLoadingAdAccount(false);
                return;
            }

            // Store all accounts for the selector
            setAdAccounts(fetchedAccounts);

            // Use cached account if it exists in the list, otherwise first active
            const cached = getSelectedAdAccountId();
            const cachedValid = cached && fetchedAccounts.some(acc => acc.id === cached);
            const activeAccount = cachedValid
                ? fetchedAccounts.find(acc => acc.id === cached)!
                : fetchedAccounts.find(acc => acc.status === 'ACTIVE') || fetchedAccounts[0];
            setAdAccountId(activeAccount.id);
            setSelectedAdAccountId(activeAccount.id);
            setAdAccountError(null); // Clear any previous error
        } catch (err) {
            console.error('Failed to fetch ad account:', err);
            setAdAccountError(err instanceof Error ? err.message : 'Erro ao buscar conta de anúncios');
        } finally {
            setLoadingAdAccount(false);
        }
    };

    // Handle ad account change from selector
    const handleAdAccountChange = (accountId: string) => {
        setAdAccountId(accountId);
        setSelectedAdAccountId(accountId);
        setShowAccountSelector(false);
        console.log('[Dashboard] User selected ad account:', accountId);
    };

    // Fetch Ad Account on mount
    useEffect(() => {
        fetchAdAccount();
    }, []);

    // Listen for BM selection changes from Settings page (cross-tab and same-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'marketing_pro_active_bm_ids') {
                console.log('BM selection changed, refetching ad account...');
                setAdAccountId(null); // Reset to trigger refetch
                fetchAdAccount(true); // Force refresh to get new ad accounts
            }
            // Also listen for Meta user connection changes
            if (e.key === 'meta_ads_connected_user') {
                console.log('Meta user connection changed, checking status...');
                fetchAdAccount(true);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Fetch insights data using hook
    const { data, kpiData, loading, error, refetch } = useInsightsData(
        adAccountId || undefined,
        filters
    );

    // Chart data from timeseries
    const chartData = useMemo(() => {
        if (!data?.timeseries || data.timeseries.length === 0) {
            return [];
        }
        return timeseriestoChartData(data.timeseries, selectedChartMetric);
    }, [data?.timeseries, selectedChartMetric]);

    // Use empty data when no real data is available
    const displayKpiData = kpiData || generateEmptyKpiData();
    const isUsingEmptyData = !kpiData;

    // Loading state
    if (loadingAdAccount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-slate-500">Carregando conta de anúncios...</p>
            </div>
        );
    }

    return (
        <>
            {/* Welcome Modal */}
            {showWelcomeModal && (
                <WelcomeModal
                    userName={userName}
                    onClose={() => setShowWelcomeModal(false)}
                />
            )}

            <div className="space-y-6">
                {/* Page Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500">
                                Bem-vindo de volta, {user?.email}
                            </p>
                            <button
                                onClick={() => {
                                    fetchAdAccount(true);
                                    if (refetch) refetch();
                                }}
                                disabled={loading || loadingAdAccount}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                                title="Atualizar métricas"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </button>
                        </div>
                    </div>

                    {/* Ad Account Selector */}
                    {adAccounts.length > 1 && adAccountId && (
                        <div className="relative">
                            <button
                                onClick={() => setShowAccountSelector(!showAccountSelector)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors text-sm shadow-sm"
                            >
                                <span className="text-slate-500">Conta:</span>
                                <span className="font-medium text-slate-800 max-w-[200px] truncate">
                                    {adAccounts.find(a => a.id === adAccountId)?.name || adAccountId}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAccountSelector ? 'rotate-180' : ''}`} />
                            </button>
                            {showAccountSelector && (
                                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                    {adAccounts
                                        .filter(acc => acc.status === 'ACTIVE')
                                        .map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => handleAdAccountChange(acc.id)}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${acc.id === adAccountId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                                                    }`}
                                            >
                                                <div className="font-medium truncate">{acc.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{acc.id} • {acc.currency}</div>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </header>

                {/* Ad Account Configuration Warning */}
                {adAccountError && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <WifiOff className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">Configuração Necessária</p>
                            <p className="text-xs text-blue-600">{adAccountError}</p>
                        </div>
                        <a
                            href="/settings"
                            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Ir para Configurações
                        </a>
                    </div>
                )}


                {/* No Data Info */}
                {isUsingEmptyData && !loading && !adAccountError && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-slate-700">Sem dados disponíveis</p>
                            <p className="text-xs text-slate-500">
                                Conecte sua conta Meta em Configurações para visualizar métricas reais.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Erro ao carregar dados</p>
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                        <button
                            onClick={refetch}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* Filter Bar */}
                <FilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                />

                {/* Top KPI Cards - 5 principais métricas */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                                <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <KpiCardsSection data={displayKpiData} />
                )}

                {/* Main Content: Chart (large) + Sidebar KPIs */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                    {/* Temporal Chart - Full width of left column */}
                    <TemporalChart
                        data={chartData}
                        comparisonData={filters.comparison !== 'none' ? chartData : undefined}
                        selectedMetric={selectedChartMetric}
                        onMetricChange={setSelectedChartMetric}
                        showTrendLine
                    />

                    {/* Sidebar KPIs - Right column */}
                    <SidebarKpiCards
                        data={displayKpiData}
                        metrics={KPI_METRICS}
                    />
                </div>

                {/* Budget Distribution + Alerts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BudgetDistribution
                        byCampaign={MOCK_BUDGET_DATA.byCampaign}
                        byObjective={MOCK_BUDGET_DATA.byObjective}
                        byPlatform={MOCK_BUDGET_DATA.byPlatform}
                        byAudience={MOCK_BUDGET_DATA.byAudience}
                    />
                    <AlertsRecommendations alerts={MOCK_ALERTS} />
                </div>
            </div>
        </>
    );
};

export default DashboardHome;
