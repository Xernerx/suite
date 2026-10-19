<!-- @format -->

# Xernerx Suite — Global Agent Guidelines (`AGENTS.md`)

This repository is the **Xernerx Suite** monorepo (`pnpm@11.24.0`, Node `>=20`), housing all core web applications, shared libraries, backend services, native clients, and internal orchestration tooling for **Xernerx Studios**.

---

## 🧭 Workspace Directory & Port Map

| Workspace Path        | Package / Service Name | Dev Port | Subdomain (Public / Canary / Dev) | Purpose                                                                          |
| :-------------------- | :--------------------- | :------- | :-------------------------------- | :------------------------------------------------------------------------------- |
| `apps/www`            | `www`                  | `4000`   | `xernerx.com`                     | Marketing showcase, legal (`terms`, `privacy`), applications, desktop download   |
| `apps/api`            | `api`                  | `4001`   | `api.xernerx.com`                 | Core backend gateway, Bearer token validator, Discord & Stripe webhooks          |
| `apps/cdn`            | `cdn`                  | `4002`   | `cdn.xernerx.com`                 | Media pipeline, `@vercel/blob` private storage, `/raw/[id]` streaming            |
| `apps/account`        | `account`              | `4003`   | `account.xernerx.com`             | Identity hub, profile settings, localization, tokens, and billing history        |
| `apps/app`            | `app`                  | `4004`   | `app.xernerx.com`                 | User dashboard, bot & server explorer, Virtue settings, dev `/portal`            |
| `apps/docs`           | `docs`                 | `4005`   | `docs.xernerx.com`                | Developer documentation, interactive API specs, package docs reader              |
| `apps/admin`          | `admin`                | `4006`   | `admin.xernerx.com`               | Internal staff portal, RBAC role management, moderation, system config           |
| `apps/info`           | `info`                 | `4007`   | `info.xernerx.com`                | Feedback & support hub (`roadmap`, `suggestions`, `bugs`, `faq`, `changelog`)    |
| `apps/store`          | `store`                | `4008`   | `store.xernerx.com`               | Store portal, Virtue subscriptions, add-ons, credits, and checkout               |
| `packages/components` | `@xernerx/components`  | —        | —                                 | Shared application shell (`AppLayout`, `Header`, `Sidebar`, `Footer`)            |
| `packages/feedback`   | `@xernerx/feedback`    | —        | —                                 | Route feedback & error boundaries (`Loading`, `Error`, `NotFound`)               |
| `packages/lib`        | `@xernerx/lib`         | —        | —                                 | Mongoose models, NextAuth, i18n dictionaries, server utilities                   |
| `packages/providers`  | `@xernerx/providers`   | —        | —                                 | Global React context providers & hooks (`useUser`, `useDictionary`)              |
| `packages/public`     | —                      | —        | —                                 | Canonical static branding assets synced across web apps                          |
| `packages/styles`     | `@xernerx/styles`      | —        | —                                 | Central Tailwind CSS v4 stylesheet & CSS variable design tokens                  |
| `packages/ui`         | `@xernerx/ui`          | —        | —                                 | Primitive UI components (`Button`, `Modal`, `Input`, `Selector`, `Toggle`, etc.) |
| `services/bot`        | `bot`                  | —        | —                                 | Discord bot daemon (`@xernerx/framework`) syncing guilds and members             |
| `services/websocket`  | `websocket`            | `5000`   | —                                 | Real-time bidirectional WebSocket gateway & microservice router                  |
| `clients/desktop`     | `desktop`              | —        | —                                 | Electron desktop companion client wrapping `app.xernerx.com`                     |
| `clients/mobile`      | —                      | —        | —                                 | Placeholder workspace for future cross-platform mobile client                    |
| `.xernerx/cli`        | `@xernerx/cli`         | —        | —                                 | Internal `suite` CLI orchestrating dev, locales, env sync, and builds            |
| `.xernerx/database`   | —                      | `27017`  | —                                 | Local WiredTiger persistence directory for `mongodb-memory-server`               |

---

## 🛠️ Non-Negotiable Engineering Rules

### 1. Package Management & Orchestration (`suite` CLI)

- **Strictly use `pnpm`** for package management. Never use `npm install` or `yarn`.
- Use the internal `suite` CLI (`pnpm suite <command>` or `pnpm dev` / `pnpm build`) for workspace-wide orchestration:
    - `pnpm suite generate-locales`: Regenerates `packages/lib/src/i18n.config.ts` from JSON dictionaries.
    - `pnpm suite initialize`: Syncs static files from `packages/public` into each app's `public/` directory.
    - `pnpm suite commit`: Formats code, checks for legal policy updates (`TERMS_VERSION` / `PRIVACY_VERSION`), and creates changesets.
- **Environment Syncing:** Root `.env` is propagated automatically to sub-packages by `suite dev` / `suite init`. Place new shared environment keys in root `.env` and `.env.example`.

### 2. Code Formatting & File Headers

- Every TypeScript/JavaScript/CSS file must start with the `/** @format */` (or `<!-- @format -->` in Markdown) header comment.
- Prettier rules (`.prettierrc`):
    - Tabs for indentation (`useTabs: true`, `tabWidth: 4`).
    - Single quotes (`singleQuote: true`).
    - Semicolons required (`semi: true`).
    - Print width `200`, `es5` trailing commas.

### 3. Styling & Tailwind CSS v4

- The suite uses **Tailwind CSS v4** (`@tailwindcss/postcss`) configured centrally in `packages/styles/globals.css`. **Never create legacy `tailwind.config.js` or `tailwind.config.ts` files.**
- Use CSS custom property tokens via Tailwind v4 syntax instead of hardcoded colors:
    - Backgrounds & surfaces: `bg-(--background)`, `bg-(--foreground)`, `bg-(--foreground)/30`
    - Text: `text-(--text)`, `text-(--text-muted)`
    - Borders: `border-(--border)/10`, `border-(--accent)`
    - Accents: `bg-(--accent)`, `hover:bg-(--hover-accent)`, `text-(--accent)`
    - Spacing: `gap-(--ui-gap)`, `p-(--ui-gap)`
- Display headings use `style={{ fontFamily: 'var(--font-fredoka)' }}`.

### 4. Localization (`DictionaryProvider` & `useDictionary`)

- **Always use `DictionaryProvider` & `useDictionary()`:** Never hardcode user-facing UI strings in applications or shared components. Always consume `const { t } = useDictionary();` from `@xernerx/providers`.
- **Inspect `t()` Before Using — Never Guess Its Signature:**
    - Always inspect [`packages/providers/src/DictionaryProvider.tsx`](./packages/providers/src/DictionaryProvider.tsx) to see how `t` actually operates rather than assuming third-party i18n conventions.
    - `t` has the signature `t(path: string, variables?: Record<string, string | number>)`:
        1. Resolves `path` (dot-separated, e.g. `'account.store.title'`) against `dictionary.dictionary` (active locale).
        2. Automatically falls back to `dictionary.fallbackDictionary` (`en-GB.json`) if undefined.
        3. Returns the raw `path` string if missing from both.
        4. Interpolates `{key}` placeholders using the optional 2nd `variables` object (e.g. `t('welcome.user', { name: 'Alex' })`).
    - **Do NOT pass a 3rd fallback string argument** (e.g., `t('key', {}, 'Fallback')` is invalid—there is no 3rd parameter). Instead, always add the key directly to `packages/lib/src/dictionaries/en-GB.json`.
- **`packages/lib/src/dictionaries/en-GB.json` is the primary source of truth** for localization keys.
- Never manually edit `packages/lib/src/i18n.config.ts`; it is auto-generated by `pnpm suite generate-locales`.

### 5. Client / Server Boundary Isolation

- Server-only modules (Mongoose models, database connection, Postmark mailers, server dictionaries) live in `@xernerx/lib/server` (guarded by `import 'server-only'`).
- **Never import `@xernerx/lib/server` inside `'use client'` components.** Client components must fetch or mutate data via `api.xernerx.com` endpoints using `useEnvironment().getEnvUrl()`.

### 6. Frontend Application Architecture (`apps/*`)

- **Reuse Shared UI First:** Before rendering custom UI elements, always check `@xernerx/ui` and `@xernerx/components` for existing primitives and components.
- **Form Controls (`Input.tsx`, `Selector.tsx`, `MultiSelector.tsx`, `Toggle.tsx`):**
    - Never render raw native `<input type="text">`, `<input type="number">`, `<textarea>`, `<select>`, or `<input type="checkbox">` elements for standard form controls.
    - Always use `<Input />`, `<Input variant="textarea" />`, `<Selector />`, `<MultiSelector />`, and `<Toggle />` from `@xernerx/ui`.
- **Search Inputs, Command Palette & Global Shortcuts (`Input.tsx` & `ShortcutsProvider.tsx`):**
    - Never build custom search input markup or bind conflicting keyboard shortcuts (such as `Ctrl + /`, which is reserved for the global Help modal, or `Ctrl + ~` which collides with browser shortcuts).
    - Always use `<Input variant="search" shortcut={true} ... />` (or `shortcut="K"`) from `@xernerx/ui` for page-level search bars so they adhere to the global `Ctrl + K` search shortcut. When no page-level search bar is mounted (or when pressing `Ctrl + Shift + K`), `Ctrl + K` opens the global Command Palette (`CommandPaletteModal.tsx`).
    - Respect all global shortcuts (`Ctrl + /` Help, `Ctrl + K` Search / Command Palette, `Ctrl + Space` / `Alt + A` App Drawer Navigation, `Ctrl + B` Sidebar toggle, `Ctrl + .` URL Omnibar, `Ctrl + I` Notifications, `Ctrl + ,` Account Settings, `Ctrl + S` / `Ctrl + Enter` Save unsaved changes, `Alt + R` Reset unsaved changes, `Alt + 1..9` Switch sidebar views, `Ctrl + Shift + C` Copy URL, `Esc` Close modals/popovers) and register any custom view shortcuts via `useShortcuts().registerShortcut()`.
- **500-Line Inline Code Cap:** Any `page.tsx` or component file exceeding 500 lines of inline UI/JSX code must be broken down into sub-components (a file >500 lines that mainly composes imported components is fine).
- **Strict `src/components/` Placement:** All app-specific components must be housed in `apps/<app>/src/components/` (next to `src/app/`), **never** co-located inside `src/app/` route folders.
- **Strict 3-Route Local `/api` Rule:** Frontend apps may only house `/api/auth/[...nextauth]`, `/api/changelog`, and `/api/version` locally. All other backend endpoints (including Stripe store routes) must live in `apps/api` (`api.xernerx.com/secure/*` or `/v1/*`).
