---
name: xernerx-living-sync
description: >-
    Cross-workspace synchronization checklist for Xernerx Suite living surfaces:
    www/download interactive preview, Global Command Palette (Ctrl + K) & Omnibar
    deep search, Info FAQ entries, and Onboarding / Interactive Tours parity. Use
    whenever adding pages, features, settings tabs, bot integrations, or modifying
    the shared app shell/UI.
---

<!-- @format -->

# Xernerx Suite Living Surface Synchronization

Whenever you ship user-facing UI, shell, route, or bot capability changes, run through the matching sync checklists below so previews, search, FAQ, and onboarding stay 100% true to the live apps.

## 1. `www/download` Desktop Preview Sync

**Trigger:** Any UI, layout, header, sidebar, window-controls, overlay, or shell change in `@xernerx/components`, `@xernerx/ui`, `apps/app`, or `clients/desktop`.

- Update [`apps/www/src/app/download/page.tsx`](../../../apps/www/src/app/download/page.tsx), [`apps/www/src/components/DesktopInteractivePreview.tsx`](../../../apps/www/src/components/DesktopInteractivePreview.tsx), and [`apps/www/src/components/DesktopPerksBento.tsx`](../../../apps/www/src/components/DesktopPerksBento.tsx) so the interactive desktop mockup and feature showcase remain 100% conformant with the live app.

## 2. Global Command Palette (`Ctrl + K`) & Deep Search Sync

**Trigger:** Adding any new page, route, studio, settings tab, Credit Store category, or user/developer/admin feature anywhere in the suite.

- Register it in:
    1. `packages/providers/src/commandPaletteCatalog.ts` (`SUITE_DEEP_PORTALS`, `ACCOUNT_DEEP_FEATURES`, `ACCOUNT_TABS`, `STORE_DEEP_LINKS`, `SUPPORT_PORTALS`, `ADMIN_TABS`)
    2. `packages/components/src/HeaderOmnibar.tsx` / `packages/components/src/omnibarRoutes.ts` (`SUBDOMAIN_ROUTES`)
    3. `apps/www/src/components/WwwDeepSearch.tsx`

## 3. Proactive FAQ Updates (`apps/info/faq` & `/core/faq`)

**Trigger:** Shipping a new feature, altering a user-facing workflow, or changing limits, permissions, or keyboard shortcuts.

- Update or add entries in:
    1. `apps/info/src/components/faq/*`
    2. `packages/lib/src/dictionaries/en-GB.json` under `faq.*` (pruning modified keys from other locales)
    3. Public FAQ API blueprints (`packages/lib/src/faqBlueprints*.ts` and/or `apps/api/src/lib/faqBlueprints*.ts`)

## 4. Onboarding & Interactive Tour Accuracy

**Trigger:** Adding, renaming, moving, or removing any header control, sidebar item, dashboard/portal/explore tab, `[data-tour]` target, welcome credit bonus, or bot dashboard integration.

- Keep these files and their `en-GB.json` keys (`components.firstSignIn.*`, `app.bots.onboarding.*`) strictly truthful:
    - `packages/components/src/FirstSignInOnboarding.tsx`
    - `packages/components/src/FirstSignInSetupAndHeader.tsx`
    - `packages/components/src/FirstSignInSidebarScene.tsx`
    - `packages/components/src/FirstSignInPageTours.tsx`
    - `apps/app/src/components/bots/BotOnboardingFlow.tsx` & `apps/app/src/app/bots/[id]/page.tsx`
- **Never falsely advertise non-existent or mismatched features:**
    1. **Accurate Bot Capabilities:** Never claim "every bot" has web configuration modules in the Server Dashboard (only `Virtue` at `/dashboard?tab=virtue` and `YourApps` at `/dashboard?tab=applications` have dedicated web modules alongside general server directory listings, 30-day statistics, links, and settings). Never display Virtue-only leveling cards (`XP Modes & Multipliers`, `Level Roles & Cycle Resets`) for non-Virtue bots.
    2. **Exact Sidebar & Tab Parity:** Demo sidebar items (`demoNav`) and descriptions must match real mounted left-`Sidebar` entries (`Explore`, `Dashboard` / `My Servers`, `Personal Workspace`, `Organizations`, `My Bots`) rather than conflating horizontal page tabs or external subdomains with sidebar items.
    3. **Exact `[data-tour]` Spotlight Truth:** Every step in `FirstSignInPageTours.tsx` (`dashboard`, `portal`, `explore`) must describe only controls and tabs actually inside its spotlighted `[data-tour="..."]` container.
