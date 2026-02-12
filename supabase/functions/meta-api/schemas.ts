import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Constants
export const VALID_ACTIONS = [
    'businesses', 'adaccounts', 'pages', 'instagram_accounts',
    'campaigns', 'campaigns_with_insights', 'create_campaign', 'update_campaign',
    'insights', 'insights_timeseries'
] as const;

// Base Schema
export const BaseParamsSchema = z.object({
    business_id: z.string().optional(),
    ad_account_id: z.string().optional(),
    page_id: z.string().optional(),
    campaign_id: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(25),
    before: z.string().optional(),
    after: z.string().optional(),
});

// Insights Schema
export const InsightsParamsSchema = BaseParamsSchema.extend({
    date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
    date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
    date_preset: z.enum(['today', 'yesterday', 'this_month', 'last_month', 'this_quarter', 'maximum', 'last_3d', 'last_7d', 'last_14d', 'last_28d', 'last_30d', 'last_90d']).optional(),
    level: z.enum(['ad', 'adset', 'campaign', 'account']).optional().default('account'),
    breakdown: z.enum(['day', 'week', 'month']).optional(),
}).refine(data => {
    if ((data.date_start && !data.date_end) || (!data.date_start && data.date_end)) {
        return false;
    }
    return true;
}, { message: "Both date_start and date_end must be provided if one is present", path: ["date_start"] });

// Create Campaign Schema
export const CreateCampaignSchema = z.object({
    name: z.string().min(1),
    objective: z.enum(['OUTCOME_TRAFFIC', 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_ENGAGEMENT', 'OUTCOME_AWARENESS', 'OUTCOME_APP_PROMOTION']),
    status: z.enum(['ACTIVE', 'PAUSED']),
    special_ad_categories: z.array(z.string()).optional().default([]),
    daily_budget: z.number().optional(),
    lifetime_budget: z.number().optional(),
    start_time: z.string().datetime({ offset: true }).optional(),
    stop_time: z.string().datetime({ offset: true }).optional(),
    bid_strategy: z.enum(['LOWEST_COST_WITHOUT_CAP', 'COST_CAP', 'BID_CAP']).optional(),
});

// Update Campaign Schema
export const UpdateCampaignSchema = z.object({
    name: z.string().min(1).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
    daily_budget: z.number().optional(),
    lifetime_budget: z.number().optional(),
});

// Main Request Schema
export const RequestSchema = z.object({
    action: z.enum(VALID_ACTIONS),
    params: z.union([InsightsParamsSchema, BaseParamsSchema]).optional(),
    body: z.union([CreateCampaignSchema, UpdateCampaignSchema, z.record(z.unknown())]).optional(),
});

export type MetaApiRequest = z.infer<typeof RequestSchema>;
export type MetaApiParams = z.infer<typeof InsightsParamsSchema>;
