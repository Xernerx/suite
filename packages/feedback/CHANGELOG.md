# @xernerx/feedback

## 0.0.19

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
    - @xernerx/ui@0.3.2

## 0.0.18

### Patch Changes

- @xernerx/providers@0.3.10
- @xernerx/ui@0.3.1

## 0.0.17

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.3.0
    - @xernerx/providers@0.3.9

## 0.0.16

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/providers@0.3.8
    - @xernerx/ui@0.2.11

## 0.0.15

### Patch Changes

- @xernerx/providers@0.3.7
- @xernerx/ui@0.2.10

## 0.0.14

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/providers@0.3.6
    - @xernerx/ui@0.2.9

## 0.0.13

### Patch Changes

- @xernerx/providers@0.3.5
- @xernerx/ui@0.2.8

## 0.0.12

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.7

## 0.0.11

### Patch Changes

- @xernerx/ui@0.2.6

## 0.0.10

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.5

## 0.0.9

### Patch Changes

- Added permissions to admin and master control to all required items
- Updated dependencies
    - @xernerx/ui@0.2.4

## 0.0.8

### Patch Changes

- Updated dependencies
- Updated dependencies
    - @xernerx/ui@0.2.3

## 0.0.7

### Patch Changes

- linted prettier
- Updated dependencies
    - @xernerx/ui@0.2.2

## 0.0.6

### Patch Changes

- deps update
- Updated dependencies
    - @xernerx/ui@0.2.1

## 0.0.5

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
    - @xernerx/ui@0.2.0

## 0.0.4

### Patch Changes

- Fixed an issue where gitignore ignored too much
- Updated dependencies
    - @xernerx/ui@0.1.1

## 0.0.3

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.1.0

## 0.0.2

### Patch Changes

- Updated dependencies
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
