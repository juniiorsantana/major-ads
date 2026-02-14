import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabaseClient.ts";
import { MetaService } from "./services/meta.service.ts";
import { RequestSchema } from "./schemas.ts";

// Rate Limiting (In-Memory)
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

serve(async (req: Request) => {
    // 1. CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Auth & Setup
        const supabase = createSupabaseClient(req);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Auth Error:", authError);
            throw new Error("Unauthorized");
        }

        // 3. Rate Limiting
        const limit = checkRateLimit(user.id);
        if (!limit.allowed) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 429
            });
        }

        // 4. Input Validation
        const body = await req.json();
        const validation = RequestSchema.safeParse(body);

        if (!validation.success) {
            const errorMsg = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new Error(`Validation Error: ${errorMsg}`);
        }

        const { action, params, body: payload } = validation.data;

        // 5. Service Initialization
        const fbToken = user.user_metadata?.facebook_access_token;
        if (!fbToken) {
            throw new Error("Facebook not connected");
        }

        const metaService = new MetaService(fbToken);
        let data;

        // 6. Controller Logic
        console.log(`[MetaAPI] Action: ${action} User: ${user.id}`);

        switch (action) {
            case 'businesses':
                data = await metaService.getBusinesses();
                break;
            case 'adaccounts':
                if (!params?.business_id) throw new Error("business_id required");
                data = await metaService.getAdAccounts(params.business_id);
                break;
            case 'campaigns':
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                data = await metaService.getCampaigns(params.ad_account_id);
                break;
            case 'campaigns_with_insights':
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                // [FIX] Passar parâmetros de data do frontend para o serviço
                // Permite que o filtro de período da página de campanhas funcione
                data = await metaService.getCampaignsWithInsights(params.ad_account_id, {
                    ...(params.date_preset ? { date_preset: params.date_preset } : {}),
                    ...(params.date_start ? { date_start: params.date_start } : {}),
                    ...(params.date_end ? { date_end: params.date_end } : {}),
                });
                break;
            case 'insights':
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                data = await metaService.getInsights(params.ad_account_id, params || {});
                break;
            case 'insights_timeseries':
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                data = await metaService.getInsightsTimeseries(params.ad_account_id, params || {});
                break;
            case 'create_campaign':
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                data = await metaService.createCampaign(params.ad_account_id, payload);
                break;

            // Allow specialized handling for logic not fully moved to service yet
            // Or extend service as needed
            case 'pages':
                if (!params?.business_id) throw new Error("business_id required");
                data = await metaService.getPages(params.business_id);
                break;
            case 'instagram_accounts':
                if (!params?.page_id) throw new Error("page_id required");
                data = await metaService.getInstagramAccounts(params.page_id);
                break;
            case 'update_campaign':
                if (!params?.campaign_id) throw new Error("campaign_id required");
                if (!payload) throw new Error("Request body required for update_campaign");
                data = await metaService.updateCampaign(params.campaign_id, payload);
                break;
            case 'duplicate_campaign':
                if (!params?.campaign_id) throw new Error("campaign_id required");
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                data = await metaService.duplicateCampaign(params.campaign_id, params.ad_account_id);
                break;

            default:
                throw new Error("Invalid action");
        }

        return new Response(JSON.stringify(data), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "X-RateLimit-Remaining": String(limit.remaining)
            },
            status: 200
        });

    } catch (error: any) {
        const message = error.message || "Internal server error";
        let status = 500;

        if (message === "Unauthorized" || message === "Facebook not connected") {
            status = 401;
        } else if (message.startsWith("Validation Error")) {
            status = 422;
        } else if (message.includes("Rate limit")) {
            status = 429;
        } else if (message.includes("Meta API Error") || message.includes("Facebook Error")) {
            status = 502;
        }

        console.error(`[MetaAPI] Error (${status}): ${message}`);

        return new Response(JSON.stringify({ error: message, code: status }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status
        });
    }
});
