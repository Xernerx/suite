# bot

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
