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
                data = await metaService.getCampaignsWithInsights(params.ad_account_id);
                break;
            case 'insights':
            case 'insights_timeseries': // Unified in service, can branch if needed
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                // TODO: Handle splitting insights logic if 'insights' vs 'insights_timeseries' differs significantly
                // For now mapping both to generalized getInsights
                data = await metaService.getInsights(params.ad_account_id, params || {});
                break;
            case 'create_campaign':
                if (!params?.ad_account_id) throw new Error("ad_account_id required");
                data = await metaService.createCampaign(params.ad_account_id, payload);
                break;

            // Allow specialized handling for logic not fully moved to service yet
            // Or extend service as needed
            case 'pages':
            case 'instagram_accounts':
            case 'update_campaign':
                throw new Error(`Action '${action}' not yet fully implemented in new architecture`);

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
        const isAuth = error.message === "Unauthorized" || error.message === "Facebook not connected";
        const status = isAuth ? 401 : 400;

        console.error("API Error:", error.message);

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status
        });
    }
});
