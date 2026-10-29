<!-- @format -->

# info

## 1.10.6

### Patch Changes

- ### Mobile `100dvh` Viewport Lock, CSS `env(safe-area-inset-*)` Support (SO to `@zanderp25`) & `www` SEO / `--page-width` Overhaul

    Huge shoutout (`SO`) to **@zanderp25** for discovering and reproducing the mobile iOS Safari viewport/header scroll overlap issue and providing the `vh` → `dvh` and `env(safe-area-inset-*)` solution!

    - **Dynamic Viewport Height (`vh` → `dvh`) & Document Scroll Lock (`@xernerx/styles`, `@xernerx/components`, `apps/*`):**
    - Locked `html, body` to `height: 100dvh; overflow: hidden; overscroll-behavior: none;` in `packages/styles/globals.css` and mapped `h-screen`, `min-h-screen`, and `max-h-screen` utilities to `100dvh` so mobile address bars never cause the outer document viewport to scroll `<Header />` into the status bar or Dynamic Island.
    - Updated `Page.tsx` to use a `fixed inset-0 flex h-dvh` shell (`height: calc(100dvh / var(--ui-zoom, 1))`) with `min-h-0 overscroll-y-contain` on `#main-scroll-container` so touch scrolling stays strictly inside `<main>`.
    - Converted viewport-relative heights (`[...vh]`) across packages and apps to `dvh` and bound page scroll listeners directly to `#main-scroll-container`.
    - **Safe-Area Insets (`env(safe-area-inset-*)`) & `viewportFit: 'cover'`:**
    - Exported `viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }` across all 12 Next.js application root layouts.
    - Added `--safe-top`, `--safe-right`, `--safe-bottom`, and `--safe-left` tokens and applied `env(safe-area-inset-*, 0px)` offsets across `Header`, `HeaderOmnibar`, `Sidebar`, `Page`, `Footer`, `CookiePrompt`, `Modal`, `ToastProvider`, `SupportProvider`, and `CommandPaletteModal`.
    - **`www.xernerx.com` Seobility SEO & AdSense Crawler Visibility Overhaul (`www`, `@xernerx/lib`, `@xernerx/providers`):**
    - Optimized root and route metadata titles (`<580px`), meta descriptions (`<1000px`), H1 keyword parity, external link counts, and server-rendered semantic HTML fallbacks.
    - Bypassed client-side loading gates (`opacity-0`) for search engine and AdSense crawlers in `LoadingProvider.tsx` and `Page.tsx`.
    - Replaced remaining hardcoded `max-w-*` widths with `max-w-(--page-width)`.

- Updated dependencies
    - @xernerx/styles@0.2.1
    - @xernerx/components@0.12.4
    - @xernerx/providers@0.18.2
    - @xernerx/ui@0.7.12
    - @xernerx/feedback@0.4.7
    - @xernerx/lib@1.16.4

## 1.10.5

### Patch Changes

- Enforce `--page-width` across all remaining application layouts, optimize SSR HTML payload size by deduplicating the fallback dictionary, and resolve all Seobility SEO and Google AdSense crawler visibility issues on `www.xernerx.com`.
- Updated dependencies
    - @xernerx/components@0.12.3
    - @xernerx/lib@1.16.3
    - @xernerx/providers@0.18.1
    - @xernerx/feedback@0.4.6
    - @xernerx/ui@0.7.11

## 1.10.4

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.12.2

## 1.10.3

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.12.1

## 1.10.2

### Patch Changes

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

- Updated dependencies
    - @xernerx/components@0.12.0
    - @xernerx/providers@0.18.0
    - @xernerx/styles@0.2.0
    - @xernerx/lib@1.16.2
    - @xernerx/feedback@0.4.5
    - @xernerx/ui@0.7.10

## 1.10.1

### Patch Changes

- Fixed a push error
- Updated dependencies
    - @xernerx/components@0.11.1
    - @xernerx/feedback@0.4.4
    - @xernerx/lib@1.16.1
    - @xernerx/providers@0.17.1
    - @xernerx/styles@0.1.17
    - @xernerx/ui@0.7.9

## 1.10.0

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

## 1.9.1

### Patch Changes

- ### Comprehensive Suite Update — Admin Bots & Servers Management, Portal Webhook Signing Secrets, Store Promo Codes, Staff Subscription 1,000 CDN Slots Fix, API Playground & Hosting Console Upgrades

    #### 1. Admin Portal (`apps/admin` — `minor`)
    - **Dedicated Bots & Servers Management Views (`Bots.tsx`, `BotCard.tsx`, `EditBotModal.tsx`, `Servers.tsx`, `ServerCard.tsx`, `EditServerModal.tsx`)**:
        - Added full administrative management tabs for **Bots** and **Servers** matching the **Users** management experience.
        - Added search by name, Discord snowflake ID, owner ID, or vanity slug; status filters (`All`, `Verified`, `Public`, `Private`, plus `Bot Installed` on Servers); and multi-metric sorting (`A - Z`, `Z - A`, `Servers` / `Members`, `Votes`).
        - Added `EditBotModal` and `EditServerModal` to inspect/override `verified`, `vanityUnlocked`, `vanitySlug`, `privacy`, `organizationId`, `coOwners`, `description`, or permanently delete a listing with confirmation and audit logging.
    - **Unified Single-Keyword Notation**:
        - Standardized all entity and management labels across `apps/admin`, `HomeOverview.tsx`, `buildHomeOverviewCards.ts`, and `@xernerx/lib` permissions to concise single-keyword notation (`Users`, `Bots`, `Servers`, `Roles`, `Tokens`, `Store`, `Settings`, `Translations`).
    - **Scroll-Container Aware Infinite Scroll (`useInfiniteScroll.ts`)**:
        - Replaced premature `IntersectionObserver` triggers with `useInfiniteScroll`, which listens directly to `#main-scroll-container` scroll and wheel events and only loads the next page when the user scrolls within `16px` of the bottom (`scrollTop > 0`).
    - **Audit Logs (`AuditLogs.tsx`)**:
        - Added `Bot` (`bot.update`, `bot.delete`) and `Server` (`server.update`, `server.delete`) category filters, icons, and color badges.
    - **Store Coupons & Promo Links (`StoreManagement.tsx`)**:
        - Added 1-click **Copy Promo Link** (`https://store.xernerx.com/?promo=CODE`) and visual redemptions progress bars to coupon rows.
    - **Support Tickets & Checklists (`SupportTicketsTab.tsx`, `SupportConfigTabs.tsx`)**:
        - Added **Export CSV** and **Export JSON** actions plus bot-name search matching to Support Tickets.
        - Added unsaved-changes reminder toast (`useToast().remind`) with `Ctrl + S` save and `<Confirm variant="danger" />` reset protection when editing troubleshooting checklists.

    #### 2. Developer Portal (`apps/portal` — `minor`)
    - **End-to-End Webhook Signing Secrets (`WebhooksTab.tsx`)**:
        - Added a **Signing Secret** (`whsec_...`) field to every webhook card with **Reveal / Hide** (`Eye` / `EyeOff`), **Roll Secret** (`generateWebhookSecret()` generating a 32-hex cryptographic secret), and **Copy Secret** controls.
        - Automatically pre-populates a fresh `whsec_...` signing secret when adding a new webhook and passes unsaved secrets directly to `POST /secure/bots/[id]/hooks/test` during live **Test Ping** checks.

    #### 3. Core Backend Gateway (`apps/api` — `minor`)
    - **Webhook Signing Secrets & HMAC-SHA256 Dispatch (`hooks/route.ts`, `hooks/test/route.ts`, `webhookDispatcher.ts`)**:
        - Preserved per-webhook `secret` across `PUT / PATCH /secure/bots/[id]/hooks` syncs.
        - Updated `dispatchBotWebhook` to sign outgoing webhook payloads (`X-Xernerx-Signature: sha256=<hmac>`) using the webhook's configured `secret` (resolving saved secrets from MongoDB automatically on vote, review, and release events, or using the request `secret` on test pings).
    - **Admin Bots & Servers Endpoints (`secure/bots/route.ts`, `secure/bots/[id]/profile/route.ts`, `secure/guilds/route.ts`, `secure/guilds/[id]/route.ts`)**:
        - Added paginated `?admin=true` directory queries with search, privacy/verified/connected filters, and multi-metric sorting (`az`, `za`, `servers`/`members`, `votes`).
        - Allowed staff with `bots` / `servers` permissions to toggle `verified` and `vanityUnlocked` overrides and recorded immutable `AuditLog` entries (`bot.update`, `bot.delete`, `server.update`, `server.delete`).
    - **Staff Infinite Subscription Synchronization (`secure/users/[id]/route.ts`, `secure/store/[id]/product/route.ts`, `secure/store/[id]/cancel/route.ts`, `vanityUnlock.ts`)**:
        - Synchronized `staffSubscription` on `models.users.User` with `staff_infinite_sub` in `models.users.Subscription` so toggling Staff Subscription in Admin immediately grants all premium perks, vanity unlocks, and billing status across the suite.
    - **Public Promo Code Validation & Checkout (`secure/store/coupons/route.ts`, `secure/store/checkout/route.ts`)**:
        - Added public `GET /secure/store/coupons?code=CODE` validation (checking active state, expiration, and max redemptions) and applied validated coupons to Stripe Checkout sessions.

    #### 4. Media CDN (`apps/cdn` — `patch`)
    - **Staff & Subscriber `1,000` Base CDN Slots Fix (`media/route.ts`, `upload/[id]/route.ts`)**:
        - Updated `/media` and `/upload/[id]` to check `userDoc?.staffSubscription`, `user?.staffSubscription`, `canManage`, and active `models.users.Subscription` records so staff members and subscribers reliably receive `1,000` base CDN slots (+ credit store slot upgrades).

    #### 5. Web Store (`apps/store` — `minor`)
    - **Interactive Promo Code Bar & Live Discount Previews (`page.tsx`, `DynamicCategoryView.tsx`, `DynamicFeaturedCard.tsx`, `DynamicItemCard.tsx`)**:
        - Added a glassmorphic promo code bar on `store.xernerx.com` with live validation, active discount badge (`-X%` or `-€X`), strikethrough original pricing across all product cards, automatic `?promo=CODE` / `?code=CODE` URL parameter application, and `sessionStorage` persistence across login redirects.
        - Updated active subscription detection to honor `user.staffSubscription` and `user.subscriptions`.

    #### 6. Developer Documentation (`apps/docs` — `minor`)
    - **Interactive API Playground Enhancements (`ApiPlayground.tsx`)**:
        - Added 1-click **Copy `cURL`** and **Copy `fetch()`** snippet buttons, JSON request body **Format JSON** and context-aware **Sample** payload generator, live JSON syntax validation badge, and a **Recent Requests** bar (`last 8` calls).

    #### 7. Server Hosting Console (`apps/hosting` — `minor`)
    - **Node Search, Status Filters & SSH Command Presets (`HostingConsole.tsx`, `HostingNodeConfigModal.tsx`, `HostingSshModal.tsx`)**:
        - Extracted `HostingNodeConfigModal.tsx` to keep all files strictly under the 500-line cap.
        - Added node search (`Ctrl + K`), status filter pills (`All`, `Online`, `Degraded`, `Offline`), and 1-click SSH command presets (`docker ps`, `df -h & free -m`, `uptime & load`, `easypanel logs`, `docker stats --no-stream`).

    #### 8. Shared Libraries & Discord App Service (`@xernerx/lib`, `@xernerx/app`, `account`, `app`, `info`)
    - **`@xernerx/lib` (`minor`)**: Added `bots` and `servers` permissions to `permissions.ts`, added `staffSubscription` and `stripeCustomerId` to `Profile.ts` (`User` schema), added `secret` to `Hook.ts` (`Hook` schema), added all new localization keys in `en-GB.json`, pruned modified keys from non-`en-GB` locales, and regenerated `i18n.config.ts`.
    - **`@xernerx/app` (`minor`)**: Upgraded Discord support ticket transcripts (`supportTickets.ts`) with detailed header metadata, per-participant message counts, embed/reaction/attachment logs, and rich closure summary embeds.
    - **`account` (`patch`)**: Updated `Tokens.tsx` to recognize `user.staffSubscription` and `user.subscriptions` for elevated token controls.
    - **`app` (`patch`)**: Updated `LevelRolesSection.tsx` in the Virtue dashboard to sort level roles ascending by level and automatically reassign duplicate roles with a toast notification.
    - **`info` (`patch`)**: Updated FAQ documentation for Bot Webhook Signing Secrets, Store Promo Codes, Media CDN `1,000`-slot quotas, and Admin Portal features.

- Updated dependencies
    - @xernerx/lib@1.15.0
    - @xernerx/components@0.10.1
    - @xernerx/providers@0.16.1
    - @xernerx/feedback@0.4.2
    - @xernerx/ui@0.7.7

## 1.9.0

### Minor Changes

- ### Summary of Changes
    - **Standalone Developer Portal (`apps/portal` — `portal.xernerx.com`, Port `4009`)**:
        - Extracted the Developer Portal from `apps/app/src/app/portal` into its own dedicated Next.js application (`apps/portal`) with personal and organization workspaces, bot publishing, vanity slug configuration, release publishing, slash & context command editor (`BotReleasesAndCommandsManager`), token management, and webhook testing.
        - Added automatic redirects on `apps/app/src/app/portal/**` to seamlessly forward legacy URLs to `portal.xernerx.com`.

    - **Staff Infrastructure & Multi-Node Hosting Console (`apps/hosting` — `hosting.xernerx.com`, Port `4010`)**:
        - Created the staff-only `hosting` console (`apps/hosting`) and `POST /secure/hosting/ssh` API route for managing multi-node server infrastructure (`one-dummi`, `two-dummi`), Easypanel projects/services, container telemetry, and WebSSH command execution.
        - Added the `hosting` RBAC permission in `@xernerx/lib` (`permissions.ts`), `apps/admin` (`Roles.tsx`, `page.tsx`), and `EasypanelConnectionCard` in `apps/account` (`Connections.tsx`).

    - **Virtue Level Roles, Live Discord Channel/Role Sync & Infinite Fetch Loop Fix (`apps/app`, `apps/api`, `@xernerx/lib`, `services/websocket`)**:
        - Added `LevelRolesSection` (`apps/app/src/components/dashboard/virtue/LevelRolesSection.tsx`) and `GET /core/guilds/[id]/discord/channels` to link Discord roles to level milestones and select live server channels/roles with automatic Virtue database fallback.
        - Added the `virtue` `Level` Mongoose model (`packages/lib/src/models/virtue/levels/Level.ts`) and synced `services/websocket/src/app/virtue/server.ts`, `/secure/guilds/[id]/leaderboard`, and `/secure/users/[id]/virtue`.
        - Fixed an infinite `GET /core/users/[id]/discord/guilds` request loop in `ConfigPortabilityCard.tsx` caused by an inline default `managedGuilds = []` array reference in `useEffect` dependencies, forwarded pre-fetched `managedGuilds` from `DashboardPage`, and stabilized `useSession` `useEffect` dependencies across `SupportProvider.tsx`, `dashboard/page.tsx`, `servers/[id]/page.tsx`, and `portal/src/app/page.tsx`.

    - **WebSocket Pre-Auth Race Condition Fix & Docs Sync (`services/websocket`, `apps/docs`, `apps/api`)**:
        - Eliminated a pre-authentication message race condition in `services/websocket/src/main.ts` by queuing incoming WebSocket frames until `authenticateConnection` resolves.
        - Synced `apps/docs` (`WebsocketServicesSection`, `WebsocketConnectingSection`, `WebsocketPlayground`, `WebsocketClientSection`, `CoreEndpoints`, `SecureEndpoints`, `PackageInstallBar`) and `docsBlueprints*.ts` / `faqBlueprints*.ts` with all WebSocket actions, `GET /core/guilds/[id]/discord/channels`, `POST /secure/hosting/ssh`, and `portal.xernerx.com` / `hosting.xernerx.com` endpoints.

    - **Desktop Client & Shared Suite Shell (`clients/desktop`, `@xernerx/components`, `@xernerx/providers`, `services/app`, `services/bot`)**:
        - Added native local bot runner and network telemetry hooks (`botNetHook.ts`, `nativeSuite.ts`, `OverlayBotRunnerCard.tsx`) in `clients/desktop` and `@xernerx/components`.
        - Enforced canonical Xernerx dot-matrix watermarks on `www`, `api`, and `docs` in `Page.tsx` so user-configured watermarks only apply to personal dashboard/account views.
        - Updated `EnvironmentProvider`, `SidebarSuite`, `CommandPaletteModal`, `services/app`, and `services/bot` (`milestoneEmojis.ts`) across the entire suite.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.10.0
    - @xernerx/lib@1.14.0
    - @xernerx/providers@0.16.0
    - @xernerx/styles@0.1.16
    - @xernerx/feedback@0.4.1
    - @xernerx/ui@0.7.6

## 1.8.6

### Patch Changes

- Updated dependencies
    - @xernerx/feedback@0.4.0
    - @xernerx/providers@0.15.0
    - @xernerx/components@0.9.5
    - @xernerx/ui@0.7.5

## 1.8.5

### Patch Changes

- Updated dependencies
    - @xernerx/feedback@0.3.0
    - @xernerx/providers@0.14.0
    - @xernerx/components@0.9.4
    - @xernerx/ui@0.7.4

## 1.8.4

### Patch Changes

- Updated dependencies
    - @xernerx/feedback@0.2.0
    - @xernerx/lib@1.13.0
    - @xernerx/components@0.9.3
    - @xernerx/providers@0.13.1
    - @xernerx/ui@0.7.3

## 1.8.3

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.9.2
    - @xernerx/lib@1.12.0
    - @xernerx/providers@0.13.0
    - @xernerx/feedback@0.1.2
    - @xernerx/ui@0.7.2

## 1.8.2

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.11.1
    - @xernerx/components@0.9.1
    - @xernerx/providers@0.12.1
    - @xernerx/feedback@0.1.1
    - @xernerx/ui@0.7.1

## 1.8.1

### Patch Changes

- Fixed type error

## 1.8.0

### Minor Changes

- ### Interactive Dot-Matrix Profile Header, Badge & Customization Studio (`@xernerx/feedback`, `@xernerx/lib`, `apps/store`, `apps/account`, `apps/app`, `apps/api`, `@xernerx/components`)
    - **Full-Bleed Reactive Canvas Engine (`packages/feedback/src/XernerxDotLogo.tsx`, `packages/feedback/src/dotLogoPaths.ts`)**:
        - Built the interactive HTML5 Canvas Dot-Matrix lattice renderer supporting `logo`, `banner`, and `ambient` layouts with real-time pointer-repulsion physics, spring-back velocity damping, traveling sine waves, and 5 color variants (`classic`, `prism`, `cyber`, `aurora`, and `ember`).
        - Fixed `banner` coordinate scaling so the background lattice spans 100% of wide banner containers while centering the `XERNERX` wordmark in the upper focal band so it is never occluded by bottom-left profile avatars.
        - Added `vivid` high-contrast rendering mode (`vivid={true}`) boosting background lattice visibility, center wordmark luminance, and ambient radial glow across both Light and Dark themes.
    - **5-Theme Persistence & API Serialization (`packages/lib/src/models/xernerx/users/Credit.ts`, `apps/api/src/app/secure/users/[id]/route.ts`, `apps/api/src/app/core/users/[id]/route.ts`)**:
        - Added `dotMatrixVariant` (`'classic' | 'prism' | 'cyber' | 'aurora' | 'ember'`, default `'classic'`) to `models.users.Credit` (bumping Mongoose model cache to `__models_v19` in `packages/lib/src/database.ts`).
        - Extended `GET / PATCH /secure/users/[id]` and `GET /core/users/[id]` to validate, persist, and expose `dotMatrixVariant` alongside `unlockedBadges` and `activeBadges`.
    - **Interactive Store Preview & Account Studio (`apps/store/src/components/DotMatrixPerkPreview.tsx`, `apps/account/src/components/DotMatrixBannerStudio.tsx`)**:
        - Embedded `DotMatrixPerkPreview.tsx` directly inside the `3,500`-credit `dot_matrix_banner` card in `CreditStoreView.tsx` so shoppers can test pointer repulsion and switch between all 5 color themes before redeeming.
        - Built `DotMatrixBannerStudio.tsx` and `DotMatrixSettingsCard.tsx` in `apps/account` (`Profile.tsx` & `ProfileShowcases.tsx`), giving owners of `dot_matrix_banner` a live interactive header preview, 1-click active banner toggle, and 5-theme preset selector.
    - **Public Profile Header, Sidebar Card, Hover Popover & SVG Embed Widget (`apps/app/src/components/users/Header.tsx`, `packages/components/src/cards/SidebarUser.tsx`, `packages/components/src/cards/UserProfilePopover.tsx`, `apps/api/src/lib/widgetRenderer.ts`)**:
        - Upgraded public user profile headers (`Header.tsx`) to render the interactive `XernerxDotLogo` (`variant="banner"`, `vivid={true}`, `colorVariant={dotMatrixVariant}`) with pointer event forwarding and an animated `Dot-Matrix` HUD pill badge.
        - Upgraded `SidebarUser.tsx` and `UserProfilePopover.tsx` to render an interactive mini Dot-Matrix banner header and HUD badge when `dot_matrix_banner` is active.
        - Upgraded `widgetRenderer.ts` (`GET /core/users/[id]?widget=svg`) to render a vector SVG dot-matrix header grid and `DOT-MATRIX` pill badge using the user's selected `dotMatrixVariant` palette.

    ### Bot Milestones, Biggest Bot Profile Showcases & Official Milestone SVGs (`@xernerx/lib`, `packages/public`, `apps/app`, `apps/api`, `services/bot`)
    - **Canonical Milestone Engine (`packages/lib/src/milestones.ts`)**:
        - Created `MILESTONE_TIERS` (`10`, `25`, `50`, `100`, `250`, `500`, `1,000`, `2,500`, `5,000`, `10,000`, `25,000`, `50,000`, `100,000`), `evaluateMilestones()`, `getHighestMilestoneBadge()`, and `getMilestoneProgress()` mapped to `/servers/Servers*.svg` and `/members/Members*.svg` static assets synced across all apps via `pnpm suite initialize`.
    - **Bot Milestones View & Next-Tier Progress Queue (`apps/app/src/components/bots/Milestones.tsx`, `apps/app/src/components/bots/Profile.tsx`)**:
        - Built the dedicated **Milestones** tab and overview showcase on bot profiles displaying unlocked Server and Member milestone SVG badges, unlock timestamps, and queued progress bars toward the next milestone tier.
    - **Biggest Bot Milestones on User Profiles (`apps/app/src/components/users/BiggestBotMilestonesCard.tsx`, `apps/api/src/app/core/users/[id]/route.ts`, `apps/api/src/lib/widgetRenderer.ts`)**:
        - Automatically resolves a bot owner's largest bot in `GET /core/users/[id]`, computes its highest Server and Member milestone badges plus next-tier progress, and displays them on public user profiles (`BiggestBotMilestonesCard.tsx`) and user SVG widgets (`widgetRenderer.ts`).

    ### Universal 3-Tier Privacy Truth (`public` | `limited` | `private`) Across Web Apps, API, CDN & Bots (`AGENTS.md`, `@xernerx/lib`, `apps/api`, `apps/app`, `apps/account`, `apps/cdn`, `services/bot`)
    - **3-Tier Privacy Enforcement (`@xernerx/lib`, `apps/api`, `apps/cdn`, `services/bot`)**:
        - Standardized privacy across User Profiles, Bots, Servers/Guilds, Organizations, and CDN Media into three tiers:
            - `public`: Listed in public directories, explorers, leaderboards, and search results, and accessible by anyone.
            - `limited`: Unlisted (hidden from public directories, explorers, leaderboards, and search results) but accessible via direct link or ID.
            - `private`: Strictly owner-only (never listed and inaccessible even with a direct link or ID unless authenticated as the owner or an authorized organization/co-owner member).
        - Updated `services/bot` multi-instance daemon (`services/bot/src/instances/*`, `services/bot/src/lib/botUtils.ts`) and all `apps/api` and `apps/cdn` routes to enforce `public | limited | private` visibility boundaries.

    ### Credit Ecosystem Expansion: Tipping, Organization Treasuries, Spotlight Boosts, Daily Streak Ladder & Ledger (`apps/store`, `apps/account`, `apps/app`, `apps/admin`, `apps/api`, `@xernerx/lib`)
    - **Peer-to-Peer Credit Tipping (`apps/app/src/components/users/TipCreditsModal.tsx`, `apps/api/src/app/secure/store/credits/tip/route.ts`, `apps/api/src/app/secure/users/[id]/credits/tip/route.ts`)**:
        - Enabled users to send direct credit tips with custom notes to bot developers and community members from public user profiles, recording paired debit/credit ledger entries.
    - **Organization Credit Treasuries (`apps/app/src/components/portal/OrganizationTreasuryCard.tsx`, `apps/api/src/app/secure/organizations/[id]/treasury/route.ts`)**:
        - Added pooled organization credit treasuries allowing members to contribute credits and fund organization-owned bot/server spotlight boosts.
    - **Bot & Server Spotlight Boosts (`apps/app/src/components/SpotlightBoostModal.tsx`, `apps/api/src/app/secure/bots/[id]/boost/route.ts`, `apps/api/src/app/secure/guilds/[id]/boost/route.ts`)**:
        - Added credit-powered Spotlight Boosts to feature bots and servers in explorer spotlight carousels.
    - **Daily Streak Ladder, Transaction Ledger, Achievements & Referrals (`apps/store/src/components/DailyStreakLadder.tsx`, `apps/store/src/components/CreditLedgerCard.tsx`, `apps/account/src/components/CreditLedgerCard.tsx`, `apps/account/src/components/AchievementsReferralCard.tsx`, `apps/admin/src/components/AdminUserCreditsModal.tsx`)**:
        - Added the 7-day progressive reward streak ladder in `apps/store`, full credit transaction history ledgers in `apps/store` and `apps/account`, user achievements & referral code claiming (`/secure/users/[id]/achievements`, `/secure/users/[id]/referrals`), and an Admin User Credit & Perk Manager (`AdminUserCreditsModal.tsx`) in `apps/admin`.

    ### Developer Portal, Public API Versioning Policy (`/v1/*` → `/v2/*`), Bot Releases & Living Documentation (`apps/api`, `apps/docs`, `apps/info`, `apps/app`)
    - **Public API Versioning & Breaking-Change Policy (`AGENTS.md`, `apps/api/AGENTS.md`, `apps/docs/src/components/api/ApiOverviewAndAuth.tsx`)**:
        - Established and documented the non-breaking (`/v1/*`) vs breaking (`/v2/*` with `X-API-Version`, `Deprecation`, and `Sunset` adapter headers) public API versioning standard.
    - **Bot Releases, Webhook Delivery Replay & Growth Telemetry (`apps/api/src/app/v1/bots/[id]/releases/route.ts`, `apps/app/src/components/bots/Releases.tsx`, `apps/app/src/components/portal/BotReleasesAndCommandsManager.tsx`, `apps/app/src/components/portal/WebhookDeliveriesCard.tsx`, `apps/app/src/components/portal/bot/GrowthTelemetryTab.tsx`)**:
        - Added public (`GET / POST /v1/bots/[id]/releases`) and portal (`/secure/bots/[id]/releases`) bot release notes management, webhook delivery history inspection & 1-click payload replay (`/secure/bots/[id]/hooks/replay`), 1-click API token rolling (`/secure/tokens/[id]/roll`), and historical bot growth telemetry charts.
    - **Interactive WebSocket Playground, API Docs Sync & FAQ Expansion (`apps/docs/src/components/websocket/WebsocketPlayground.tsx`, `apps/docs/src/components/api/*.tsx`, `apps/info/src/components/faq/*.tsx`, `apps/api/src/lib/docsBlueprints*.ts`, `apps/api/src/lib/faqBlueprints*.ts`)**:
        - Added an interactive WebSocket testing playground on `docs.xernerx.com/websocket`, documented 100% of `/v1/*`, `/secure/*`, `/core/*`, and `/info/*` API routes, and expanded the `info.xernerx.com/faq` knowledgebank and public `/core/faq` & `/core/docs` blueprints.

    ### Desktop Companion v2.3, UI Primitives (`<Check />` vs `<Toggle />`) & Strict `AGENTS.md` Architecture Compliance (`clients/desktop`, `apps/www`, `@xernerx/ui`, `@xernerx/components`, `@xernerx/providers`, `@xernerx/cli`)
    - **Desktop Companion Enhancements & `/download` Parity (`clients/desktop`, `apps/www/src/components/DesktopInteractivePreview.tsx`, `apps/www/src/components/DesktopPerksBento.tsx`, `apps/www/src/components/DesktopPowerPerksRow.tsx`)**:
        - Added CDN Watch Folder auto-upload (`desktopExtras.ts`), Quick Screen Capture, Streamer Mode auto-detection, and Battery Saver power monitoring in `clients/desktop`, and synced `xernerx.com/download` interactive previews.
    - **Selection Primitive `<Check />` vs Boolean `<Toggle />` (`packages/ui/src/Check.tsx`, `packages/components/src/media/MediaGridCard.tsx`)**:
        - Introduced `<Check />` in `@xernerx/ui` strictly for item/option selection (such as multi-selecting media cards in `MediaManager.tsx`, token scopes, and role permissions) while reserving `<Toggle />` strictly for boolean On/Off state switches.
    - **Strict `AGENTS.md` Compliance & Automated Suite Linter (`.xernerx/cli/commands/lint.ts`)**:
        - Modularized all large pages and components across `apps/*` and `packages/*` so every source file strictly obeys the 500-line cap after Prettier formatting, `src/components/` placement rule, 3-route local `/api` rule, `useDictionary()` `t()` localization completeness in `en-GB.json`, and zero ESLint errors across all 19 workspace projects.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.9.0
    - @xernerx/feedback@0.1.0
    - @xernerx/lib@1.11.0
    - @xernerx/providers@0.12.0
    - @xernerx/ui@0.7.0

## 1.7.2

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.8.2
    - @xernerx/lib@1.10.0
    - @xernerx/providers@0.11.2
    - @xernerx/feedback@0.0.42
    - @xernerx/ui@0.6.2

## 1.7.1

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.8.1
    - @xernerx/lib@1.9.0
    - @xernerx/providers@0.11.1
    - @xernerx/feedback@0.0.41
    - @xernerx/ui@0.6.1

## 1.7.0

### Minor Changes

- ### Encrypted QR Code & 6-Character Pairing Code Cross-Device Sign-In (`apps/account`, `apps/api`, `@xernerx/lib`)
    - **Passwordless Cross-Device Authentication (`/login/qr` & `/login/approve`)**: Introduced end-to-end encrypted QR Code and 6-character manual pairing code sign-in (`QrLoginPanel.tsx`, `QrApproveView.tsx`, `DevicePairingCard.tsx`, `qrMatrix.ts`) allowing users to authenticate desktop or secondary browser sessions from an already-signed-in mobile or desktop device without re-entering credentials.
    - **AES-256-GCM Ticket Exchange (`apps/api/src/app/secure/auth/qr/route.ts`)**: Built a dedicated ticket lifecycle endpoint (`PENDING` -> `APPROVED` -> `CONSUMED`) backed by AES-256-GCM encrypted session handoff payloads, 3-minute TTL expiration, and one-time consumption guards.
    - **NextAuth `xernerx-qr` Provider (`@xernerx/lib/src/auth.ts`)**: Added a dedicated NextAuth credentials provider to verify and exchange approved QR/pairing tickets directly into authenticated suite sessions.

    ### Native Desktop Client Companion v2.2, Multi-Account Switcher & Live Overlay (`clients/desktop`, `apps/app`, `apps/www`, `@xernerx/components`)
    - **Isolated Multi-Account Chromium Partitions (`clients/desktop`)**: Added native multi-account session management (`persist:xernerx-<slot>`) in `main.ts`, `metadata.ts`, and `preload.cts`, enabling instant switching between up to 5 independent Discord accounts (`DesktopAccountSwitcher.tsx`) without signing out.
    - **Always-on-Top Live Overlay Monitor (`clients/desktop/src/overlay.ts`, `apps/app/src/app/overlay/page.tsx`)**: Added a translucent, frameless Always-on-Top companion overlay window (`OverlayMonitor.tsx`) displaying live API latency, real-time WebSocket event streams, server & bot metrics, and quick navigation triggers.
    - **Custom Window Controls & Global Summon Hotkey (`HeaderWindowControls.tsx`, `clients/desktop/src/rpc.ts`)**: Added customizable desktop titlebar controls (`System`, `Windows Classic`, `macOS Traffic Lights`, and `Xernerx Glass Pills`), global summon shortcut (`Ctrl + Shift + X`), rich Discord RPC activity presence, and an integrated runtime debug log viewer (`DesktopLogsModal.tsx`).
    - **Interactive `/download` Showcase (`apps/www/src/app/download/page.tsx`)**: Rebuilt the desktop download showcase with `DesktopInteractivePreview.tsx` and `DesktopPerksBento.tsx` featuring interactive previews of multi-account switching, Discord Rich Presence, mini-overlay telemetry, QR phone pairing, and global summon hotkeys.

    ### Comprehensive Interactive FAQ Knowledgebank & Public Bot API (`apps/info`, `apps/api`, `services/bot`)
    - **9-Category, 54-Card Interactive FAQ Hub (`apps/info/src/app/faq/page.tsx`)**: Overhauled the FAQ knowledgebank across 9 domain modules (`EcosystemAndNavigation.tsx`, `DesktopAndOverlay.tsx`, `Bots.tsx`, `ServersAndOrganizations.tsx`, `AccountAndSecurity.tsx`, `BillingAndStore.tsx`, `ApiAndDevelopers.tsx`, `Translations.tsx`, `Environments.tsx`) with deep explanations of every suite app, clickable quick links, vanity URLs, copyable route badges, and interactive UI triggers (`Command Palette`, `App Drawer`, `URL Omnibar`, `Shortcuts Modal`).
    - **Public `/core/faq/**` REST API (`apps/api/src/app/core/faq/**`)**: Exposed the entire localized FAQ catalog via `GET /core/faq`, `GET /core/faq/categories`, `GET /core/faq/search`, `GET /core/faq/[category]`, and `GET /core/faq/[category]/[id]` (`faqCatalog.ts`, `faqBlueprints.ts`, `faqBlueprintsPlatform.ts`) complete with pre-built `discordEmbed` objects, quick links, and multi-locale resolution (`?lang=`).
    - **Public `/core/docs/**` Catalog API & Discord Bot `/faq` + `/docs` Slash Commands (`apps/api/src/app/core/docs/**`, `services/bot`)**: Added `GET /core/docs` and `GET /core/docs/[id]` (`docsCatalog.ts`, `docsBlueprints.ts`, `docsBlueprintsApi.ts`) and wired interactive `/faq` and `/docs` slash commands in `services/bot` with live autocomplete, category browsing, and localized embeds.

    ### Developer Documentation Portal Overhaul & Token-Gated Access (`apps/docs`)
    - **REST API Reference Redesign (`/api/[version]`)**: Added `ApiOverviewAndAuth.tsx` (copyable Base URLs for `v1`, `core`, and `secure`, visual 3-step Token Lifecycle `Pending -> Active -> Scoped`, and clickable Namespace Switcher) and `V1PlatformEndpoints.tsx` (`/v1/leaderboard`, `/v1/changelog/rss.xml`, `/api/version`, `/api/changelog`). Reorganized the sidebar into logical domain groups with live `Ctrl + K` filtering, HTTP method filter pills, `Expand All` / `Collapse All` controls, auth scope badges, 1-click Copy Full URL buttons, and `Test` in Playground triggers.
    - **CDN, WebSocket & NPM Package Docs Upgrade (`/cdn`, `/websocket`, `/packages`)**: Unified all documentation portals with `CdnOverviewAndAuth.tsx`, `CdnEndpoints.tsx`, interactive RPC service & action filtering in `WebsocketServicesSection.tsx`, 1-click `pnpm add` copy bars, symbol kind filter tabs (`ALL`, `Classes`, `Interfaces`, `Functions`), and `Ctrl + K` search bars.
    - **Dynamic Token-Gated Access (`useDocsAccess.ts`)**: Added `useDocsAccess()` to inspect the active user's personal API tokens (`permissions.websocket`, `permissions.secure`) alongside admin roles to conditionally unlock and render the `/websocket` and `/api/secure` documentation views and homepage cards.

    ### Live Status Telemetry, Dynamic SVG Shields, Analytics Charts & Daily Credit Gifts (`apps/info`, `apps/api`, `apps/app`, `apps/account`)
    - **24-Hour Service Uptime Bars & Bot Shard Telemetry (`apps/info`, `apps/api/src/app/info/status/**`)**: Added `Status24hBar.tsx` and `StatusBotsSection.tsx` backed by `/info/status/history` and `/info/status/bots` plus live bot shard telemetry reporting (`services/bot/src/events/presenceUpdate.ts`).
    - **Dynamic SVG Shields & Embeddable Widgets (`apps/api/src/app/v1/**/badge.svg`, `WidgetSettingsCard.tsx`)**: Added dynamic SVG status/metric badges for bots, servers, organizations, and users (`badgeRenderer.ts`) and a shared `WidgetSettingsCard` component in `@xernerx/components`.
    - **Unified `MetricsChart` Time-Series Analytics (`apps/app/src/components/MetricsChart.tsx`)**: Built an interactive SVG time-series analytics chart used across Bot Stats (`bots/Stats.tsx`), Server Stats (`servers/ServerStatsView.tsx`), and Dashboard Statistics (`dashboard/Statistics.tsx`).
    - **Daily Credit Mystery Gift & 48h Streak System (`SidebarUser.tsx`, `Billing.tsx`, `apps/api/src/app/secure/users/[id]/credits/claim`)**: Added daily credit mystery gift claiming with a 24-hour cooldown and 48-hour streak retention window, surfaced in both `SidebarUser.tsx` and `apps/account` Billing.

    ### Workspace Preferences, Translation Studio & Strict `AGENTS.md` Architecture Compliance (`packages/*`, `apps/*`)
    - **Workspace & Appearance Customizer (`Preferences.tsx`, `ThemeProvider.tsx`, `@xernerx/styles`)**: Added granular workspace toggles for Header/Sidebar visibility, left/right layout alignment, reduced motion, shortcut hints, Discord avatar decorations/nameplates, and developer mode persisted via `pref_*` functional cookies and user settings.
    - **Community Translation Studio (`apps/admin/src/components/translations/*`, `apps/api/src/app/secure/dictionary/[language]`)**: Modularized the Translation Studio with community submission review workflows, auto-translate batching, and progress tracking.
    - **Shared Primitives & Media Manager (`@xernerx/ui`, `@xernerx/components`, `@xernerx/feedback`)**: Added `Badge`, `CopyButton`, and `EmptyState` to `@xernerx/ui`; extracted shared `MediaManager`, `AsyncUserMultiSelector`, and `BotProfilePreview` into `@xernerx/components`; and upgraded `@xernerx/feedback` error boundaries with collapsible stack traces and 1-click error diagnostics.
    - **Full Monorepo `AGENTS.md` Audit & Localization (`packages/lib/src/dictionaries/*`)**: Modularized all large views under the 500-line inline code cap, moved all co-located components into `src/components/`, enforced the strict 3-route local `/api` rule, added SEO metadata (`opengraph-image.tsx`, `sitemap.ts`, `robots.ts`) and vanity redirects across apps, updated Terms of Service, Privacy Policy, and Cookie Policy (`2026-10-21`), and added 1,200+ localization keys across `en-GB` and supported locales.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.8.0
    - @xernerx/feedback@0.0.40
    - @xernerx/lib@1.8.0
    - @xernerx/providers@0.11.0
    - @xernerx/ui@0.6.0

## 1.6.0

### Minor Changes

- <!-- @format -->

    ### Workspace-Wide Architecture, Governance, Safeguards & UX Overhaul

    #### `account` (`2.2.0` → `2.3.0` — `minor`)
    - **Per-Device Session Revocation & Bulk Sign-Out**: Added individual session revocation (`DELETE /secure/account/sessions` with `sessionId`) alongside bulk sign-out (`revokeAllExceptCurrent`), guarded by `<Confirm variant="danger" />` modals and toast feedback in `Devices.tsx`.
    - **High-Risk Destructive Safeguards (`confirmKeyword`)**: Enforced `confirmKeyword` verification on API token deletion (`ManageTokenModal.tsx`), CDN asset deletion (`Media.tsx`), OAuth account unlinking (`Connections.tsx`), and extracted `AccountDangerZone.tsx` for account disable/delete workflows.
    - **Billing & Subscription Confirmation**: Replaced inline state toggles with a shared `<Confirm variant="danger" />` modal for subscription cancellation and saved payment method removal in `Billing.tsx`.
    - **Notifications Search (`Ctrl + K`)**: Added page-level search (`<Input variant="search" shortcut={true} />`) with filter resetting and empty-state clearing in `Notifications.tsx`.
    - **URL-Synced Sidebar Navigation**: Synchronized active views with `?tab=` query parameters via `SidebarProvider`.

    #### `admin` (`0.13.0` → `0.14.0` — `minor`)
    - **Destructive Action Safeguards Across All Modules**: Added `<Confirm variant="danger" />` modals (with `confirmKeyword` where appropriate) and `useToast().toast()` feedback across `Issues.tsx`, `Suggestions.tsx`, `Roadmap.tsx`, `Announcements.tsx`, `Media.tsx`, `Roles.tsx`, `Tokens.tsx`, `Invites.tsx`, `ApplicationConfigs.tsx`, `StoreCategoriesTab.tsx`, `StoreItemsTab.tsx`, and `UserModal.tsx`.
    - **CSV / JSON Data Export & Manual Refresh**: Added filtered CSV/JSON export helpers and manual refresh buttons with loading spinners across `Users.tsx`, `AuditLogs.tsx`, `Tokens.tsx`, `Invites.tsx`, `Roles.tsx`, and `ApplicationConfigs.tsx`.
    - **Localization Manager (`Translations.tsx`)**: Wired `useToast().remind` unsaved-changes bar (`Save` / `Reset`) for edited locale strings and added one-click JSON dictionary export.
    - **Application Reviews (`ApplicationReviews.tsx`)**: Replaced custom backdrop markup with the shared `<Modal />` primitive from `@xernerx/ui`.
    - **Modular Component Decomposition (<500-Line Rule)**: Extracted `HomeOverview.tsx`, `overview/*`, `settings/*`, and `issues/*` sub-components to keep all admin views modular and under 500 lines.

    #### `api` (`0.14.0` → `0.15.0` — `minor`)
    - **Public User Widget Endpoint (`/v1/users/[id]/widget`)**: Added SVG, PNG (`ImageResponse`), HTML iframe, and JSON embed widget rendering for user profiles (`widgetRenderer.ts`) and exposed `publicWidget` preferences in `GET/PATCH /core/users/[id]`.

    #### `app` (`2.9.0` → `2.10.0` — `minor`)
    - **Public Profile Embed Widgets (`PublicWidgetModalButton.tsx`)**: Added an interactive Embed Widget generator modal (Markdown, HTML, Image URL, Iframe, JSON) on Bot (`bots/Header.tsx`), Server (`ServerHeader.tsx`), Organization (`organization/Header.tsx`), and User (`users/Header.tsx`) public profiles.
    - **Developer Portal Safeguards & Deep-Linking**: Added `confirmKeyword` + `variant="danger"` when removing organization members (`OrgMembersTab.tsx`), linked organization servers directly to `/dashboard?guild=${id}` (`OrgServersTab.tsx`), and added toast feedback for Guild Dashboard settings save/delete (`dashboard/page.tsx`).
    - **Modularization & URL State**: Extracted `ExploreCards.tsx` (`BotCard`, `ServerCard`) from `app/page.tsx` and modularized `servers/[id]/page.tsx` into `src/components/servers/*`.

    #### `docs` (`1.1.0` → `1.2.0` — `minor`)
    - **API Playground Request History & Copy as cURL**: Added persistent recent request history (`localStorage`) with one-click replay and a `Copy as cURL` generator in `ApiPlayground.tsx`.
    - **Interactive Endpoint Jump-Links**: Linked endpoint cards in `CoreEndpoints.tsx` directly to prefill the live API Playground and extracted `docsHomeData.ts` for modular architecture compliance.

    #### `info` (`1.5.0` → `1.6.0` — `minor`)
    - **URL-Synced Filtering & Pagination**: Synchronized search, status, category, and sort filters with URL query parameters across `issues/page.tsx`, `suggestions/page.tsx`, `roadmap/page.tsx`, and `ChangelogClient.tsx`.
    - **Status Uptime Range Toggle**: Added `30d` / `60d` / `90d` historical uptime range selector and manual refresh in `StatusClient.tsx`.
    - **Modularization**: Extracted `issues/*`, `suggestions/*`, and `MobileRoadmapTimeline.tsx` into `src/components/`.

    #### `@xernerx/lib` (`1.6.0` → `1.7.0` — `minor`)
    - **User Profile Schema**: Added `settings.privacy.publicWidget` (`boolean`, default `true`) to `UserProfileSchema` (`Profile.ts`).
    - **Localization (`en-GB.json` & `i18n.config.ts`)**: Added comprehensive localization keys for all new modals, confirmations, exports, widgets, and actions across the monorepo.

    #### `@xernerx/providers` (`0.9.1` → `0.10.0` — `minor`)
    - **URL-Synced `SidebarProvider`**: Added optional `?tab=` URL query parameter synchronization (`history.replaceState` + `popstate` listener) when switching sidebar views.
    - **Modularized Providers (<500-Line Rule)**: Extracted `commandPaletteData.ts` from `CommandPaletteModal.tsx` and `ShortcutHelpModal.tsx` from `ShortcutsProvider.tsx`.

    #### `@xernerx/components` (`0.7.1` → `0.7.2` — `patch`)
    - **Header Omnibar Decomposition**: Extracted `HeaderOmnibar.tsx` from `Header.tsx` to keep `Header.tsx` well under the 500-line threshold.

    #### `store` (`0.3.12` → `0.3.13` — `patch`)
    - **Localization Cleanup**: Replaced remaining hardcoded fallback strings in `apps/store/src/app/page.tsx` with `useDictionary()` keys.

    #### `@xernerx/cli` (`2.2.1` → `2.2.2` — `patch`)
    - **Suite Architecture Linter (`lint.ts`)**: Allowed Next.js App Router `manifest.ts` metadata files and `apps/account` secondary OAuth connection routes (`/api/connections/[provider]`) per `AGENTS.md` Rule 6.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.7.0
    - @xernerx/providers@0.10.0
    - @xernerx/components@0.7.2
    - @xernerx/feedback@0.0.39
    - @xernerx/ui@0.5.2

## 1.5.0

### Minor Changes

- <!-- @format -->

    ### Ecosystem Leaderboards, Dynamic OpenGraph Embeds & Suite Enhancements

    #### `app` (`minor`)
    - **Ecosystem Leaderboards (`/leaderboard`)**: Added a dedicated leaderboard hub featuring Top Bots, Top Servers, and Daily Streaks with a stepped `2 - 1 - 3` Olympic podium showcase, live Discord profile resolution via `/core/users/[id]/discord`, a unified category switcher, `Ctrl + K` search bar, and `@xernerx/ui` metric `<Selector />`.
    - **Rich OpenGraph & Discord Unfurl Cards**: Added `users/[id]/layout.tsx` and upgraded `bots/[id]/layout.tsx`, `servers/[id]/layout.tsx`, `organization/[id]/layout.tsx`, and `leaderboard/page.tsx` with `siteName: 'Xernerx Studios'` and high-DPI `840×360` dynamic OpenGraph card images.
    - **Profile Privacy Enforcement**: Enforced `privacy === 'private'` guards on `/bots/[id]` and `/servers/[id]` for non-owners/non-managers and loaded live Discord data for bots and owners via `/core/users/[id]/discord`.
    - **Embeddable SVG Badges & Webhook Testing**: Added an Embed Badges modal (`Markdown` & `HTML` snippets for votes, servers, users, and status badges) on Bot profiles and a "Send Test Ping" webhook button in the Developer Portal (`WebhooksTab.tsx`).
    - **SEO & PWA Metadata**: Added `manifest.ts`, `opengraph-image.tsx`, `robots.ts`, and `sitemap.ts`.

    #### `api` (`minor`)
    - **Public Leaderboard Endpoint (`/v1/leaderboard`)**: Added aggregation pipelines for public bots, public guilds, and public user credit streaks, strictly enforcing `{ privacy: 'public' }`.
    - **User OpenGraph & Widget Endpoint (`/core/users/[id]`) & `widgetRenderer.ts`**: Added `/core/users/[id]` and upgraded `renderWidgetPng` to render `840×360` retina cards with Discord/guild banner backgrounds, rounded avatars, `VERIFIED` pills, `@handle`, and stat boxes across `bot`, `guild`, `organization`, and `user` profiles.
    - **Live SVG Badges (`/v1/bots/[id]/badge.svg` & `/v1/status/badge.svg`)**: Added dynamic Shields-style SVG badge endpoints for bot metrics and system status.
    - **Daily Credit Claim (`/secure/users/[id]/credits/claim`) & Webhook Test Ping (`/secure/bots/[id]/hooks/test`)**: Added endpoints for 24-hour daily credit streak rewards and signed `ping.test` webhook verification.
    - **Roadmap Interactions (`/info/roadmap/[id]/interact`) & Audit/Email Dispatch (`auditAndNotify.ts`)**: Added roadmap upvoting and release-watcher toggling with automatic Postmark email and in-app notification dispatch when watched roadmap items are released.
    - **Unified Status, Changelog & Audit Endpoints**: Added `/v1/status`, `/v1/changelog`, `/secure/core/audit`, and `/secure/users/[id]/activity`.

    #### `account` (`minor`)
    - **OAuth2 / OpenID Connections (`/api/connections/[provider]`)**: Added dedicated OAuth2/OpenID linking routes (`github`, `twitch`, `twitter`, `youtube`, `steam`, `roblox`, `reddit`, `spotify`) and updated `Connections.tsx` with provider cards and profile visibility toggles.
    - **Daily Credit Rewards & Activity Feed**: Added the Daily Reward & Streak claim card in `Billing.tsx`, `ActivityView.tsx` for account history, and granular notification toggles (including Roadmap Releases) in `Notifications.tsx`.
    - **Navigation Cleanup & PWA Manifest**: Removed the redundant Store sidebar item from `account` and added `manifest.ts`.

    #### `info` (`minor`)
    - **Roadmap Upvoting & Release Watcher (`RoadmapActionBar.tsx`)**: Added interactive upvoting and "Notify on Release" watcher buttons to roadmap items.
    - **Live System Status (`/status`)**: Added `StatusClient.tsx` and `/status` route plus SEO/PWA metadata (`manifest.ts`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`).

    #### `admin` (`minor`)
    - **Staff Audit Logs & Live Subdomain Health**: Added `AuditLogs.tsx` and `OverviewSubdomainCard.tsx` for monitoring staff actions, service latency, and versions across the suite.

    #### `docs` (`minor`)
    - **Interactive API Playground (`ApiPlayground.tsx`)**: Added an interactive HTTP request tester in the API documentation viewer along with SEO/PWA metadata routes.

    #### `@xernerx/lib` (`minor`)
    - **Models, Postmark Dispatch & Localization**: Added `AuditLog` model, updated `RoadmapItem` (`upvotes`, `watchers`) and `User` (`connections`) schemas, added `dispatchUserNotification` with Postmark HTML email delivery in `dispatch.ts`, and expanded `en-GB.json` and `nl.json` dictionaries.

    #### `@xernerx/providers` (`patch`)
    - **`PermissionProvider` Stability & Command Palette**: Fixed `TypeError: Failed to fetch` in `PermissionProvider.tsx` by normalizing role IDs, including credentials, and gracefully handling aborted fetches during navigation/HMR; updated `CommandPaletteModal.tsx` shortcuts.

    #### `@xernerx/components`, `@xernerx/cli`, `store`, `www` (`patch`)
    - Updated ecosystem links in `Footer.tsx`, environment initialization in `@xernerx/cli`, and added `manifest.ts`, `opengraph-image.tsx`, `robots.ts`, and `sitemap.ts` to `store` and `www`.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.6.0
    - @xernerx/components@0.7.1
    - @xernerx/providers@0.9.1
    - @xernerx/feedback@0.0.38
    - @xernerx/ui@0.5.1

## 1.4.0

### Minor Changes

- ### Public User Profiles & Cross-Suite Entity Parity (`app`, `account`, `admin`, `@xernerx/components`)
    - **Public User Profile Route (`apps/app/src/app/users/[id]/page.tsx`, `apps/app/src/components/users/Header.tsx`, `apps/app/src/components/users/Profile.tsx`)**: Added public user profile pages at `/users/[id]` displaying Discord avatar, banner, clan badge, live status dot, Markdown bio (`info`), level & daily streak stats, published bots, and organizations, with `public` / `limited` / `private` privacy gating and dynamic sidebar navigation.
    - **Copy ID & Share / View Public Profile Parity (`app`, `account`, `admin`, `@xernerx/components`)**:
        - Added one-click **Copy ID** pills and **Share Profile** / **View Public Profile** buttons across **Organizations** (`organization/Header.tsx`, `OrgWorkspaceHeader.tsx`, `OrgMembersTab.tsx`), **Bots** (`bots/Header.tsx`, `portal/bots/[id]/page.tsx`), **Servers** (`servers/[id]/page.tsx`, `dashboard/page.tsx`), and **Users** (`users/Header.tsx`, `PersonalWorkspace.tsx`, `Account.tsx`, `Profile.tsx`, `SidebarUser.tsx`, `UserProfilePreview.tsx`).
        - Linked developer/owner badges on `/bots/[id]` and member rows in `OrgMembersTab.tsx` directly to `/users/[id]`.

    ### Global Command Palette, Search Standardization & Support Popover (`@xernerx/providers`, `@xernerx/components`, `info`, `docs`, `store`)
    - **Global Command Palette (`packages/providers/src/CommandPaletteModal.tsx`, `ShortcutsProvider.tsx`)**: Added a suite-wide Command Palette (`Ctrl + K` when no page search is mounted, or `Ctrl + Shift + K` anywhere) indexing current page sidebar views, quick actions (theme toggle, sidebar toggle, App Drawer, URL Omnibar, copy URL, shortcuts), suite applications, account/developer settings, support routes, and staff admin tools.
    - **Standardized `Ctrl + K` Search Inputs (`@xernerx/ui`, `account`, `admin`, `app`, `docs`, `info`, `store`, `www`)**: Upgraded all page-level search bars across `account` (`Media`, `Tokens`), `admin` (`Announcements`, `Media`, `Tokens`), `app` (`ExploreSearchBar`, `bots`, `servers`, `Commands`), `docs`, `info` (`Support Hub`, `Issues`, `Suggestions`, `Roadmap`, `Changelog`, `FAQ`), `store`, and `www` (`/invites`) to use `<Input variant="search" shortcut={true} />`.
    - **Support Quick-Links Popover (`packages/providers/src/SupportProvider.tsx`)**: Upgraded the floating support button to open a quick-links popover (**Support Hub**, **Report an Issue**, **Suggest a Feature**, **FAQ**, and **Join Support Server**) with a localized Discord server auto-join confirmation modal.
    - **Notifications Drawer & Header Omnibar (`packages/components/src/cards/SidebarNotifications.tsx`, `Header.tsx`, `Sidebar.tsx`)**: Added **All / Unread** filter tabs and localized relative timestamps to the Notifications drawer, auto-focus/select when opening the URL Omnibar (`Ctrl + .`), and automatic mobile sidebar closing on navigation.

    ### Discovery Controls, Interactive Bot Commands & Deep-Linking (`app`, `account`, `admin`, `info`, `www`)
    - **Explore Bots & Servers Discovery (`apps/app/src/app/page.tsx`, `bots/page.tsx`, `servers/page.tsx`)**: Added a hero search bar on `/`, sort selectors (**Most Popular**, **Most Users**, **Most Upvotes**, **Top Rated**, **Newest**), a **Verified Only** toggle, interactive tag filter pills, and clickable tag pills on Bot cards.
    - **Interactive Bot Commands & Review Sorting (`apps/app/src/components/bots/Commands.tsx`, `Reviews.tsx`)**: Added `Ctrl + K` command search, category filter pills, one-click **Copy `/command`** with toast feedback, and review sorting (**Newest**, **Highest Rated**, **Lowest Rated**).
    - **URL Query Deep-Linking & Tab Persistence (`apps/account/src/app/page.tsx`, `apps/admin/src/app/page.tsx`, `apps/app/src/app/portal/page.tsx`, `apps/app/src/app/organization/[id]/page.tsx`)**: Synchronized active sidebar views and tabs with `?tab=` and `?org=` URL parameters across Account, Admin Panel, and the Developer Portal, and added **Write / Preview** Markdown toggles to Server Dashboard General (`General.tsx`) and Account Profile (`Profile.tsx`).
    - **API Tokens & Official Invites Enhancements (`account`, `admin`, `www`)**: Added status filter pills (**All**, **Active**, **Inactive**, **Suspended**, **Pending**) and exterior **Copy Token ID** badges to Account and Admin Tokens (`Tokens.tsx`, `TokenCard.tsx`), and added `Ctrl + K` search plus one-click **Copy Invite Link** / **Open Invite** actions to `/invites` (`www`) and Admin Invites (`Invites.tsx`).

    ### Type-to-Confirm Destructive Action Protection (`@xernerx/ui`, `app`, `account`, `admin`)
    - **Enhanced `<Confirm />` Modal (`packages/ui/src/Confirm.tsx`)**: Added `confirmKeyword` type-to-confirm validation (`<Input />` matching + `Enter` submission) and a `'warning'` (orange) variant.
    - **Reset Data & Delete Entity Modals (`Account.tsx`, `OrgSettingsTab.tsx`, `bot/SettingsTab.tsx`, `dashboard/Settings.tsx`, `portal/page.tsx`, `portal/bots/[id]/page.tsx`, `dashboard/page.tsx`)**: Protected all **Reset Data** actions with `confirmKeyword="RESET"` (`variant="warning"`) and all **Delete** actions (Account, Organization, Bot, Server) with entity-name `confirmKeyword` verification.
    - **Custom Modal Prompts in Admin Store (`StoreCategoriesTab.tsx`, `StoreItemsTab.tsx`)**: Replaced native browser `prompt()` dialogs with `<Modal />` + `<Input />` components.

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.9.0
    - @xernerx/ui@0.5.0
    - @xernerx/components@0.7.0
    - @xernerx/lib@1.5.4
    - @xernerx/feedback@0.0.37

## 1.3.7

### Patch Changes

- Streamlined UI
- Updated dependencies
    - @xernerx/providers@0.8.0
    - @xernerx/components@0.6.5
    - @xernerx/lib@1.5.3
    - @xernerx/ui@0.4.3
    - @xernerx/feedback@0.0.36

## 1.3.6

### Patch Changes

- Streamlined UI
- Updated dependencies
    - @xernerx/providers@0.7.0
    - @xernerx/components@0.6.4
    - @xernerx/lib@1.5.2
    - @xernerx/ui@0.4.2
    - @xernerx/feedback@0.0.35

## 1.3.5

### Patch Changes

- Fixed type error

## 1.3.4

### Patch Changes

- Streamlined shortcuts and added new shortcuts.
- Updated dependencies
    - @xernerx/components@0.6.3
    - @xernerx/lib@1.5.1
    - @xernerx/providers@0.6.6
    - @xernerx/feedback@0.0.34
    - @xernerx/ui@0.4.1

## 1.3.3

### Patch Changes

- Fixed cors policy issues

## 1.3.2

### Patch Changes

- ### Public Profile Widgets & Embeds (`api`, `app`, `@xernerx/lib`, `@xernerx/ui`, `docs`)
    - **Profile Schema & Persistence (`@xernerx/lib`, `api`)**: Added `widgets: { type: Boolean, default: false }` to the Bot, Organization, and Guild Mongoose schemas (`packages/lib/src/models/xernerx/*/Profile.ts`) and wired `GET`/`PATCH` persistence across `/secure/bots/[id]/profile`, `/secure/organizations/[id]`, and `/secure/guilds/[id]`.
    - **Public Core Widget Renderer (`apps/api/src/lib/widgetRenderer.ts`, `/core/{bots,organizations,guilds}/[id]`)**: Added public widget endpoints gated on `widgets: true` that dynamically render profile status cards as `image/svg+xml` (`?type=svg`), `image/png` via `next/og` `ImageResponse` (`?type=png` / `?type=image` and automatic `Discordbot`/`Twitterbot`/`Slackbot` unfurling), `text/html` (`?type=iframe`), or `application/json`.
    - **Settings Toggle & Tabbed Embed Modal (`apps/app/src/components/WidgetSettingsCard.tsx`)**: Added the **Public Embed Widget** settings card with a `Toggle` (`@xernerx/ui`) and an **Embed Code** modal across Bot Settings (`SettingsTab.tsx`), Organization Settings (`OrgSettingsTab.tsx`), and Server Settings (`Settings.tsx`).
    - **Enhanced `CodeBlock` Component (`@xernerx/ui`)**: Added a built-in one-click **Copy** button and syntax highlighting/icons for `html`, `iframe`, `markdown`, `svg`, and `url` tabs (`HTML Iframe`, `Markdown`, `HTML Image`, `Image`, `SVG Image`, `Raw SVG`, and `Direct JSON Endpoint`).
    - **Dynamic OpenGraph Metadata (`apps/app`)**: Added dynamic server-rendered OpenGraph and Twitter metadata layouts for `/bots/[id]`, `/organization/[id]`, and `/servers/[id]`.

    ### Admin Overview, Service Telemetry & Lighthouse Audits (`admin`, `api`)
    - **Admin Overview Dashboard (`apps/admin/src/components/Overview.tsx`, `OverviewSummaryCards.tsx`)**: Added a dedicated **Overview** tab displaying service health, Production/Canary/Dev version sync status, live latency pings, Seobility score badges, on-demand Chrome Lighthouse audits (SEO, Performance, Accessibility, Best Practices), and issue resolution metrics.
    - **Secure Versions & Lighthouse Endpoints (`apps/api/src/app/secure/core/versions`, `/secure/core/lighthouse`, `suiteVersions.ts`)**: Moved suite version discovery under `/secure/core/versions` with server-side latency measurement and added an on-demand Google PageSpeed Insights / Lighthouse audit proxy at `/secure/core/lighthouse`.

    ### Marketing Showcase & Desktop Highlights (`www`)
    - **Expanded Landing Page Content (`HomeClient.tsx`, `Timeline.tsx`, `PlatformHighlights.tsx`)**: Added `PlatformHighlights` and `LandingCta` sections, expanded ecosystem and bot overview copy (Virtue, Metamorphosis, Zodiac), emphasized the open HTTP JSON REST API, filtered internal `@xernerx/websocket` from public package cards, and hid the `/download` CTA when running inside the Electron desktop client (`usePlatform().type === 'application'`).
    - **Desktop Client Feature Showcase (`apps/www/src/app/download/page.tsx`)**: Added a 3-card feature highlight grid detailing the native Electron desktop experience on `/download`.

    ### SEO, Accessibility & Localization (`@xernerx/components`, `@xernerx/lib`, `account`, `cdn`, `docs`, `info`, `store`, `www`)
    - **SSR Metadata & Streaming Cleanup (`next.config.ts`, `layout.tsx`, `loading.tsx`)**: Removed root `app/loading.tsx` boundaries that caused Next.js to stream blank loading skeletons to SEO crawlers, configured `htmlLimitedBots: /.*/` across public apps, and added `robots: { index: false, follow: false }` to `admin`, `api`, and `cdn`.
    - **Localized Route Metadata (`getMetaDictionary`, `layout.tsx`)**: Added server-side `getMetaDictionary()` in `@xernerx/lib` with distinct, localized page titles and descriptions (140–160 characters) across all routes in `www`, `app`, `docs`, `info`, `account`, and `store`.
    - **Semantic Heading & Header Accessibility (`Footer.tsx`, `Header.tsx`)**: Replaced `<h2>` footer column headings with semantic `<p>` labels so page `<h1>`/`<h2>` hierarchy remains clean for SEO crawlers, and added explicit `aria-label` attributes to icon-only header controls.

- Updated dependencies
    - @xernerx/lib@1.5.0
    - @xernerx/ui@0.4.0
    - @xernerx/components@0.6.2
    - @xernerx/providers@0.6.5
    - @xernerx/feedback@0.0.33

## 1.3.1

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.6.1

## 1.3.0

### Minor Changes

- ### Marketing Showcase (`www`)
    - **Canonical Metadata & OpenGraph (`layout.tsx`)**: Updated `metadataBase` and `openGraph.url` from `https://xernerx.com` to `https://www.xernerx.com`, added `alternates.canonical: './'`, and enabled `<AppLayout enableAds>`.
    - **SSR-Visible Animations & Static Doc Cards (`page.tsx`, `Timeline.tsx`)**: Set Framer Motion `initial` states to `opacity: 1` so SSR HTML is immediately visible to crawlers inside `#main-scroll-container`, and seeded the Developer Software carousel with static links to `docs.xernerx.com` (`/api`, `/packages`, `/websocket`, `/cdn`).
    - **Changelog Route Redirect (`next.config.ts`)**: Migrated `/changelog` to `info.xernerx.com/changelog` and added a permanent redirect on `www`.

    ### Info & Support Hub (`info`)
    - **Changelog Hub Migration (`/changelog`)**: Relocated `/changelog` (`ChangelogClient.tsx`, `SidebarTrigger.tsx`) from `www` to `apps/info`, added a Changelog card to the `info` landing page, and updated workspace documentation.
    - **Roadmap Component Extraction (`src/components/roadmap/`)**: Extracted `RoadmapDetailModal`, `RoadmapFormModal`, and `RoadmapTypes` into `src/components/roadmap/` and cleaned up unused legacy files (`Timeline.tsx` and default SVG assets).
    - **Canonical Metadata & AdSense (`layout.tsx`)**: Added `alternates.canonical: './'` and enabled `<AppLayout enableAds>`.

    ### Developer Documentation (`docs`) & User Dashboard (`app`)
    - **Canonical Metadata & AdSense (`layout.tsx`, `docs/src/app/page.tsx`)**: Configured `alternates.canonical: './'` and `<AppLayout enableAds>` across `docs` and `app`, and updated `docs` home page motion blocks to render with `opacity: 1` on SSR.
    - **Proxy Canonical Redirect Guard (`apps/app/src/proxy.ts`)**: Skipped Next.js prefetch requests and verified hostname/protocol mismatches before redirecting.

    ### Shared Application Shell (`@xernerx/components`)
    - **Selective AdSense Script Injection (`AppLayout.tsx`)**: Added an `enableAds` prop so the Google AdSense script loads only on content-rich public apps (`www`, `docs`, `info`, `app`) and stays excluded from `account`, `admin`, `store`, `cdn`, and `api`.
    - **Header Store Icon (`Header.tsx`)**: Added an icon-only Store link (`https://store.xernerx.com`) with native hover tooltip (`components.header.store`) to the global header.
    - **Footer Canonical Links & SSR Visibility (`Footer.tsx`)**: Updated `www` footer links to `https://www.xernerx.com/...`, pointed Changelog to `https://info.xernerx.com/changelog`, preserved SSR `href` attributes prior to client mount, and set `initial={{ opacity: 1, y: 0 }}`.
    - **Version Tracker Reload Guard (`VersionTracker.tsx`)**: Validated `/api/version` payloads and added a `sessionStorage` cooldown before triggering hard reloads.

    ### Shared Libraries, Next.js Config & Static Assets (`@xernerx/lib`, `packages/public`, `account`, `admin`, `api`, `cdn`, `store`, `desktop`)
    - **Turbopack Dev Cache Fix (`packages/lib/next.config.ts`)**: Disabled `experimental.turbopackFileSystemCacheForDev` to resolve a Next.js `16.4.1` Turbopack filesystem cache mismatch that caused infinite HMR `restart` reload loops in browser and Electron (`desktop`) dev sessions.
    - **Cross-Domain Sitemap (`packages/public/sitemap.xml`)**: Added a unified cross-domain `sitemap.xml` covering `www`, `app`, `store`, `docs`, and `info`, synced across all app `public/` directories.
    - **Canonical Metadata & Localization (`account`, `admin`, `api`, `cdn`, `store`, `en-GB.json`)**: Standardized `metadataBase` and `alternates.canonical: './'` across all remaining app layouts and added `components.header.store` localization keys.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.6.0
    - @xernerx/lib@1.4.1
    - @xernerx/providers@0.6.4
    - @xernerx/feedback@0.0.32
    - @xernerx/ui@0.3.15

## 1.2.0

### Minor Changes

- ### Info & Support (`info`)
    - **Issues Module Rename & Route Migration**: Renamed the Bugs / Bugtracker module to **Issues**, added `/issues` (`apps/info/src/app/issues/page.tsx`), and configured `/bugs` to redirect to `/issues`.
    - **Unified Create & Search Card Flow**: Consolidated the Suggestions and Issues pages into a single centered view that transitions between the search + list view and the creation form card, returning to the list upon submission or cancellation.
    - **Login Redirect & Draft Persistence**: Added a direct Login button when unauthenticated users search for a new suggestion or issue, persisting their typed draft in `sessionStorage` and redirecting back to the originating page after authentication.
    - **Search Prompt & Product Validation**: Added helper text beneath the search input (`Start typing for a new suggestion/issue`) and enforced required product selection with toast feedback.
    - **Canary vs. Production Fix Badges**: Added live release channel badges (`Live (Prod & Canary)`, `Canary Only`, `Queued`) with tooltips on `/roadmap` and `/issues` for resolved Suite issues.

    ### Backend API (`api`)
    - **Suite Version Discovery & Canary/Prod Comparison (`GET /info/versions`)**: Added `suiteVersions.ts` and `/info/versions` to read available versions from each of the 9 Suite apps' `package.json` and `CHANGELOG.md` files and compare against live Canary and Production `/api/version` endpoints.
    - **Version-Aware Issue Resolution (`GET /info/issues`, `GET /secure/core/issues`)**: Enriched resolved Suite issues with live `releaseStatus` (`production`, `canary`, `pending`) and kept Canary-only fixes visible on `/issues` until deployed to Production.
    - **Default `App` Product (`GET /info/roadmap/products`)**: Guaranteed `'App'` is always included in the product list.
    - **Organization Bot Webhook Authorization (`POST /secure/bots/[id]/hooks`)**: Allowed organization owners and members to update bot webhooks alongside direct bot owners.

    ### Admin Portal (`admin`)
    - **Resolve App Issue Version Modal (`Issues.tsx`)**: Added a resolution modal for Suite (`App`) issues to select the target subdomain/service (`app`, `www`, `account`, `store`, `info`, `docs`, `admin`, `api`, `cdn`) and fixed release version (defaulting to the latest version and displaying live Canary & Production versions), plus clickable status badges on resolved issues.
    - **Login Callback Preservation (`ReturnPage.tsx`)**: Updated login redirects to pass `callbackUrl`.

    ### Portal & Dashboard (`app`)
    - **Organization Bots Visibility (`/portal`, `/portal/bots/[id]`)**: Updated the Portal overview, `OrgBotsTab`, and bot management sidebar to fetch and display all bots belonging to an organization (`?organization=<orgId>`) rather than only bots directly owned by the logged-in user.
    - **Login Callback Preservation**: Updated `/dashboard` and `/portal` login redirects to preserve `callbackUrl`.

    ### Shared Packages & Cross-App Auth (`@xernerx/lib`, `@xernerx/ui`, `@xernerx/components`, `account`, `cdn`, `store`, `www`)
    - **`@xernerx/lib`**: Added `resolvedApp` and `resolvedVersion` fields to the `Issue` Mongoose schema, updated `auth.ts` `redirect` callback to allow cross-subdomain `*.xernerx.com` and localhost `callbackUrl` redirects, and added English (`en-GB.json`) and Dutch (`nl.json`) translations.
    - **`@xernerx/ui`**: Added `required` prop support to `Selector.tsx`.
    - **`@xernerx/components`**: Updated `Footer.tsx` to link to `/issues` and `Sidebar.tsx` to include `callbackUrl` when redirecting to login.
    - **`account`, `cdn`, `store`, `www`**: Updated login flows and unauthenticated prompts to preserve and redirect back to `callbackUrl`.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.4.0
    - @xernerx/ui@0.3.14
    - @xernerx/components@0.5.1
    - @xernerx/providers@0.6.3
    - @xernerx/feedback@0.0.31

## 1.1.0

### Minor Changes

- ### 🚀 Minor Features

    #### Main Organization Product Autocomplete & Discord Bot Referencing (`admin`, `api`, `info`, `@xernerx/lib`)
    - **Main Organization Setting (`apps/admin`):** Added a **Main Organization** (`main_org_id`) selector to the Admin Settings page (`Settings.tsx`) populated from `/secure/organizations`.
    - **Main Organization Product Autocomplete (`apps/api`):** Updated `GET /info/roadmap/products` to read `main_org_id`, query all bots belonging to the main organization (`models.bots.Bot`), resolve their live Discord names and avatars, and return both the combined product names (`data`) and bot metadata (`bots`).
    - **Bot Reference by ID & Live Discord Rendering (`@xernerx/lib`, `apps/admin`, `apps/info`):**
        - Added optional `botId` field to `core.RoadmapItem`, `core.Issue`, and `core.Suggestion` Mongoose schemas.
        - Added **Bot ID** inputs with Main Organization bot autocomplete and live Discord profile preview badges (via `GET /core/users/[id]/discord`) to Admin `Roadmap.tsx` and `Issues.tsx`, and updated `Suggestions.tsx` to carry `botId` over when moving a suggestion to the Roadmap.
        - Updated `info.xernerx.com` (`roadmap/page.tsx`, `bugs/page.tsx`, and `suggestions/page.tsx`) as well as Admin `Roadmap.tsx`, `Issues.tsx`, and `Suggestions.tsx` to resolve referenced bots directly from Discord (`/core/users/[id]/discord`) and render the bot's Discord avatar and name on product selector dropdowns, roadmap timeline cards, mobile stacks, known issues, bug reports, and suggestions.

    #### Support Category in Shared Footer (`@xernerx/components`, `@xernerx/lib`)
    - **Dedicated Support Column (`packages/components/src/Footer.tsx`):** Expanded the footer grid to 4 columns and added a **Support** category linking to the Help Center (`info.xernerx.com`), Issues (`/bugs`), Suggestions (`/suggestions`), Roadmap (`/roadmap`), FAQ (`/faq`), and Contact (`xernerx.com/contact`).
    - **Localization (`@xernerx/lib`):** Added `en-GB` and `nl` translations for the Support footer section, Main Organization settings, and Roadmap/Issues Bot ID fields.

    ***

    ### 🛠️ Patches & Bug Fixes (`@xernerx/lib`, `@xernerx/providers`, `@xernerx/feedback`, `admin`, `api`)
    - **Shared Single-Pool MongoDB Connection Architecture (`@xernerx/lib`):**
        - Refactored `packages/lib/src/database.ts` to share a single underlying `MongoClient` (`maxPoolSize: 3`, `minPoolSize: 0`, `maxIdleTimeMS: 15000`, `serverSelectionTimeoutMS: 5000`) across all logical databases (`xernerx`, `virtue`, `global`) via `rootConn.useDb(name, { useCache: true })`, and automatically close legacy leaked connections cached on `global.mongoose` during HMR.
    - **Graceful Database Error Handling & Admin Sidebar Preservation (`apps/admin`, `@xernerx/providers`, `@xernerx/feedback`):**
        - Updated `apps/admin/src/app/layout.tsx` and `apps/admin/src/app/page.tsx` to catch database connection/timeout errors (`profiles.findOne()`, `roles.find()`) and render an inline Database Connection Error alert card inside the dashboard while keeping the Admin sidebar and navigation shell accessible.
        - Updated `useDictionary()` in `packages/providers/src/DictionaryProvider.tsx` to return a safe fallback translator instead of throwing when rendered inside root `global-error.tsx` boundaries.
    - **Defensive Array Normalization & Settings Fallback (`apps/admin`, `apps/api`, `@xernerx/providers`):**
        - Updated `GET /secure/core/settings/[id]` to return `{ id, value: null }` (`200 OK`) instead of `404` when a setting has not yet been initialized.
        - Added defensive `Array.isArray` normalization across Admin components (`Settings`, `Announcements`, `ApplicationConfigs`, `ApplicationReviews`, `Invites`, `Issues`, `ReturnPage`, `Roadmap`, `Roles`, `StoreManagement`, `Suggestions`, `Tokens`, `Translations`, `Users`) and providers (`NotificationProvider`, `PermissionProvider`, `ShortcutsProvider`) to prevent `.map is not a function` runtime errors when API routes return error payloads.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.5.0
    - @xernerx/lib@1.3.0
    - @xernerx/providers@0.6.2
    - @xernerx/feedback@0.0.30
    - @xernerx/ui@0.3.13

## 1.0.6

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.1
    - @xernerx/components@0.4.1
    - @xernerx/feedback@0.0.29
    - @xernerx/ui@0.3.12

## 1.0.5

### Patch Changes

- ### 🚀 Major & Minor Features

    #### Dedicated Storefront Application (`store`, `account` [BREAKING], `api`, `admin`, `@xernerx/lib`)
    - **Extracted `apps/store` (`store.xernerx.com`, port `4008`) [BREAKING for `account`]:** Migrated `/store` and `/store/[id]/cancel` out of `apps/account` into a dedicated Next.js storefront application (`apps/store`) with `DynamicCategoryView`, `DynamicFeaturedCard`, `DynamicItemCard`, and subscription cancellation routes.
    - **Centralized Store Backend API (`apps/api`):** Moved all Stripe store endpoints out of frontend apps into `apps/api/src/app/secure/store/*` (`catalog`, `categories`, `categories/[id]`, `items`, `items/[id]`, `checkout`, `[id]/product`, `[id]/cancel`).
    - **Database-Driven Store Catalog (`@xernerx/lib`, `apps/admin`):**
        - Added `store.Category` and `store.Item` Mongoose models to `@xernerx/lib` (`registry.ts`) and added the `manageStore` RBAC permission (`permissions.ts`).
        - Built the `StoreManagement` admin console (`StoreCategoriesTab`, `StoreItemsTab`, `CategoryModal`, `ItemModal`) in `apps/admin` to manage store categories, Stripe-linked products/prices, feature lists, badges, and discounts.

    #### Cookie Policy & Consent Versioning (`www`, `@xernerx/providers`, `@xernerx/components`, `@xernerx/cli`)
    - **Dedicated Cookie Policy Page (`apps/www`):** Added `/cookies` (`apps/www/src/app/cookies/page.tsx`) and updated `/privacy` with expanded data sharing, rights, and children's privacy sections.
    - **Consent Versioning & Re-Prompting (`@xernerx/providers`, `@xernerx/components`):** Added `COOKIES_VERSION` timestamp validation (`agreedAt`), `isPromptOpen`, `openPrompt()`, and `closePrompt()` to `CookieProvider`, and added a Cookie Policy link and interactive "Cookie Preferences" trigger to `Footer` and `CookiePrompt`.
    - **Automated Policy Version Bumping (`@xernerx/cli`):** Updated `suite commit` (`commands/commit.ts`) to detect changes to `/cookies` or cookie dictionary keys and prompt to bump `COOKIES_VERSION` alongside `TERMS_VERSION` and `PRIVACY_VERSION`.

    #### Hierarchical `AGENTS.md` System & Automated CLI Architecture Linter (`@xernerx/cli`, all workspaces)
    - **Per-Workspace `AGENTS.md` Guidelines:** Added 24 hierarchical `AGENTS.md` files (root `AGENTS.md`, `apps/AGENTS.md`, and individual `AGENTS.md` files across every `apps/*`, `packages/*`, `services/*`, `clients/*`, and `.xernerx/*` workspace).
    - **Automated Architecture & i18n Linter (`@xernerx/cli`):** Upgraded `pnpm suite lint` (`commands/lint.ts`) with `runSuiteArchitectureLint()` to automatically enforce:
        1. **500-Line Inline Code Cap** across all `.ts`/`.tsx` files in `apps/*/src`.
        2. **Strict `src/components/` Placement** (no non-route files inside `apps/*/src/app`).
        3. **Strict 3-Route Local `/api` Rule** in frontend apps (`/api/auth/[...nextauth]`, `/api/changelog`, `/api/version`).
        4. **`DictionaryProvider` `t(path, variables?)` Signature Validation** (blocking invalid 2nd/3rd fallback string arguments).
        5. **100% `en-GB.json` Key Resolution** across all static `t('...')` calls in `apps/*` and `packages/*`.

    #### Provider & Localization Expansion (`@xernerx/lib`, `@xernerx/providers`)
    - **Complete Suite Localization (`@xernerx/lib`):** Added 900+ localization keys to `packages/lib/src/dictionaries/en-GB.json` (and synced locale dictionaries + `i18n.config.ts`) so every component and page across `apps/*` and `packages/components` consumes `useDictionary()`.
    - **`UserProvider` & `EnvironmentProvider` Improvements (`@xernerx/providers`):**
        - Optimized `UserProvider` to fetch Discord and Xernerx user profiles in parallel (`Promise.allSettled`) with in-flight request deduplication (`inFlightRef`) and `mutate()` support.
        - Updated `EnvironmentProvider` with `store.xernerx.com` (`4008`) port mapping and improved local hostname/IP resolution.

    ***

    ### 🛠️ Patches, Refactors & Bug Fixes (`app`, `admin`, `account`, `docs`, `cdn`, `desktop`, `info`, `@xernerx/ui`, `@xernerx/feedback`, `@xernerx/styles`, `bot`, `websocket`)
    - **500-Line Component Decomposition:**
        - **`apps/account`:** Decomposed `Tokens.tsx` (885 $\rightarrow$ 134 lines) into `src/components/tokens/*` (`TokenCard`, `BotProfilePreview`, `AsyncUserMultiSelector`, `CreateTokenModal`, `ManageTokenModal`).
        - **`apps/admin`:** Decomposed `Announcements.tsx`, `ApplicationConfigs.tsx`, `Roles.tsx`, `Tokens.tsx`, `Translations.tsx`, and `Users.tsx` into modular sub-components under `src/components/{announcements,applications,roles,tokens,translations,users}/*`.
        - **`apps/app`:** Decomposed `dashboard/page.tsx`, `portal/page.tsx`, `portal/bots/[id]/page.tsx`, `dashboard/General.tsx`, and `portal/Bots.tsx` into focused sub-components under `src/components/{dashboard,portal}/*`, and removed unused legacy `src/components/{account,admin}/*` directories.
        - **`apps/docs`:** Decomposed `V1Endpoints.tsx` and `websocket/page.tsx` into modular sub-components under `src/components/{api,websocket}/*`.
    - **Strict `src/components/` & `src/lib/` Relocation:**
        - Moved co-located route components out of `src/app/` into `src/components/` across `apps/app` (`bots/*`, `organization/*`), `apps/docs` (`api/*`, `packages/*`), and `apps/www` (`changelog/*`).
        - Moved non-route sync helpers out of `apps/api/src/app/secure/core/**` into `apps/api/src/lib/sync/{settings,users}.ts`.
    - **3-Route Local `/api` Cleanup & Desktop Health Check (`apps/app`, `clients/desktop`):**
        - Updated `clients/desktop/src/main.ts` to ping `${WEB_URL}/api/version` instead of `/api/status` and removed `apps/app/src/app/api/status/route.ts`.
    - **CDN Viewer Localization (`apps/cdn`):**
        - Extracted `UnauthorizedView` and `MediaFileDownload` into `apps/cdn/src/components/` and localized `MediaActions` tooltips.
    - **Dependencies & Tooling Alignment:**
        - Upgraded Next.js (`^16.4.1`), React (`^19.3.1`), Mongoose (`^9.11.2`), Framer Motion (`^14.2.0`), Lucide React (`^1.57.0`), Electron (`44.7.2`), and TypeScript (`^6.0.3`) across workspaces.

- Updated dependencies
    - @xernerx/components@0.4.0
    - @xernerx/lib@1.2.0
    - @xernerx/providers@0.6.0
    - @xernerx/feedback@0.0.28
    - @xernerx/ui@0.3.11

## 1.0.4

### Patch Changes

- ### 🚀 Major & Minor Features

    #### Dedicated Storefront Application (`store`, `account` [BREAKING], `api`, `admin`, `@xernerx/lib`)
    - **Extracted `apps/store` (`store.xernerx.com`, port `4008`) [BREAKING for `account`]:** Migrated `/store` and `/store/[id]/cancel` out of `apps/account` into a dedicated Next.js storefront application (`apps/store`) with `DynamicCategoryView`, `DynamicFeaturedCard`, `DynamicItemCard`, and subscription cancellation routes.
    - **Centralized Store Backend API (`apps/api`):** Moved all Stripe store endpoints out of frontend apps into `apps/api/src/app/secure/store/*` (`catalog`, `categories`, `categories/[id]`, `items`, `items/[id]`, `checkout`, `[id]/product`, `[id]/cancel`).
    - **Database-Driven Store Catalog (`@xernerx/lib`, `apps/admin`):**
        - Added `store.Category` and `store.Item` Mongoose models to `@xernerx/lib` (`registry.ts`) and added the `manageStore` RBAC permission (`permissions.ts`).
        - Built the `StoreManagement` admin console (`StoreCategoriesTab`, `StoreItemsTab`, `CategoryModal`, `ItemModal`) in `apps/admin` to manage store categories, Stripe-linked products/prices, feature lists, badges, and discounts.

    #### Cookie Policy & Consent Versioning (`www`, `@xernerx/providers`, `@xernerx/components`, `@xernerx/cli`)
    - **Dedicated Cookie Policy Page (`apps/www`):** Added `/cookies` (`apps/www/src/app/cookies/page.tsx`) and updated `/privacy` with expanded data sharing, rights, and children's privacy sections.
    - **Consent Versioning & Re-Prompting (`@xernerx/providers`, `@xernerx/components`):** Added `COOKIES_VERSION` timestamp validation (`agreedAt`), `isPromptOpen`, `openPrompt()`, and `closePrompt()` to `CookieProvider`, and added a Cookie Policy link and interactive "Cookie Preferences" trigger to `Footer` and `CookiePrompt`.
    - **Automated Policy Version Bumping (`@xernerx/cli`):** Updated `suite commit` (`commands/commit.ts`) to detect changes to `/cookies` or cookie dictionary keys and prompt to bump `COOKIES_VERSION` alongside `TERMS_VERSION` and `PRIVACY_VERSION`.

    #### Hierarchical `AGENTS.md` System & Automated CLI Architecture Linter (`@xernerx/cli`, all workspaces)
    - **Per-Workspace `AGENTS.md` Guidelines:** Added 24 hierarchical `AGENTS.md` files (root `AGENTS.md`, `apps/AGENTS.md`, and individual `AGENTS.md` files across every `apps/*`, `packages/*`, `services/*`, `clients/*`, and `.xernerx/*` workspace).
    - **Automated Architecture & i18n Linter (`@xernerx/cli`):** Upgraded `pnpm suite lint` (`commands/lint.ts`) with `runSuiteArchitectureLint()` to automatically enforce:
        1. **500-Line Inline Code Cap** across all `.ts`/`.tsx` files in `apps/*/src`.
        2. **Strict `src/components/` Placement** (no non-route files inside `apps/*/src/app`).
        3. **Strict 3-Route Local `/api` Rule** in frontend apps (`/api/auth/[...nextauth]`, `/api/changelog`, `/api/version`).
        4. **`DictionaryProvider` `t(path, variables?)` Signature Validation** (blocking invalid 2nd/3rd fallback string arguments).
        5. **100% `en-GB.json` Key Resolution** across all static `t('...')` calls in `apps/*` and `packages/*`.

    #### Provider & Localization Expansion (`@xernerx/lib`, `@xernerx/providers`)
    - **Complete Suite Localization (`@xernerx/lib`):** Added 900+ localization keys to `packages/lib/src/dictionaries/en-GB.json` (and synced locale dictionaries + `i18n.config.ts`) so every component and page across `apps/*` and `packages/components` consumes `useDictionary()`.
    - **`UserProvider` & `EnvironmentProvider` Improvements (`@xernerx/providers`):**
        - Optimized `UserProvider` to fetch Discord and Xernerx user profiles in parallel (`Promise.allSettled`) with in-flight request deduplication (`inFlightRef`) and `mutate()` support.
        - Updated `EnvironmentProvider` with `store.xernerx.com` (`4008`) port mapping and improved local hostname/IP resolution.

    ***

    ### 🛠️ Patches, Refactors & Bug Fixes (`app`, `admin`, `account`, `docs`, `cdn`, `desktop`, `info`, `@xernerx/ui`, `@xernerx/feedback`, `@xernerx/styles`, `bot`, `websocket`)
    - **500-Line Component Decomposition:**
        - **`apps/account`:** Decomposed `Tokens.tsx` (885 $\rightarrow$ 134 lines) into `src/components/tokens/*` (`TokenCard`, `BotProfilePreview`, `AsyncUserMultiSelector`, `CreateTokenModal`, `ManageTokenModal`).
        - **`apps/admin`:** Decomposed `Announcements.tsx`, `ApplicationConfigs.tsx`, `Roles.tsx`, `Tokens.tsx`, `Translations.tsx`, and `Users.tsx` into modular sub-components under `src/components/{announcements,applications,roles,tokens,translations,users}/*`.
        - **`apps/app`:** Decomposed `dashboard/page.tsx`, `portal/page.tsx`, `portal/bots/[id]/page.tsx`, `dashboard/General.tsx`, and `portal/Bots.tsx` into focused sub-components under `src/components/{dashboard,portal}/*`, and removed unused legacy `src/components/{account,admin}/*` directories.
        - **`apps/docs`:** Decomposed `V1Endpoints.tsx` and `websocket/page.tsx` into modular sub-components under `src/components/{api,websocket}/*`.
    - **Strict `src/components/` & `src/lib/` Relocation:**
        - Moved co-located route components out of `src/app/` into `src/components/` across `apps/app` (`bots/*`, `organization/*`), `apps/docs` (`api/*`, `packages/*`), and `apps/www` (`changelog/*`).
        - Moved non-route sync helpers out of `apps/api/src/app/secure/core/**` into `apps/api/src/lib/sync/{settings,users}.ts`.
    - **3-Route Local `/api` Cleanup & Desktop Health Check (`apps/app`, `clients/desktop`):**
        - Updated `clients/desktop/src/main.ts` to ping `${WEB_URL}/api/version` instead of `/api/status` and removed `apps/app/src/app/api/status/route.ts`.
    - **CDN Viewer Localization (`apps/cdn`):**
        - Extracted `UnauthorizedView` and `MediaFileDownload` into `apps/cdn/src/components/` and localized `MediaActions` tooltips.
    - **Dependencies & Tooling Alignment:**
        - Upgraded Next.js (`^16.4.1`), React (`^19.3.1`), Mongoose (`^9.11.2`), Framer Motion (`^14.2.0`), Lucide React (`^1.57.0`), Electron (`44.7.2`), and TypeScript (`^6.0.3`) across workspaces.

- Updated dependencies
    - @xernerx/components@0.3.0
    - @xernerx/lib@1.1.0
    - @xernerx/providers@0.5.0
    - @xernerx/feedback@0.0.27
    - @xernerx/ui@0.3.10

## 1.0.3

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.0.0
    - @xernerx/components@0.2.25
    - @xernerx/providers@0.4.1
    - @xernerx/feedback@0.0.26
    - @xernerx/ui@0.3.9

## 1.0.2

### Patch Changes

- Fixed issues on the api routes and pages to do with UI and loading

## 1.0.1

### Patch Changes

- Fixed metadata and footer content

## 1.0.0

### Major Changes

- Added a new subdomain for info and moved roadmap, suggestions, bug reports as well as faq to info.xernerx.com
