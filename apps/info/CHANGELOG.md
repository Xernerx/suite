# info

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
