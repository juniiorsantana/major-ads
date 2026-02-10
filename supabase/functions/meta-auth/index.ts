/**
 * Meta Auth Edge Function
 * Handles Facebook OAuth, token exchange, and refresh
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: simple in-memory store (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    return true;
}

// Input validation
function validateToken(token: unknown): string {
    if (!token || typeof token !== 'string') {
        throw new Error('Invalid access_token: must be a non-empty string');
    }
    if (token.length < 20 || token.length > 500) {
        throw new Error('Invalid access_token: invalid length');
    }
    // Basic sanitization - tokens should be alphanumeric with some special chars
    if (!/^[A-Za-z0-9_\-|]+$/.test(token)) {
        throw new Error('Invalid access_token: contains invalid characters');
    }
    return token;
}

function log(level: 'info' | 'warn' | 'error', message: string, data?: object) {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ timestamp, level, message, ...data }));
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting check
    if (!checkRateLimit(clientIp)) {
        log('warn', 'Rate limit exceeded', { ip: clientIp });
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
        });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('PRIVATE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Server configuration error');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();
        const action = body.action || 'authenticate';

        // Validate and sanitize token
        const access_token = validateToken(body.access_token);

        if (action === 'refresh_token') {
            // Token refresh flow - exchange short-lived for long-lived
            return await handleTokenRefresh(access_token, supabase, body.app_user_id);
        }

        // Default: authenticate flow
        return await handleAuthenticate(access_token, supabase, body.app_user_id);

    } catch (error: any) {
        log('error', 'Auth error', { message: error.message, ip: clientIp });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

async function handleAuthenticate(access_token: string, supabase: any, app_user_id?: string) {
    // 1. Verify token with Facebook
    const fbRes = await fetch(
        `https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email`
    );
    const fbData = await fbRes.json();

    if (fbData.error) {
        log('warn', 'Facebook verification failed', { error: fbData.error.message });
        throw new Error(`Facebook Error: ${fbData.error.message}`);
    }

    log('info', 'Facebook user verified', { fb_user_id: fbData.id });

    // 2. Try to exchange for long-lived token
    let longLivedToken = access_token;
    let tokenExpiresAt: string | null = null;

    try {
        const appId = Deno.env.get('META_APP_ID');
        const appSecret = Deno.env.get('META_APP_SECRET');

        if (appId && appSecret) {
            const exchangeRes = await fetch(
                `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
            );
            const exchangeData = await exchangeRes.json();

            if (exchangeData.access_token) {
                longLivedToken = exchangeData.access_token;
                // Long-lived tokens last ~60 days
                const expiresIn = exchangeData.expires_in || 60 * 24 * 60 * 60;
                tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
                log('info', 'Exchanged for long-lived token', { expires_at: tokenExpiresAt });
            }
        }
    } catch (e) {
        log('warn', 'Token exchange failed, using short-lived token', { error: (e as Error).message });
    }

    // 3. Store token in the CURRENT APP USER's metadata (not a Facebook-based user)
    // This is critical: we must update the user who is already logged in via Supabase Auth
    if (!app_user_id) {
        throw new Error('app_user_id is required to store the Facebook token');
    }

    const userMetadata = {
        facebook_access_token: longLivedToken,
        facebook_user_id: fbData.id,
        facebook_name: fbData.name,
        facebook_email: fbData.email,
        token_expires_at: tokenExpiresAt,
        token_updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.auth.admin.updateUserById(app_user_id, {
        user_metadata: userMetadata
    });

    if (updateError) {
        log('error', 'Failed to update user metadata', { error: updateError.message, user_id: app_user_id });
        throw new Error('Failed to store Facebook credentials');
    }

    log('info', 'Updated app user with Facebook token', { user_id: app_user_id, fb_user_id: fbData.id });

    return new Response(JSON.stringify({
        success: true,
        user: {
            meta_user_id: fbData.id,
            name: fbData.name,
            email: fbData.email || `${fbData.id}@meta.local`,
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleTokenRefresh(access_token: string, supabase: any, app_user_id?: string) {
    const appId = Deno.env.get('META_APP_ID');
    const appSecret = Deno.env.get('META_APP_SECRET');

    if (!appId || !appSecret) {
        throw new Error('Token refresh not configured');
    }

    // Exchange for new long-lived token
    const exchangeRes = await fetch(
        `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
    );
    const exchangeData = await exchangeRes.json();

    if (exchangeData.error) {
        log('error', 'Token refresh failed', { error: exchangeData.error.message });
        throw new Error(`Token refresh failed: ${exchangeData.error.message}`);
    }

    const newToken = exchangeData.access_token;
    const expiresIn = exchangeData.expires_in || 60 * 24 * 60 * 60;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update user metadata if app_user_id provided
    if (app_user_id) {
        await supabase.auth.admin.updateUserById(app_user_id, {
            user_metadata: {
                facebook_access_token: newToken,
                token_expires_at: tokenExpiresAt,
                token_updated_at: new Date().toISOString(),
            }
        });
        log('info', 'Token refreshed for user', { user_id: app_user_id });
    }

    return new Response(JSON.stringify({
        success: true,
        expires_at: tokenExpiresAt,
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}
