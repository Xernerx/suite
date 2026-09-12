# api

## 0.7.4

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/components@0.2.21
    - @xernerx/feedback@0.0.22
    - @xernerx/lib@0.5.3
    - @xernerx/providers@0.3.14
    - @xernerx/ui@0.3.5

## 0.7.3

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
    - @xernerx/components@0.2.20
    - @xernerx/providers@0.3.13
    - @xernerx/feedback@0.0.21
    - @xernerx/ui@0.3.4

## 0.7.2

### Patch Changes

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

- Updated dependencies
    - @xernerx/lib@0.5.2
    - @xernerx/components@0.2.19
    - @xernerx/providers@0.3.12
    - @xernerx/feedback@0.0.20
    - @xernerx/ui@0.3.3

## 0.7.1

### Patch Changes

- Fixed an issue where embeds were send incorrectly

## 0.7.0

### Minor Changes

- Added Webhooks, Webhook support and reviews for bots

## 0.6.8

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

## 0.6.7

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.5.0
    - @xernerx/components@0.2.17
    - @xernerx/providers@0.3.10
    - @xernerx/feedback@0.0.18
    - @xernerx/ui@0.3.1

## 0.6.6

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

## 0.6.5

### Patch Changes

- Added announcements and update privacy policy and terms of service

## 0.6.4

### Patch Changes

- fix stripe

## 0.6.3

### Patch Changes

- Another fix for stripe version

## 0.6.2

### Patch Changes

- Fixed stripe version

## 0.6.1

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/components@0.2.15
    - @xernerx/providers@0.3.8
    - @xernerx/feedback@0.0.16
    - @xernerx/lib@0.3.7
    - @xernerx/ui@0.2.11

## 0.6.0

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

## 0.5.8

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

## 0.5.7

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.4
    - @xernerx/components@0.2.12
    - @xernerx/providers@0.3.5
    - @xernerx/feedback@0.0.13
    - @xernerx/ui@0.2.8

## 0.5.6

### Patch Changes

- Removed a bunch of files

## 0.5.5

### Patch Changes

- Fix /secure/validate/token endpoint to use the correct users.Token model path

## 0.5.4

### Patch Changes

- Resolve token modal issues, fix auth user IDs, apply custom ui, and trigger vercel builds.

## 0.5.3

### Patch Changes

- Fixed organization invite acceptance logic, removed duplicate timezone fields, and updated Next.js 15 header async calls.

## 0.5.2

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.7
    - @xernerx/providers@0.3.4
    - @xernerx/components@0.2.11
    - @xernerx/feedback@0.0.12

## 0.5.1

### Patch Changes

-   - Restyled the `api` app landing page to feature the premium glassmorphism aesthetic.
    - Fixed hydration mismatch issues involving `next/link` and translated dictionaries.
    - Resolved Discord API `Failed to fetch` error that broke the User account synchronization by splitting try/catch blocks and gracefully bypassing Discord CORS failures.
    - Ensured session cookies traverse successfully between client subdomains and the API route by adding `credentials: 'include'` to `UserProvider` fetches.
    - Fixed a bug where same-origin browser API calls lacked `Origin` headers, preventing them from bypassing the `proxy.ts` middleware authentication block.
- Updated dependencies
    - @xernerx/components@0.2.10
    - @xernerx/providers@0.3.3
    - @xernerx/ui@0.2.6
    - @xernerx/feedback@0.0.11

## 0.5.0

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

## 0.4.2

### Patch Changes

- Updated dependencies and added Translation page

## 0.4.1

### Patch Changes

- Added permissions to admin and master control to all required items
- Updated dependencies
    - @xernerx/components@0.2.8
    - @xernerx/providers@0.3.1
    - @xernerx/feedback@0.0.9
    - @xernerx/lib@0.3.2
    - @xernerx/ui@0.2.4

## 0.4.0

### Minor Changes

- Updated dependencies

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.3.0
    - @xernerx/components@0.2.7
    - @xernerx/feedback@0.0.8
    - @xernerx/lib@0.3.1
    - @xernerx/ui@0.2.3

## 0.3.0

### Minor Changes

- Stripe addition

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.0
    - @xernerx/components@0.2.6
    - @xernerx/providers@0.2.6

## 0.2.3

### Patch Changes

- linted prettier
- Updated dependencies
    - @xernerx/components@0.2.5
    - @xernerx/providers@0.2.5
    - @xernerx/feedback@0.0.7
    - @xernerx/lib@0.2.2
    - @xernerx/ui@0.2.2

## 0.2.2

### Patch Changes

- deps update
- Updated dependencies
    - @xernerx/components@0.2.4
    - @xernerx/providers@0.2.4
    - @xernerx/feedback@0.0.6
    - @xernerx/lib@0.2.1
    - @xernerx/ui@0.2.1

## 0.2.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.2.3
    - @xernerx/components@0.2.3

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

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.2.0
    - @xernerx/ui@0.2.0
    - @xernerx/components@0.2.2
    - @xernerx/providers@0.2.2
    - @xernerx/feedback@0.0.5
