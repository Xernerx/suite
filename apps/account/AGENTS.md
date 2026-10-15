<!-- @format -->

# `apps/account` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/account` (`account.xernerx.com`, dev port `4003`) is the central user identity, profile configuration, localization, token management, and billing service for the Xernerx Suite. The storefront has been extracted into its own dedicated application at `apps/store` (`store.xernerx.com`).

## 🏗️ Architecture & Routing Conventions

- **Single-Page Tab Switcher (`/`):**
    - The root route (`src/app/page.tsx`) is **not** split into separate sub-routes for settings tabs.
    - Instead, it renders subcomponents dynamically via `COMPONENT_MAP[view]` driven by `useSidebar().view` (`profile`, `account`, `appearance`, `language`, `notifications`, `billing`, `tokens`, `media`).
    - When adding or editing an account settings tab, update the corresponding view component and register it in `COMPONENT_MAP` and the sidebar navigation registry in `@xernerx/lib`.
- **Auth Flow (`/login`, `/logout`, `/api/auth/[...nextauth]`):**
    - Uses NextAuth with Discord OAuth (`identify`, `guilds`, `guilds.join`, `email`, `connections`, `guilds.members.read`).
    - Session cookies (`__Secure-next-auth.session-token`) are scoped across `.xernerx.com` (or the configured local dev domain).
    - Unauthenticated requests to `/` automatically redirect to `/login`.
- **Billing Overview (`src/components/Billing.tsx`):**
    - Displays user subscriptions fetched from `/secure/store/[id]/product` on `api.xernerx.com`.
    - Links out to the dedicated Storefront application at `store.xernerx.com`.

## ⚠️ Important Rules & Gotchas

1. **Cross-Subdomain Cookies:** Never hardcode `localhost` in auth callbacks or redirects. Always rely on `useEnvironment().getEnvUrl()` or configured `DOMAIN` variables so cross-subdomain cookies work across `account`, `app`, `admin`, etc.
2. **Localization (`DictionaryProvider` & `t`):** All text in account tabs must use `useDictionary()` (`const { t } = useDictionary()`) under the `account.*` namespace in `packages/lib/src/dictionaries/en-GB.json`. Always inspect `packages/providers/src/DictionaryProvider.tsx` to see how `t(path, variables?)` operates rather than guessing its signature.
3. **Middleware / Proxy (`src/proxy.ts`):** Handles `x-locale` headers and `NEXT_LOCALE` cookies. Preserve locale resolution when modifying request interception.
