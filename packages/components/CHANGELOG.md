# @xernerx/components

## 0.5.0

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
    - @xernerx/lib@1.3.0
    - @xernerx/providers@0.6.2
    - @xernerx/feedback@0.0.30
    - @xernerx/ui@0.3.13

## 0.4.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.1
    - @xernerx/feedback@0.0.29
    - @xernerx/ui@0.3.12

## 0.4.0

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
    - @xernerx/lib@1.2.0
    - @xernerx/providers@0.6.0
    - @xernerx/feedback@0.0.28
    - @xernerx/ui@0.3.11

## 0.3.0

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
    - @xernerx/lib@1.1.0
    - @xernerx/providers@0.5.0
    - @xernerx/feedback@0.0.27
    - @xernerx/ui@0.3.10

## 0.2.25

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.0.0
    - @xernerx/providers@0.4.1
    - @xernerx/feedback@0.0.26
    - @xernerx/ui@0.3.9

## 0.2.24

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.4.0
    - @xernerx/feedback@0.0.25
    - @xernerx/ui@0.3.8

## 0.2.23

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.6.0
    - @xernerx/providers@0.3.16
    - @xernerx/feedback@0.0.24
    - @xernerx/ui@0.3.7

## 0.2.22

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries
- Updated dependencies
    - @xernerx/feedback@0.0.23
    - @xernerx/lib@0.5.4
    - @xernerx/providers@0.3.15
    - @xernerx/ui@0.3.6

## 0.2.21

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/feedback@0.0.22
    - @xernerx/lib@0.5.3
    - @xernerx/providers@0.3.14
    - @xernerx/ui@0.3.5

## 0.2.20

### Patch Changes

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

- Updated dependencies
    - @xernerx/providers@0.3.13
    - @xernerx/feedback@0.0.21
    - @xernerx/ui@0.3.4

## 0.2.19

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.5.2
    - @xernerx/providers@0.3.12
    - @xernerx/feedback@0.0.20
    - @xernerx/ui@0.3.3

## 0.2.18

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
    - @xernerx/feedback@0.0.19
    - @xernerx/lib@0.5.1
    - @xernerx/ui@0.3.2

## 0.2.17

### Patch Changes

- Added footer link to careers, and 2 languages
- Updated dependencies
    - @xernerx/lib@0.5.0
    - @xernerx/providers@0.3.10
    - @xernerx/feedback@0.0.18
    - @xernerx/ui@0.3.1

## 0.2.16

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
    - @xernerx/providers@0.3.9
    - @xernerx/feedback@0.0.17

## 0.2.15

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/providers@0.3.8
    - @xernerx/feedback@0.0.16
    - @xernerx/lib@0.3.7
    - @xernerx/ui@0.2.11

## 0.2.14

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.6
    - @xernerx/providers@0.3.7
    - @xernerx/feedback@0.0.15
    - @xernerx/ui@0.2.10

## 0.2.13

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/providers@0.3.6
    - @xernerx/feedback@0.0.14
    - @xernerx/lib@0.3.5
    - @xernerx/ui@0.2.9

## 0.2.12

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.4
    - @xernerx/providers@0.3.5
    - @xernerx/feedback@0.0.13
    - @xernerx/ui@0.2.8

## 0.2.11

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.7
    - @xernerx/providers@0.3.4
    - @xernerx/feedback@0.0.12

## 0.2.10

### Patch Changes

-   - Restyled the `api` app landing page to feature the premium glassmorphism aesthetic.
    - Fixed hydration mismatch issues involving `next/link` and translated dictionaries.
    - Resolved Discord API `Failed to fetch` error that broke the User account synchronization by splitting try/catch blocks and gracefully bypassing Discord CORS failures.
    - Ensured session cookies traverse successfully between client subdomains and the API route by adding `credentials: 'include'` to `UserProvider` fetches.
    - Fixed a bug where same-origin browser API calls lacked `Origin` headers, preventing them from bypassing the `proxy.ts` middleware authentication block.
- Updated dependencies
    - @xernerx/providers@0.3.3
    - @xernerx/ui@0.2.6
    - @xernerx/feedback@0.0.11

## 0.2.9

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.5
    - @xernerx/providers@0.3.2
    - @xernerx/lib@0.3.3
    - @xernerx/feedback@0.0.10

## 0.2.8

### Patch Changes

- Added permissions to admin and master control to all required items
- Updated dependencies
    - @xernerx/providers@0.3.1
    - @xernerx/lib@0.3.2
    - @xernerx/ui@0.2.4

## 0.2.7

### Patch Changes

- Updated dependencies
- Updated dependencies
    - @xernerx/providers@0.3.0
    - @xernerx/lib@0.3.1
    - @xernerx/ui@0.2.3

## 0.2.6

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.0
    - @xernerx/providers@0.2.6

## 0.2.5

### Patch Changes

- linted prettier
- Updated dependencies
    - @xernerx/providers@0.2.5
    - @xernerx/lib@0.2.2
    - @xernerx/ui@0.2.2

## 0.2.4

### Patch Changes

- deps update
- Updated dependencies
    - @xernerx/providers@0.2.4
    - @xernerx/lib@0.2.1
    - @xernerx/ui@0.2.1

## 0.2.3

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.2.3

## 0.2.2

### Patch Changes

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

- Updated dependencies
    - @xernerx/lib@0.2.0
    - @xernerx/ui@0.2.0
    - @xernerx/providers@0.2.2

## 0.2.1

### Patch Changes

- Fixed an issue where gitignore ignored too much
- Updated dependencies
    - @xernerx/providers@0.2.1
    - @xernerx/lib@0.1.1
    - @xernerx/ui@0.1.1

## 0.2.0

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

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.2.0
    - @xernerx/lib@0.1.0
    - @xernerx/ui@0.1.0

## 0.1.2

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.1.1

## 0.1.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.1.0
    - @xernerx/lib@0.0.2
    - @xernerx/ui@0.0.1

## 0.0.1

### Patch Changes

- <!-- @format -->

    Updated UI

    ## @xernerx/components
    - Fixed an issue where sidebar was incorrectly shown on mobile
    - Changed the way the banner is positioned on mobile
    - Fixed an issue where suite navigation on mobile didn't show on mobile
    - Fixed an issue where user was hidden under the viewport on the sidebar
    - Added a button on the header for navigation when sidebar is hidden
    - Added a top load animation to the top of the pages

    ## @xernerx/providers
    - Added an EnvironmentProvider, allowing for dev, canary and public distinction
    - Added a ShortcutProvider allowing shortcuts to be used
    - Fixed an issue where SidebarProvider no longer showed categories
    - Fixed an issue where ToastProvider didn't use the center on mobile

    ## @xernerx/feedback
    - Added Loading
    - Added Error
    - Added GlobalError
    - Added NotFound

    ## @xernerx/lib
    - Added navigation for url endpoints of suite services

    ## auth
    - Updated UI based on packages

    ## cdn
    - Updated UI based on packages

    ## www
    - Updated UI based on packages
    - Completely rewritten all pages

- Updated dependencies
    - @xernerx/providers@0.0.1
    - @xernerx/lib@0.0.1
