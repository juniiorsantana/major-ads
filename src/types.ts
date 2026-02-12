
export enum AppStep {
  LOGIN = 'LOGIN',
  BUSINESS_SELECT = 'BUSINESS_SELECT',
  ASSET_SELECT = 'ASSET_SELECT',
  DASHBOARD = 'DASHBOARD'
}

export interface BusinessManager {
  id: string;
  name: string;
  vertical: string;
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  status: 'ACTIVE' | 'DISABLED';
}

export interface MetaPage {
  id: string;
  name: string;
  category: string;
  picture: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
  roas?: number;
  conversions?: number;
  ctr?: number;
  budget_spent_percent?: number;
}

export type CampaignViewMode = 'cards' | 'table';
export type CampaignStatusFilter = 'all' | 'active' | 'paused' | 'archived';
export type CampaignSortBy = 'roas' | 'spend' | 'performance' | 'date';

export interface UserContext {
  userId: string;
  name: string;
  email: string;
  accessToken: string;
  selectedBusiness?: BusinessManager;
  selectedAdAccount?: AdAccount;
  selectedPage?: MetaPage;
  selectedInstagram?: InstagramAccount;
}

export interface TokenInfo {
  expiresAt: string;
  scopes: string[];
  isLongLived: boolean;
}

export interface CampaignInsights {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  reach: number;
  frequency: number;
  conversions: number;
  conversion_rate: number;
  roas: number;
  cost_per_conversion: number;
  messages_initiated: number;
}

// === KPI Cards System Types ===

export type KpiMetricKey =
  | 'spend'
  | 'impressions'
  | 'cpm'
  | 'cpc'
  | 'ctr'
  | 'clicks'
  | 'conversions'
  | 'messages_initiated'
  | 'conversion_rate'
  | 'roas';

export interface KpiMetricConfig {
  key: KpiMetricKey;
  label: string;
  format: 'currency' | 'number' | 'percentage' | 'decimal';
  icon?: string;
  color: string;
}

export interface KpiCardData {
  key: KpiMetricKey;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
}

export interface KpiLayoutConfig {
  visibleCards: KpiMetricKey[];
  cardOrder: KpiMetricKey[];
  topCards: KpiMetricKey[]; // Max 5 cards for main top row
  sidebarCards: KpiMetricKey[]; // Remaining cards for sidebar
}

// === Filter State Types ===

export type DatePeriodPreset =
  | 'today'
  | 'yesterday'
  | 'today_and_yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_28_days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export type ComparisonMode =
  | 'previous_period'
  | 'same_period_last_year'
  | 'none';

export type GroupingMode =
  | 'hour'
  | 'day'
  | 'week'
  | 'month';

export interface FilterState {
  period: DatePeriodPreset;
  customStartDate?: string;
  customEndDate?: string;
  comparison: ComparisonMode;
  grouping: GroupingMode;
}

// === Chart Types ===

export type ChartViewMode = 'line' | 'area' | 'bar';

export interface ChartDataPoint {
  date: string;
  label: string;
  value: number;
  comparisonValue?: number;
}

export interface EventMarker {
  date: string;
  label: string;
  type: 'info' | 'warning' | 'success';
}

// === Insights API Types ===

export interface InsightsTimeseriesPoint {
  date_start: string;
  date_stop: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  reach: number;
  conversions: number;
}

export interface InsightsRequestParams {
  adAccountId: string;
  dateStart?: string;
  dateEnd?: string;
  datePreset?: string;
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  breakdown?: 'day' | 'week' | 'month';
}

export interface InsightsData {
  insights: CampaignInsights;
  timeseries: InsightsTimeseriesPoint[];
  comparison: CampaignInsights | null;
}

// === User Profile Types (Onboarding) ===

export interface UserProfile {
  id: string;
  full_name: string;
  company_name: string;
  role: string;
  business_type: string;
  goals: string[];
  created_at?: string;
  updated_at?: string;
}

export type UserProfileInput = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
