<!-- @format -->

# bot

## 2.1.9

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.6

## 2.1.8

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.5

## 2.1.7

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.4

## 2.1.6

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.3

## 2.1.5

### Patch Changes

- ### Landing Page (`www`), Documentation (`docs`) & Discord Bot Catalogs (`@xernerx/app`, `bot`)
    - **Showcase Package Discovery & Fallback Seeding (`apps/www/src/app/page.tsx`)**:
        - Added `@xernerx/hooks` and `@xernerx/extension-builder` to `FALLBACK_SHOWCASE_PACKAGES` and updated the `xernerx` all-in-one SDK description.
        - Seeded `packagesMap` inside `fetchShowcasePackagesFromRemote()` with all `FALLBACK_SHOWCASE_PACKAGES` names and mapped fallback descriptions (`FALLBACK_PACKAGE_DESC_MAP`) so first-party packages always render both during the initial 150ms SSR race and after remote GitHub/NPM refreshes.
    - **Docs Package Catalog Seeding (`apps/docs/src/app/packages/page.tsx`)**:
        - Seeded `packagesMap` with all keys from `FALLBACK_PACKAGE_DESCRIPTIONS` so `@xernerx/hooks` and `@xernerx/extension-builder` always appear in the package explorer even before a remote `docs.json` tree entry is fetched.
    - **Discord Bot Docs Catalog Fallbacks (`services/app/src/lib/catalogFallbacks.ts`, `services/bot/src/lib/catalogFallbacks.ts`)**:
        - Added `@xernerx/hooks` and `@xernerx/extension-builder` fallback entries and updated the `xernerx` SDK bundle description.

## 2.1.4

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.2

## 2.1.3

### Patch Changes

- Fixed a push error
- Updated dependencies
    - @xernerx/lib@1.16.1

## 2.1.2

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

## 2.1.1

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.15.0

## 2.1.0

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

## 2.0.4

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.13.0

## 2.0.3

### Patch Changes

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

- Updated dependencies
    - @xernerx/lib@1.12.0

## 2.0.2

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

## 2.0.1

### Patch Changes

- Fixed an issue where env's were shared on different branches

## 2.0.0

### Major Changes

- Changed the single bot instance runner into their own dedicated bot runtimes.

## 1.3.0

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
    - @xernerx/lib@1.11.0

## 1.2.2

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.10.0

## 1.2.1

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.9.0

## 1.2.0

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
    - @xernerx/lib@1.8.0

## 1.1.57

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.7.0

## 1.1.56

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.6.0

## 1.1.55

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.4

## 1.1.54

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.3

## 1.1.53

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.2

## 1.1.52

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.1

## 1.1.51

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.0

## 1.1.50

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.4.1

## 1.1.49

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.4.0

## 1.1.48

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.3.0

## 1.1.47

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
    - @xernerx/lib@1.2.0

## 1.1.46

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
    - @xernerx/lib@1.1.0

## 1.1.45

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.0.0

## 1.1.44

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.6.0

## 1.1.43

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries
- Updated dependencies
    - @xernerx/lib@0.5.4

## 1.1.42

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/lib@0.5.3

## 1.1.41

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.5.2

## 1.1.40

### Patch Changes

- Fixed an issue where guilds on the production bot would be removed by the dev and canary bots

## 1.1.39

### Patch Changes

- Fixed an issue where in canary build it would register it's own guilds

## 1.1.38

### Patch Changes

- Comprehensive Russian & English Ecosystem Localization Phase 2

    - **Ecosystem-wide Localization Wrappers:** Swept `admin`, `account`, `docs`, `cdn`, and `www` applications, systematically replacing hardcoded English strings with `@xernerx/providers` `useDictionary` hooks.
    - **Deep Dictionary Integrations:** Centralized hundreds of new configuration keys into `@xernerx/lib` (`ru.json` and `en-GB.json`), including complex nested objects for the Admin dashboard matrix, application package documentation, Account Media Library, and dynamic notification settings (`api`, `billing`, `apps`, `virtue`).
    - **Server/Client Boundary Separation:** Resolved React boundary crashes by explicitly splitting async data-fetching Server Components (like `PackageDetails`) away from new `'use client'` components strictly dedicated to translation contexts.
    - **Turbopack Cache Busting:** Mitigated Next.js 16 caching glitches by introducing manual invalidation markers (`// Force recompile`) when heavily rewriting ASTs with new context hooks.
    - **Interpolation Identifier Fixes:** Audited and resolved deep dictionary mapping bugs where the localization parser crashed because interpolation variables (e.g. `{current}`, `{error}`) were incorrectly translated into literal Cyrillic identifiers in the JSON tree.
    - **Widget Translation Parity:** Restored and translated hidden edge-cases in `@xernerx/components`, including the `SidebarUser` daily gift claiming states and success/error notification toasts.
    - **Cross-App Deep Linking:** Upgraded inter-app navigation URLs (like `Switch to Admin` and `Go to Translations` from the Account app) to support `?view=` query parameters, landing users securely into explicit Admin views (`?view=media`, `?view=translations`).

- Updated dependencies
    - @xernerx/lib@0.5.1

## 1.1.37

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.5.0

## 1.1.36

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.4.0

## 1.1.35

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/lib@0.3.7

## 1.1.34

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.6

## 1.1.33

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/lib@0.3.5

## 1.1.32

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.4

## 1.1.31

### Patch Changes

- Added permissions to admin and master control to all required items

## 1.1.30

### Patch Changes

- Updated dependencies

## 1.1.29

### Patch Changes

- linted prettier

## 1.1.28

### Patch Changes

- deps update

## 1.1.27

### Patch Changes

- Fixed an issue where gitignore ignored too much

## 1.1.26

### Patch Changes

- <!-- @format -->

    Updated UI and added User Context

    ## @xernerx/components
    - Added UserProvider in AppLayout
    - Fixed an issue where CookiePrompt was using the wrong accent color origin
    - Updated Sidebar UI and seperated modals from sidebar

    ## @xernerx/providers
    - Updated ThemeProvider to inject current set theme before page load
    - Fixed an issue where ToastProvider was using thw wrong accent color origin
    - Added UserProvider for User Context

    ## @xernerx/styles
    - Added new accent specific colors

    ## auth
    - Fixed issues across multiple pages where the accent color was derived from the wrong origin

    ## @xernerx/lib
    - Fixed an issue where discord login credentials were not being refreshed.

    ## @xernerx/ui
    - Fixed an issue where the toggle switch had a misaligned toggle

    ## bot
    - Changed backend code
