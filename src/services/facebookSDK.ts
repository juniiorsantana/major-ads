/**
 * Facebook SDK Service
 * Handles Facebook Login initialization and OAuth flow
 */

declare global {
    interface Window {
        FB: {
            init: (params: FBInitParams) => void;
            login: (callback: (response: FBLoginResponse) => void, params: FBLoginParams) => void;
            logout: (callback: () => void) => void;
            getLoginStatus: (callback: (response: FBLoginResponse) => void) => void;
            api: (path: string, callback: (response: unknown) => void) => void;
        };
        fbAsyncInit: () => void;
    }
}

interface FBInitParams {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
}

interface FBLoginParams {
    scope: string;
    return_scopes?: boolean;
    auth_type?: 'rerequest' | 'reauthenticate' | 'reauthorize';
}

interface FBLoginResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: {
        accessToken: string;
        expiresIn: number;
        signedRequest: string;
        userID: string;
        grantedScopes?: string;
    };
}

const META_APP_ID = import.meta.env.VITE_META_APP_ID;

// Required scopes for Marketing API
const MARKETING_SCOPES = [
    'public_profile',
    'email',
    'ads_management',
    'ads_read',
    'business_management',
    'read_insights',
    'pages_show_list',
    'pages_read_engagement',
].join(',');

let sdkLoaded = false;
let sdkLoadPromise: Promise<void> | null = null;

/**
 * Loads the Facebook SDK script dynamically
 */
export const loadFacebookSDK = (): Promise<void> => {
    if (sdkLoaded) {
        return Promise.resolve();
    }

    if (sdkLoadPromise) {
        return sdkLoadPromise;
    }

    sdkLoadPromise = new Promise((resolve, reject) => {
        // Check if SDK is already in DOM
        if (document.getElementById('facebook-jssdk')) {
            if (window.FB) {
                sdkLoaded = true;
                resolve();
            }
            return;
        }

        // Set async init callback
        window.fbAsyncInit = () => {
            window.FB.init({
                appId: META_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v21.0',
            });
            sdkLoaded = true;
            resolve();
        };

        // Create script element
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error('Failed to load Facebook SDK'));

        // Insert into DOM
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript?.parentNode?.insertBefore(script, firstScript);
    });

    return sdkLoadPromise;
};

/**
 * Initiates Facebook Login with marketing permissions
 */
export const facebookLogin = async (): Promise<{
    accessToken: string;
    userID: string;
    grantedScopes: string[];
}> => {
    await loadFacebookSDK();

    return new Promise((resolve, reject) => {
        window.FB.login(
            (response) => {
                if (response.status === 'connected' && response.authResponse) {
                    resolve({
                        accessToken: response.authResponse.accessToken,
                        userID: response.authResponse.userID,
                        grantedScopes: response.authResponse.grantedScopes?.split(',') || [],
                    });
                } else {
                    reject(new Error('Facebook login cancelled or failed'));
                }
            },
            {
                scope: MARKETING_SCOPES,
                return_scopes: true,
            }
        );
    });
};

/**
 * Checks current login status
 */
export const checkLoginStatus = async (): Promise<FBLoginResponse> => {
    await loadFacebookSDK();
    return new Promise((resolve) => {
        window.FB.getLoginStatus(resolve);
    });
};

/**
 * Logs out from Facebook
 */
export const facebookLogout = async (): Promise<void> => {
    await loadFacebookSDK();

    // Check status first to avoid "FB.logout() called without an access token"
    const status = await checkLoginStatus();
    if (status.status !== 'connected') {
        return;
    }

    return new Promise((resolve) => {
        window.FB.logout(() => resolve());
    });
};

/**
 * Check if SDK is configured
 */
export const isFacebookConfigured = (): boolean => {
    return !!META_APP_ID;
};
