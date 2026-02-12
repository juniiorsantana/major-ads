# Security Audit Report
**Date:** 2026-02-11
**Auditor:** Penetration Tester Agent
**Target:** MajorHub Meta Ads Manager

## Executive Summary

A security assessment was performed on the `major-ads` codebase, specifically focusing on the Supabase Edge Functions (`meta-api` and `meta-auth`) and the frontend integration.

## Findings

### 1. [CRITICAL] Authentication Bypass & IDOR in `meta-auth`

**Severity:** Critical (CVSS 9.1)
**Location:** `supabase/functions/meta-auth/index.ts`

**Description:**
The `meta-auth` endpoint (used for "authenticate" and "refresh_token" actions) accepts an `app_user_id` parameter directly from the client request body. It uses `createAdminClient()` (Service Role) to update the User Metadata for the provided `app_user_id` without verifying that the requestor *is* that user.

**Vulnerability:**
An attacker can send a request with their *own* valid Facebook Access Token but specify a *victim's* `app_user_id` (Supabase User UUID). The system will validate the Facebook token (which is valid) and then update the victim's account to be linked to the attacker's Facebook account.

**Proof of Concept (Theoretical):**
```bash
POST /functions/v1/meta-auth
Content-Type: application/json

{
  "action": "authenticate",
  "access_token": "ATTACKER_VALID_FB_TOKEN",
  "app_user_id": "VICTIM_UUID"
}
```
**Result:** The system updates `VICTIM_UUID` metadata with `ATTACKER_FB_TOKEN`.

**Remediation:**
1.  **Require Authentication:** The `meta-auth` function should require a valid Supabase JWT in the `Authorization` header.
2.  **Verify Identity:** Use `supabase.auth.getUser()` to get the authenticated user's ID from the JWT.
3.  **Ignore Client Input:** Do **not** trust `app_user_id` from the body. Use the ID returned by `getUser()`.

---

### 2. [HIGH] Ineffective Rate Limiting

**Severity:** High
**Location:** `supabase/functions/meta-api/index.ts` and `supabase/functions/meta-auth/index.ts`

**Description:**
The functions implement rate limiting using an in-memory `Map` (`const rateLimitMap = new Map()`).

**Vulnerability:**
Supabase Edge Functions are often ephemeral and stateless. A new instance is often spun up for new requests. The `rateLimitMap` is cleared whenever an instance restarts or is replaced. This allows trivial bypassing of rate limits.

**Remediation:**
Use a persistent store such as Redis or a dedicated database table for tracking request counts.

---

### 3. [MEDIUM] Weak IP-based Protection

**Severity:** Medium
**Location:** `supabase/functions/meta-auth/index.ts`

**Description:**
The function uses `req.headers.get("x-forwarded-for")` for rate limiting identification.

**Vulnerability:**
While Supabase filters headers, relying on IP for security execution provides false security and can block legitimate users sharing an IP (NAT).

**Remediation:**
Rate limit based on **User ID** (extracted from JWT) rather than IP where possible.

## Conclusion

The vulnerabilities identified pose a significant risk to the integrity of user accounts. The IDOR vulnerability in `meta-auth` must be addressed immediately.
