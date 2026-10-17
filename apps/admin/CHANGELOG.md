# admin

## 0.10.1

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

## 0.10.0

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

## 0.9.0

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

## 0.8.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.1
    - @xernerx/components@0.4.1
    - @xernerx/feedback@0.0.29
    - @xernerx/ui@0.3.12

## 0.8.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.4.0
    - @xernerx/lib@1.2.0
    - @xernerx/providers@0.6.0
    - @xernerx/feedback@0.0.28
    - @xernerx/ui@0.3.11

## 0.7.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.3.0
    - @xernerx/lib@1.1.0
    - @xernerx/providers@0.5.0
    - @xernerx/feedback@0.0.27
    - @xernerx/ui@0.3.10

## 0.6.3

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.0.0
    - @xernerx/components@0.2.25
    - @xernerx/providers@0.4.1
    - @xernerx/feedback@0.0.26
    - @xernerx/ui@0.3.9

## 0.6.2

### Patch Changes

- Fixed some UI issues and make the roadmap look cleaner

## 0.6.1

### Patch Changes

- Fixed interaction issues and product listing

## 0.6.0

### Minor Changes

- Added a new roadmap and suggestions feature

## 0.5.10

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.4.0
    - @xernerx/components@0.2.24
    - @xernerx/feedback@0.0.25
    - @xernerx/ui@0.3.8

## 0.5.9

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.6.0
    - @xernerx/components@0.2.23
    - @xernerx/providers@0.3.16
    - @xernerx/feedback@0.0.24
    - @xernerx/ui@0.3.7

## 0.5.8

### Patch Changes

- Fixed an issue where only public environments would show version changes, also added a quicklink to the changelog page to quickly reference versions

## 0.5.7

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries
- Updated dependencies
    - @xernerx/components@0.2.22
    - @xernerx/feedback@0.0.23
    - @xernerx/lib@0.5.4
    - @xernerx/providers@0.3.15
    - @xernerx/ui@0.3.6

## 0.5.6

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/components@0.2.21
    - @xernerx/feedback@0.0.22
    - @xernerx/lib@0.5.3
    - @xernerx/providers@0.3.14
    - @xernerx/ui@0.3.5

## 0.5.5

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.2.20
    - @xernerx/providers@0.3.13
    - @xernerx/feedback@0.0.21
    - @xernerx/ui@0.3.4

## 0.5.4

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.5.2
    - @xernerx/components@0.2.19
    - @xernerx/providers@0.3.12
    - @xernerx/feedback@0.0.20
    - @xernerx/ui@0.3.3

## 0.5.3

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
    - @xernerx/lib@0.5.1
    - @xernerx/ui@0.3.2

## 0.5.2

### Patch Changes

- Added footer link to careers, and 2 languages
- Updated dependencies
    - @xernerx/lib@0.5.0
    - @xernerx/components@0.2.17
    - @xernerx/providers@0.3.10
    - @xernerx/feedback@0.0.18
    - @xernerx/ui@0.3.1

## 0.5.1

### Patch Changes

- Fixed type errors

## 0.5.0

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

- Updated dependencies
    - @xernerx/lib@0.4.0
    - @xernerx/ui@0.3.0
    - @xernerx/components@0.2.16
    - @xernerx/providers@0.3.9
    - @xernerx/feedback@0.0.17

## 0.4.2

### Patch Changes

- Automated all processes

## 0.4.1

### Patch Changes

- Updated ToS and Privacy Policy to better include developer terms, and fixed permissions in admin panel

## 0.4.0

### Minor Changes

- Added announcements and update privacy policy and terms of service

## 0.3.1

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/components@0.2.15
    - @xernerx/providers@0.3.8
    - @xernerx/feedback@0.0.16
    - @xernerx/lib@0.3.7
    - @xernerx/ui@0.2.11

## 0.3.0

### Minor Changes

- ## New Features & Enhancements
    - **Invites Matrix System Added**: Added a comprehensive `/invites` matrix system allowing admins to manage official Discord bot invites across the Xernerx network.
    - **Dynamic Discord Profiles (API & Frontend)**: The public Invites listing page (`www`) and Admin dashboard cards now dynamically fetch and display live Discord `global_name`/`username` and `avatarUrl` metadata directly from the Discord API. This ensures that bot branding is always up-to-date.
    - **Admin Dashboard UI Upgrades**:
        - The Invites view is fully integrated into the Admin sidebar layout under the `Administrator` category.
        - The Invites management modal now utilizes the sleek `@xernerx/ui` `Toggle` component for the 53-item Discord Permission matrix.
        - Modals were scaled up to support robust scrolling configurations (`maxWidth="max-w-4xl"`).
    - **Public Timeline Overhaul**: Upgraded the Xernerx landing page timeline to a 2035 "editorial" layout featuring sticky typography headers on the left and seamlessly scrolling bento glass cards on the right.

    ## Bug Fixes
    - Fixed `database` import errors by correctly awaiting the server connection and passing the appropriate `xernerx` project configuration payload across API routes.
    - Resolved build-time dependency leakage by properly scoping `discord-api-types` exclusively to the `admin` app.
    - Corrected React context collisions in the Admin `Settings` page by ensuring `useSession` is imported directly from `@xernerx/providers` rather than raw `next-auth/react`.
    - Next.js 15+ Compatibility: Implemented Promise resolutions for dynamic routing parameters `await params` in OAuth2 routing paths.
    - Prevented cross-environment failures by switching hardcoded API paths in Server Components to properly evaluate `ENV.ENVIRONMENT` domains for local proxying versus production calls.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.6
    - @xernerx/components@0.2.14
    - @xernerx/providers@0.3.7
    - @xernerx/feedback@0.0.15
    - @xernerx/ui@0.2.10

## 0.2.6

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/components@0.2.13
    - @xernerx/providers@0.3.6
    - @xernerx/feedback@0.0.14
    - @xernerx/lib@0.3.5
    - @xernerx/ui@0.2.9

## 0.2.5

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.4
    - @xernerx/components@0.2.12
    - @xernerx/providers@0.3.5
    - @xernerx/feedback@0.0.13
    - @xernerx/ui@0.2.8

## 0.2.4

### Patch Changes

- Resolve token modal issues, fix auth user IDs, apply custom ui, and trigger vercel builds.

## 0.2.3

### Patch Changes

-   - Added debounced infinite scroll to Users table to prevent rapid continuous fetching
    - Fixed alphabetical sorting to always push users with empty names to the bottom of the list
    - Fixed z-index stacking context so Confirm dialogs appear over standard edit Modals
    - Fixed `useToast` import missing from Roles and Tokens causing Turbopack build failures
    - Fixed hydration environment mismatch that caused immediate CORS failures when fetching in dev
- Updated dependencies
    - @xernerx/ui@0.2.7
    - @xernerx/providers@0.3.4
    - @xernerx/components@0.2.11
    - @xernerx/feedback@0.0.12

## 0.2.2

### Patch Changes

- Updated dependencies
    - @xernerx/components@0.2.10
    - @xernerx/providers@0.3.3
    - @xernerx/ui@0.2.6
    - @xernerx/feedback@0.0.11

## 0.2.1

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.5
    - @xernerx/providers@0.3.2
    - @xernerx/lib@0.3.3
    - @xernerx/components@0.2.9
    - @xernerx/feedback@0.0.10

## 0.2.0

### Minor Changes

- Added Notifications to the sidebar, added Request for Translator, added FaQ page

## 0.1.5

### Patch Changes

- Users submitting translations now post with their username and id

## 0.1.4

### Patch Changes

- Updated dependencies and added Translation page

## 0.1.3

### Patch Changes

- Added user selector in Tokens

## 0.1.2

### Patch Changes

- Added permissions to admin and master control to all required items
- Updated dependencies
    - @xernerx/components@0.2.8
    - @xernerx/providers@0.3.1
    - @xernerx/feedback@0.0.9
    - @xernerx/lib@0.3.2
    - @xernerx/ui@0.2.4

## 0.1.1

### Patch Changes

- Updated dependencies
- Updated dependencies
    - @xernerx/providers@0.3.0
    - @xernerx/components@0.2.7
    - @xernerx/feedback@0.0.8
    - @xernerx/lib@0.3.1
    - @xernerx/ui@0.2.3
