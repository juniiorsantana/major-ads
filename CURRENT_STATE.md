# Current State - Major Ads (Meta Ads SaaS Pro)

> **Generated:** 2026-02-11
> **Version:** 0.0.0 (Pre-Alpha)

## 1. Project Overview
**Name:** Meta Ads SaaS Pro (Internal: `major-ads`)
**Description:** A SaaS dashboard for analyzing and managing Meta Ads campaigns, providing simplified insights for traffic managers.
**Repository:** `d:\CLIENTES 2024\MajorHub\App MajorHub\Dash\meta-ads-major\major-ads`

## 2. Technical Stack

### Frontend
- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (w/ PostCSS & Autoprefixer)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query v5
- **Routing:** React Router v7
- **UI Components:** Lucide React (Icons), Recharts (Charts)

### Backend (Serverless)
- **Platform:** Supabase
- **Database:** PostgreSQL
- **Edge Functions:** Deno (TypeScript)
- **Authentication:** Supabase Auth + Meta OAuth

### Integrations
- **Meta Graph API:** v21.0
- **AI:** Google Gemini (`@google/genai`)

## 3. Project Structure
```
/src
  /components       # UI Components (Overview, Campaigns, Settings)
  /context          # React Contexts (AuthContext)
  /hooks            # Custom Hooks (useMetaQueries)
  /layouts          # Layout wrappers (DashboardLayout)
  /pages            # Application views (Dashboard, Campaigns, Settings)
  /services         # API integrations (metaService)
  /stores           # Zustand stores
  /types            # TypeScript definitions
/supabase
  /functions        # Deno Edge Functions
    /meta-api       # Proxy for Meta Graph API
    /meta-auth      # OAuth & Token management
  /migrations       # SQL Schema definitions
```

## 4. Key Features & Status

### ✅ Authentication & Onboarding
- Supabase Auth implemented (Email/Password).
- Meta OAuth 2.0 flow integrated.
- Token exchange (short-lived -> long-lived) functioning.
- User profile creation (`user_profiles` table).

### ✅ Dashboard Logic
- Ad Account selection.
- Date range filtering.
- Key Metrics display (Spend, Impressions, Clicks, CTR, CPM, ROAS).
- Temporal charts implementation.

### 🚧 Meta API Integration
- **Status:** Active development / Refinement.
- **Components:**
  - `meta-api` Edge Function handles requests.
  - Proxy mechanism with JWT validation.
  - Fetching Business Managers, Ad Accounts, and Campaigns.

## 5. Recent Changes & Focus
- **Fixing Meta Connection:** Addressed "Invalid JWT" errors in `meta-api` function.
- **Architecture Refinement:** Moving towards a Controller-Service-Adapter pattern for backend logic.
- **UI Updates:** Branding color updates (Orange -> Blue #5441F0).
- **Metric Accuracy:** Debugging real-time data fetching vs mock data usage.

## 6. Configuration
**Environment Variables (Frontend):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

**Supabase Secrets:**
- `META_APP_ID`, `META_APP_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`
