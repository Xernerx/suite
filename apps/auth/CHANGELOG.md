# auth

## 0.4.3

### Patch Changes

- Fixed an issue where useSession on login would not resolve in time

## 0.4.2

### Patch Changes

- Fixed a render issue

## 0.4.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.2.3
    - @xernerx/components@0.2.3

## 0.4.0

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
    - @xernerx/styles@0.1.2

## 0.3.1

### Patch Changes

- Fixed an issue where gitignore ignored too much
- Updated dependencies
    - @xernerx/components@0.2.1
    - @xernerx/providers@0.2.1
    - @xernerx/feedback@0.0.4
    - @xernerx/styles@0.1.1
    - @xernerx/lib@0.1.1
    - @xernerx/ui@0.1.1

## 0.3.0

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
    - @xernerx/components@0.2.0
    - @xernerx/providers@0.2.0
    - @xernerx/lib@0.1.0
    - @xernerx/ui@0.1.0
    - @xernerx/feedback@0.0.3

## 0.2.2

### Patch Changes

- <!-- @format -->

    Fixed UI issues on cookieheaders

    ## @xernerx/providers
    - Fixed an issue where cookie headers were incorrectly being read, making all domains return discord derived accent colors

    ## auth
    - Fixed an issue where cookie headers were incorrectly being set

- Updated dependencies
    - @xernerx/providers@0.1.2
    - @xernerx/components@0.1.2

## 0.2.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.1.1
    - @xernerx/components@0.1.1

## 0.2.0

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
    - @xernerx/components@0.1.0
    - @xernerx/providers@0.1.0
    - @xernerx/styles@0.1.0
    - @xernerx/lib@0.0.2
    - @xernerx/ui@0.0.1
    - @xernerx/feedback@0.0.2

## 0.1.8

### Patch Changes

- <!-- @format -->

    Added Changelog

    - Fixed an issue where changelog was not properly loaded

## 0.1.7

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
    - @xernerx/components@0.0.1
    - @xernerx/providers@0.0.1
    - @xernerx/feedback@0.0.1
    - @xernerx/lib@0.0.1

## 0.1.6

### Patch Changes

-   - test 2

## 0.1.5

### Patch Changes

- 62b09e4: test
