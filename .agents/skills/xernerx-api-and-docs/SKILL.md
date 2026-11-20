---
name: xernerx-api-and-docs
description: >-
    API architecture, public /v1 -> /v2 versioning policy, 3-route frontend /api
    restriction, and apps/docs synchronization for Xernerx Suite. Use whenever
    adding, modifying, or deleting routes under apps/api, apps/cdn, frontend
    apps/*/src/app/api, or services/websocket.
---

<!-- @format -->

# Xernerx API Architecture, Versioning & Docs Sync

## 1. Strict 3-Route Local `/api` Rule for Frontend Apps

Frontend Next.js apps (`apps/*` other than `apps/api` and `apps/cdn`) may **only** host these local API routes:

1. `/api/auth/[...nextauth]`
2. `/api/changelog`
3. `/api/version`

**Sole exception:** `apps/account` also houses `/api/connections/[provider]` and `/api/connections/[provider]/callback` for linking secondary OAuth connections to an authenticated Discord session.

All other backend endpoints (including Stripe checkout/store routes, CRUD mutations, and proxy endpoints) **must** live in `apps/api` (`api.xernerx.com/secure/*`, `/core/*`, `/info/*`, or `/v1/*`) and be called from client components via `useEnvironment().getEnvUrl()`.

## 2. Public API Versioning & Breaking-Change Policy (`/v1/*` → `/v2/*`)

### Additive (Non-Breaking) Changes → Keep in `/v1/*`

- Adding a brand-new endpoint (e.g. `POST /v1/bots/[id]/releases`).
- Adding a new **optional** request field or query parameter.
- Adding a new property to an existing JSON response object.

### Breaking Changes → Require `/v2/*`

**Never** make breaking changes in-place to published `/v1/*` (or any `/vN/*`) routes. A change is **breaking** if it:

1. Removes or renames an existing JSON response field.
2. Changes a field's data type or format (e.g. `number` → `array` or epoch `number` → ISO `string`).
3. Makes a previously optional request field or parameter `required`.
4. Changes the response envelope shape (e.g. `[...]` → `{ data: [...] }`).
5. Removes an endpoint or changes its authentication/permission requirements.

When a breaking change is required on a public developer endpoint:

1. Create the new route under `apps/api/src/app/v2/...` (re-export unchanged handlers from `v1` rather than duplicating logic).
2. Keep the `/v1/...` route functioning as a backward-compatible adapter for existing SDKs (`@xernerx/stats`, `@xernerx/framework`) and bots, attaching deprecation headers:
    - `X-API-Version: v1`
    - `Deprecation: true`
    - `Sunset: <ISO-Date>`
3. Register `v2` in `apps/docs/src/app/api/[version]/page.tsx` and `apps/api/src/lib/docsBlueprints*.ts`.

### Internal Suite Endpoints (`/secure/*`, `/core/*`, `/info/*`)

Internal routes do not use `/vN/` prefixes because monorepo apps deploy in lockstep—just update all monorepo callers (including `clients/desktop`) in the same change.

## 3. Mandatory `apps/docs` Synchronization Checklist

Whenever adding, modifying, or deleting any route in `apps/api/src/app/{v1,core,secure,info}/**`, `apps/cdn`, or `services/websocket/src/app/**`, update **all** applicable docs surfaces in the same change:

- [ ] `apps/docs/src/app/api/[version]/page.tsx`
- [ ] `apps/docs/src/components/V1PlatformEndpoints.tsx` (for `/v1/*` routes)
- [ ] `apps/docs/src/components/CdnEndpoints.tsx` (for `apps/cdn` routes)
- [ ] `apps/docs/src/app/websocket/page.tsx` (for `services/websocket` actions)
- [ ] `apps/api/src/lib/docsBlueprints*.ts` (public docs catalog blueprints)
- [ ] `packages/lib/src/dictionaries/en-GB.json` under `docs.*` (and prune updated keys from other locales per `xernerx-localization`)

## 4. Verification

- Confirm 3-tier privacy (`public` | `limited` | `private`) is enforced on every new/modified endpoint.
- Typecheck affected apps: `pnpm --dir apps/api exec tsc --noEmit` and `pnpm --dir apps/docs exec tsc --noEmit`.
