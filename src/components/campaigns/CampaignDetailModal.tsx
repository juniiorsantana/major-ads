import React, { useState, useEffect } from 'react';
import { Campaign, AdSet, Ad } from '../../types';
import { metaService } from '../../services/metaService';
import { X, ChevronRight, Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CampaignDetailModalProps {
    campaign: Campaign;
    onClose: () => void;
}

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

const STATUS_CONFIG = {
    ACTIVE: { label: 'ATIVA', className: 'bg-emerald-100 text-emerald-700' },
    PAUSED: { label: 'PAUSADA', className: 'bg-amber-100 text-amber-700' },
    ARCHIVED: { label: 'ARQUIVADA', className: 'bg-slate-100 text-slate-600' },
};

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ campaign, onClose }) => {
    const [adSets, setAdSets] = useState<AdSet[]>([]);
    const [expandedAdSetId, setExpandedAdSetId] = useState<string | null>(null);
    const [ads, setAds] = useState<Record<string, Ad[]>>({});
    const [loadingAdSets, setLoadingAdSets] = useState(true);
    const [loadingAds, setLoadingAds] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdSets = async () => {
            setLoadingAdSets(true);
            setError(null);
            try {
                const data = await metaService.getAdSets(campaign.id);
                setAdSets(data);
            } catch (err: any) {
                console.error('Failed to fetch ad sets:', err);
                setError(err.message || 'Erro ao carregar conjuntos de anúncios');
            } finally {
                setLoadingAdSets(false);
            }
        };

        fetchAdSets();
    }, [campaign.id]);

    const handleAdSetClick = async (adSetId: string) => {
        if (expandedAdSetId === adSetId) {
            setExpandedAdSetId(null);
            return;
        }

        setExpandedAdSetId(adSetId);

        if (!ads[adSetId]) {
            setLoadingAds({ ...loadingAds, [adSetId]: true });
            try {
                const data = await metaService.getAds(adSetId);
                setAds({ ...ads, [adSetId]: data });
            } catch (err: any) {
                console.error('Failed to fetch ads:', err);
            } finally {
                setLoadingAds({ ...loadingAds, [adSetId]: false });
            }
        }
    };

    const MetricRow = ({ label, value, trend }: { label: string; value: string | React.ReactNode; trend?: 'up' | 'down' }) => (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{value}</span>
                {trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                {trend === 'down' && <TrendingDown size={14} className="text-rose-500" />}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{campaign.name}</h2>
                        <p className="text-sm text-slate-500 mt-1">{campaign.objective}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* Campaign Metrics */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Métricas da Campanha</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-slate-500">Investido</div>
                            <div className="text-lg font-bold text-slate-900">{formatCurrency(campaign.spend)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">ROAS</div>
                            <div className="text-lg font-bold text-slate-900">{(campaign.roas || 0).toFixed(1)}x</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">Conversões</div>
                            <div className="text-lg font-bold text-slate-900">{campaign.conversions || 0}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">CTR</div>
                            <div className="text-lg font-bold text-slate-900">{(campaign.ctr || 0).toFixed(2)}%</div>
                        </div>
                    </div>
                </div>

                {/* AdSets List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Conjuntos de Anúncios</h3>

                    {loadingAdSets && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8 text-red-600">
                            <p>{error}</p>
                        </div>
                    )}

                    {!loadingAdSets && !error && adSets.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <p>Nenhum conjunto de anúncios encontrado</p>
                        </div>
                    )}

                    {!loadingAdSets && !error && adSets.length > 0 && (
                        <div className="space-y-2">
                            {adSets.map((adSet) => (
                                <div key={adSet.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                    {/* AdSet Header */}
                                    <button
                                        onClick={() => handleAdSetClick(adSet.id)}
                                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ChevronRight
                                                size={18}
                                                className={`text-slate-400 transition-transform ${expandedAdSetId === adSet.id ? 'rotate-90' : ''
                                                    }`}
                                            />
                                            <div className="text-left">
                                                <div className="font-medium text-slate-900">{adSet.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[adSet.status].className}`}>
                                                        {STATUS_CONFIG[adSet.status].label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">Gasto</div>
                                                <div className="font-semibold text-slate-900">{formatCurrency(adSet.spend)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">ROAS</div>
                                                <div className="font-semibold text-slate-900">{(adSet.roas || 0).toFixed(1)}x</div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Ads List (Expanded) */}
                                    {expandedAdSetId === adSet.id && (
                                        <div className="border-t border-slate-200 bg-slate-50 p-4">
                                            {loadingAds[adSet.id] && (
                                                <div className="flex items-center justify-center py-6">
                                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                                </div>
                                            )}

                                            {!loadingAds[adSet.id] && (!ads[adSet.id] || ads[adSet.id].length === 0) && (
                                                <div className="text-center py-6 text-slate-500 text-sm">
                                                    Nenhum anúncio encontrado
                                                </div>
                                            )}

                                            {!loadingAds[adSet.id] && ads[adSet.id] && ads[adSet.id].length > 0 && (
                                                <div className="space-y-2">
                                                    {ads[adSet.id].map((ad) => (
                                                        <div key={ad.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                                            <div className="flex items-start gap-3">
                                                                {ad.creative?.thumbnail_url && (
                                                                    <img
                                                                        src={ad.creative.thumbnail_url}
                                                                        alt={ad.name}
                                                                        className="w-12 h-12 rounded object-cover"
                                                                    />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-sm text-slate-900 truncate">{ad.name}</div>
                                                                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                                                        <div>
                                                                            <div className="text-slate-500">Gasto</div>
                                                                            <div className="font-semibold text-slate-900">{formatCurrency(ad.spend)}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-slate-500">ROAS</div>
                                                                            <div className="font-semibold text-slate-900">{(ad.roas || 0).toFixed(1)}x</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-slate-500">Conv.</div>
                                                                            <div className="font-semibold text-slate-900">{ad.conversions || 0}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignDetailModal;
