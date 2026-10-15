<!-- @format -->

# `apps/api` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/api` (`api.xernerx.com`, dev port `4001`) is the central backend gateway, security enforcement engine, Bearer token validator, Discord synchronization service, Stripe webhook processor, and primary MongoDB API layer for the Xernerx Suite.

## 🏗️ Route Hierarchy

- **`/secure/*` (Internal & Authenticated Suite Endpoints):**
    - `/secure/core/*`: Users, RBAC roles (`/roles/reorder`), system settings (`/settings/sister_servers/sync`), suggestions, issues, roadmap.
    - `/secure/bots/*`: Bot profiles, webhooks, stats, reviews, and voting.
    - `/secure/guilds/*` & `/secure/servers/*`: Discord server synchronization, channels, roles, join workflows, Virtue configuration, and voting.
    - `/secure/dispatch/*`: Staff application submissions/reviews, email dispatches, and webhook notifications.
    - `/secure/tokens/*` & `/secure/validate/token`: API token CRUD and Bearer token validation.
    - `/secure/webhooks/stripe`: Stripe checkout and subscription lifecycle webhook receiver.
    - `/secure/downloads/app`: Desktop companion app binary download endpoints.
- **`/v1/*` (Public Developer API):**
    - `/v1/bots/[id]/commands`, `/v1/bots/[id]/profile`, `/v1/bots/[id]/stats`.

## ⚠️ Security, Proxy & Database Rules

1. **Request Interception (`src/proxy.ts`):**
    - Enforces IP rate limiting (100 req/min/IP) and CORS headers.
    - All `/secure/*` routes (except `/secure/webhooks/stripe` and `/secure/validate/token`) require either a valid Bearer token with `permissions.secure` OR a trusted `.xernerx.com` origin/session.
    - In local development (`ENVIRONMENT === 'development'`), internal token validation loops back via `http://127.0.0.1:<port>` to avoid local SSL errors.
2. **Database Access:**
    - Always call `await database.connect()` (from `@xernerx/lib/server`) before querying Mongoose models from `registry`.
3. **Consistent Responses:**
    - Return standardized JSON responses with appropriate HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `429`, `500`) and ensure CORS compatibility with all suite subdomains.
