<!-- @format -->

# Xernerx Suite — Global Agent Guidelines (`AGENTS.md`)

This repository is the **Xernerx Suite** monorepo (`pnpm@12.21.0`, Node `>=24`), housing all web applications, shared libraries, backend services, native clients, and internal orchestration tooling for **Xernerx Studios**.

> **Modular Instructions — Read On Demand:**
>
> - **UI, Styling, Tokens & Brand Kit:** Read [`DESIGN.md`](./DESIGN.md) and [`../.github/BRAND.md`](../.github/BRAND.md) ([`packages/public/brand.json`](./packages/public/brand.json)) before creating, editing, or styling any UI or brand/application imagery.
> - **Task Runbooks (Auto-Discovered Skills in `.agents/skills/`):**
>     - `xernerx-localization` — `useDictionary()`, `en-GB.json`, stale-locale pruning, `generate-locales`.
>     - `xernerx-api-and-docs` — 3-route frontend `/api` rule, `/v1/*` → `/v2/*` breaking-change policy, `apps/docs` sync.
>     - `xernerx-living-sync` — `www/download` preview, `Ctrl + K` Command Palette, FAQ, and Onboarding tour parity.
>     - `xernerx-legal-and-org` — 5 legal/security pages, `../.github` org inheritance, and sibling repos in `..`.
>     - `xernerx-release-and-canary` — Audience tiers, 1-app-per-changeset format, and 5-gate `canary → main` soak pipeline.

---

## 🧭 Workspace Directory & Port Map

| Workspace             | Package / App         | Port    | Subdomain             | Purpose                                                                                      |
| :-------------------- | :-------------------- | :------ | :-------------------- | :------------------------------------------------------------------------------------------- |
| `apps/www`            | `www`                 | `4000`  | `xernerx.com`         | Marketing, `/terms`, `/privacy`, `/cookies`, `/security`, `/license`, `/download`            |
| `apps/api`            | `api`                 | `4001`  | `api.xernerx.com`     | Core backend gateway, Bearer auth, Discord & Stripe webhooks                                 |
| `apps/cdn`            | `cdn`                 | `4002`  | `cdn.xernerx.com`     | Media pipeline, `@vercel/blob` private storage, `/raw/[id]` streaming                        |
| `apps/account`        | `account`             | `4003`  | `account.xernerx.com` | Identity hub, profile settings, localization, tokens, billing history                        |
| `apps/app`            | `app`                 | `4004`  | `app.xernerx.com`     | Dashboard, bot/server explorer, Virtue & YourApps settings, live `/overlay`                  |
| `apps/docs`           | `docs`                | `4005`  | `docs.xernerx.com`    | Developer docs, interactive API specs, package docs reader                                   |
| `apps/admin`          | `admin`               | `4006`  | `admin.xernerx.com`   | Internal staff portal, RBAC roles, moderation, translations, system config                   |
| `apps/info`           | `info`                | `4007`  | `info.xernerx.com`    | Feedback & support (`roadmap`, `suggestions`, `bugs`, `faq`, `changelog`)                    |
| `apps/store`          | `store`               | `4008`  | `store.xernerx.com`   | Store portal, Virtue subscriptions, add-ons, credits, checkout                               |
| `apps/portal`         | `portal`              | `4009`  | `portal.xernerx.com`  | Developer portal, organizations, bot publishing, commands, webhooks                          |
| `apps/hosting`        | `hosting`             | `4010`  | `hosting.xernerx.com` | Staff multi-node server hosting & Easypanel console (`one/two-dummi`)                        |
| `apps/haste`          | `haste`               | `4011`  | `haste.xernerx.com`   | Hastebin-compatible code pastebin, TTL expirations, `/raw/[id]`                              |
| `apps/blog`           | `blog`                | `4012`  | `blog.xernerx.com`    | Official newsroom, engineering/security posts, `/rss.xml`                                    |
| `packages/components` | `@xernerx/components` | —       | —                     | Shared app shell (`AppLayout`, `Header`, `Sidebar`, `Footer`, onboarding)                    |
| `packages/feedback`   | `@xernerx/feedback`   | —       | —                     | Route feedback & error boundaries (`Loading`, `Error`, `NotFound`)                           |
| `packages/lib`        | `@xernerx/lib`        | —       | —                     | Mongoose models, NextAuth, i18n dictionaries, server utilities                               |
| `packages/providers`  | `@xernerx/providers`  | —       | —                     | Global React providers & hooks (`useUser`, `useDictionary`, `useShortcuts`)                  |
| `packages/public`     | —                     | —       | —                     | Canonical static branding assets synced across web apps                                      |
| `packages/styles`     | `@xernerx/styles`     | —       | —                     | Tailwind CSS v4 stylesheet & CSS custom property design tokens                               |
| `packages/ui`         | `@xernerx/ui`         | —       | —                     | Primitive UI components (`Button`, `Modal`, `Input`, `Selector`, `Toggle`, `Check`)          |
| `services/app`        | `@xernerx/app`        | —       | —                     | Xernerx App Discord bot daemon (support, docs, status, info)                                 |
| `services/bot`        | `bot`                 | —       | —                     | Xernerx Bot Discord daemon (directory, stats, guild sync)                                    |
| `services/websocket`  | `websocket`           | `5000`  | —                     | Bidirectional WebSocket gateway & microservice router                                        |
| `clients/desktop`     | `desktop`             | —       | —                     | Electron desktop companion client wrapping `app.xernerx.com`                                 |
| `clients/mobile`      | `mobile`              | —       | —                     | Native React Native (Expo) iOS & Android companion for Account, Authenticator & Staff Admin  |
| `.xernerx/cli`        | `@xernerx/cli`        | —       | —                     | Internal `suite` CLI (`dev`, `build`, `generate-locales`, `initialize`, `commit`, `promote`) |
| `.xernerx/database`   | —                     | `27017` | —                     | Local WiredTiger persistence for `mongodb-memory-server`                                     |

_(Sibling org repositories live one level up in `..`: `../apps/{virtue,yourapps}`, `../packages/*`, `../docs`, `../examples`, `../.github` — see `xernerx-legal-and-org` skill for full map.)_

---

## 🛠️ Always-On Engineering Invariants

### 1. Package Management, Formatting & `suite` CLI

- **Strictly use `pnpm`** (`pnpm@12.21.0`, Node `>=24`). Never use `npm install` or `yarn`.
- Use `pnpm suite <command>` (`generate-locales`, `initialize`, `commit`, `promote`) and `pnpm dev` / `pnpm build`. Place new shared env keys in root `.env` and `.env.example`.
- Start every `.ts`/`.tsx`/`.js`/`.mjs`/`.css` file with `/** @format */` and standard `.md` files with `<!-- @format -->` (for YAML-frontmatter files like `SKILL.md`, keep `---` on line 1).
- Prettier (`.prettierrc`): tabs (`tabWidth: 4`), single quotes, semicolons, `printWidth: 200`, `es5` trailing commas.

### 2. Design System & Frontend Boundaries (Full Spec → [`DESIGN.md`](./DESIGN.md))

- **Tailwind CSS v4 only** (`packages/styles/globals.css`) — never create `tailwind.config.*`.
- **Modern Round Glassmorphism Pop:** Rounded geometry (`rounded-3xl`/`2xl`/`full`), frosted `bg-(--foreground)/30` + `backdrop-blur-md`, theme-aware tokens (`--background`, `--foreground`, `--text`, `--border`), dynamic `var(--accent)` (no decorative off-palette rainbow colors except top-3 leaderboard podiums), `--font-fredoka` headings, and user scaling (`max-w-(--page-width) mx-auto w-full`, `--ui-gap`).
- **Shared `@xernerx/ui` controls only:** Never render raw text/number/textarea/select/checkbox controls. Use `<Toggle />` strictly for On/Off settings and `<Check />` strictly for item selection. Use `<Input variant="search" shortcut={true} />` for search bars.
- **No native browser dialogs:** Never use `alert()`, `confirm()`, or `prompt()`. Use `useToast().toast()`, `<Confirm />`, and `<Modal />` + `<Input />`.
- **File & Component Layout:** Break down `page.tsx`/components exceeding 500 lines of inline JSX. Place app components in `apps/<app>/src/components/`, never inside `src/app/` route folders.
- **3-Route Local `/api` Rule:** Frontend apps may only house `/api/auth/[...nextauth]`, `/api/changelog`, and `/api/version` (plus `/api/connections/[provider]{,/callback}` on `apps/account`). All other backend endpoints belong in `apps/api`.

### 3. Localization Invariant (Full Runbook → `xernerx-localization`)

- Never hardcode user-facing UI strings; always use `const { t } = useDictionary();` with `t(path, variables?)` (no 3rd fallback arg).
- `packages/lib/src/dictionaries/en-GB.json` is the source of truth. Whenever updating or deleting an existing key in `en-GB.json`, **delete that key path from all other `packages/lib/src/dictionaries/*.json` files** (pruning empty parents). Never hand-edit `packages/lib/src/i18n.config.ts`.

### 4. Client / Server Isolation & Universal 3-Tier Privacy Truth

- **Never import `@xernerx/lib/server` inside `'use client'` components.** Fetch/mutate from client components via `api.xernerx.com` using `useEnvironment().getEnvUrl()`.
- **Universal 3-Tier Privacy Truth (applies across all apps, API, CDN, WebSockets, and bots):**
    - **`public`**: Listed in public directories/explorers/leaderboards/search and accessible by anyone.
    - **`limited`**: Unlisted (never in directories/search/leaderboards), accessible to anyone with the direct link or ID.
    - **`private`**: Never listed and strictly owner/authorized-member only, even with a direct link or ID.

### 5. Cross-Workspace Sync, API Versioning & Releases (Load Matching Skill)

- **API / CDN / WebSocket changes** → Load `xernerx-api-and-docs` (keep `/v1/*` non-breaking; sync `apps/docs` & `docsBlueprints*.ts`).
- **UI / Shell / New Routes / Bot Integrations** → Load `xernerx-living-sync` (sync `www/download`, `Ctrl + K` Command Palette/Omnibar, FAQ, and Onboarding tours).
- **Auth, Cookies, Bots, Billing, Privacy, Security, or Org Docs** → Load `xernerx-legal-and-org` (audit all 5 web policy pages + `../.github`; never duplicate `SECURITY.md`/`CONTRIBUTING.md`/`CODE_OF_CONDUCT.md` inside child repos).
- **Changesets, Changelogs & Canary Promotion** → Load `xernerx-release-and-canary` (strict 1-app-per-changeset `.changeset/<pkg>.md`, audience segmentation, and 5-gate `canary → main` soak checks).
