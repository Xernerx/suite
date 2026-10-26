<!-- @format -->

# Xernerx Suite — Global Agent Guidelines (`AGENTS.md`)

This repository is the **Xernerx Suite** monorepo (`pnpm@11.24.0`, Node `>=20`), housing all core web applications, shared libraries, backend services, native clients, and internal orchestration tooling for **Xernerx Studios**.

---

## 🧭 Workspace Directory & Port Map

| Workspace Path        | Package / Service Name | Dev Port | Subdomain (Public / Canary / Dev)                             | Purpose                                                                                   |
| :-------------------- | :--------------------- | :------- | :------------------------------------------------------------ | :---------------------------------------------------------------------------------------- |
| `apps/www`            | `www`                  | `4000`   | `xernerx.com`                                                 | Marketing showcase, legal (`terms`, `privacy`), applications, desktop download            |
| `apps/api`            | `api`                  | `4001`   | `api.xernerx.com`                                             | Core backend gateway, Bearer token validator, Discord & Stripe webhooks                   |
| `apps/cdn`            | `cdn`                  | `4002`   | `cdn.xernerx.com`                                             | Media pipeline, `@vercel/blob` private storage, `/raw/[id]` streaming                     |
| `apps/account`        | `account`              | `4003`   | `account.xernerx.com`                                         | Identity hub, profile settings, localization, tokens, and billing history                 |
| `apps/app`            | `app`                  | `4004`   | `app.xernerx.com`                                             | User dashboard, bot & server explorer, Virtue settings, live `/overlay`                   |
| `apps/docs`           | `docs`                 | `4005`   | `docs.xernerx.com`                                            | Developer documentation, interactive API specs, package docs reader                       |
| `apps/admin`          | `admin`                | `4006`   | `admin.xernerx.com`                                           | Internal staff portal, RBAC role management, moderation, system config                    |
| `apps/info`           | `info`                 | `4007`   | `info.xernerx.com`                                            | Feedback & support hub (`roadmap`, `suggestions`, `bugs`, `faq`, `changelog`)             |
| `apps/store`          | `store`                | `4008`   | `store.xernerx.com`                                           | Store portal, Virtue subscriptions, add-ons, credits, and checkout                        |
| `apps/portal`         | `portal`               | `4009`   | `portal.xernerx.com`                                          | Developer portal, organizations, bot publishing, slash commands, and webhooks             |
| `apps/hosting`        | `hosting`              | `4010`   | `hosting.xernerx.com`                                         | Staff-only multi-node server hosting & Easypanel infrastructure console (`one/two-dummi`) |
| `packages/components` | `@xernerx/components`  | —        | —                                                             | Shared application shell (`AppLayout`, `Header`, `Sidebar`, `Footer`)                     |
| `packages/feedback`   | `@xernerx/feedback`    | —        | —                                                             | Route feedback & error boundaries (`Loading`, `Error`, `NotFound`)                        |
| `packages/lib`        | `@xernerx/lib`         | —        | —                                                             | Mongoose models, NextAuth, i18n dictionaries, server utilities                            |
| `packages/providers`  | `@xernerx/providers`   | —        | —                                                             | Global React context providers & hooks (`useUser`, `useDictionary`)                       |
| `packages/public`     | —                      | —        | —                                                             | Canonical static branding assets synced across web apps                                   |
| `packages/styles`     | `@xernerx/styles`      | —        | —                                                             | Central Tailwind CSS v4 stylesheet & CSS variable design tokens                           |
| `packages/ui`         | `@xernerx/ui`          | —        | —                                                             | Primitive UI components (`Button`, `Modal`, `Input`, `Selector`, `Toggle`, `Check`, etc.) |
| `services/app`        | `@xernerx/app`         | —        | —                                                             | Xernerx App Discord bot daemon (`@xernerx/framework`) for support, docs, status, and info |
| `services/bot`        | `bot`                  | —        | —                                                             | Xernerx Bot Discord daemon (`@xernerx/framework`) for directory, stats, and guild sync    |
| `services/websocket`  | `websocket`            | `5000`   | —                                                             | Real-time bidirectional WebSocket gateway & microservice router                           |
| `clients/desktop`     | `desktop`              | —        | —                                                             | Electron desktop companion client wrapping `app.xernerx.com`                              |
| `clients/mobile`      | —                      | —        | Placeholder workspace for future cross-platform mobile client |
| `.xernerx/cli`        | `@xernerx/cli`         | —        | —                                                             | Internal `suite` CLI orchestrating dev, locales, env sync, and builds                     |
| `.xernerx/database`   | —                      | `27017`  | —                                                             | Local WiredTiger persistence directory for `mongodb-memory-server`                        |

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

### 3. Styling, Design Language & Tailwind CSS v4 ("Modern Round Glassmorphism Pop")

- The suite uses **Tailwind CSS v4** (`@tailwindcss/postcss`) configured centrally in `packages/styles/globals.css`. **Never create legacy `tailwind.config.js` or `tailwind.config.ts` files.**
- **Core Aesthetic — Modern Round Glassmorphism Pop:**
    - **Rounded Geometry:** Use generous, tactile rounding everywhere—`rounded-3xl` for primary cards, panels, and modals; `rounded-2xl` for inner sub-cards, buttons, and form controls; `rounded-full` for pills, tags, and status badges. Never use sharp or boxy `rounded-sm` / `rounded-md` on cards or interactive controls.
    - **Translucent Glass Surfaces:** Layer surfaces using `bg-(--foreground)/30` or `bg-(--foreground)/40` paired with `backdrop-blur-md`, `border border-(--border)/10`, and soft elevation (`shadow-sm` or subtle accent glow `shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]`). Inner recessed wells use `bg-(--background)/50` or `bg-(--background)/60` with `border border-(--border)/10`.
    - **Favor `var(--accent)` at All Times:** The user's chosen `--accent` color is the primary visual identity across the entire suite. Always use `bg-(--accent)`, `text-(--accent)`, `border-(--accent)/30`, `bg-(--accent)/10`, and `hover:bg-(--hover-accent)` for active states, highlights, icons, pills, and interactive flourishes. **Never introduce off-palette rainbow Tailwind colors (`purple-500`, `blue-500`, `sky-500`, `amber-500`, `orange-500`, `#5865F2`, etc.) for decorative UI elements.** Reserve `--accent-green`, `--accent-orange`, and `--accent-red` strictly for semantic status, warning, and danger states.
    - **Full Light & Dark Mode Compatibility:** Never hardcode dark-only or light-only surface colors (`bg-black`, `bg-zinc-900`, `text-white` on non-accent backgrounds, `border-white/10`). Always use theme-aware CSS custom properties (`--background`, `--foreground`, `--text`, `--text-muted`, `--border`) so every component adapts seamlessly between Light and Dark themes.
    - **Custom UI & Text Scaling Support:** Respect user-configured scaling (`--ui-gap`, `--ui-scale`, `--text-scale`) across all views. Use `style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}` (or `gap-(--ui-gap)` / `p-(--ui-gap)` and `calc(var(--ui-gap) * ...)`) for layout spacing rather than rigid fixed pixel spacing.
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
- **Delete Existing Translations Across Other Languages When Updating or Removing a Key in `en-GB.json`:**
    - Whenever an existing translation key's value is updated (or deleted) in `packages/lib/src/dictionaries/en-GB.json`, you **must** delete that corresponding key path from all other locale dictionary files (`packages/lib/src/dictionaries/*.json` excluding `en-GB.json`, such as `en-US.json`, `es.json`, `fr.json`, `nl.json`, `ru.json`, `se.json`, pruning any resulting empty parent objects).
    - This prevents non-English locales from serving stale/outdated translations, ensures `DictionaryProvider` immediately falls back to the updated `en-GB.json` text, and queues the modified key as untranslated in the Admin Translations portal (`apps/admin`).
- Never manually edit `packages/lib/src/i18n.config.ts`; it is auto-generated by `pnpm suite generate-locales`.

### 5. Client / Server Boundary Isolation & Universal Privacy Truth

- Server-only modules (Mongoose models, database connection, Postmark mailers, server dictionaries) live in `@xernerx/lib/server` (guarded by `import 'server-only'`).
- **Never import `@xernerx/lib/server` inside `'use client'` components.** Client components must fetch or mutate data via `api.xernerx.com` endpoints using `useEnvironment().getEnvUrl()`.
- **Universal 3-Tier Privacy Truth (`public` | `limited` | `private`):**
    - **`public` (Listed & Publicly Accessible):** Displayed in public directories, explorers, leaderboards, and search results, and accessible by anyone.
    - **`limited` (Unlisted / Direct-Link Access):** Not private, but **never** listed in public directories, explorers, leaderboards, or search results. Accessible by anyone who has the direct link or ID.
    - **`private` (Hard Private / Owner Only):** Strictly private—never listed and **no one** except the owner (or explicitly authorized co-owners/organization members) can view or access it, even with a direct link or ID.
    - **Applies Everywhere:** This 3-tier privacy truth applies universally across the entire suite—all Next.js web applications (`apps/*`), API routes (`apps/api`), CDN media (`apps/cdn`), Users, Bots, Servers/Guilds, Organizations, WebSocket services (`services/websocket`), and Discord bots (`services/bot`).

### 6. Frontend Application Architecture (`apps/*`)

- **Reuse Shared UI First:** Before rendering custom UI elements, always check `@xernerx/ui` and `@xernerx/components` for existing primitives and components.
- **Form Controls (`Input.tsx`, `Selector.tsx`, `MultiSelector.tsx`, `Toggle.tsx`, `Check.tsx`):**
    - Never render raw native `<input type="text">`, `<input type="number">`, `<textarea>`, `<select>`, or `<input type="checkbox">` elements for standard form controls.
    - Always use `<Input />`, `<Input variant="textarea" />`, `<Selector />`, `<MultiSelector />`, `<Toggle />`, and `<Check />` from `@xernerx/ui`.
    - **`<Toggle />` vs `<Check />`:** Use `<Toggle />` (`Toggle.tsx`) strictly for **On / Off** boolean state switches (enabling or disabling a setting/feature). Use `<Check />` (`Check.tsx`) strictly for **selecting** items (multi-select cards, list selection, checkboxes, and option selection).
- **No Native Browser Dialogs (`prompt()`, `confirm()`, `alert()`):**
    - **NEVER EVER use `window.prompt()` / `prompt()`, `window.confirm()` / `confirm()`, or `window.alert()` / `alert()` for anything.**
    - Always use `<Modal />` + `<Input />` from `@xernerx/ui` instead of `prompt()`, `<Confirm />` from `@xernerx/ui` instead of `confirm()`, and `useToast().toast()` from `@xernerx/providers` instead of `alert()`.
- **Search Inputs, Command Palette & Global Shortcuts (`Input.tsx` & `ShortcutsProvider.tsx`):**
    - Never build custom search input markup or bind conflicting keyboard shortcuts (such as `Ctrl + /`, which is reserved for the global Help modal, or `Ctrl + ~` which collides with browser shortcuts).
    - Always use `<Input variant="search" shortcut={true} ... />` (or `shortcut="K"`) from `@xernerx/ui` for page-level search bars so they adhere to the global `Ctrl + K` search shortcut. When no page-level search bar is mounted (or when pressing `Ctrl + Shift + K`), `Ctrl + K` opens the global Command Palette (`CommandPaletteModal.tsx`).
    - Respect all global shortcuts (`Ctrl + /` Help, `Ctrl + K` Search / Command Palette, `Ctrl + Space` / `Alt + A` App Drawer Navigation, `Ctrl + B` Sidebar toggle, `Ctrl + .` URL Omnibar, `Ctrl + I` Notifications, `Ctrl + ,` Account Settings, `Ctrl + S` / `Ctrl + Enter` Save unsaved changes, `Alt + R` Reset unsaved changes, `Alt + 1..9` Switch sidebar views, `Ctrl + Shift + C` Copy URL, `Esc` Close modals/popovers) and register any custom view shortcuts via `useShortcuts().registerShortcut()`.
- **500-Line Inline Code Cap:** Any `page.tsx` or component file exceeding 500 lines of inline UI/JSX code must be broken down into sub-components (a file >500 lines that mainly composes imported components is fine).
- **Strict `src/components/` Placement:** All app-specific components must be housed in `apps/<app>/src/components/` (next to `src/app/`), **never** co-located inside `src/app/` route folders.
- **Strict 3-Route Local `/api` Rule:** Frontend apps may only house `/api/auth/[...nextauth]`, `/api/changelog`, and `/api/version` locally (with the sole exception of `/api/connections/[provider]` and `/api/connections/[provider]/callback` on `apps/account` for linking secondary OAuth connections to an already-authenticated Discord account). All other backend endpoints (including Stripe store routes) must live in `apps/api` (`api.xernerx.com/secure/*` or `/v1/*`).

### 7. Cross-Workspace Synchronization & Living Documentation

- **Keep `www/download` Conformant with Live App UI & Layout:**
    - Whenever any change is made to the application UI, layout, header, sidebar, window controls, overlay, or core shell (`@xernerx/components`, `@xernerx/ui`, `apps/app`, or `clients/desktop`), you **must** update `apps/www/src/app/download/page.tsx` (`apps/www/src/components/DesktopInteractivePreview.tsx` and `DesktopPerksBento.tsx`) so the interactive desktop preview and feature showcase stay 100% conformant with how the actual app looks and behaves.
- **Keep `apps/docs` Synced with All API & WebSocket Changes:**
    - Whenever adding, modifying, or deleting any API routes (`apps/api/src/app/{v1,core,secure,info}/**` or `apps/cdn`) or WebSocket services/actions (`services/websocket/src/app/**`), you **must** update the documentation in `apps/docs` (`apps/docs/src/app/api/[version]/page.tsx`, `apps/docs/src/components/V1PlatformEndpoints.tsx`, `apps/docs/src/components/CdnEndpoints.tsx`, `apps/docs/src/app/websocket/page.tsx`, and `packages/lib/src/dictionaries/en-GB.json` under `docs.*`) as well as the public docs catalog blueprints in `apps/api/src/lib/docsBlueprints*.ts`.
- **Proactively Update the FAQ (`apps/info/faq` & `/core/faq`):**
    - Whenever shipping a new feature, altering a user-facing workflow, changing limits/permissions/shortcuts, or making any change where a user question may be forthcoming, you **must** proactively update or add the relevant entries in the FAQ (`apps/info/src/components/faq/*`, `packages/lib/src/dictionaries/en-GB.json` under `info.faq.*`, and the public FAQ API blueprints in `apps/api/src/lib/faqBlueprints*.ts`).

### 8. Public API Versioning & Breaking-Change Policy (`/v1/*` → `/v2/*`)

- **Additive (Non-Breaking) Changes Stay in Current Version (`/v1/*`):**
    - Adding a brand-new endpoint (e.g., `POST /v1/bots/[id]/releases`), adding a new **optional** request field/query parameter, or adding a new property to a JSON response object are **non-breaking** and belong in the active version (`/v1/*`).
- **Breaking Changes Require a New Version (`/v2/*`):**
    - **Never make breaking changes in-place to existing `/v1/*` (or any published `/vN/*`) routes.**
    - A change is **breaking** if it:
        1. Removes or renames an existing JSON response field.
        2. Changes a field's data type or format (e.g., `number` → `array` or timestamp `number` → ISO `string`).
        3. Makes a previously optional request field or parameter `required`.
        4. Changes the response envelope structure (e.g., `[...]` → `{ data: [...] }`).
        5. Removes an endpoint or changes its authentication/permission requirements.
    - When a breaking change is required on a public developer endpoint:
        1. Create the new version route under `apps/api/src/app/v2/...` (re-exporting unchanged handlers from `v1` rather than duplicating code).
        2. Keep the `/v1/...` route functioning as a backward-compatible adapter for existing SDKs (`@xernerx/stats`, `@xernerx/framework`) and bots, and attach standard deprecation headers (`X-API-Version: v1`, `Deprecation: true`, `Sunset: <ISO-Date>`).
        3. Register the new version (`v2`) in `apps/docs/src/app/api/[version]/page.tsx` and `apps/api/src/lib/docsBlueprints*.ts`.
- **Internal Suite Endpoints (`/secure/*` & `/core/*`):**
    - Because internal `/secure/*` and `/core/*` routes are consumed by monorepo apps deployed in lockstep, they do not use `/vN/` URL prefixes, provided all monorepo callers (including `clients/desktop`) are updated in the same change.
