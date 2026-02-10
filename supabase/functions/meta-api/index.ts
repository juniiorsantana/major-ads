/**
 * Meta API Edge Function
 * Proxy for Meta Graph API with rate limiting, validation, and logging
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Input validation helpers
const VALID_ACTIONS = [
    'businesses', 'adaccounts', 'pages', 'instagram_accounts',
    'campaigns', 'campaigns_with_insights', 'create_campaign', 'update_campaign',
    'insights', 'insights_timeseries'
];

const MAX_DATE_RANGE_DAYS = 90;

function validateAction(action: unknown): string {
    if (!action || typeof action !== 'string') {
        throw new Error('Missing or invalid action');
    }
    if (!VALID_ACTIONS.includes(action)) {
        throw new Error(`Invalid action: ${action}`);
    }
    return action;
}

function validateId(id: unknown, field: string): string {
    if (!id || typeof id !== 'string') {
        throw new Error(`Missing ${field}`);
    }
    if (!/^(act_)?[0-9]+$/.test(id) && !/^[a-zA-Z0-9_-]+$/.test(id)) {
        throw new Error(`Invalid ${field} format`);
    }
    return id;
}

function validateDateRange(dateStart: string | undefined, dateEnd: string | undefined): { valid: boolean; timeRange?: string } {
    if (!dateStart || !dateEnd) {
        return { valid: false };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStart) || !dateRegex.test(dateEnd)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const start = new Date(dateStart);
    const end = new Date(dateEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date values');
    }

    if (start > end) {
        throw new Error('date_start must be before or equal to date_end');
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_DATE_RANGE_DAYS) {
        throw new Error(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`);
    }

    return {
        valid: true,
        timeRange: JSON.stringify({ since: dateStart, until: dateEnd })
    };
}

function getTimeIncrement(breakdown: string): string {
    switch (breakdown) {
        case 'week': return '7';
        case 'month': return 'monthly';
        case 'day':
        default: return '1';
    }
}

function log(level: 'info' | 'warn' | 'error', message: string, data?: object) {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ timestamp, level, message, ...data }));
}

// Insights fields - expanded for complete metrics
const INSIGHTS_FIELDS = [
    'spend', 'impressions', 'clicks', 'reach', 'frequency',
    'cpc', 'cpm', 'ctr', 'cpp',
    'actions', 'conversions', 'conversion_values',
    'cost_per_action_type', 'cost_per_conversion'
].join(',');

const INSIGHTS_TIMESERIES_FIELDS = [
    'spend', 'impressions', 'clicks', 'reach',
    'cpc', 'cpm', 'ctr',
    'actions', 'conversions'
].join(',');

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const authHeader = req.headers.get('Authorization');

        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            log('warn', 'Unauthorized access attempt');
            throw new Error('Unauthorized');
        }

        // Rate limiting
        const rateLimit = checkRateLimit(user.id);
        if (!rateLimit.allowed) {
            log('warn', 'Rate limit exceeded', { user_id: user.id });
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before making more requests.' }), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'X-RateLimit-Remaining': '0',
                    'Retry-After': '60',
                },
                status: 429,
            });
        }

        const fbToken = user.user_metadata?.facebook_access_token;
        if (!fbToken) {
            throw new Error('No Facebook Token found. Please reconnect Facebook.');
        }

        // Check token expiry
        const tokenExpiresAt = user.user_metadata?.token_expires_at;
        if (tokenExpiresAt && new Date(tokenExpiresAt) < new Date()) {
            log('warn', 'Token expired', { user_id: user.id });
            throw new Error('Facebook token expired. Please reconnect.');
        }

        const body = await req.json();
        const action = validateAction(body.action);
        const params = body.params || {};

        const API_VER = 'v21.0';
        const BASE = `https://graph.facebook.com/${API_VER}`;

        let url = '';
        let method = 'GET';
        let payload = null;

        switch (action) {
            case 'businesses':
                url = `${BASE}/me/businesses?fields=id,name,vertical,created_time`;
                break;

            case 'adaccounts': {
                const businessId = validateId(params.business_id, 'business_id');

                // Fetch both owned and client ad accounts
                const ownedUrl = `${BASE}/${businessId}/owned_ad_accounts?fields=id,name,currency,account_status&access_token=${fbToken}`;
                const clientUrl = `${BASE}/${businessId}/client_ad_accounts?fields=id,name,currency,account_status&access_token=${fbToken}`;

                log('info', 'Fetching ad accounts', { business_id: businessId, user_id: user.id });

                try {
                    const [ownedRes, clientRes] = await Promise.all([
                        fetch(ownedUrl),
                        fetch(clientUrl)
                    ]);

                    const ownedData = await ownedRes.json();
                    const clientData = await clientRes.json();

                    // Combine both lists, avoiding duplicates
                    const allAccounts = new Map();

                    // Add owned accounts
                    if (ownedData.data && Array.isArray(ownedData.data)) {
                        ownedData.data.forEach((acc: any) => allAccounts.set(acc.id, acc));
                    }

                    // Add client accounts (won't overwrite if already exists)
                    if (clientData.data && Array.isArray(clientData.data)) {
                        clientData.data.forEach((acc: any) => {
                            if (!allAccounts.has(acc.id)) {
                                allAccounts.set(acc.id, acc);
                            }
                        });
                    }

                    const combinedAccounts = Array.from(allAccounts.values());
                    log('info', 'Ad accounts fetched', {
                        owned: ownedData.data?.length || 0,
                        client: clientData.data?.length || 0,
                        total: combinedAccounts.length,
                        user_id: user.id
                    });

                    return new Response(JSON.stringify({ data: combinedAccounts }), {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json',
                            'X-RateLimit-Remaining': String(rateLimit.remaining),
                        },
                    });
                } catch (err) {
                    log('error', 'Failed to fetch ad accounts', { error: err instanceof Error ? err.message : 'Unknown' });
                    throw new Error('Failed to fetch ad accounts from Business Manager');
                }
            }

            case 'pages': {
                const businessId = validateId(params.business_id, 'business_id');
                url = `${BASE}/${businessId}/owned_pages?fields=id,name,category,picture`;
                break;
            }

            case 'instagram_accounts': {
                const pageId = validateId(params.page_id, 'page_id');
                url = `${BASE}/${pageId}?fields=instagram_business_account{id,username,profile_picture_url}`;
                break;
            }

            case 'campaigns': {
                const adAccountId = validateId(params.ad_account_id, 'ad_account_id');
                url = `${BASE}/${adAccountId}/campaigns?fields=id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget`;
                break;
            }

            case 'campaigns_with_insights': {
                const adAccountId = validateId(params.ad_account_id, 'ad_account_id');

                log('info', 'Fetching campaigns with insights', { ad_account_id: adAccountId, user_id: user.id });

                // Fetch campaigns first
                const campaignsUrl = `${BASE}/${adAccountId}/campaigns?fields=id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget&access_token=${fbToken}`;
                const campaignsRes = await fetch(campaignsUrl);
                const campaignsData = await campaignsRes.json();

                if (campaignsData.error) {
                    log('error', 'Facebook API error (campaigns)', { error: campaignsData.error.message, code: campaignsData.error.code });
                    throw new Error(campaignsData.error.message);
                }

                const campaigns = campaignsData.data || [];

                // Fetch insights for each campaign (parallel requests)
                const campaignsWithInsights = await Promise.all(
                    campaigns.map(async (campaign: any) => {
                        try {
                            // Get last 7 days insights for each campaign
                            const insightsUrl = `${BASE}/${campaign.id}/insights?fields=${INSIGHTS_FIELDS}&date_preset=last_7d&access_token=${fbToken}`;
                            const insightsRes = await fetch(insightsUrl);
                            const insightsData = await insightsRes.json();

                            if (insightsData.error) {
                                log('warn', 'Failed to fetch insights for campaign', { campaign_id: campaign.id, error: insightsData.error.message });
                                // Return campaign without insights if fetch fails
                                return {
                                    ...campaign,
                                    spend: 0,
                                    impressions: 0,
                                    clicks: 0,
                                    cpc: 0,
                                    cpm: 0,
                                    ctr: 0,
                                };
                            }

                            const insights = insightsData.data?.[0] || {};

                            // Parse insights data
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
                        } catch (err) {
                            log('error', 'Error fetching campaign insights', { campaign_id: campaign.id, error: err instanceof Error ? err.message : 'Unknown' });
                            // Return campaign without insights on error
                            return {
                                ...campaign,
                                spend: 0,
                                impressions: 0,
                                clicks: 0,
                                cpc: 0,
                                cpm: 0,
                                ctr: 0,
                            };
                        }
                    })
                );

                log('info', 'Campaigns with insights fetched', { count: campaignsWithInsights.length, user_id: user.id });

                // Return directly, will be wrapped in Response below
                const duration = Date.now() - startTime;
                return new Response(JSON.stringify({ data: campaignsWithInsights }), {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                    },
                });
            }

            case 'insights': {
                const adAccountId = validateId(params.ad_account_id, 'ad_account_id');
                const level = params.level || 'account';

                // Build date parameters
                let dateParams = '';
                const dateValidation = validateDateRange(params.date_start, params.date_end);

                if (dateValidation.valid && dateValidation.timeRange) {
                    dateParams = `&time_range=${encodeURIComponent(dateValidation.timeRange)}`;
                } else if (params.date_preset) {
                    dateParams = `&date_preset=${params.date_preset}`;
                } else {
                    dateParams = '&date_preset=last_7d';
                }

                url = `${BASE}/${adAccountId}/insights?fields=${INSIGHTS_FIELDS}${dateParams}&level=${level}`;
                break;
            }

            case 'insights_timeseries': {
                const adAccountId = validateId(params.ad_account_id, 'ad_account_id');
                const dateValidation = validateDateRange(params.date_start, params.date_end);

                if (!dateValidation.valid || !dateValidation.timeRange) {
                    throw new Error('date_start and date_end are required for timeseries');
                }

                const breakdown = params.breakdown || 'day';
                const timeIncrement = getTimeIncrement(breakdown);
                const level = params.level || 'account';

                url = `${BASE}/${adAccountId}/insights?` +
                    `fields=${INSIGHTS_TIMESERIES_FIELDS}` +
                    `&time_range=${encodeURIComponent(dateValidation.timeRange)}` +
                    `&time_increment=${timeIncrement}` +
                    `&level=${level}`;
                break;
            }

            case 'create_campaign': {
                const adAccountId = validateId(params.ad_account_id, 'ad_account_id');
                url = `${BASE}/${adAccountId}/campaigns`;
                method = 'POST';
                payload = body.body;
                break;
            }

            case 'update_campaign': {
                const campaignId = validateId(params.campaign_id, 'campaign_id');
                url = `${BASE}/${campaignId}`;
                method = 'POST';
                payload = body.body;
                break;
            }

            default:
                throw new Error(`Unhandled action: ${action}`);
        }

        // Make request to Facebook Graph API
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${separator}access_token=${fbToken}`;

        log('info', 'API request', { action, user_id: user.id });

        const fbRes = await fetch(finalUrl, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : null,
        });

        const fbData = await fbRes.json();

        if (fbData.error) {
            log('error', 'Facebook API error', { action, error: fbData.error.message, code: fbData.error.code });
            throw new Error(fbData.error.message);
        }

        // Response formatting
        let responseData = fbData;
        if (action === 'instagram_accounts') {
            responseData = fbData.instagram_business_account || {};
        }

        const duration = Date.now() - startTime;
        log('info', 'API response', { action, duration_ms: duration, user_id: user.id });

        return new Response(JSON.stringify(responseData), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
        });

    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log('error', 'Request failed', { message: errorMessage, duration_ms: duration });

        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
