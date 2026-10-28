<!-- @format -->

# `@xernerx/app`

## 2.3.0

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

## 2.2.0

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
    - @xernerx/lib@1.14.0

## 2.1.1

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.13.0

## 2.1.0

### Minor Changes

- <!-- @format -->

    ### Discord Server Ecosystem Integration, Support Hub, Credit Store Coupons & Bot Release Webhooks
    - **Bot Developer `POST release` Webhook Trigger & Dispatcher (`apps/app`, `apps/api`, `apps/docs`)**:
        - Added the `POST release` event trigger toggle to the Developer Portal Webhooks configuration (`apps/app/src/components/portal/bot/WebhooksTab.tsx`) alongside existing vote, stat, and review webhook triggers.
        - Built `dispatchBotReleaseWebhooks()` in `apps/api/src/lib/webhookDispatcher.ts` and wired it into both the Developer Portal release publisher (`POST /secure/bots/[id]/releases`) and the public REST API (`POST / PUT /v1/bots/[id]/releases`).
        - Dispatches rich Discord release embeds (`🚀 vX.Y.Z — Title`, release notes body, version field, bot branding, and direct changelog URL) when targeting Discord webhook URLs, or a structured JSON payload (`{ event: 'POST release', botId, timestamp, bot, release, data: { release }, embeds }`) with `X-Xernerx-Event: POST release` headers for custom HTTP endpoints, recording every delivery in `HookModel.deliveries`.
        - Updated `POST /secure/bots/[id]/hooks/test` to include sample `release` data when testing webhooks subscribed to `POST release`, and documented the `POST release` payload in `apps/docs/src/components/api/V1PlatformEndpoints.tsx` and `apps/api/src/lib/docsBlueprintsApi.ts`.

    - **Admin Announcements Channel Panel Presets & Split `#issues` / `#suggestions` Live-Feed Webhooks (`apps/admin`, `apps/api`)**:
        - Added 1-click Discord server channel panel presets in the Admin Announcements visual builder (`apps/admin/src/components/announcements/boilerplateTemplates.ts`, `AnnouncementModal.tsx`, `Announcements.tsx`): **#welcome Panel (3 Embeds + 5 Link Buttons)**, **#rules Panel**, **#support Hub Panel**, **#ecosystem Directory Panel**, plus Terms of Service and Privacy Policy templates.
        - Separated the community live-feed webhooks into dedicated `#issues` (`issues_webhook_url`) and `#suggestions` (`suggestions_webhook_url`) settings in `apps/admin/src/components/Settings.tsx`, `apps/admin/src/components/settings/WebhooksSection.tsx`, and `apps/api/src/lib/mainDiscordServer.ts`.
        - Wired real-time Discord webhook dispatches into `POST /info/issues`, `PATCH /secure/core/issues/[id]`, `POST /info/suggestions`, `PATCH /secure/core/suggestions/[id]`, and `PATCH /secure/core/roadmap/[id]`.
        - Hardened `POST /secure/announcements/create-webhook` and `GET /secure/guilds/[id]` to iterate across `[DISCORD_BOT_TOKEN, DISCORD_CLIENT_TOKEN]`, filter channel selectors to webhook-capable channel types (`0`, `5`, `15`, `16`), support thread webhooks (`?thread_id=...`), load `public/logo.png` locally, and surface detailed Discord API error messages.

    - **Official Discord Server Membership & Support Hub (`packages/providers`, `apps/account`, `apps/admin`, `apps/api`, `services/app`)**:
        - Enhanced `SupportProvider.tsx` (`@xernerx/providers`) with the `useSupport()` hook (`isJoined`, `isChecking`, `adminServerId`, `refreshMembership`) and integrated an Official Discord Server connection card with 1-click Join (`PUT /secure/guilds/[id]/discord/join/[userId]`) and Role Sync in `apps/account/src/components/Connections.tsx`.
        - Added the Admin Support Hub (`apps/admin/src/components/Support.tsx`, `apps/admin/src/components/support/*`) and backend API (`GET / POST /secure/core/support`, `PATCH / DELETE /secure/core/support/[id]`) backed by `SupportBot`, `SupportChannel`, and `SupportTicket` Mongoose models (`@xernerx/lib`).
        - Upgraded `@xernerx/app` (`services/app`) slash commands (`/status`, `/roadmap`, `/faq`, `/docs`, `/issues`, `/suggestions`, `/changelog`, `/sync`) with interactive buttons and Link Buttons, and added automated support thread & forum post intake with interactive troubleshooting checklists and ticket resolution (`services/app/src/events/messageCreate.ts`, `interactionCreate.ts`, `lib/supportTickets.ts`).

    - **Credit Store Coupon Codes & Developer Bot Slot Quotas (`apps/store`, `apps/admin`, `apps/account`, `apps/api`, `packages/lib`)**:
        - Added the `Coupon` Mongoose model (`packages/lib/src/models/xernerx/store/Coupon.ts`), Admin Coupon management UI (`apps/admin/src/components/store/StoreCouponsTab.tsx`, `CouponModal.tsx`), and `/secure/store/coupons` CRUD endpoints supporting `credit_bonus` and `perk_unlock` coupon codes.
        - Added `+1 Bot & API Token Slot` (2,500 Credits) and `+3 Bot & API Token Slots` (6,000 Credits) developer perks to the Credit Store (`apps/api/src/lib/storeSeed.ts`, `apps/store/src/components/CreditStoreView.tsx`), and enforced bot/token slot quotas with an inline slot counter and upgrade prompt in `apps/account/src/components/Tokens.tsx` and `CreateTokenModal.tsx`.

    - **Bot Explorer & Discord Lookup Hardening (`apps/app`, `apps/api`)**:
        - Consolidated `BotCard` into `apps/app/src/components/ExploreCards.tsx` (reused by `apps/app/src/app/bots/page.tsx`), initializing stats and Discord metadata directly from `GET /secure/bots`, awaiting `useEnvironment().isReady`, and aborting in-flight requests cleanly on unmount.
        - Added a 5-minute in-memory response cache and `[DISCORD_BOT_TOKEN, DISCORD_CLIENT_TOKEN]` fallback to `GET /core/users/[id]/discord`.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.12.0

## 2.0.1

### Patch Changes

- <!-- @format -->

    ### Added & Enhanced
    - **Universal `/v1/bots/[id]` Auto-Profile Creation & Token/Bot/User Binding (`apps/api/src/lib/v1BotAuth.ts`, `apps/api/src/app/v1/bots/[id]/*`)**:
        - Centralized `/v1/bots/[id]` authentication and mutation handling in `authenticateV1BotRequest`.
        - Any `POST`, `PUT`, `PATCH`, or `DELETE` request across `/v1/bots/[id]`, `/v1/bots/[id]/profile`, `/v1/bots/[id]/stats`, `/v1/bots/[id]/commands`, and `/v1/bots/[id]/releases` now automatically creates the bot profile from Discord if it does not exist yet, binds the API token (`botId` and `status: 'active'`), and synchronizes user `owners` between the token and the bot profile.
        - Added full `POST`, `PUT`, `PATCH`, and `DELETE` method support across `/v1/bots/[id]/*` endpoints and documented the expanded release methods in `apps/docs`.
    - **Token & Bot Owner Synchronization (`apps/api/src/app/secure/tokens/*`, `apps/api/src/app/secure/bots/*`)**:
        - Exposed `botId` and `owners` in `GET /secure/tokens` and ensured token creation/updates sync `owners` with any bound bot profile.
        - Updated `GET /secure/bots?owner=...` to automatically resolve and sync bots bound via the user's API tokens, and updated bot profile deletion (`DELETE`) to reset bound tokens back to `pending`.
    - **Automatic Stale Locale Key Pruning & Lint Enforcement (`.xernerx/cli/commands/commit.ts`, `.xernerx/cli/commands/lint.ts`, `packages/lib/src/dictionaries/*`)**:
        - Updated `suite commit` to automatically prune any translation keys modified or removed in `en-GB.json` from all non-English locale dictionaries (`en-US.json`, `es.json`, `fr.json`, `nl.json`, `ru.json`, `se.json`) so updated keys immediately fall back to `en-GB.json` and queue for re-translation.
        - Added Section 4b stale/orphaned i18n key verification to `suite lint`.
    - **Discord Daemon Startup & Stats Sync (`services/app/src/main.ts`, `services/bot/src/main.ts`)**:
        - Added `DISCORD_BOT_TOKEN` fallback alongside `DISCORD_CLIENT_TOKEN` in `@xernerx/app` and enabled `XernerxStats` initialization in `bot` whenever `XERNERX_TOKEN` is configured.

- Updated dependencies
    - @xernerx/lib@1.11.1

## 2.0.0

### Major Changes

- Changed the single bot instance runner into their own dedicated bot runtimes.

## 1.0.0

### Major Changes

- Initial standalone workspace extraction for **Xernerx App** (`services/app`), separating its runtime, build pipeline, and uptime tracking completely from `services/bot`.
