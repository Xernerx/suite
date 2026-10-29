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
4. **Universal 3-Tier Privacy Truth (`public` | `limited` | `private`):**
    - **`public`:** Listed in public directories, explorers, leaderboards, and search results; accessible by anyone.
    - **`limited`:** Unlisted (excluded from all public directory/explorer/search listings), but accessible by anyone via direct link or ID lookup.
    - **`private`:** Hard private—never listed and **no one** except the owner (or authorized co-owners/organization members) may access or view it, even with a direct link or ID. Enforce this across all Users, Bots, Servers/Guilds, Organizations, and Media endpoints.
5. **Public API Versioning & Breaking-Change Policy (`/v1/*` → `/v2/*`):**
    - **Additive (Non-Breaking) Changes:** New endpoints, new optional request parameters, and new response fields stay in `/v1/*`.
    - **Breaking Changes:** Never modify existing `/v1/*` contracts in a breaking way (removing/renaming response fields, changing field types, making optional inputs required, or altering response envelopes). Instead, introduce `/v2/*` for the breaking contract, re-export unchanged routes from `v1`, keep `/v1/*` working as a compatibility adapter with `X-API-Version: v1`, `Deprecation: true`, and `Sunset` headers, and add the new version to `apps/docs`.
6. **Sync Docs & FAQ on Route Changes:**
    - Whenever adding, modifying, or deleting any API routes (`/v1/*`, `/core/*`, `/secure/*`, `/info/*`), always update the corresponding documentation in `apps/docs` (`apps/docs/src/app/api/[version]/page.tsx`, `V1PlatformEndpoints.tsx`, `packages/lib/src/dictionaries/en-GB.json`) and `src/lib/docsBlueprints*.ts`.
    - When a new endpoint or behavior introduces user-facing concepts or questions, also update the FAQ in `apps/info/src/components/faq/*` and `src/lib/faqBlueprints*.ts`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
