<!-- @format -->

# app

## 2.14.2

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.11.1
    - @xernerx/components@0.9.1
    - @xernerx/providers@0.12.1
    - @xernerx/feedback@0.1.1
    - @xernerx/ui@0.7.1

## 2.14.1

### Patch Changes

- Fixed an issue where env's were shared on different branches

## 2.14.0

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
    - @xernerx/styles@0.1.15
    - @xernerx/ui@0.7.0

## 2.13.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.8.2
    - @xernerx/lib@1.10.0
    - @xernerx/providers@0.11.2
    - @xernerx/feedback@0.0.42
    - @xernerx/ui@0.6.2

## 2.12.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.8.1
    - @xernerx/lib@1.9.0
    - @xernerx/providers@0.11.1
    - @xernerx/feedback@0.0.41
    - @xernerx/ui@0.6.1

## 2.11.0

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
    - @xernerx/styles@0.1.14
    - @xernerx/ui@0.6.0

## 2.10.0

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

## 2.9.0

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

## 2.8.0

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

## 2.7.4

### Patch Changes

- Streamlined UI
- Updated dependencies
    - @xernerx/providers@0.8.0
    - @xernerx/components@0.6.5
    - @xernerx/lib@1.5.3
    - @xernerx/ui@0.4.3
    - @xernerx/feedback@0.0.36

## 2.7.3

### Patch Changes

- Streamlined UI
- Updated dependencies
    - @xernerx/providers@0.7.0
    - @xernerx/components@0.6.4
    - @xernerx/lib@1.5.2
    - @xernerx/ui@0.4.2
    - @xernerx/feedback@0.0.35

## 2.7.2

### Patch Changes

- Streamlined shortcuts and added new shortcuts.
- Updated dependencies
    - @xernerx/components@0.6.3
    - @xernerx/lib@1.5.1
    - @xernerx/providers@0.6.6
    - @xernerx/feedback@0.0.34
    - @xernerx/ui@0.4.1

## 2.7.1

### Patch Changes

- Fixed cors policy issues

## 2.7.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.5.0
    - @xernerx/ui@0.4.0
    - @xernerx/components@0.6.2
    - @xernerx/providers@0.6.5
    - @xernerx/feedback@0.0.33

## 2.6.15

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.6.1

## 2.6.14

### Patch Changes

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

- Updated dependencies
    - @xernerx/components@0.6.0
    - @xernerx/lib@1.4.1
    - @xernerx/providers@0.6.4
    - @xernerx/feedback@0.0.32
    - @xernerx/ui@0.3.15

## 2.6.13

### Patch Changes

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

- Updated dependencies
    - @xernerx/lib@1.4.0
    - @xernerx/ui@0.3.14
    - @xernerx/components@0.5.1
    - @xernerx/providers@0.6.3
    - @xernerx/feedback@0.0.31

## 2.6.12

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.5.0
    - @xernerx/lib@1.3.0
    - @xernerx/providers@0.6.2
    - @xernerx/feedback@0.0.30
    - @xernerx/ui@0.3.13

## 2.6.11

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.1
    - @xernerx/components@0.4.1
    - @xernerx/feedback@0.0.29
    - @xernerx/ui@0.3.12

## 2.6.10

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
    - @xernerx/styles@0.1.13
    - @xernerx/ui@0.3.11

## 2.6.9

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
    - @xernerx/styles@0.1.12
    - @xernerx/ui@0.3.10

## 2.6.8

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.0.0
    - @xernerx/components@0.2.25
    - @xernerx/providers@0.4.1
    - @xernerx/feedback@0.0.26
    - @xernerx/ui@0.3.9

## 2.6.7

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.4.0
    - @xernerx/components@0.2.24
    - @xernerx/feedback@0.0.25
    - @xernerx/ui@0.3.8

## 2.6.6

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.6.0
    - @xernerx/components@0.2.23
    - @xernerx/providers@0.3.16
    - @xernerx/feedback@0.0.24
    - @xernerx/ui@0.3.7

## 2.6.5

### Patch Changes

- Fixed opengraph embed for bot specific pages

## 2.6.4

### Patch Changes

- Fixed an issue where only public environments would show version changes, also added a quicklink to the changelog page to quickly reference versions

## 2.6.3

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries
- Updated dependencies
    - @xernerx/components@0.2.22
    - @xernerx/feedback@0.0.23
    - @xernerx/lib@0.5.4
    - @xernerx/providers@0.3.15
    - @xernerx/styles@0.1.11
    - @xernerx/ui@0.3.6

## 2.6.2

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/components@0.2.21
    - @xernerx/feedback@0.0.22
    - @xernerx/lib@0.5.3
    - @xernerx/providers@0.3.14
    - @xernerx/styles@0.1.10
    - @xernerx/ui@0.3.5

## 2.6.1

### Patch Changes

- Fixed build issue

## 2.6.0

### Minor Changes

- Added a new public page for organizations and completely overhauled the organization member management and invite system.

    ### Features
    - **Organization Pages**: Added `organization/[id]` route to display public profiles for organizations, aggregating their bots and servers.
    - **Team Roles**: Team members are now dynamically categorized and grouped by custom roles on the public organization page.
    - **Member Management**: Organization owners can now assign roles to members using a dropdown selector and kick members via the Developer Portal.
    - **Role Creation**: Added the ability to define custom roles/titles within the portal, which are safely passed through the API whitelist and stored in the database.

    ### Bug Fixes
    - **Invite Routing**: Fixed a critical bug where organization invites were bypassing the notification engine. Invites are now properly routed through the `dispatch` collection rather than `applications`.
    - **Notification Overlap**: Resolved a z-index stacking context issue where the `SidebarNotifications` modal backdrop was rendering behind the sticky desktop sidebar by forcing it to the maximum allowable z-index.
    - **Dirty State Tracking**: Fixed a React shallow-copy mutation bug in the portal that prevented the "Save" button from appearing after modifying nested role objects.

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.2.20
    - @xernerx/providers@0.3.13
    - @xernerx/feedback@0.0.21
    - @xernerx/ui@0.3.4

## 2.5.0

### Minor Changes

- Added valuation and faq

## 2.4.0

### Minor Changes

- ### Platform Features & Enhancements
    - **App (Portal)**: Overhauled the Organization profile configuration page with a modern interactive UI. Replaced standard file upload buttons with an interactive, Discord-style avatar and banner overlay with hover edit states.
    - **App (Portal)**: Added deferred-save functionality utilizing `URL.createObjectURL` to provide instant, client-side previews for avatar and banner uploads prior to submission.
    - **App (Portal)**: Upgraded the organization and bot detailed description inputs into a rich text Markdown editor featuring a Write/Preview tab toggle.
    - **App (Portal)**: Added an interactive tag management UI to the bot portal page.
    - **Lib (Database)**: Expanded the Mongoose Organization `Profile` schema by adding `iconUrl` and `bannerUrl` properties to explicitly support custom CDN image uploads alongside legacy Discord icons.
    - **Lib (Database)**: Expanded the Mongoose Bot `Profile` schema to support a new `dashboard` link field, making it available in the portal link configurations.
    - **API**: Updated the `PATCH /secure/organizations/[id]` endpoint to whitelist and securely save the new `iconUrl` and `bannerUrl` payload fields.
    - **API**: Updated the bot endpoints (`/secure/bots`) to properly parse and return the new tags and dashboard link configurations.

    ### Bug Fixes
    - **CDN**: Completely refactored the `/raw/[id]` media fetching proxy to use the official `@vercel/blob` SDK. This replaces manual HTTP requests and fixes a critical issue where private blobs failed to authenticate in production (returning `502 Bad Gateway`) by correctly utilizing Vercel's automatic OIDC token resolution.
    - **CDN**: Patched the `/upload` endpoint payload to return direct byte-stream URLs (`/raw/[id]`) instead of HTML dashboard URLs (`/view/[id]`), fixing broken image renders.
    - **CDN**: Appended the `addRandomSuffix: true` option to Vercel Blob uploads to guarantee global filename uniqueness and prevent caching collisions.
    - **App (Portal)**: Fixed an issue where the Portal was requesting production CDN images during local development by wrapping all avatar and banner URL references with the `getEnvUrl()` provider hook.
    - **Database**: Executed a global MongoDB migration across the `organizations`, `users`, `guilds`, and `bots` profiles to convert all legacy, broken `/view/` CDN URLs into the correct `/raw/` format.

### Patch Changes

- Updated dependencies
    - @xernerx/styles@0.1.9
    - @xernerx/lib@0.5.2
    - @xernerx/components@0.2.19
    - @xernerx/providers@0.3.12
    - @xernerx/feedback@0.0.20
    - @xernerx/ui@0.3.3

## 2.3.0

### Minor Changes

- Added Webhooks, Webhook support and reviews for bots

## 2.2.5

### Patch Changes

- Testing Ads 2

## 2.2.4

### Patch Changes

- Testing ads

## 2.2.3

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
    - @xernerx/components@0.2.18
    - @xernerx/providers@0.3.11
    - @xernerx/feedback@0.0.19
    - @xernerx/styles@0.1.8
    - @xernerx/lib@0.5.1
    - @xernerx/ui@0.3.2

## 2.2.2

### Patch Changes

- Added footer link to careers, and 2 languages
- Updated dependencies
    - @xernerx/lib@0.5.0
    - @xernerx/components@0.2.17
    - @xernerx/providers@0.3.10
    - @xernerx/feedback@0.0.18
    - @xernerx/ui@0.3.1

## 2.2.1

### Patch Changes

- ## Feature Updates & UI Polish
    - **Store Overhaul**: Redesigned the Consumer tab ecosystem in the Account Store to feature a side-by-side comparison of the new `Free` plan and the `Ultra` plan.
    - **Dynamic Store Discounts**: The store's annual billing toggle now dynamically calculates exact savings margins based directly on live Stripe prices. The discount percentage natively responds to whichever ecosystem tab (Consumers vs Developers) is active.
    - **Checkout Subtext**: Added a global disclaimer on the store page clarifying that locale prices and taxes are securely calculated at checkout.

    ## Core Backend & Authorization
    - **CDN Storage Quota Engine**: The `/upload` endpoint now strictly enforces dynamic storage quotas. Free tier users are hard-capped at 10 media uploads, while users with active subscriptions via Stripe bypass this constraint (up to 1,000).
    - **Media Dashboard Isolation**: Heavily scoped the media query logic. The personal library view now completely filters out global public media, only returning media explicitly uploaded by or shared directly with the current user.

    ## Bug Fixes
    - **Upload Permissions Patch**: Changed the fallback default value of `uploadMedia` to `false` inside the permissions library, fixing a dangerous bug where zero-role accounts were mistakenly granted UI access to the upload buttons.
    - **Typo Fixes**: Resolved an interpolation issue in the store rendering that caused `/mo` and `/yr` suffixes to double-slash in the Developer API tab.
    - **CDN Crashing Fix**: Resolved a critical Turbopack compilation crash caused by variable redeclaration in the upload route that brought down the entire CDN server.
    - **Unauthorized State**: Polished the 404 unauthorized fallback inside the CDN file viewer to intelligently handle login/redirect loops vs simple permission denials.

- Updated dependencies
    - @xernerx/lib@0.4.0
    - @xernerx/ui@0.3.0
    - @xernerx/components@0.2.16
    - @xernerx/providers@0.3.9
    - @xernerx/feedback@0.0.17

## 2.2.0

### Minor Changes

- Added announcements and update privacy policy and terms of service

## 2.1.9

### Patch Changes

- Added deprecation warning to api endpoint

## 2.1.8

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/components@0.2.15
    - @xernerx/providers@0.3.8
    - @xernerx/feedback@0.0.16
    - @xernerx/styles@0.1.7
    - @xernerx/lib@0.3.7
    - @xernerx/ui@0.2.11

## 2.1.7

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.6
    - @xernerx/components@0.2.14
    - @xernerx/providers@0.3.7
    - @xernerx/feedback@0.0.15
    - @xernerx/ui@0.2.10

## 2.1.6

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/components@0.2.13
    - @xernerx/providers@0.3.6
    - @xernerx/feedback@0.0.14
    - @xernerx/styles@0.1.6
    - @xernerx/lib@0.3.5
    - @xernerx/ui@0.2.9

## 2.1.5

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.4
    - @xernerx/components@0.2.12
    - @xernerx/providers@0.3.5
    - @xernerx/feedback@0.0.13
    - @xernerx/ui@0.2.8

## 2.1.4

### Patch Changes

- Resolve token modal issues, fix auth user IDs, apply custom ui, and trigger vercel builds.

## 2.1.3

### Patch Changes

- Fixed organization invite acceptance logic, removed duplicate timezone fields, and updated Next.js 15 header async calls.

## 2.1.2

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.7
    - @xernerx/providers@0.3.4
    - @xernerx/components@0.2.11
    - @xernerx/feedback@0.0.12

## 2.1.1

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.2.10
    - @xernerx/providers@0.3.3
    - @xernerx/ui@0.2.6
    - @xernerx/feedback@0.0.11

## 2.1.0

### Minor Changes

- ### Dashboard (apps/app)
    - Restyled the dashboard configuration interface into a responsive, full-width SPA layout without arbitrary height restrictions, allowing native body scrolling.
    - Implemented premium glassmorphism aesthetics (`bg-(--foreground)/30`, `backdrop-blur-md`, `rounded-[2rem]`) and grid-based cards (Server Sync Data, Server Info, Privacy & Data).
    - Rendered Discord guild banners natively within the layout.
    - Replaced native HTML `<select>` elements with the custom `@xernerx/ui` `<Selector>` component (`items={true}`).
    - Fixed build errors regarding the `<Loading />` component variant and Recharts tooltip label formatting.

    ### API & Middleware (apps/api)
    - Updated `core/users/[id]/discord/guilds` to successfully map and return `bannerUrl` for Discord guilds.
    - Created `secure/guilds/[id]` endpoint for profile persistence.
    - Resolved token invalidation loop (`proxy.ts`) by removing unnecessary `Authorization` headers on internal DB requests, instead relying on Next-Auth session cookies.
    - Resolved TypeScript errors in bot voting endpoints (`secure/bots/[id]/vote`).

    ### Desktop App (apps/desktop)
    - Configured dynamic routing in `main.ts` so canary builds automatically point `WEB_URL` to `https://app.canary.xernerx.com` by sniffing the version string for `canary`.

    ### Packages & Providers
    - **@xernerx/ui**: Expanded `InputProps` to include the `rows` property to support `variant="textarea"`, fixing upstream compilation errors in `apps/auth`.
    - **@xernerx/providers**: Wrapped `getEnvUrl` in a `useCallback` hook inside `EnvironmentProvider` to prevent infinite re-render fetch loops against the Discord API.
    - **@xernerx/lib**: Exported `GuildSchema` to the central registry.

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.5
    - @xernerx/providers@0.3.2
    - @xernerx/lib@0.3.3
    - @xernerx/components@0.2.9
    - @xernerx/feedback@0.0.10

## 2.0.1

### Patch Changes

- Fixed downloads page added Canary channel when viewing on dev or canary branch

## 2.0.0

### Major Changes

- Updated app

## 1.3.2

### Patch Changes

- Added permissions to admin and master control to all required items
- Updated dependencies
    - @xernerx/websocket@1.2.4

## 1.3.1

### Patch Changes

- Updated dependencies

## 1.3.0

### Minor Changes

- Stripe addition

## 1.2.29

### Patch Changes

- linted prettier
- Updated dependencies
    - @xernerx/websocket@1.2.3

## 1.2.28

### Patch Changes

- deps update
- Updated dependencies
    - @xernerx/websocket@1.2.2

## 1.2.27

### Patch Changes

- Fixed an issue where gitignore ignored too much
- Updated dependencies
    - @xernerx/websocket@1.2.1

## 1.2.26

### Patch Changes

- 62b09e4: test
