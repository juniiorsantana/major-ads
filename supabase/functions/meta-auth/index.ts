import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseClient.ts";

// Schemas
const RefreshTokenSchema = z.object({
    action: z.literal("refresh_token"),
    access_token: z.string().min(1),
    app_user_id: z.string().optional(),
});

const AuthenticateSchema = z.object({
    action: z.literal("authenticate").default("authenticate"),
    access_token: z.string().min(20),
    app_user_id: z.string().uuid(),
});

const RequestSchema = z.union([RefreshTokenSchema, AuthenticateSchema]);

// Types
type AuthRequest = z.infer<typeof RequestSchema>;

// Rate Limiting (In-Memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count++;
    return true;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
        return new Response(JSON.stringify({ error: "Too many requests" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 429,
        });
    }

    try {
        const body = await req.json();
        const result = RequestSchema.safeParse(body);

        if (!result.success) {
            throw new Error(`Validation Error: ${result.error.errors[0].message}`);
        }

        const { action, access_token, app_user_id } = result.data;
        const supabaseAdmin = createAdminClient();

        if (action === "refresh_token") {
            return await handleTokenRefresh(access_token, supabaseAdmin, app_user_id);
        } else {
            return await handleAuthenticate(access_token, supabaseAdmin, app_user_id!);
        }
    } catch (error: any) {
        console.error("Auth Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

async function handleAuthenticate(access_token: string, supabase: any, app_user_id: string) {
    // 1. Verify with Facebook
    const fbRes = await fetch(
        `https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email`
    );
    const fbData = await fbRes.json();

    if (fbData.error) throw new Error(`Facebook Error: ${fbData.error.message}`);

    // 2. Exchange for Long-Lived Token
    let longLivedToken = access_token;
    let tokenExpiresAt: string | null = null;
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");

    if (appId && appSecret) {
        try {
            const exRes = await fetch(
                `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
            );
            const exData = await exRes.json();
            if (exData.access_token) {
                longLivedToken = exData.access_token;
                const expiresIn = exData.expires_in || 60 * 24 * 60 * 60; // 60 days default
                tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
            }
        } catch (e) {
            console.warn("Token exchange warning:", e);
        }
    }

    // 3. Update User Metadata
    const { error } = await supabase.auth.admin.updateUserById(app_user_id, {
        user_metadata: {
            facebook_access_token: longLivedToken,
            facebook_user_id: fbData.id,
            facebook_name: fbData.name,
            facebook_email: fbData.email,
            token_expires_at: tokenExpiresAt,
            token_updated_at: new Date().toISOString(),
        },
    });

    if (error) throw new Error("Failed to update user metadata");

    return new Response(
        JSON.stringify({
            success: true,
            user: { meta_user_id: fbData.id, name: fbData.name, email: fbData.email },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
}

async function handleTokenRefresh(access_token: string, supabase: any, app_user_id?: string) {
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");

    if (!appId || !appSecret) throw new Error("Server not configured for token refresh");

    const res = await fetch(
        `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
    );
    const data = await res.json();

    if (data.error) throw new Error(`Refresh Failed: ${data.error.message}`);

    const newToken = data.access_token;
    const expiresIn = data.expires_in || 5184000;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    if (app_user_id) {
        await supabase.auth.admin.updateUserById(app_user_id, {
            user_metadata: {
                facebook_access_token: newToken,
                token_expires_at: tokenExpiresAt,
                token_updated_at: new Date().toISOString(),
            },
        });
    }

    return new Response(JSON.stringify({ success: true, expires_at: tokenExpiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });
}
