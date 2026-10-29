<!-- @format -->

# Changelog

## 1.2.0

### Minor Changes

- ### Haste Studio Overhaul, Viewport-Relative `--page-width` Slider & Suite Documentation Alignment

    #### 1. `haste` (`haste.xernerx.com`, `:4011`) — `minor`
    - **Cohesive Single-Card Studio (`HasteStudioClient.tsx`):** Consolidated the studio header, metadata controls (`Title`, `Language`, `Privacy`, `Expiration`), and monospace code editor into a single clean glassmorphic card (`max-w-(--page-width) mx-auto w-full`). Removed the duplicate in-page mode switcher pills and the drop-in CLI/Bot code integration card.
    - **Sidebar-Only Navigation & Personal Explorer (`HasteExplorerList.tsx`):** Navigation between **New Paste** (`editor`) and **My Hastes** (`mine`) now lives strictly in the global Sidebar (`useSidebar()`). Removed the public paste list mode.
    - **Authentication Redirect vs. Direct Code Viewing & 404 (`HasteStudioClient.tsx` & `HasteDocumentViewer.tsx`):**
        - Visiting `/` while unauthenticated immediately redirects to `account.xernerx.com/login?redirect=...`.
        - Visiting `/[id]` with a valid `public` or `limited` code displays the document directly (hiding the sidebar for unauthenticated viewers and showing `New Paste` / `My Hastes` for authenticated users).
        - Visiting `/[id]` with an invalid, deleted, or expired code renders `<NotFound />` (`404`) directly on `/[id]` without redirecting.
    - **API Payload & Author Parsing Fixes (`HasteDocumentViewer.tsx`, `HasteStudioClient.tsx`, `HasteExplorerList.tsx`, `hasteConstants.ts`):** Fixed unwrapping of top-level `GET /v1/haste/[id]` and `PATCH /v1/haste/[id]` JSON payloads as well as `GET /v1/haste` array payloads and author display names (`globalName` / `username` / `name`).
    - **Documentation & Types (`README.md`, `AGENTS.md`, `next-env.d.ts`):** Rewrote `apps/haste/README.md` and `apps/haste/AGENTS.md` to match the canonical Xernerx Suite documentation template and added `next-env.d.ts`.

    #### 2. Viewport-Relative `--page-width` Slider (`60%–100%`, Default `90%`)
    - **`@xernerx/styles` (`minor`):** Changed default `--page-width` token in `packages/styles/globals.css` from fixed `96rem` (`1536px`) to viewport-relative `90%` so layouts scale naturally on 21:9 / 32:9 ultra-wide and 4K monitors. Documented `--page-width` in `packages/styles/AGENTS.md` and root `AGENTS.md`.
    - **`account` (`minor`):** Replaced the fixed-rem Page Content Width preset dropdown in `Appearance.tsx` and `AppearanceScalingCards.tsx` with a continuous `60%–100%` `<Slider />` (step `5%`, default `90%`), matching the UI Zoom Level slider.
    - **`@xernerx/providers` (`minor`) & `@xernerx/components` (`minor`):** Added `parsePageWidthPercent` in `ThemeProvider.tsx` and `ThemeScript.tsx` to apply `--page-width` as `${pct}%` (`60%–100%`, default `90%`) while automatically migrating any legacy stored preset values (`compact` -> `75%`, `default` -> `90%`, `wide` -> `95%`, `full` -> `100%`). Added `max-w-(--page-width) mx-auto` to `MediaManager.tsx`.
    - **`@xernerx/lib` (`patch`):** Updated `packages/lib/src/models/xernerx/users/Appearance.ts` so `pageWidth` defaults to `'90'` without a restrictive enum, added `'haste'` to `uiPreferences.headerSubdomains`, and bumped the Mongoose model cache key (`__models_v26`) in `database.ts`.
    - **`www`, `app`, `info` (`patch`):** Replaced hardcoded `max-w-7xl` / `max-w-6xl` / `max-w-[1400px]` widths and unconstrained containers with `max-w-(--page-width) mx-auto` across `apps/www` (`/`, `/download`, `/applications`, `/contact`, `/invites`, `/terms`, `/privacy`, `/cookies`), `apps/app` (`/bots`, `/bots/[id]`, `/servers`, `/servers/[id]`, `/users/[id]`, `/organization/[id]`), and `apps/info` (`/roadmap`).

    #### 3. API, Docs & README Alignment (`api`, `docs`, `portal`, `hosting` — `patch`)
    - **`api` (`patch`):** Updated `GET /v1/haste` (`apps/api/src/app/v1/haste/route.ts`) to require `viewerUserId` and strictly return the requesting user's own pastes.
    - **`docs` (`patch`):** Standardized `/v1/haste/[id]`, `/v1/haste/[id]/raw`, and `https://haste.xernerx.com/documents/[userId]` route path notation in `apps/docs/src/components/api/V1PlatformEndpoints.tsx`.
    - **`portal` & `hosting` (`patch`):** Standardized `apps/portal/README.md` and `apps/hosting/README.md` to match the suite README format.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.12.0
    - @xernerx/providers@0.18.0
    - @xernerx/styles@0.2.0
    - @xernerx/lib@1.16.2
    - @xernerx/feedback@0.4.5
    - @xernerx/ui@0.7.10

## 1.1.1

### Patch Changes

- Fixed a push error
- Updated dependencies
    - @xernerx/components@0.11.1
    - @xernerx/feedback@0.4.4
    - @xernerx/lib@1.16.1
    - @xernerx/providers@0.17.1
    - @xernerx/styles@0.1.17
    - @xernerx/ui@0.7.9

## 1.1.0

### Minor Changes

- ### 🚀 Xernerx Haste (`apps/haste` — `haste.xernerx.com`, Port `4011`)
    - **First-Party Code Pastebin & Studio (`apps/haste`)**: Added the `apps/haste` workspace on dev port `4011` (`haste.xernerx.com`) with `HasteStudioClient`, `HasteExplorerList`, and `HasteDocumentViewer` featuring syntax language selection, TTL expirations (`1h`, `24h`, `7d`, `30d`, `never`), Universal 3-Tier Privacy (`public`, `limited`, `private`), `?fork=[id]` preloading, `Ctrl + S` shortcut publishing, raw streaming (`/raw/[id]`), and owner management controls.
    - **Hastebin Protocol & REST v1 Endpoints (`apps/haste`, `apps/api`)**: Added `POST /documents/[userId]`, `POST /documents`, `GET /raw/[id]`, `GET & POST /v1/haste`, `GET, PATCH & DELETE /v1/haste/[id]`, and `GET /v1/haste/[id]/raw` with lightweight Xernerx `userId` verification against `models.users.User` and automatic outer Discord triple-backtick code-fence unwrapping.
    - **Dedicated `MONGO_HASTE` Cluster & TTL Model (`@xernerx/lib/server`)**: Added `packages/lib/src/models/haste/documents/Document.ts` with a MongoDB TTL index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`) and bound `database('haste')` strictly to `process.env.MONGO_HASTE` with no fallback.

    ### 📦 `@xernerx/*` Ecosystem & Engagement Updates
    - **Bot User Engagement Endpoint & Signed Webhooks (`apps/api`, `apps/portal`, `apps/docs`)**: Added `GET /v1/bots/[id]/users/[userId]` returning `voted`, `lastVotedAt`, `nextVoteAt`, `reviewed`, `rating`, and `tipped` status, HMAC-SHA256 webhook signature headers (`x-xernerx-signature`), and real-time webhook triggers for votes, reviews, and credit tips.
    - **Updated `@xernerx/*` Package Dependencies (`services/*`, `apps/*`, `packages/*`, `.xernerx/cli`, `clients/desktop`)**: Bumped `@xernerx/terminal` to `^1.1.15` workspace-wide, updated `services/app` and `services/bot` to `@xernerx/commands@^0.2.6`, `@xernerx/framework@^1.1.1`, and `@xernerx/stats@^1.0.14`, and registered `XernerxStats` via `extensionHandler.loadExtensions`.
    - **Developer Documentation & Catalog Sync (`apps/docs`, `apps/info`, `apps/api`)**: Documented `/v1/haste`, `/v1/bots/[id]/users/[userId]`, `@xernerx/hooks`, and `@xernerx/extension-builder`, updated `@xernerx/stats` (`get`, `post`, `update`, `delete`) and `@xernerx/commands` (`get`, `post`, `delete`, `clear`) SDK examples, and added the Xernerx Haste FAQ entry.
    - **Suite CLI, Desktop & Branding Polish (`.xernerx/cli`, `clients/desktop`, `packages/public`)**: Added lazy port proxy (`lazyProxy.ts`), `@xernerx/terminal` logging integration (`terminal.ts`), draggable desktop loader bar (`loading.html`), and environment-specific Canary/Dev branding assets across all 13 applications.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.0
    - @xernerx/providers@0.17.0
    - @xernerx/components@0.11.0
    - @xernerx/feedback@0.4.3
    - @xernerx/ui@0.7.8

## 1.0.0

### Major Changes

- Initial release of **Xernerx Haste** (`haste.xernerx.com`, Port `4011`) — dedicated code & text pastebin with TTL expirations, 3-tier privacy (`public`, `limited`, `private`), raw text streaming (`/raw/[id]`), and Hastebin-compatible `/documents` API.
