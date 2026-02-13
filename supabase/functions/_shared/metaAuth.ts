import { createAdminClient } from "./supabaseClient.ts";

/**
 * Validates the Facebook Token or attempts to refresh it if expired/invalid.
 * This is used by Edge Functions to ensure seamless API calls.
 */
export async function refreshMetaToken(
    currentAccessToken: string,
    appUserId: string
): Promise<{ success: boolean; newAccessToken?: string; error?: string }> {
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");

    if (!appId || !appSecret) {
        console.error("[MetaAuth] META_APP_ID or META_APP_SECRET missing.");
        return { success: false, error: "Server configuration error (Meta App ID/Secret missing)" };
    }

    try {
        console.log(`[MetaAuth] Attempting to refresh token for user ${appUserId}...`);

        // Exchange the current (expired/short-lived) token for a new long-lived token
        const res = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentAccessToken}`
        );
        const data = await res.json();

        if (data.error) {
            console.error(`[MetaAuth] Refresh Failed: ${data.error.message}`);
            return { success: false, error: data.error.message };
        }

        const newAccessToken = data.access_token;
        const expiresIn = data.expires_in || 5184000; // 60 days default
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        // Update the user's metadata in Supabase
        const supabaseAdmin = createAdminClient();
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(appUserId, {
            user_metadata: {
                facebook_access_token: newAccessToken,
                token_expires_at: tokenExpiresAt,
                token_updated_at: new Date().toISOString(),
            },
        });

        if (updateError) {
            console.error(`[MetaAuth] Failed to update user metadata: ${updateError.message}`);
            return { success: false, error: "Failed to persist new token" };
        }

        console.log(`[MetaAuth] Token refreshed successfully for user ${appUserId}`);
        return { success: true, newAccessToken };

    } catch (err) {
        console.error("[MetaAuth] Unexpected error during token refresh:", err);
        return { success: false, error: "Internal server error during token refresh" };
    }
}
