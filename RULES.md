# Project Rules & Guidelines - Meta Ads SaaS Pro

> **Version:** 1.0.0
> **Last Updated:** 2026-02-11

This document allows the team to maintain code quality, consistency, and scalability throughout the project lifecycle.

## 1. General Principles
- **DRY (Don't Repeat Yourself):** Extract common logic into hooks or utility functions.
- **KISS (Keep It Simple, Stupid):** Avoid over-engineering. Write code that is easy to understand and maintain.
- **Single Responsibility:** Each component, function, or module should have one clear purpose.
- **Mobile First:** Design and implement for mobile devices first, then scale up to desktop.

## 2. Technology Stack Standards
- **Runtime:** Node.js (Latest LTS)
- **Language:** TypeScript (Strict mode enabled)
- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **State Management:** 
  - **Server Stats:** TanStack Query v5 (React Query)
  - **Client Global State:** Zustand
- **Routing:** React Router v7
- **Backend:** Supabase (PostgreSQL + Edge Functions w/ Deno)

## 3. Directory Structure & Naming
- **File Names:**
  - Components: `PascalCase.tsx` (e.g., `CampaignCard.tsx`)
  - Hooks: `camelCase.ts` (prefix with `use`, e.g., `useCampaigns.ts`)
  - Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
  - Stores: `camelCase.ts` (e.g., `authStore.ts`)
- **Folders:**
  - Keep related files close (colocation).
  - Use lowercase-kebab-case for folder names generally, but match component names if it contains a primary component (e.g., `components/campaigns/CampaignList.tsx`).

## 4. Coding Standards

### TypeScript
- **No `any`:** Explicitly define types. Use `unknown` if necessary and narrow types.
- **Interfaces vs Types:** Use `interface` for object definitions that might be extended, `type` for unions/intersections.
- **Props:** Define component props using an interface named `<ComponentName>Props`.

### React Components
- **Functional Components:** Use function declarations.
- **Hooks Rules:** Only call hooks at the top level.
- **Fragment:** Use `<>...</>` for fragments unless keys are needed.
- **Memoization:** Use `useMemo` and `useCallback` judiciously to prevent unnecessary re-renders, especially for expensive calculations or callback props passed to children.

### Architecture Features
- **Data Fetching:** Encapsulate API calls in **Services** (`/src/services`), then consume them via **React Query Hooks** (`/src/hooks`). Do not call services directly from components.
- **Supabase Client:** Access via the singleton instance.

### Styling (Tailwind CSS)
- **Utility First:** Use utility classes directly in `className`.
- **Ordering:** Follow a logical order (Layout -> Box Model -> Typography -> Visuals -> Misc). *Tip: Use the prettier-plugin-tailwindcss.*
- **No Inline Styles:** Avoid `style={{ ... }}` unless dynamic values are strictly required.
- **Colors:** Use the defined `primary` (Blue #5441F0) and semantic colors from the theme configuration.

## 5. State Management Rules
- **Server State:** MUST use **TanStack Query**. Handle `isLoading`, `isError`, and `data` states gracefully.
- **Local State:** Use `useState` or `useReducer` for component-level state.
- **Global Client State:** Use **Zustand** only for truly global UI state (e.g., Sidebar open/close, User Session). Avoid putting server data in Zustand stores (that's what React Query is for).

## 6. Backend & Supabase
- **Edge Functions:**
  - Written in TypeScript (Deno).
  - Located in `supabase/functions`.
  - MUST Validate inputs (Zod recommended).
  - MUST Return standardized JSON responses.
  - MUST Handle CORS `OPTIONS` requests.
- **Database:**
  - Use Snake Case (`snake_case`) for table names and columns.
  - **RLS (Row Level Security):** ENABLED on all tables. Define policies explicitely.

## 7. Git & Commit Workflow
- **Commits:** Conventional Commits style.
  - `feat: add campaign creation flow`
  - `fix: resolve auth token refresh issue`
  - `docs: update SPEC.md`
  - `refactor: simplify dashboard layout`
- **Branches:** `feature/feature-name`, `fix/bug-name`, `hotfix/urgent-fix`.

## 8. Error Handling
- **Frontend:** Use Error Boundaries for UI crashes. Display user-friendly toasts (Sonner/Toast) for API errors.
- **Backend:** Log errors to Supabase/Console but return safe error messages to client. Do not leak stack traces to production client.
