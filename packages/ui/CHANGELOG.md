# @xernerx/ui

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
