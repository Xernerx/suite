<!-- @format -->

# `packages/components` (`@xernerx/components`) — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`@xernerx/components` provides high-level application shell layouts (`AppLayout`, `Page`, `Header`, `Sidebar`, `Footer`), domain cards (`BotCard`, `BotRow`), advertising (`AdBanner`), and compliance/update modals (`CookiePrompt`, `TermsPrompt`, `VersionTracker`) shared across all Next.js apps in the suite.

## 📦 Exported Surface (`index.ts`)

- **Shell & Navigation:** `AppLayout`, `Page`, `Header`, `Sidebar`, `Footer`
- **Cards & Rows:** `BotCard`, `BotRow`
- **Compliance & Utility:** `CookiePrompt`, `AdBanner`, `VersionTracker`
- _(Internal components loaded by `AppLayout` / `Sidebar`):_ `TermsPrompt`, `ThemeScript`, `SidebarNotifications`, `SidebarSuite`, `SidebarUser`

## ⚠️ Important Rules & Gotchas

1. **`AppLayout` Provider Order:** `AppLayout` wraps every web app in the exact provider hierarchy from `@xernerx/providers` (`SessionProvider`, `EnvironmentProvider`, `ThemeProvider`, `DictionaryProvider`, `UserProvider`, `PermissionProvider`, `SidebarProvider`, `ToastProvider`, etc.). Do not reorder providers without verifying downstream hook dependencies.
2. **Policy Version Constants (`TermsPrompt.tsx`):** `TERMS_VERSION` and `PRIVACY_VERSION` control when users are prompted to accept updated legal policies. `pnpm suite commit` tracks policy edits against this file.
3. **Client Directives & Styling:** All interactive components must include `'use client';` and use CSS variables (`var(--ui-gap)`, `bg-(--foreground)`, `text-(--text)`).
4. **Localization:** Never hardcode text; use `useDictionary()`.
