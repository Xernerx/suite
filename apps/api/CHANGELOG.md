# api

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
