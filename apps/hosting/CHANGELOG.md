<!-- @format -->

# Changelog

## 1.2.2

### Patch Changes

- Fixed a push error
- Updated dependencies
    - @xernerx/components@0.11.1
    - @xernerx/feedback@0.4.4
    - @xernerx/lib@1.16.1
    - @xernerx/providers@0.17.1
    - @xernerx/styles@0.1.17
    - @xernerx/ui@0.7.9

## 1.2.1

### Patch Changes

- ### 🚀 Xernerx Haste (`apps/haste` — `haste.xernerx.com`, Port `4011`)
    - **First-Party Code Pastebin & Studio (`apps/haste`)**: Added the `apps/haste` workspace on dev port `4011` (`haste.xernerx.com`) with `HasteStudioClient`, `HasteExplorerList`, and `HasteDocumentViewer` featuring syntax language selection, TTL expirations (`1h`, `24h`, `7d`, `30d`, `never`), Universal 3-Tier Privacy (`public`, `limited`, `private`), `?fork=[id]` preloading, `Ctrl + S` shortcut publishing, raw streaming (`/raw/[id]`), and owner management controls.
    - **Hastebin Protocol & REST v1 Endpoints (`apps/haste`, `apps/api`)**: Added `POST /documents/[userId]`, `POST /documents`, `GET /raw/[id]`, `GET & POST /v1/haste`, `GET, PATCH & DELETE /v1/haste/[id]`, and `GET /v1/haste/[id]/raw` with lightweight Xernerx `userId` verification against `models.users.User` and automatic outer Discord triple-backtick code-fence unwrapping.
    - **Dedicated `MONGO_HASTE` Cluster & TTL Model (`@xernerx/lib/server`)**: Added `packages/lib/src/models/haste/documents/Document.ts` with a MongoDB TTL index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`) and bound `database('haste')` strictly to `process.env.MONGO_HASTE` with no fallback.

    ### 📦 `@xernerx/*` Ecosystem & Engagement Updates
    - **Bot User Engagement Endpoint & Signed Webhooks (`apps/api`, `apps/portal`, `apps/docs`)**: Added `GET /v1/bots/[id]/users/[userId]` returning `voted`, `lastVotedAt`, `nextVoteAt`, `reviewed`, `rating`, and `tipped` status, HMAC-SHA256 webhook signature headers (`x-xernerx-signature`), and real-time webhook triggers for votes, reviews, and credit tips.
    - **Updated `@xernerx/*` Package Dependencies (`services/*`, `apps/*`, `packages/*`, `.xernerx/cli`, `clients/desktop`)**: Bumped `@xernerx/terminal` to `^1.1.15` workspace-wide, updated `services/app` and `services/bot` to `@xernerx/commands@^0.2.6`, `@xernerx/framework@^1.1.1`, and `@xernerx/stats@^1.0.14`, and registered `XernerxStats` via `extensionHandler.loadExtensions`.
    - **Developer Documentation & Catalog Sync (`apps/docs`, `apps/info`, `apps/api`)**: Documented `/v1/haste`, `/v1/bots/[id]/users/[userId]`, `@xernerx/hooks`, and `@xernerx/extension-builder`, updated `@xernerx/stats` (`get`, `post`, `update`, `delete`) and `@xernerx/commands` (`get`, `post`, `delete`, `clear`) SDK examples, and added the Xernerx Haste FAQ entry.
    - **Suite CLI, Desktop & Branding Polish (`.xernerx/cli`, `clients/desktop`, `packages/public`)**: Added lazy port proxy (`lazyProxy.ts`), `@xernerx/terminal` logging integration (`terminal.ts`), draggable desktop loader bar (`loading.html`), and environment-specific Canary/Dev branding assets across all 13 applications.

- Updated dependencies
    - @xernerx/lib@1.16.0
    - @xernerx/providers@0.17.0
    - @xernerx/components@0.11.0
    - @xernerx/feedback@0.4.3
    - @xernerx/ui@0.7.8

## 1.2.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.15.0
    - @xernerx/components@0.10.1
    - @xernerx/providers@0.16.1
    - @xernerx/feedback@0.4.2
    - @xernerx/ui@0.7.7

## 1.1.0

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

## 1.0.0

### Major Changes

- Initial release of `hosting.xernerx.com` (`apps/hosting`, port `4010`) with session & RBAC staff guarding, persistent `one-dummi` and `two-dummi` Easypanel iframe consoles, side-by-side split view, full-bleed focus mode, and live node URL configuration.
