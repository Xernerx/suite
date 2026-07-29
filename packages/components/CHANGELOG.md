# @xernerx/components

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
