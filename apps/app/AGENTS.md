<!-- @format -->

# `apps/app` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/app` (`app.xernerx.com`, dev port `4004`) is the primary user-facing application, hosting the Discord Bot & Server Explorer (`/`), Server Management Dashboard (`/dashboard`), Live Overlay (`/overlay`), and public User/Organization/Bot/Server profiles (`/users/[id]`, `/organization/[id]`, `/bots/[id]`, `/servers/[id]`). Note: the Developer Portal now lives in its own dedicated workspace `apps/portal` (`portal.xernerx.com`, dev port `4009`), with `/portal` on `apps/app` acting as a backward-compatible redirect.

## 🏗️ Key Routes & Architecture

- **Explorer (`/`, `/bots`, `/bots/[id]`, `/servers`, `/servers/[id]`):**
    - Public discovery hub featuring Promoted, Top Voted, Biggest, and Newcomer listings.
    - Syncs active explorer mode (`bots` vs `servers`) to `localStorage('explore-context')`.
- **Dashboard (`/dashboard`):**
    - Authenticated workspace for configuring Discord servers (Virtue moderation/utility modules, statistics, links, webhooks).
- **Portal Redirect (`/portal`, `/portal/bots/[id]`):**
    - Lightweight backward-compatible redirects to `https://portal.xernerx.com` (`:4009`).

## ⚠️ Important Rules & Gotchas

1. **Desktop Client Platform Redirection:**
    - Check `usePlatform()`. When `type === 'application'` (running inside the Electron desktop wrapper `clients/desktop`), visiting `/` automatically redirects the user to `/dashboard`. Preserve this behavior when modifying the landing page.
2. **Environment-Aware API Calls:**
    - Always build API URLs using `useEnvironment().getEnvUrl('api', '/secure/...')` so requests route accurately across `public`, `canary`, and `dev` environments.
3. **Universal 3-Tier Privacy Truth (`public` | `limited` | `private`):**
    - **`public`:** Listed in public explorers/leaderboards/search and accessible by anyone.
    - **`limited`:** Never listed in public explorers/leaderboards/search, but accessible by anyone with the direct link or ID (`/bots/[id]`, `/servers/[id]`, `/users/[id]`, `/organization/[id]`).
    - **`private`:** Hard private—never listed and strictly inaccessible to anyone except the owner (or authorized co-owners/organization members), even with a direct link or ID.
4. **Localization (`DictionaryProvider` & `t`):**
    - Use `useDictionary()` (`app.*` namespace in `packages/lib/src/dictionaries/en-GB.json`) for all UI labels, empty states, and toast messages. Always inspect `packages/providers/src/DictionaryProvider.tsx` to verify how `t(path, variables?)` operates rather than guessing its signature.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
