<!-- @format -->

# `apps/admin` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/admin` (`admin.xernerx.com`, dev port `4006`) is the restricted internal staff and administration console for user moderation, RBAC role management, staff application reviews, translation management, roadmap/suggestions/issues curation, and system configuration.

## 🏗️ Architecture & Routing Conventions

- **Permission-Driven View Switcher (`/`):**
    - Like `apps/account`, the main console (`src/app/page.tsx`) is a single-page view switcher controlled by `useSidebar().view`.
    - Views include: `media`, `translations`, `users`, `applications_review`, `applications_manage`, `roles`, `tokens`, `settings`, `invites`, `announcements`, `roadmap`, `suggestions`, `issues`.
    - Every view and action must enforce role-based access control (RBAC) via `usePermission()` / `@xernerx/lib` permission flags.
- **Bootstrap Route (`/setup/[...key]`):**
    - Visiting `/setup/<NEXTAUTH_SECRET>` while authenticated bootstraps the master `owner` role in MongoDB with full permissions and assigns it to the current user. Do not weaken the `NEXTAUTH_SECRET` check on this route.

## ⚠️ Important Rules & Gotchas

1. **`admin_server_id` Dependency:** Several management panels (`users`, `roles`, `tokens`, `translations`, `applications`) require the `admin_server_id` core setting to be configured before they activate.
2. **Backend Mutations:** All administrative mutations should go through protected `/secure/core/*` or `/secure/dispatch/*` endpoints on `api.xernerx.com` with proper role/permission verification.
3. **Localization (`DictionaryProvider` & `t`):** Place all admin UI copy under the `admin.*` namespace in `packages/lib/src/dictionaries/en-GB.json` and consume via `const { t } = useDictionary()`. Always inspect `packages/providers/src/DictionaryProvider.tsx` to see how `t(path, variables?)` operates rather than guessing its signature.
