<!-- @format -->

# @xernerx/websocket

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
