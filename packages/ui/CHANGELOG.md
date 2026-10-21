<!-- @format -->

# @xernerx/ui

## 0.6.0

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
    - @xernerx/providers@0.11.0

## 0.5.2

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.10.0

## 0.5.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.9.1

## 0.5.0

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

## 0.4.3

### Patch Changes

- Streamlined UI
- Updated dependencies
    - @xernerx/providers@0.8.0

## 0.4.2

### Patch Changes

- Streamlined UI
- Updated dependencies
    - @xernerx/providers@0.7.0

## 0.4.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.6

## 0.4.0

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

- @xernerx/providers@0.6.5

## 0.3.15

### Patch Changes

- @xernerx/providers@0.6.4

## 0.3.14

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

- @xernerx/providers@0.6.3

## 0.3.13

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.2

## 0.3.12

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.1

## 0.3.11

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
    - @xernerx/providers@0.6.0

## 0.3.10

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
    - @xernerx/providers@0.5.0

## 0.3.9

### Patch Changes

- @xernerx/providers@0.4.1

## 0.3.8

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.4.0

## 0.3.7

### Patch Changes

- @xernerx/providers@0.3.16

## 0.3.6

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries
- Updated dependencies
    - @xernerx/providers@0.3.15

## 0.3.5

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/providers@0.3.14

## 0.3.4

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.3.13

## 0.3.3

### Patch Changes

- @xernerx/providers@0.3.12

## 0.3.2

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
    - @xernerx/providers@0.3.11

## 0.3.1

### Patch Changes

- @xernerx/providers@0.3.10

## 0.3.0

### Minor Changes

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

### Patch Changes

- @xernerx/providers@0.3.9

## 0.2.11

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/providers@0.3.8

## 0.2.10

### Patch Changes

- @xernerx/providers@0.3.7

## 0.2.9

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/providers@0.3.6

## 0.2.8

### Patch Changes

- @xernerx/providers@0.3.5

## 0.2.7

### Patch Changes

-   - Added debounced infinite scroll to Users table to prevent rapid continuous fetching
    - Fixed alphabetical sorting to always push users with empty names to the bottom of the list
    - Fixed z-index stacking context so Confirm dialogs appear over standard edit Modals
    - Fixed `useToast` import missing from Roles and Tokens causing Turbopack build failures
    - Fixed hydration environment mismatch that caused immediate CORS failures when fetching in dev
- Updated dependencies
    - @xernerx/providers@0.3.4

## 0.2.6

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.3.3

## 0.2.5

### Patch Changes

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

- Updated dependencies
    - @xernerx/providers@0.3.2

## 0.2.4

### Patch Changes

- Added permissions to admin and master control to all required items

## 0.2.3

### Patch Changes

- Updated dependencies

## 0.2.2

### Patch Changes

- linted prettier

## 0.2.1

### Patch Changes

- deps update

## 0.2.0

### Minor Changes

- Added Database rendering and UI changes

    ## @xernerx/lib
    - Added Database
    - Updated en-GB, en-US and nl

    ## @xernerx/ui
    - Added Confirm
    - Added Slider

    ## auth
    - Added Profile
    - Fixed an issue where deleting user data would just log an error
    - Added client sync to appearance
    - Added ui zoom to appearance
    - Added ui spacing to appearance
    - Added text size to appearance
    - Added visual language indicator to Language
    - Added notification togglers in Notifications (Actual notifications will be implemented later)
    - Added Tokens
    - Added docs and api route

    ## www
    - Updated appearance rendering

    ## api
    - Added a new api routing, this is now the core api experience

    ## docs
    - Added a new docs renderer, this is now the core docs experience

    ## @xernerx/components
    - Updated UI elements and logic

    ## @xernerx/providers
    - Updated UI elements and logic

    ## @xernerx/feedback
    - Updated UI elements

    ## @xernerx/styles
    - Updated UI variables
    - Added highlight accent coloring

## 0.1.1

### Patch Changes

- Fixed an issue where gitignore ignored too much

## 0.1.0

### Minor Changes

- <!-- @format -->

    Added language support and changed some UI

    ## @xernerx/components
    - Updated all components with language support
    - Added ThemeScript to prevent accent flashing due to loading times

    ## @xernerx/lib
    - Added server support for languages
    - Added Languages en-US, en-GB, fr, es, nl
    - Added proxy for language detection
    - Added locales script to generate config file for languages

    ## @xernerx/providers
    - Added DictionaryProvider for language support
    - Changed toast duration to 3000ms

    ## @xernerx/ui
    - Added Selector UI element

    ## auth
    - Updated the whole app to support localization

    ## www
    - Updated the whole app to support localization

    ## cdn
    - Updated the whole app to support localization

## 0.0.1

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
