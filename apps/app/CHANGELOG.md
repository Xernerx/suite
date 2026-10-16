# app

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
