<!-- @format -->

# `@xernerx/lib` — Shared Core Library, Models & i18n

Houses shared client/server utilities, NextAuth configuration, localization dictionaries, and server-only Mongoose models for the Xernerx Suite.

---

## 📦 Entry Points

- **`@xernerx/lib` (Isomorphic / Client-Safe):**
    - `auth`: Shared NextAuth.js configuration (`*.xernerx.com` cookie sharing).
    - `proxy`: Internationalization and subdomain request proxy handler.
    - `i18n.config.ts`: Auto-generated locale registry (`pnpm suite generate-locales`).
- **`@xernerx/lib/server` (Server-Only — guarded by `import 'server-only'`):**
    - `database('xernerx')`: Multi-connection Mongoose connection manager and model registry (`models.core`, `models.users`, `models.bots`, `models.guilds`, `models.organizations`, `models.dispatch`).
    - Server dictionary loader and transactional Postmark email helpers.

> [!IMPORTANT]
> Never import `@xernerx/lib/server` inside `'use client'` components. Client components must communicate through `api.xernerx.com`.
