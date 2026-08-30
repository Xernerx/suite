# @xernerx/ui

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
