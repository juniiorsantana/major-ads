/**
 * useInsightsData Hook
 * Fetches and manages insights data with loading/error states
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { metaService } from '../services/metaService';
import {
    FilterState,
    CampaignInsights,
    InsightsTimeseriesPoint,
    InsightsData,
    DatePeriodPreset,
    KpiCardData,
    KpiMetricKey,
} from '../types';

// ==========================================
// Date Helpers
// ==========================================

function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getDateRangeFromPreset(preset: DatePeriodPreset): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
        case 'today':
            return { start: today, end: today };

        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: yesterday, end: yesterday };
        }

        case 'today_and_yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: yesterday, end: today };
        }

        case 'last_7_days': {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            return { start, end: today };
        }

        case 'last_14_days': {
            const start = new Date(today);
            start.setDate(start.getDate() - 13);
            return { start, end: today };
        }

        case 'last_28_days': {
            const start = new Date(today);
            start.setDate(start.getDate() - 27);
            return { start, end: today };
        }

        case 'this_week': {
            // Week starts Monday (ISO standard, same as Facebook)
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const start = new Date(today);
            start.setDate(start.getDate() - diffToMonday);
            return { start, end: today };
        }

        case 'last_week': {
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const thisMonday = new Date(today);
            thisMonday.setDate(thisMonday.getDate() - diffToMonday);
            const lastMonday = new Date(thisMonday);
            lastMonday.setDate(lastMonday.getDate() - 7);
            const lastSunday = new Date(thisMonday);
            lastSunday.setDate(lastSunday.getDate() - 1);
            return { start: lastMonday, end: lastSunday };
        }

        case 'this_month': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start, end: today };
        }

        case 'last_month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start, end };
        }

        case 'custom':
        default:
            return { start: today, end: today };
    }
}

function getPreviousPeriodDates(
    start: Date,
    end: Date,
    comparisonMode: 'previous_period' | 'same_period_last_year'
): { prevStart: Date; prevEnd: Date } {
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (comparisonMode === 'same_period_last_year') {
        const prevStart = new Date(start);
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        const prevEnd = new Date(end);
        prevEnd.setFullYear(prevEnd.getFullYear() - 1);
        return { prevStart, prevEnd };
    }

    // previous_period: subtract the same number of days
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    return { prevStart, prevEnd };
}

// ==========================================
// Transform to KPI Card Data
// ==========================================

function calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function generateSparklineFromTimeseries(
    timeseries: InsightsTimeseriesPoint[],
    metric: KpiMetricKey
): number[] {
    return timeseries.slice(-7).map(point => {
        switch (metric) {
            case 'spend': return point.spend;
            case 'impressions': return point.impressions;
            case 'clicks': return point.clicks;
            case 'ctr': return point.ctr;
            case 'cpm': return point.cpm;
            case 'cpc': return point.cpc;
            case 'conversions': return point.conversions;
            default: return 0;
        }
    });
}

export function transformInsightsToKpiCards(
    current: CampaignInsights,
    previous: CampaignInsights | null,
    timeseries: InsightsTimeseriesPoint[]
): Record<KpiMetricKey, KpiCardData> {
    const createCardData = (key: KpiMetricKey, currentValue: number, previousValue: number): KpiCardData => ({
        key,
        value: currentValue,
        previousValue,
        change: currentValue - previousValue,
        changePercent: calculateChangePercent(currentValue, previousValue),
        sparklineData: generateSparklineFromTimeseries(timeseries, key),
    });

    const prev = previous || {
        spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0,
        reach: 0, frequency: 0, conversions: 0, conversion_rate: 0,
        roas: 0, cost_per_conversion: 0, messages_initiated: 0,
    };

    return {
        spend: createCardData('spend', current.spend, prev.spend),
        impressions: createCardData('impressions', current.impressions, prev.impressions),
        clicks: createCardData('clicks', current.clicks, prev.clicks),
        cpc: createCardData('cpc', current.cpc, prev.cpc),
        cpm: createCardData('cpm', current.cpm, prev.cpm),
        ctr: createCardData('ctr', current.ctr, prev.ctr),
        conversions: createCardData('conversions', current.conversions, prev.conversions),
        conversion_rate: createCardData('conversion_rate', current.conversion_rate, prev.conversion_rate),
        roas: createCardData('roas', current.roas, prev.roas),
        messages_initiated: createCardData('messages_initiated', current.messages_initiated, prev.messages_initiated),
    };
}

// ==========================================
// Main Hook
// ==========================================

interface UseInsightsDataResult {
    data: InsightsData | null;
    kpiData: Record<KpiMetricKey, KpiCardData> | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useInsightsData(
    adAccountId: string | undefined,
    filters: FilterState
): UseInsightsDataResult {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refetch = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    useEffect(() => {
        if (!adAccountId) {
            setLoading(false);
            setData(null);
            return;
        }

        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // ALWAYS use explicit dates for consistency between insights and timeseries
                let dateStart: string;
                let dateEnd: string;

                if (filters.period === 'custom' && filters.customStartDate && filters.customEndDate) {
                    dateStart = filters.customStartDate;
                    dateEnd = filters.customEndDate;
                } else {
                    const { start, end } = getDateRangeFromPreset(filters.period);
                    dateStart = formatDateForApi(start);
                    dateEnd = formatDateForApi(end);
                }

                // Prepare comparison dates
                let prevStart: string | undefined;
                let prevEnd: string | undefined;

                if (filters.comparison !== 'none') {
                    const { prevStart: ps, prevEnd: pe } = getPreviousPeriodDates(
                        new Date(dateStart),
                        new Date(dateEnd),
                        filters.comparison
                    );
                    prevStart = formatDateForApi(ps);
                    prevEnd = formatDateForApi(pe);
                }

                // Fetch all data in parallel
                const [insights, timeseries, comparison] = await Promise.all([
                    metaService.getInsights(adAccountId, { dateStart, dateEnd }),
                    metaService.getInsightsTimeseries(
                        adAccountId,
                        dateStart,
                        dateEnd,
                        filters.grouping === 'hour' ? 'day' : filters.grouping
                    ),
                    prevStart && prevEnd
                        ? metaService.getInsights(adAccountId, { dateStart: prevStart, dateEnd: prevEnd })
                        : Promise.resolve(null),
                ]);

                if (cancelled) return;

                setData({
                    insights,
                    timeseries,
                    comparison,
                });
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to fetch insights:', err);
                setError(err instanceof Error ? err.message : 'Falha ao carregar insights');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [adAccountId, filters, refreshKey]);

    // Transform to KPI card data
    const kpiData = useMemo(() => {
        if (!data) return null;
        return transformInsightsToKpiCards(data.insights, data.comparison, data.timeseries);
    }, [data]);

    return { data, kpiData, loading, error, refetch };
}

export default useInsightsData;
