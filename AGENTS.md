<!-- @format -->

# Xernerx Suite — Global Agent Guidelines (`AGENTS.md`)

This repository is the **Xernerx Suite** monorepo (`pnpm@11.24.0`, Node `>=20`), housing all core web applications, shared libraries, backend services, native clients, and internal orchestration tooling for **Xernerx Studios**.

---

## 🧭 Workspace Directory & Port Map

| Workspace Path        | Package / Service Name | Dev Port | Subdomain (Public / Canary / Dev)                             | Purpose                                                                                                          |
| :-------------------- | :--------------------- | :------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| `apps/www`            | `www`                  | `4000`   | `xernerx.com`                                                 | Marketing showcase, legal & security (`terms`, `privacy`, `cookies`, `security`), applications, desktop download |
| `apps/api`            | `api`                  | `4001`   | `api.xernerx.com`                                             | Core backend gateway, Bearer token validator, Discord & Stripe webhooks                                          |
| `apps/cdn`            | `cdn`                  | `4002`   | `cdn.xernerx.com`                                             | Media pipeline, `@vercel/blob` private storage, `/raw/[id]` streaming                                            |
| `apps/account`        | `account`              | `4003`   | `account.xernerx.com`                                         | Identity hub, profile settings, localization, tokens, and billing history                                        |
| `apps/app`            | `app`                  | `4004`   | `app.xernerx.com`                                             | User dashboard, bot & server explorer, Virtue settings, live `/overlay`                                          |
| `apps/docs`           | `docs`                 | `4005`   | `docs.xernerx.com`                                            | Developer documentation, interactive API specs, package docs reader                                              |
| `apps/admin`          | `admin`                | `4006`   | `admin.xernerx.com`                                           | Internal staff portal, RBAC role management, moderation, system config                                           |
| `apps/info`           | `info`                 | `4007`   | `info.xernerx.com`                                            | Feedback & support hub (`roadmap`, `suggestions`, `bugs`, `faq`, `changelog`)                                    |
| `apps/store`          | `store`                | `4008`   | `store.xernerx.com`                                           | Store portal, Virtue subscriptions, add-ons, credits, and checkout                                               |
| `apps/portal`         | `portal`               | `4009`   | `portal.xernerx.com`                                          | Developer portal, organizations, bot publishing, slash commands, and webhooks                                    |
| `apps/hosting`        | `hosting`              | `4010`   | `hosting.xernerx.com`                                         | Staff-only multi-node server hosting & Easypanel infrastructure console (`one/two-dummi`)                        |
| `apps/haste`          | `haste`                | `4011`   | `haste.xernerx.com`                                           | First-party Hastebin-compatible code pastebin, TTL expirations, and `/raw/[id]` streaming                        |
| `apps/blog`           | `blog`                 | `4012`   | `blog.xernerx.com`                                            | Official newsroom, security & engineering deep-dives, product announcements, and `/rss.xml` feed                 |
| `packages/components` | `@xernerx/components`  | —        | —                                                             | Shared application shell (`AppLayout`, `Header`, `Sidebar`, `Footer`)                                            |
| `packages/feedback`   | `@xernerx/feedback`    | —        | —                                                             | Route feedback & error boundaries (`Loading`, `Error`, `NotFound`)                                               |
| `packages/lib`        | `@xernerx/lib`         | —        | —                                                             | Mongoose models, NextAuth, i18n dictionaries, server utilities                                                   |
| `packages/providers`  | `@xernerx/providers`   | —        | —                                                             | Global React context providers & hooks (`useUser`, `useDictionary`)                                              |
| `packages/public`     | —                      | —        | —                                                             | Canonical static branding assets synced across web apps                                                          |
| `packages/styles`     | `@xernerx/styles`      | —        | —                                                             | Central Tailwind CSS v4 stylesheet & CSS variable design tokens                                                  |
| `packages/ui`         | `@xernerx/ui`          | —        | —                                                             | Primitive UI components (`Button`, `Modal`, `Input`, `Selector`, `Toggle`, `Check`, etc.)                        |
| `services/app`        | `@xernerx/app`         | —        | —                                                             | Xernerx App Discord bot daemon (`@xernerx/framework`) for support, docs, status, and info                        |
| `services/bot`        | `bot`                  | —        | —                                                             | Xernerx Bot Discord daemon (`@xernerx/framework`) for directory, stats, and guild sync                           |
| `services/websocket`  | `websocket`            | `5000`   | —                                                             | Real-time bidirectional WebSocket gateway & microservice router                                                  |
| `clients/desktop`     | `desktop`              | —        | —                                                             | Electron desktop companion client wrapping `app.xernerx.com`                                                     |
| `clients/mobile`      | —                      | —        | Placeholder workspace for future cross-platform mobile client |
| `.xernerx/cli`        | `@xernerx/cli`         | —        | —                                                             | Internal `suite` CLI orchestrating dev, locales, env sync, and builds                                            |
| `.xernerx/database`   | —                      | `27017`  | —                                                             | Local WiredTiger persistence directory for `mongodb-memory-server`                                               |

---

## 🛠️ Non-Negotiable Engineering Rules

### 1. Package Management & Orchestration (`suite` CLI)

- **Strictly use `pnpm`** for package management. Never use `npm install` or `yarn`.
- Use the internal `suite` CLI (`pnpm suite <command>` or `pnpm dev` / `pnpm build`) for workspace-wide orchestration:
    - `pnpm suite generate-locales`: Regenerates `packages/lib/src/i18n.config.ts` from JSON dictionaries.
    - `pnpm suite initialize`: Syncs static files from `packages/public` into each app's `public/` directory.
    - `pnpm suite commit`: Formats code, checks for legal & security policy updates (`TERMS_VERSION` / `PRIVACY_VERSION` / `COOKIES_VERSION` / `/security` review date), and creates changesets.
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
    - **Favor `var(--accent)` at All Times:** The user's chosen `--accent` color is the primary visual identity across the entire suite. Always use `bg-(--accent)`, `text-(--accent)`, `border-(--accent)/30`, `bg-(--accent)/10`, and `hover:bg-(--hover-accent)` for active states, highlights, icons, pills, and interactive flourishes. **Never introduce off-palette rainbow Tailwind colors (`purple-500`, `blue-500`, `sky-500`, `amber-500`, `orange-500`, `#5865F2`, etc.) for decorative UI elements** (with the sole exception of top-3 leaderboard podium ranks: `#1` Gold `amber-400`/`amber-500`, `#2` Silver `slate-300`/`slate-400`, and `#3` Bronze `amber-600`/`amber-700`). Reserve `--accent-green`, `--accent-orange`, and `--accent-red` strictly for semantic status, warning, and danger states.
    - **Full Light & Dark Mode Compatibility:** Never hardcode dark-only or light-only surface colors (`bg-black`, `bg-zinc-900`, `text-white` on non-accent backgrounds, `border-white/10`). Always use theme-aware CSS custom properties (`--background`, `--foreground`, `--text`, `--text-muted`, `--border`) so every component adapts seamlessly between Light and Dark themes.
    - **Custom UI, Text & Page-Width Scaling Support (`--page-width`, `--ui-gap`, `--ui-scale`, `--text-scale`):** Respect user-configured layout and text scaling across all views. Always constrain primary page and view containers using `max-w-(--page-width) mx-auto w-full` rather than hardcoded Tailwind widths (`max-w-7xl`, `max-w-6xl`, `max-w-[1400px]`, etc.) so the entire suite responds dynamically to the user's `--page-width` preference. Use `style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}` (or `gap-(--ui-gap)` / `p-(--ui-gap)` and `calc(var(--ui-gap) * ...)`) for layout spacing rather than rigid fixed pixel spacing.
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
- **Keep Legal & Security Pages (`/terms`, `/privacy`, `/cookies`, `/security`) Conformant with the Monorepo:**
    - Whenever any change is made to authentication, session cookies, `localStorage` keys, Desktop App storage/features, Discord bot capabilities or telemetry (`Virtue`, `To-Do List Bot`, `Metamorphosis`, `Zodiac`), API/WebSocket security, CDN/Haste storage, Stripe billing, Credit Store perks/unlocks, or privacy/data controls, you **must** audit and update `apps/www/src/app/{terms,privacy,cookies,security}/page.tsx` and their dictionary strings in `packages/lib/src/dictionaries/en-GB.json` (`www.terms.*`, `www.privacy.*`, `www.cookies.*`, `www.security.*`) so every statement on those four pages remains 100% accurate to what is happening in the codebase.
- **Keep Global Command Palette (`Ctrl + K`) & Deep Search Synced with All New Pages & Features:**
    - Whenever introducing a new page, route, studio, setting tab, Credit Store category, or user/developer/admin feature anywhere in the suite (such as `/security`, `/cookies`, Profile Cosmetics Studio, Stage Render Forms, Ambient Canvas Scenes, Cursor FX, or Desktop App Icon Crests), you **must** register it in `packages/providers/src/commandPaletteCatalog.ts` (`SUITE_DEEP_PORTALS`, `ACCOUNT_DEEP_FEATURES`, `ACCOUNT_TABS`, `STORE_DEEP_LINKS`, `SUPPORT_PORTALS`, `ADMIN_TABS`), `packages/components/src/HeaderOmnibar.tsx` (`SUBDOMAIN_ROUTES`), and `apps/www/src/components/WwwDeepSearch.tsx` so `Ctrl + K` (and `Ctrl + Shift + K`) surfaces every new feature immediately across the suite.

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

### 9. Audience Segmentation: End-User vs. Developer vs. Internal Updates

Always maintain a strict separation between **End-User**, **Developer**, and **Internal (Staff / Infrastructure)** updates across UI feature placement, changesets (`CHANGELOG.md`), announcements, and documentation:

| Tier                     | Target Workspaces & Surfaces                                                                                        | Audience                                                                                          | What Belongs Here & Tone Guidelines                                                                                                                                                                                                                                                                                                                          |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. End-User Updates**  | `apps/www`, `apps/app`, `apps/account`, `apps/store`, `apps/info`, `apps/haste`, `apps/cdn`, `clients/desktop`      | Community members, voters, server members, To-Do List Bot / Virtue / Metamorphosis / Zodiac users | **Consumer-first & benefit-driven.** Public profiles, bot/server discovery, voting, leaderboards, user settings, subscriptions, credits, and desktop/overlay UX. Never expose raw developer embed snippets, webhook secrets, or internal source file paths (`packages/lib/...`) in end-user UI or consumer changelogs.                                       |
| **2. Developer Updates** | `apps/portal`, `apps/docs`, `apps/api` (`/v1/*`), `services/websocket`, `@xernerx/*` SDKs & NPM packages            | Bot owners, organization managers, API consumers, SDK integrators                                 | **Technical & actionable.** Bot publishing, slash command syncing, webhook delivery logs, embeddable widget code generators (`<iframe>` / SVG / Markdown), `/v1/*` API endpoints, rate limits, and SDK documentation (`apps/docs`). Keep developer tooling in `portal` and `docs` rather than cluttering public `app` views.                                 |
| **3. Internal Updates**  | `apps/admin`, `apps/hosting`, `.xernerx/cli`, `/secure/admin/*`, `/secure/core/*`, internal DB / compiler refactors | Xernerx Studios staff, moderators, translators, infrastructure engineers                          | **Operational & internal-only.** RBAC role management, moderation queues, translation portals, Easypanel node orchestration (`one/two-dummi`), audit logs, and monorepo/CLI refactors (e.g., Mongoose deprecations, Next.js build fixes). Never surface internal staff tools or pure code-hygiene refactors as end-user announcements or consumer FAQ items. |

- **Strict 1-App-Per-Changeset Rule & Mandatory Changelog Structure (`.changeset/*.md` & `CHANGELOG.md`):**
    - **Every modified app, service, or package MUST have its own separate `.changeset/<pkg-name>.md` file.** Never list two or more apps/packages in the YAML frontmatter of a single `.changeset/*.md` file—each app's `CHANGELOG.md` must only ever contain changes made to that specific app.
    - **Mandatory Changelog Format:** Always build every changelog / `.changeset/*.md` entry with the following exact Markdown structure (omitting empty `### Added`, `### Changed`, or `### Deleted` sections when not applicable):
        ```markdown
        ## Title

        Shortdescription

        ### Added

        - **Feature Name**: Detailed description of what was added.

        ### Changed

        - **Updated Feature**: Detailed description of what was updated or improved.

        ### Deleted

        - **Removed Feature**: Detailed description of what was removed.
        ```
    - Write **End-User** app changelogs (`app`, `www`, `blog`, `account`, `store`, `info`, `haste`, `cdn`, `desktop`) in clean, user-friendly language describing what changed for that specific app—without internal file paths or database schema names.
    - Write **Developer** changelogs (`portal`, `docs`, `api`, `@xernerx/*` packages) with clear endpoint, payload, widget, and SDK details scoped strictly to that workspace.
    - Keep **Internal** changes (`admin`, `hosting`, `@xernerx/cli`) scoped strictly to their own individual package changesets so internal staff/infrastructure updates never pollute consumer or developer release notes.
