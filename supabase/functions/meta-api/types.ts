export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    start_time?: string;
    stop_time?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    insights?: MetaInsights;
}

export interface MetaInsights {
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    cpm: number;
    ctr: number;
    reach: number;
    frequency: number;
    actions: any[];
    conversions: any[];
}

export interface FacebookError {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
}
