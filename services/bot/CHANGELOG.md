# bot

## 1.1.39

### Patch Changes

- Fixed an issue where in canary build it would register it's own guilds

## 1.1.38

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
    - @xernerx/lib@0.5.1

## 1.1.37

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.5.0

## 1.1.36

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.4.0

## 1.1.35

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/lib@0.3.7

## 1.1.34

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.6

## 1.1.33

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/lib@0.3.5

## 1.1.32

### Patch Changes

- Updated dependencies
    - @xernerx/lib@0.3.4

## 1.1.31

### Patch Changes

- Added permissions to admin and master control to all required items

## 1.1.30

### Patch Changes

- Updated dependencies

## 1.1.29

### Patch Changes

- linted prettier

## 1.1.28

### Patch Changes

- deps update

## 1.1.27

### Patch Changes

- Fixed an issue where gitignore ignored too much

## 1.1.26

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
