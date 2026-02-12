import { MetaCampaign, MetaInsights, FacebookError } from "./types.ts";

const API_VER = 'v21.0';
const BASE = `https://graph.facebook.com/${API_VER}`;

export class MetaService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetchGraph(endpoint: string, params: Record<string, string> = {}, method = 'GET', body: any = null) {
        const url = new URL(`${BASE}${endpoint}`);
        url.searchParams.append('access_token', this.accessToken);

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }

        const response = await fetch(url.toString(), {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null,
        });

        const data = await response.json();

        if (data.error) {
            const error = data.error as FacebookError;
            console.error(`Meta API Error [${endpoint}]:`, error.message);
            throw new Error(error.message);
        }

        return data;
    }

    async getBusinesses() {
        return this.fetchGraph('/me/businesses', { fields: 'id,name,vertical,created_time' });
    }

    async getAdAccounts(businessId: string) {
        // Parallel fetch for owned and client accounts
        try {
            const [owned, client] = await Promise.all([
                this.fetchGraph(`/${businessId}/owned_ad_accounts`, { fields: 'id,name,currency,account_status' }),
                this.fetchGraph(`/${businessId}/client_ad_accounts`, { fields: 'id,name,currency,account_status' })
            ]);

            const allAccounts = new Map();
            owned.data?.forEach((acc: any) => allAccounts.set(acc.id, acc));
            client.data?.forEach((acc: any) => {
                if (!allAccounts.has(acc.id)) allAccounts.set(acc.id, acc);
            });

            return { data: Array.from(allAccounts.values()) };
        } catch (error) {
            console.error("Error fetching ad accounts:", error);
            throw new Error("Failed to fetch ad accounts");
        }
    }

    async getCampaigns(adAccountId: string, fields = 'id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget') {
        return this.fetchGraph(`/${adAccountId}/campaigns`, { fields });
    }

    /**
     * Build Meta API-compatible params from our internal params.
     * Converts date_start/date_end → time_range JSON, keeps date_preset as-is.
     * Strips internal-only fields that Meta doesn't recognize.
     */
    private buildInsightsParams(params: Record<string, any>): Record<string, string> {
        const metaParams: Record<string, string> = {};

        // Convert date_start/date_end to Meta's time_range format
        if (params.date_start && params.date_end) {
            metaParams.time_range = JSON.stringify({
                since: params.date_start,
                until: params.date_end,
            });
        } else if (params.date_preset) {
            metaParams.date_preset = params.date_preset;
        }

        // Pass through valid Meta Insights params only
        if (params.level) metaParams.level = params.level;
        if (params.time_increment) metaParams.time_increment = String(params.time_increment);
        // Note: params.breakdown (day/week/month) is time grouping, NOT Meta breakdowns.
        // It's handled via time_increment in getInsightsTimeseries. Do NOT pass as breakdowns.

        return metaParams;
    }

    async getInsights(objectId: string, params: Record<string, any>) {
        const fields = 'spend,impressions,clicks,reach,frequency,cpc,cpm,ctr,cpp,actions,conversions,conversion_values,cost_per_action_type,cost_per_conversion';
        const metaParams = this.buildInsightsParams(params);
        console.log(`[MetaService] getInsights ${objectId}`, JSON.stringify(metaParams));
        return this.fetchGraph(`/${objectId}/insights`, { fields, ...metaParams });
    }

    async getInsightsTimeseries(objectId: string, params: Record<string, any>) {
        const fields = 'spend,impressions,clicks,reach,frequency,cpc,cpm,ctr,cpp,actions,conversions,conversion_values,cost_per_action_type,cost_per_conversion';
        // Force time_increment=1 for per-day breakdown (critical for chart data)
        const metaParams = this.buildInsightsParams({ ...params, time_increment: '1' });
        // Remove date_preset when explicit dates exist (time_range takes priority)
        if (metaParams.time_range) {
            delete metaParams.date_preset;
        }
        console.log(`[MetaService] getInsightsTimeseries ${objectId}`, JSON.stringify(metaParams));
        return this.fetchGraph(`/${objectId}/insights`, { fields, ...metaParams });
    }

    async getCampaignsWithInsights(adAccountId: string) {
        const campaignsData = await this.getCampaigns(adAccountId);
        const campaigns = campaignsData.data || [];

        // Parallel enrichment
        const enriched = await Promise.all(campaigns.map(async (campaign: any) => {
            try {
                const insightsData = await this.getInsights(campaign.id, { date_preset: 'last_7d' });
                const insights = insightsData.data?.[0] || {};

                return {
                    ...campaign,
                    spend: parseFloat(insights.spend || '0'),
                    impressions: parseInt(insights.impressions || '0'),
                    clicks: parseInt(insights.clicks || '0'),
                    cpc: parseFloat(insights.cpc || '0'),
                    cpm: parseFloat(insights.cpm || '0'),
                    ctr: parseFloat(insights.ctr || '0'),
                    reach: parseInt(insights.reach || '0'),
                    frequency: parseFloat(insights.frequency || '0'),
                };
            } catch (e) {
                console.warn(`Failed to fetch insights for campaign ${campaign.id}`);
                return { ...campaign, spend: 0, impressions: 0, clicks: 0 };
            }
        }));

        return { data: enriched };
    }

    async getPages(businessId: string) {
        return this.fetchGraph(`/${businessId}/owned_pages`, {
            fields: 'id,name,category,picture{url}',
        });
    }

    async getInstagramAccounts(pageId: string) {
        return this.fetchGraph(`/${pageId}`, {
            fields: 'instagram_business_account{id,username,profile_picture_url}',
        });
    }

    async updateCampaign(campaignId: string, payload: Record<string, unknown>) {
        return this.fetchGraph(`/${campaignId}`, {}, 'POST', payload);
    }

    async createCampaign(adAccountId: string, payload: any) {
        return this.fetchGraph(`/${adAccountId}/campaigns`, {}, 'POST', payload);
    }
}
