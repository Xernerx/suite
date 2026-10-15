<!-- @format -->

# `apps/store` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/store` (`store.xernerx.com`, dev port `4008`) is the dedicated storefront application managing subscriptions, Stripe checkout sessions, and plan cancellations for the Xernerx Suite.

## 🏗️ Key Routes & Architecture

- **`/`:** Central storefront page displaying Consumer passes, Server infrastructure, the Ultra bundle, and Developer API plans.
- **`/[id]/cancel`:** Subscription cancellation page for individual Stripe subscriptions (`sub_...`).
- **`/api/auth/[...nextauth]`:** Local NextAuth session handler.
- **`/api/changelog`:** Application changelog endpoint.
- **`/api/version`:** Version endpoint.

## ⚠️ Important Rules & Gotchas

1. **Strict 3-Route Rule:** `apps/store/src/app/api/` must **only** contain the standard local Next.js API routes (`/api/auth/[...nextauth]`, `/api/changelog`, and `/api/version`). All Stripe checkout, product resolution, and cancellation calls must be routed to `api.xernerx.com/secure/store/*` using `useEnvironment().getEnvUrl('https://api.xernerx.com/secure/store/...')` with `credentials: 'include'`.
2. **File Size Limit:** Keep all files strictly under 500 lines. Break UI sections into reusable sub-components in `src/components/`.
3. **Environment URLs:** Never hardcode localhost or direct URLs. Always resolve URLs via `getEnvUrl()`.
4. **Shared Layout:** Wraps with `SessionProvider`, `AppLayout`, and `PermissionProvider`.
5. **Localization (`DictionaryProvider` & `t`):** Always localize UI strings using `useDictionary()` (`const { t } = useDictionary()`). Inspect `packages/providers/src/DictionaryProvider.tsx` to see how `t(path, variables?)` operates rather than guessing its signature.
