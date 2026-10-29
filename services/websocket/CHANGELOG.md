<!-- @format -->

# @xernerx/websocket

## 1.3.13

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.5

## 1.3.12

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.4

## 1.3.11

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.3

## 1.3.10

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.2

## 1.3.9

### Patch Changes

- Fixed a push error
- Updated dependencies
    - @xernerx/lib@1.16.1

## 1.3.8

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

## 1.3.7

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.15.0

## 1.3.6

### Patch Changes

- Fixed issues regarding the spawn process in different environment

## 1.3.5

### Patch Changes

- Updated WebSocket startup logging to use `wss://ws.xernerx.com` in production and `wss://ws.dev.xernerx.com` in development, bound auxiliary HTTP/WebSocket upgrade listeners on ports 80 and 3000 in production for reverse-proxy compatibility, and automatically activated pending tokens on first WebSocket authentication.

## 1.3.4

### Patch Changes

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

- Updated dependencies
    - @xernerx/lib@1.14.0

## 1.3.3

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.13.0

## 1.3.2

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.12.0

## 1.3.1

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.11.1

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

## 1.2.25

### Patch Changes

- <!-- @format -->

    ### Credit Store, Ecosystem Perks, Profile Showcases & Subscription Credit Multipliers (`apps/store`, `apps/api`, `apps/admin`, `apps/account`, `apps/app`, `apps/cdn`, `services/websocket`, `@xernerx/components`, `@xernerx/lib`)
    - **Dedicated Credit Store & Perks Hub (`apps/store/src/components/CreditStoreView.tsx`, `apps/store/src/app/page.tsx`)**:
        - Added the **Credits & Perks** (`category=credits`) tab on `store.xernerx.com` featuring a live Credit Wallet & Perks summary bar (current credit balance, daily streak badge, lifetime credits spent, owned CDN slots, owned showcase slots, unlocked vanity badges, and 1-click Daily Reward claiming).
        - Added filterable perk categories (**All Items**, **CDN Slots**, **Showcase Slots**, **Trial Passes**, **Vanity Badges**, and **Buy Credits (€)**) with `<Confirm />` redemption modals showing current balance, item cost, and remaining balance.
        - Seeded initial Credit Store catalog items in `apps/api/src/lib/storeSeed.ts`:
            - **CDN Upload Slots**: `+1 CDN Media Slot` (`1,000` credits), `+3 CDN Media Slots` (`2,500` credits), and `+10 CDN Media Slots` (`7,500` credits).
            - **Profile Showcase Slots**: `+1 Profile Showcase Slot` (`1,500` credits) and `+3 Profile Showcase Slots` (`3,500` credits).
            - **Trial Passes**: `3-Day Virtue Trial` (`900` credits), `3-Day Zodiac Trial` (`900` credits), `3-Day Ultra Ecosystem Trial` (`2,000` credits), and `7-Day Ultra Ecosystem Trial` (`4,000` credits).
            - **High-Spender & Patron Vanity Badges**: `Credit Patron` (`2,500` credits), `High Roller` (`10,000` credits), and `Vault Sovereign` (`25,000` credits).
            - **Stripe Credit Top-Up Packs**: `500 Credits Pack` (`€5`), `1,200 Credits Pack` (`€10`, +20% bonus), `3,250 Credits Vault` (`€25`, +30% bonus), and `7,000 Credits Treasury` (`€50`, +40% bonus) linked to Stripe Product/Price SKUs.

    - **Credit Redemption Engine, One-Time Stripe Top-Ups & Admin Catalog Controls (`apps/api`, `apps/admin`, `@xernerx/lib`)**:
        - Extended `models.users.Credit` (`Credit.ts`), `models.users.Profile` (`Profile.ts`), and `models.store.Item` (`Item.ts`) to track `totalSpent`, `extraCdnSlots`, `extraShowcaseSlots`, `unlockedBadges`, `activeBadges`, `transactions`, `showcases`, and store item types (`subscription`, `credit_pack`, `credit_perk`).
        - Created `POST /secure/store/credits/redeem` (`apps/api/src/app/secure/store/credits/redeem/route.ts`) to atomically deduct credit balances, record ledger transactions, auto-unlock lifetime spender milestone badges (`2,500`, `10,000`, `25,000` credits), increment CDN/showcase slot quotas, and provision/extend `trialing` subscriptions.
        - Updated `POST /secure/store/checkout` and `POST /secure/webhooks/stripe` to support one-time `mode: 'payment'` Stripe Checkout sessions for `credit_pack` SKUs and credit user balances upon `checkout.session.completed`.
        - Upgraded Admin Store Management (`ItemModal.tsx`, `StoreItemsTab.tsx`, `/secure/store/items`) to configure `itemType`, `skuId`, `creditCost`, `creditAmount`, `perkType`, `perkValue`, and `durationDays`.

    - **Server-Side 125% & 200% Subscription Credit Multipliers (`apps/api/src/lib/creditMultiplier.ts`, `services/websocket`)**:
        - Built `applySubscriptionCreditMultiplier()` to inspect a user's active/trialing subscriptions right before adding earned credits, applying a **200% (`2.0x`)** multiplier for active **Ultra** (or staff) subscriptions and a **125% (`1.25x`)** multiplier for any other active subscription.
        - Wired the server-side credit multiplier into Daily Gift claims (`/secure/store/[id]/gift`, `/secure/users/[id]/credits/claim`), Bot/Server/Guild voting rewards (`/secure/bots/[id]/vote`, `/secure/servers/[id]/vote`, `/secure/guilds/[id]/vote`), and WebSocket credit balance increments (`services/websocket/src/app/xernerx/server.ts`).

    - **CDN Slot Quota & Public Profile Showcases (`apps/cdn`, `apps/account`, `apps/app`, `@xernerx/components`)**:
        - Updated `POST /upload/[id]` and `GET /media` on `apps/cdn` to stack `extraCdnSlots` on top of base/subscription upload limits and surfaced a live `{used} / {max} CDN Slots` badge in `MediaManager.tsx` linking to the Credit Store.
        - Built `ProfileShowcases.tsx` in `apps/account` so users can manage their pinned Showcase Cards (`1` free base slot + `extraShowcaseSlots`) and toggle unlocked Vanity Badges on/off, rendered live on public user profiles (`apps/app/src/components/users/Profile.tsx`) and `SidebarUser.tsx`.

- Updated dependencies
    - @xernerx/lib@1.10.0

## 1.2.24

### Patch Changes

- <!-- @format -->

    ### Credit Store, Ecosystem Perks, Profile Showcases & Subscription Credit Multipliers (`apps/store`, `apps/api`, `apps/admin`, `apps/account`, `apps/app`, `apps/cdn`, `services/websocket`, `@xernerx/components`, `@xernerx/lib`)
    - **Dedicated Credit Store & Perks Hub (`apps/store/src/components/CreditStoreView.tsx`, `apps/store/src/app/page.tsx`)**:
        - Added the **Credits & Perks** (`category=credits`) tab on `store.xernerx.com` featuring a live Credit Wallet & Perks summary bar (current credit balance, daily streak badge, lifetime credits spent, owned CDN slots, owned showcase slots, unlocked vanity badges, and 1-click Daily Reward claiming).
        - Added filterable perk categories (**All Items**, **CDN Slots**, **Showcase Slots**, **Trial Passes**, **Vanity Badges**, and **Buy Credits (€)**) with `<Confirm />` redemption modals showing current balance, item cost, and remaining balance.
        - Seeded initial Credit Store catalog items in `apps/api/src/lib/storeSeed.ts`:
            - **CDN Upload Slots**: `+1 CDN Media Slot` (`1,000` credits), `+3 CDN Media Slots` (`2,500` credits), and `+10 CDN Media Slots` (`7,500` credits).
            - **Profile Showcase Slots**: `+1 Profile Showcase Slot` (`1,500` credits) and `+3 Profile Showcase Slots` (`3,500` credits).
            - **Trial Passes**: `3-Day Virtue Trial` (`900` credits), `3-Day Zodiac Trial` (`900` credits), `3-Day Ultra Ecosystem Trial` (`2,000` credits), and `7-Day Ultra Ecosystem Trial` (`4,000` credits).
            - **High-Spender & Patron Vanity Badges**: `Credit Patron` (`2,500` credits), `High Roller` (`10,000` credits), and `Vault Sovereign` (`25,000` credits).
            - **Stripe Credit Top-Up Packs**: `500 Credits Pack` (`€5`), `1,200 Credits Pack` (`€10`, +20% bonus), `3,250 Credits Vault` (`€25`, +30% bonus), and `7,000 Credits Treasury` (`€50`, +40% bonus) linked to Stripe Product/Price SKUs.

    - **Credit Redemption Engine, One-Time Stripe Top-Ups & Admin Catalog Controls (`apps/api`, `apps/admin`, `@xernerx/lib`)**:
        - Extended `models.users.Credit` (`Credit.ts`), `models.users.Profile` (`Profile.ts`), and `models.store.Item` (`Item.ts`) to track `totalSpent`, `extraCdnSlots`, `extraShowcaseSlots`, `unlockedBadges`, `activeBadges`, `transactions`, `showcases`, and store item types (`subscription`, `credit_pack`, `credit_perk`).
        - Created `POST /secure/store/credits/redeem` (`apps/api/src/app/secure/store/credits/redeem/route.ts`) to atomically deduct credit balances, record ledger transactions, auto-unlock lifetime spender milestone badges (`2,500`, `10,000`, `25,000` credits), increment CDN/showcase slot quotas, and provision/extend `trialing` subscriptions.
        - Updated `POST /secure/store/checkout` and `POST /secure/webhooks/stripe` to support one-time `mode: 'payment'` Stripe Checkout sessions for `credit_pack` SKUs and credit user balances upon `checkout.session.completed`.
        - Upgraded Admin Store Management (`ItemModal.tsx`, `StoreItemsTab.tsx`, `/secure/store/items`) to configure `itemType`, `skuId`, `creditCost`, `creditAmount`, `perkType`, `perkValue`, and `durationDays`.

    - **Server-Side 125% & 200% Subscription Credit Multipliers (`apps/api/src/lib/creditMultiplier.ts`, `services/websocket`)**:
        - Built `applySubscriptionCreditMultiplier()` to inspect a user's active/trialing subscriptions right before adding earned credits, applying a **200% (`2.0x`)** multiplier for active **Ultra** (or staff) subscriptions and a **125% (`1.25x`)** multiplier for any other active subscription.
        - Wired the server-side credit multiplier into Daily Gift claims (`/secure/store/[id]/gift`, `/secure/users/[id]/credits/claim`), Bot/Server/Guild voting rewards (`/secure/bots/[id]/vote`, `/secure/servers/[id]/vote`, `/secure/guilds/[id]/vote`), and WebSocket credit balance increments (`services/websocket/src/app/xernerx/server.ts`).

    - **CDN Slot Quota & Public Profile Showcases (`apps/cdn`, `apps/account`, `apps/app`, `@xernerx/components`)**:
        - Updated `POST /upload/[id]` and `GET /media` on `apps/cdn` to stack `extraCdnSlots` on top of base/subscription upload limits and surfaced a live `{used} / {max} CDN Slots` badge in `MediaManager.tsx` linking to the Credit Store.
        - Built `ProfileShowcases.tsx` in `apps/account` so users can manage their pinned Showcase Cards (`1` free base slot + `extraShowcaseSlots`) and toggle unlocked Vanity Badges on/off, rendered live on public user profiles (`apps/app/src/components/users/Profile.tsx`) and `SidebarUser.tsx`.

- Updated dependencies
    - @xernerx/lib@1.9.0

## 1.2.23

### Patch Changes

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

- Updated dependencies
    - @xernerx/lib@1.8.0

## 1.2.22

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.7.0

## 1.2.21

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.6.0

## 1.2.20

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.4

## 1.2.19

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.3

## 1.2.18

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.2

## 1.2.17

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.1

## 1.2.16

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.0

## 1.2.15

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.4.1

## 1.2.14

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.4.0

## 1.2.13

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.3.0

## 1.2.12

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

## 1.2.11

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

## 1.2.10

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.0.0

## 1.2.9

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries

## 1.2.8

### Patch Changes

- Updated dependencies and fixed a loading state issue on app

## 1.2.7

### Patch Changes

- Comprehensive Russian & English Ecosystem Localization Phase 2

    - **Ecosystem-wide Localization Wrappers:** Swept `admin`, `account`, `docs`, `cdn`, and `www` applications, systematically replacing hardcoded English strings with `@xernerx/providers` `useDictionary` hooks.
    - **Deep Dictionary Integrations:** Centralized hundreds of new configuration keys into `@xernerx/lib` (`ru.json` and `en-GB.json`), including complex nested objects for the Admin dashboard matrix, application package documentation, Account Media Library, and dynamic notification settings (`api`, `billing`, `apps`, `virtue`).
    - **Server/Client Boundary Separation:** Resolved React boundary crashes by explicitly splitting async data-fetching Server Components (like `PackageDetails`) away from new `'use client'` components strictly dedicated to translation contexts.
    - **Turbopack Cache Busting:** Mitigated Next.js 16 caching glitches by introducing manual invalidation markers (`// Force recompile`) when heavily rewriting ASTs with new context hooks.
    - **Interpolation Identifier Fixes:** Audited and resolved deep dictionary mapping bugs where the localization parser crashed because interpolation variables (e.g. `{current}`, `{error}`) were incorrectly translated into literal Cyrillic identifiers in the JSON tree.
    - **Widget Translation Parity:** Restored and translated hidden edge-cases in `@xernerx/components`, including the `SidebarUser` daily gift claiming states and success/error notification toasts.
    - **Cross-App Deep Linking:** Upgraded inter-app navigation URLs (like `Switch to Admin` and `Go to Translations` from the Account app) to support `?view=` query parameters, landing users securely into explicit Admin views (`?view=media`, `?view=translations`).

## 1.2.6

### Patch Changes

- fix build

## 1.2.5

### Patch Changes

- Xerple and Crean
- Xerple and Crean

## 1.2.4

### Patch Changes

- Added permissions to admin and master control to all required items

## 1.2.3

### Patch Changes

- linted prettier

## 1.2.2

### Patch Changes

- deps update

## 1.2.1

### Patch Changes

- Fixed an issue where gitignore ignored too much

## 1.2.0

### Minor Changes

- Updated app name
