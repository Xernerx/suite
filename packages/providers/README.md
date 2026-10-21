<!-- @format -->

# `@xernerx/providers` — Global React Contexts & Hooks

Centralized React context providers and hooks powering authentication state, localization, environment routing, notifications, sidebar navigation, and keyboard shortcuts across the Xernerx Suite.

---

## 🪝 Core Providers & Hooks

- **`DictionaryProvider` & `useDictionary()`:** Provides `t(path, variables?)` with automatic fallback to `en-GB.json`.
- **`EnvironmentProvider` & `useEnvironment()`:** Resolves cross-subdomain URLs dynamically across Production (`*.xernerx.com`), Canary (`*.canary.xernerx.com`), and Development (`*.dev.xernerx.com` / localhost ports) via `getEnvUrl()`.
- **`UserProvider` & `useUser()`:** Synchronizes authenticated user profile, roles, theme preferences, and UI scaling tokens.
- **`ToastProvider` & `useToast()`:** Non-blocking toast notification dispatcher (`toast({ type, title, description })`).
- **`SidebarProvider` & `useSidebar()`:** Manages dynamic per-page sidebar navigation items (`setNavItems`, `show`, `hide`, `view`, `setView`).
- **`ShortcutsProvider` & `useShortcuts()`:** Registers and coordinates global and view-scoped keyboard shortcuts.
