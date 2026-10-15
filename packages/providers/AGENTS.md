<!-- @format -->

# `packages/providers` (`@xernerx/providers`) — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`@xernerx/providers` supplies all global React Context providers and hooks for authentication sessions, user profiles, permissions, localization, dynamic themes, environment URL resolution, keyboard shortcuts, sidebar navigation, and toast notifications.

## 📦 Exported Providers & Hooks (`index.ts`)

- `SessionProvider`, `useSession`, `signIn`, `signOut` (NextAuth)
- `EnvironmentProvider`, `useEnvironment` (`env`, `getEnvUrl(service, path)`)
- `ThemeProvider`, `useTheme` (light/dark mode, custom accent color, `--ui-scale`, `--text-scale`, `--ui-gap`)
- `DictionaryProvider`, `useDictionary` (`{ dictionary, currentLocale, locales, currentLanguage, t }` where `t(path: string, variables?: Record<string, string | number>)` resolves `path` in active dictionary -> `fallbackDictionary` (`en-GB.json`) -> `path`, and replaces `{key}` variables)
- `UserProvider`, `useUser` (authenticated user document, billing subscriptions, refresh helpers)
- `PermissionProvider`, `usePermission` (RBAC permission evaluation)
- `SidebarProvider`, `useSidebar` (`view`, `setView`, `hide`, `show`, collapsed state)
- `ToastProvider`, `useToast` (`toast({ type, title, description })`)
- `PlatformProvider`, `usePlatform` (web vs Electron desktop `application` detection)
- `CookieProvider`, `useCookie`
- `SupportProvider`, `useSupport`
- `ShortcutsProvider`, `useShortcuts`
- `DispatchProvider`, `useDispatch`
- `NotificationProvider`, `useNotification`

## ⚠️ Important Rules & Gotchas

1. **Always Inspect Provider Implementations First:** Never guess hook return shapes or function signatures (especially `useDictionary().t`). Read the corresponding `src/*Provider.tsx` file directly.
2. **Client-Only Package:** Every provider in this package must begin with `'use client';` and must only import client-safe utilities from `@xernerx/lib` (never `@xernerx/lib/server`).
3. **Hook Consumption:** Always consume state through the exported `use*` hooks rather than importing raw Context objects.
4. **Cross-Environment Routing:** `useEnvironment().getEnvUrl(service, path)` is the canonical way for client code to construct URLs to `api`, `cdn`, `account`, `app`, `store`, `www`, `docs`, `admin`, and `info` across `public`, `canary`, and `dev`.
