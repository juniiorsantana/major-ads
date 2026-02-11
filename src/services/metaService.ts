/**
 * Meta Service - Real Implementation
 * Connects to Meta Marketing API via Supabase Edge Functions
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { facebookLogin, facebookLogout, isFacebookConfigured } from './facebookSDK';
import {
  BusinessManager, AdAccount, MetaPage, InstagramAccount,
  Campaign, CampaignInsights, InsightsTimeseriesPoint
} from '../types';

// USE_MOCK removed - now using dynamic runtime check via shouldUseMock() method

// ==========================================
// Types for API responses
// ==========================================

interface MetaApiResponse<T> {
  data?: T[];
  error?: {
    message: string;
    code: string;
  };
}

interface MetaUserInfo {
  meta_user_id: string;
  name: string;
  email?: string;
}

// ==========================================
// Mock Data (fallback when not configured)
// ==========================================

const mockData = {
  businesses: [
    { id: 'bm_1', name: 'Digital Growth Agency', vertical: 'Advertising' },
    { id: 'bm_2', name: 'Global Retail Corp', vertical: 'E-commerce' },
  ],
  adAccounts: [
    { id: 'act_12345', name: 'Performance Account - Q4', currency: 'USD', status: 'ACTIVE' as const },
    { id: 'act_67890', name: 'Retargeting Global', currency: 'EUR', status: 'ACTIVE' as const },
  ],
  pages: [
    { id: 'pg_1', name: 'Main Brand Page', category: 'Retail', picture: 'https://picsum.photos/40/40?1' },
    { id: 'pg_2', name: 'Secondary Store', category: 'Fashion', picture: 'https://picsum.photos/40/40?2' },
  ],
  instagrams: [
    { id: 'ig_1', username: 'brand_official', profile_picture_url: 'https://picsum.photos/40/40?3' },
  ],
  campaigns: [
    { id: 'cp_1', name: 'Winter Clearance 2024', status: 'ACTIVE' as const, objective: 'OUTCOME_SALES', spend: 1250.4, impressions: 45000, clicks: 1200 },
    { id: 'cp_2', name: 'Brand Awareness - Global', status: 'PAUSED' as const, objective: 'OUTCOME_AWARENESS', spend: 450.0, impressions: 120000, clicks: 350 },
    { id: 'cp_3', name: 'App Installs - Android', status: 'ACTIVE' as const, objective: 'OUTCOME_APP_PROMOTION', spend: 890.15, impressions: 32000, clicks: 2100 },
  ],
};

// ==========================================
// Helper: Call Edge Function
// ==========================================

const META_USER_STORAGE_KEY = 'meta_ads_connected_user';

interface StoredMetaUser {
  appUserId: string;
  metaUserId: string;
  name: string;
  email: string;
}

function getStoredMetaUser(): StoredMetaUser | null {
  const stored = localStorage.getItem(META_USER_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StoredMetaUser;
  } catch {
    return null;
  }
}

function setStoredMetaUser(user: StoredMetaUser): void {
  localStorage.setItem(META_USER_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredMetaUser(): void {
  localStorage.removeItem(META_USER_STORAGE_KEY);
}

async function callMetaApi<T>(action: string, params?: Record<string, string | undefined>): Promise<T> {
  const storedUser = getStoredMetaUser();
  if (!storedUser?.appUserId) {
    throw new Error('Not authenticated - no Meta user found');
  }

  // Filter out undefined params
  const cleanParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value;
      }
    });
  }


  // Try to get fresh session - Supabase should auto-refresh, but let's be explicit
  let { data: { session } } = await supabase.auth.getSession();

  // If session is null or token seems expired, try refreshing
  if (!session?.access_token) {
    console.log('[MetaService] Session missing, attempting refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error('[MetaService] Failed to refresh session:', refreshError);
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    session = refreshData.session;
  }

  const token = session?.access_token;

  if (!token) {
    throw new Error('No active session found. Please log in.');
  }

  const { data, error } = await supabase.functions.invoke('meta-api', {
    body: { action, params: cleanParams, app_user_id: storedUser.appUserId },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (error) {
    console.error('Meta API Error:', error);

    let detailedErrorMessage = error.message || 'Unknown error invoking meta-api';

    if (error && typeof error === 'object' && 'context' in error) {
      // @ts-ignore
      const errorContext = error.context as any;
      console.error('Error Context (Response):', errorContext);

      if (errorContext && typeof errorContext.json === 'function') {
        try {
          const errorBody = await errorContext.json();
          console.error('Error Body:', errorBody);

          // Handle JWT/session errors specifically
          if (errorBody.code === 401 || errorBody.message === 'Invalid JWT' || errorBody.error?.includes('Invalid JWT')) {
            console.warn('[MetaService] Invalid JWT detected, clearing stored user...');
            clearStoredMetaUser();
            detailedErrorMessage = 'Sessão expirada. Por favor, vá em Configurações, desconecte e reconecte sua conta Meta.';
          } else if (errorBody.error) {
            // Detect permission errors and provide user-friendly guidance
            if (errorBody.error.includes('does not exist') && params?.business_id) {
              detailedErrorMessage = `Business Manager com ID "${params.business_id}" não existe ou você não tem permissão para acessá-lo. Verifique se o ID está correto e se você tem as permissões necessárias.`;
            } else if (errorBody.error.includes('ads_management') || errorBody.error.includes('ads_read')) {
              detailedErrorMessage = `Permissões insuficientes: Você precisa conceder permissões "ads_management" e "ads_read" ao conectar sua conta do Facebook. Por favor, desconecte e reconecte sua conta, garantindo que todas as permissões sejam aceitas.`;
            } else {
              detailedErrorMessage = `Meta API Error: ${errorBody.error}`;
            }
          }
        } catch (e) {
          console.warn('Could not parse error context JSON', e);
        }
      }
    }

    throw new Error(detailedErrorMessage);
  }

  return data as T;
}

// ==========================================
// Date Helpers
// ==========================================

function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateMockTimeseries(
  dateStart: string,
  dateEnd: string,
  breakdown: 'day' | 'week' | 'month'
): InsightsTimeseriesPoint[] {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const points: InsightsTimeseriesPoint[] = [];

  const incrementDays = breakdown === 'day' ? 1 : breakdown === 'week' ? 7 : 30;
  const current = new Date(start);

  while (current <= end) {
    const nextDate = new Date(current);
    nextDate.setDate(nextDate.getDate() + incrementDays - 1);

    points.push({
      date_start: formatDateForApi(current),
      date_stop: formatDateForApi(nextDate > end ? end : nextDate),
      spend: Math.random() * 500 + 100,
      impressions: Math.floor(Math.random() * 10000 + 2000),
      clicks: Math.floor(Math.random() * 500 + 50),
      ctr: Math.random() * 3 + 0.5,
      cpm: Math.random() * 15 + 5,
      cpc: Math.random() * 2 + 0.3,
      reach: Math.floor(Math.random() * 8000 + 1500),
      conversions: Math.floor(Math.random() * 50 + 5),
    });

    current.setDate(current.getDate() + incrementDays);
  }

  return points;
}

// ==========================================
// Meta Service
// ==========================================

class MetaService {
  /**
   * Check if should use mock data (dynamic runtime check)
   */
  private shouldUseMock(): boolean {
    const hasSupabase = isSupabaseConfigured();
    const hasFacebook = isFacebookConfigured();
    const useMock = !hasSupabase || !hasFacebook;
    console.log('[MetaService] Mock check:', { hasSupabase, hasFacebook, useMock });
    return useMock;
  }

  constructor() {
    console.log('MetaService Initialized');
    if (this.shouldUseMock()) {
      console.warn('Mock mode enabled - Supabase:', isSupabaseConfigured(), 'Facebook:', isFacebookConfigured());
    }
  }

  async login(): Promise<{ userId: string; name: string; email: string; accessToken: string }> {
    if (this.shouldUseMock()) {
      console.warn('🔶 Mock mode: Using simulated data. Configure META_APP_ID and Supabase for real API.');
      await new Promise((r) => setTimeout(r, 1000));
      const mockUser = {
        userId: '1015823456789',
        name: 'Meta Advertiser',
        email: 'admin@marketing-pro.com',
        accessToken: 'MOCK_TOKEN',
      };
      setStoredMetaUser({ appUserId: 'mock-app-user', metaUserId: mockUser.userId, name: mockUser.name, email: mockUser.email });
      return mockUser;
    }

    // Step 1: Verify Supabase authentication FIRST
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('Login failed: No active Supabase session');
      throw new Error('Você precisa estar logado para conectar com o Facebook. Por favor, faça login novamente.');
    }

    if (!session.access_token) {
      console.error('Login failed: Session exists but no access token');
      throw new Error('Sessão inválida. Por favor, faça login novamente.');
    }

    const { data: { user: appUser } } = await supabase.auth.getUser();
    if (!appUser) {
      console.error('Login failed: Session exists but getUser() returned null');
      throw new Error('Não foi possível verificar a autenticação. Por favor, faça login novamente.');
    }

    // Step 2: Facebook login flow
    const fbResult = await facebookLogin();

    // Step 3: Call Edge Function with verified session
    console.log('Calling meta-auth Edge Function with valid session...');
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: {
        access_token: fbResult.accessToken,
        app_user_id: appUser.id,
      }
    });

    if (error) {
      console.error('meta-auth error:', error);

      let detailedErrorMessage = error.message || 'Failed to authenticate with Meta service';

      if (error && typeof error === 'object' && 'context' in error) {
        // @ts-ignore
        const errorContext = error.context as any;
        console.error('meta-auth Error Context:', errorContext);

        // Tentar extrair mensagem de erro do corpo da resposta se possível
        if (errorContext && typeof errorContext.json === 'function') {
          try {
            const errorBody = await errorContext.json();
            console.error('meta-auth Error Body:', errorBody);
            if (errorBody.error) {
              detailedErrorMessage = `Meta Auth Error: ${errorBody.error}`;
            }
          } catch (e) {
            console.warn('Could not parse meta-auth error context JSON', e);
          }
        }
      }

      throw new Error(detailedErrorMessage);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unknown error during authentication');
    }

    const userData = data.user as MetaUserInfo;
    const userEmail = userData.email || `${userData.meta_user_id}@meta-user.local`;
    const storedUser: StoredMetaUser = {
      appUserId: appUser.id,
      metaUserId: userData.meta_user_id,
      name: userData.name,
      email: userEmail,
    };
    setStoredMetaUser(storedUser);

    return {
      userId: userData.meta_user_id,
      name: userData.name,
      email: userEmail,
      accessToken: 'STORED_SECURELY',
    };
  }

  /**
   * Check if user is already connected to Meta
   */
  async getConnectedUser(): Promise<{ userId: string; name: string; email: string } | null> {
    if (this.shouldUseMock()) {
      return {
        userId: '1015823456789',
        name: 'Meta Advertiser (Mock)',
        email: 'admin@marketing-pro.com',
      };
    }

    const storedUser = getStoredMetaUser();
    if (!storedUser) return null;

    return {
      userId: storedUser.metaUserId,
      name: storedUser.name,
      email: storedUser.email,
    };
  }

  /**
   * Logout from both Facebook and Supabase
   */
  async logout(): Promise<void> {
    clearStoredMetaUser();
    if (!this.shouldUseMock()) {
      await facebookLogout();
      // We only disconnect from Facebook, NOT the entire app
      // await supabase.auth.signOut(); 
    }
  }

  /**
   * Get Business Managers the user has access to
   */
  async getBusinesses(): Promise<BusinessManager[]> {
    if (this.shouldUseMock()) {
      return mockData.businesses;
    }

    try {
      const response = await callMetaApi<MetaApiResponse<{ id: string; name: string; vertical?: string }>>(
        'businesses'
      );

      return (response.data || []).map((bm) => ({
        id: bm.id,
        name: bm.name,
        vertical: bm.vertical || 'Business',
      }));
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      throw error;
    }
  }

  /**
   * Get Ad Accounts for a Business Manager
   */
  async getAdAccounts(businessId: string): Promise<AdAccount[]> {
    if (this.shouldUseMock()) {
      return mockData.adAccounts;
    }

    try {
      const response = await callMetaApi<MetaApiResponse<{ id: string; name: string; currency: string; account_status: number }>>(
        'adaccounts',
        { business_id: businessId }
      );

      return (response.data || []).map((acc) => ({
        id: acc.id,
        name: acc.name,
        currency: acc.currency,
        status: acc.account_status === 1 ? 'ACTIVE' : 'DISABLED',
      }));
    } catch (error) {
      console.error('Failed to fetch ad accounts:', error);
      throw error; // Don't fallback to mock data - let UI handle the error
    }
  }

  /**
   * Get Facebook Pages for a Business Manager
   */
  async getPages(businessId: string): Promise<MetaPage[]> {
    if (this.shouldUseMock()) {
      return mockData.pages;
    }

    try {
      const response = await callMetaApi<MetaApiResponse<{ id: string; name: string; category: string; picture?: { data?: { url?: string } } }>>(
        'pages',
        { business_id: businessId }
      );

      return (response.data || []).map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        picture: page.picture?.data?.url || `https://picsum.photos/40/40?${page.id}`,
      }));
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      throw error; // Don't fallback to mock data - let UI handle the error
    }
  }

  /**
   * Get Instagram Business Accounts linked to a Page
   */
  async getInstagramAccounts(pageId: string): Promise<InstagramAccount[]> {
    if (this.shouldUseMock()) {
      return mockData.instagrams;
    }

    try {
      const response = await callMetaApi<{ id: string; username: string; profile_picture_url?: string }>(
        'instagram_accounts',
        { page_id: pageId }
      );

      if (response.id) {
        return [{
          id: response.id,
          username: response.username,
          profile_picture_url: response.profile_picture_url || '',
        }];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Get Campaigns for an Ad Account
   */
  async getCampaigns(adAccountId: string): Promise<Campaign[]> {
    if (this.shouldUseMock()) {
      return mockData.campaigns;
    }

    try {
      console.log('[MetaService] Fetching campaigns with insights for:', adAccountId);

      const response = await callMetaApi<MetaApiResponse<{
        id: string;
        name: string;
        status: string;
        objective: string;
        spend?: number;
        impressions?: number;
        clicks?: number;
        cpc?: number;
        cpm?: number;
        ctr?: number;
        reach?: number;
        frequency?: number;
      }>>(
        'campaigns_with_insights',
        { ad_account_id: adAccountId }
      );

      console.log('[MetaService] Campaigns response:', response.data?.length || 0, 'campaigns');

      return (response.data || []).map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
        objective: campaign.objective,
        spend: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        cpc: campaign.cpc,
        cpm: campaign.cpm,
        ctr: campaign.ctr,
        reach: campaign.reach,
        frequency: campaign.frequency,
      }));
    } catch (error) {
      console.error('[MetaService] Failed to fetch campaigns:', error);
      throw error; // Don't fallback to mock data - let UI handle the error
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    adAccountId: string,
    name: string,
    objective: string,
    status: 'ACTIVE' | 'PAUSED' = 'PAUSED'
  ): Promise<{ id: string }> {
    if (this.shouldUseMock()) {
      return { id: `cp_${Date.now()}` };
    }


    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const { data, error } = await supabase.functions.invoke('meta-api', {
      body: {
        action: 'create_campaign',
        params: { ad_account_id: adAccountId },
        body: { name, objective, status, special_ad_categories: '[]' },
      },
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined
      }
    });

    if (error) {
      console.error('Create Campaign Error:', error);
      throw new Error(error.message);
    }

    return data as { id: string };
  }

  /**
   * Update campaign status (pause/activate)
   */
  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean> {
    if (this.shouldUseMock()) {
      return true;
    }


    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const { error } = await supabase.functions.invoke('meta-api', {
      body: {
        action: 'update_campaign',
        params: { campaign_id: campaignId },
        body: { status },
      },
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined
      }
    });

    return !error;
  }

  /**
   * Get Insights for an Ad Account
   * Supports custom date range or preset
   */
  async getInsights(
    adAccountId: string,
    params?: {
      dateStart?: string;
      dateEnd?: string;
      datePreset?: string;
    }
  ): Promise<CampaignInsights> {
    if (this.shouldUseMock()) {
      return this.getMockInsights();
    }

    try {
      console.log('[MetaService] Fetching insights for:', adAccountId, params);

      // Build params carefully: use datePreset OR dateStart/dateEnd, never both
      const apiParams: Record<string, string | undefined> = {
        ad_account_id: adAccountId,
      };

      if (params?.datePreset) {
        // Use Meta API's native date_preset (most accurate, respects account timezone)
        apiParams.date_preset = params.datePreset;
      } else if (params?.dateStart && params?.dateEnd) {
        // Use explicit date range only when preset is not available
        apiParams.date_start = params.dateStart;
        apiParams.date_end = params.dateEnd;
      } else {
        // Fallback: let Edge Function use default last_7d
        apiParams.date_preset = 'last_7d';
      }

      const response = await callMetaApi<MetaApiResponse<Record<string, unknown>>>(
        'insights',
        apiParams
      );

      const rawData = response.data?.[0] || {};
      console.log('[MetaService] ===== INSIGHTS RAW RESPONSE =====');
      console.log('[MetaService] Ad Account:', adAccountId);
      console.log('[MetaService] Params sent:', JSON.stringify(params));
      console.log('[MetaService] Raw spend:', rawData.spend);
      console.log('[MetaService] Raw impressions:', rawData.impressions);
      console.log('[MetaService] Raw clicks:', rawData.clicks);
      console.log('[MetaService] Raw reach:', rawData.reach);
      console.log('[MetaService] Date range:', rawData.date_start, 'to', rawData.date_stop);
      console.log('[MetaService] Actions:', JSON.stringify(rawData.actions));
      console.log('[MetaService] ================================');

      return this.parseInsightsResponse(rawData);
    } catch (error) {
      console.error('[MetaService] Failed to fetch insights:', error);
      throw error;
    }
  }

  /**
   * Get Insights Timeseries for charts
   */
  async getInsightsTimeseries(
    adAccountId: string,
    dateStart: string,
    dateEnd: string,
    breakdown: 'day' | 'week' | 'month' = 'day'
  ): Promise<InsightsTimeseriesPoint[]> {
    if (this.shouldUseMock()) {
      return generateMockTimeseries(dateStart, dateEnd, breakdown);
    }

    try {
      const response = await callMetaApi<MetaApiResponse<Record<string, unknown>>>(
        'insights_timeseries',
        {
          ad_account_id: adAccountId,
          date_start: dateStart,
          date_end: dateEnd,
          breakdown,
        }
      );

      return (response.data || []).map(this.parseTimeseriesPoint);
    } catch (error) {
      console.error('Failed to fetch timeseries:', error);
      throw error;
    }
  }

  /**
   * Compare insights between two periods
   */
  async compareInsights(
    adAccountId: string,
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string
  ): Promise<{
    current: CampaignInsights;
    previous: CampaignInsights;
    changes: Record<string, number>;
  }> {
    const [current, previous] = await Promise.all([
      this.getInsights(adAccountId, { dateStart: currentStart, dateEnd: currentEnd }),
      this.getInsights(adAccountId, { dateStart: previousStart, dateEnd: previousEnd }),
    ]);

    const changes = this.calculateChanges(current, previous);
    return { current, previous, changes };
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  private getMockInsights(): CampaignInsights {
    return {
      spend: Math.random() * 5000 + 500,
      impressions: Math.floor(Math.random() * 100000 + 10000),
      clicks: Math.floor(Math.random() * 5000 + 500),
      cpc: Math.random() * 2 + 0.3,
      cpm: Math.random() * 15 + 5,
      ctr: Math.random() * 3 + 1,
      reach: Math.floor(Math.random() * 80000 + 8000),
      frequency: Math.random() * 2 + 1,
      conversions: Math.floor(Math.random() * 200 + 20),
      conversion_rate: Math.random() * 5 + 1,
      roas: Math.random() * 4 + 1,
      cost_per_conversion: Math.random() * 30 + 5,
      messages_initiated: Math.floor(Math.random() * 100 + 10),
    };
  }

  private parseInsightsResponse(data: Record<string, unknown>): CampaignInsights {
    // Parse actions to extract conversions and messages
    const actions = (data.actions as Array<{ action_type: string; value: string }>) || [];
    const conversions = actions.find(a => a.action_type === 'purchase')?.value || '0';
    const messagesInitiated = actions.find(a =>
      a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
    )?.value || '0';

    // Parse conversion values for ROAS calculation
    const conversionValues = (data.conversion_values as Array<{ action_type: string; value: string }>) || [];
    const purchaseValue = conversionValues.find(cv => cv.action_type === 'purchase')?.value || '0';

    const spend = parseFloat(String(data.spend || '0'));
    const parsedConversions = parseInt(conversions);
    const clicks = parseInt(String(data.clicks || '0'));

    return {
      spend,
      impressions: parseInt(String(data.impressions || '0')),
      clicks,
      cpc: parseFloat(String(data.cpc || '0')),
      cpm: parseFloat(String(data.cpm || '0')),
      ctr: parseFloat(String(data.ctr || '0')),
      reach: parseInt(String(data.reach || '0')),
      frequency: parseFloat(String(data.frequency || '0')),
      conversions: parsedConversions,
      conversion_rate: clicks > 0 ? (parsedConversions / clicks) * 100 : 0,
      roas: spend > 0 ? parseFloat(purchaseValue) / spend : 0,
      cost_per_conversion: parsedConversions > 0 ? spend / parsedConversions : 0,
      messages_initiated: parseInt(messagesInitiated),
    };
  }

  private parseTimeseriesPoint(data: Record<string, unknown>): InsightsTimeseriesPoint {
    return {
      date_start: String(data.date_start || ''),
      date_stop: String(data.date_stop || ''),
      spend: parseFloat(String(data.spend || '0')),
      impressions: parseInt(String(data.impressions || '0')),
      clicks: parseInt(String(data.clicks || '0')),
      ctr: parseFloat(String(data.ctr || '0')),
      cpm: parseFloat(String(data.cpm || '0')),
      cpc: parseFloat(String(data.cpc || '0')),
      reach: parseInt(String(data.reach || '0')),
      conversions: parseInt(String(data.conversions || '0')),
    };
  }

  private calculateChanges(
    current: CampaignInsights,
    previous: CampaignInsights
  ): Record<string, number> {
    const changes: Record<string, number> = {};
    const keys: (keyof CampaignInsights)[] = [
      'spend', 'impressions', 'clicks', 'cpc', 'cpm', 'ctr',
      'reach', 'frequency', 'conversions', 'roas', 'cost_per_conversion'
    ];

    keys.forEach(key => {
      const curr = current[key];
      const prev = previous[key];
      if (prev === 0) {
        changes[key] = curr > 0 ? 100 : 0;
      } else {
        changes[key] = ((curr - prev) / prev) * 100;
      }
    });

    return changes;
  }

  /**
   * Check if real API is configured (dynamic)
   */
  isConfigured(): boolean {
    return !this.shouldUseMock();
  }
}

export const metaService = new MetaService();
