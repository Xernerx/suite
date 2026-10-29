<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Suite Banner" width="100%">
</p>

<p align="center">
  <b>Enterprise-grade infrastructure, modular frameworks, and modern full-stack applications.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/ecosystem-monorepo-informational?style=for-the-badge&logo=pnpm" alt="Ecosystem">
  <img src="https://img.shields.io/badge/stack-Next.js_%7C_TypeScript_%7C_Tailwind_v4-blue?style=for-the-badge&logo=next.js" alt="Tech Stack">
</p>

<p align="center">
  <img src="https://api.xernerx.com/v1/status/badge.svg" alt="Xernerx Status" />
</p>

---

## 🧭 Ecosystem Directory

### 🌐 Core Web Applications (`apps/*`)

| Service                                 | Dev Port | Public                                               | Canary                                                 | Dev                                              | Description                                                                   |
| :-------------------------------------- | :------- | :--------------------------------------------------- | :----------------------------------------------------- | :----------------------------------------------- | :---------------------------------------------------------------------------- |
| **[WWW](./apps/www/README.md)**         | `4000`   | [`xernerx.com`](https://www.xernerx.com)             | [`www.canary`](https://www.canary.xernerx.com)         | [`www.dev`](https://www.dev.xernerx.com)         | Marketing showcase, company timeline, legal terms, applications, and download |
| **[API](./apps/api/README.md)**         | `4001`   | [`api.xernerx.com`](https://api.xernerx.com)         | [`api.canary`](https://api.canary.xernerx.com)         | [`api.dev`](https://api.dev.xernerx.com)         | Central backend gateway, Bearer token validator, widgets, and Stripe webhooks |
| **[CDN](./apps/cdn/README.md)**         | `4002`   | [`cdn.xernerx.com`](https://cdn.xernerx.com)         | [`cdn.canary`](https://cdn.canary.xernerx.com)         | [`cdn.dev`](https://cdn.dev.xernerx.com)         | Private & public media storage pipeline, `/raw/[id]` streaming, and viewer    |
| **[Account](./apps/account/README.md)** | `4003`   | [`account.xernerx.com`](https://account.xernerx.com) | [`account.canary`](https://account.canary.xernerx.com) | [`account.dev`](https://account.dev.xernerx.com) | Identity hub, profile settings, localization, OAuth links, tokens, & billing  |
| **[App](./apps/app/README.md)**         | `4004`   | [`app.xernerx.com`](https://app.xernerx.com)         | [`app.canary`](https://app.canary.xernerx.com)         | [`app.dev`](https://app.dev.xernerx.com)         | User dashboard, bot & server explorer, Virtue configuration, & `/overlay`     |
| **[Docs](./apps/docs/README.md)**       | `4005`   | [`docs.xernerx.com`](https://docs.xernerx.com)       | [`docs.canary`](https://docs.canary.xernerx.com)       | [`docs.dev`](https://docs.dev.xernerx.com)       | Interactive REST API playground, CDN & WebSocket guides, and NPM package docs |
| **[Admin](./apps/admin/README.md)**     | `4006`   | [`admin.xernerx.com`](https://admin.xernerx.com)     | [`admin.canary`](https://admin.canary.xernerx.com)     | [`admin.dev`](https://admin.dev.xernerx.com)     | Internal staff portal, RBAC role management, moderation, & system telemetry   |
| **[Info](./apps/info/README.md)**       | `4007`   | [`info.xernerx.com`](https://info.xernerx.com)       | [`info.canary`](https://info.canary.xernerx.com)       | [`info.dev`](https://info.dev.xernerx.com)       | Feedback & support hub (`roadmap`, `suggestions`, `issues`, `faq`, `status`)  |
| **[Store](./apps/store/README.md)**     | `4008`   | [`store.xernerx.com`](https://store.xernerx.com)     | [`store.canary`](https://store.canary.xernerx.com)     | [`store.dev`](https://store.dev.xernerx.com)     | Storefront for Xernerx Ultra, bot/server passes, gifting, and Stripe checkout |
| **[Portal](./apps/portal/README.md)**   | `4009`   | [`portal.xernerx.com`](https://portal.xernerx.com)   | [`portal.canary`](https://portal.canary.xernerx.com)   | [`portal.dev`](https://portal.dev.xernerx.com)   | Developer portal, organizations, bot publishing, slash commands, & webhooks   |
| **[Hosting](./apps/hosting/README.md)** | `4010`   | [`hosting.xernerx.com`](https://hosting.xernerx.com) | [`hosting.canary`](https://hosting.canary.xernerx.com) | [`hosting.dev`](https://hosting.dev.xernerx.com) | Staff-only multi-node server hosting & Easypanel infrastructure console       |
| **[Haste](./apps/haste/README.md)**     | `4011`   | [`haste.xernerx.com`](https://haste.xernerx.com)     | [`haste.canary`](https://haste.canary.xernerx.com)     | [`haste.dev`](https://haste.dev.xernerx.com)     | First-party Hastebin-compatible code pastebin, TTL expirations, & `/raw/[id]` |

### 📦 Shared Workspace Packages (`packages/*`)

| Package                                                    | Workspace Path        | Description                                                                                  |
| :--------------------------------------------------------- | :-------------------- | :------------------------------------------------------------------------------------------- |
| **[@xernerx/components](./packages/components/README.md)** | `packages/components` | Shared application shell (`AppLayout`, `Header`, `Sidebar`, `Footer`, `CommandPaletteModal`) |
| **[@xernerx/feedback](./packages/feedback/README.md)**     | `packages/feedback`   | Standardized route feedback and error boundaries (`Loading`, `Error`, `NotFound`)            |
| **[@xernerx/lib](./packages/lib/README.md)**               | `packages/lib`        | Mongoose models (`@xernerx/lib/server`), NextAuth config, i18n dictionaries, and proxy       |
| **[@xernerx/providers](./packages/providers/README.md)**   | `packages/providers`  | Global React context providers & hooks (`useUser`, `useDictionary`, `useEnvironment`, etc.)  |
| **[@xernerx/styles](./packages/styles/README.md)**         | `packages/styles`     | Central Tailwind CSS v4 stylesheet (`globals.css`) & CSS custom property design tokens       |
| **[@xernerx/ui](./packages/ui/README.md)**                 | `packages/ui`         | Primitive UI components (`Button`, `Modal`, `Input`, `Selector`, `Toggle`, `CodeBlock`)      |
| **[packages/public](./packages/public/README.md)**         | `packages/public`     | Canonical static branding assets synced across all web applications                          |

### ⚡ Services, Native Clients & Tooling

| Workspace                                       | Source Path          | Description                                                                            |
| :---------------------------------------------- | :------------------- | :------------------------------------------------------------------------------------- |
| **[App Bot](./services/app/README.md)**         | `services/app`       | Xernerx App Discord bot daemon (`@xernerx/framework`) for support, docs, and status    |
| **[Bot](./services/bot/README.md)**             | `services/bot`       | Xernerx Bot Discord daemon (`@xernerx/framework`) syncing guilds, members, and stats   |
| **[Websocket](./services/websocket/README.md)** | `services/websocket` | Real-time bidirectional WebSocket JSON-RPC gateway & microservice router (port `5000`) |
| **[Desktop](./clients/desktop/README.md)**      | `clients/desktop`    | Electron desktop companion client wrapping `app.xernerx.com`                           |
| **[Mobile](./clients/mobile/README.md)**        | `clients/mobile`     | Cross-platform mobile client workspace                                                 |
| **[@xernerx/cli](./.xernerx/cli/README.md)**    | `.xernerx/cli`       | Internal `suite` CLI orchestrating dev servers, i18n generation, env sync, & lint      |

---

## 🚀 Quick Start & CLI Orchestration

The monorepo requires **Node.js `>=20`** and **`pnpm@11.24.0`**. Workspace orchestration is managed by the internal `suite` CLI:

```bash
# Install workspace dependencies
pnpm install

# Initialize static assets & sync root .env across workspaces
pnpm suite initialize

# Regenerate i18n locale config from JSON dictionaries
pnpm suite generate-locales

# Start the development suite (local MongoDB + apps + services)
pnpm dev

# Run workspace-wide linting
pnpm suite lint

# Build all packages and applications for production
pnpm build
```

---

## 🛠️ Architecture & Principles

- **First Principles Engineering:** Zero cross-project filesystem coupling; all services communicate over typed HTTP (`/v1/*`, `/core/*`, `/info/*`, `/secure/*`) and WebSocket RPC protocols.
- **Modern Round Glassmorphism Pop:** Unified Tailwind CSS v4 design system (`@xernerx/styles` & `@xernerx/ui`) featuring translucent glass surfaces, generous rounded geometry, dynamic `--accent` theming, and custom UI/typography scaling.
- **Full Localization (`i18n`):** Centralized dictionary pipeline (`@xernerx/lib` + `DictionaryProvider`) with automatic fallback to `en-GB.json`.
- **Edge & Cloud Deployment:** Distributed across Vercel and self-hosted server infrastructure managed via Easypanel and Cloudflare tunnels.

---

## 📄 License

All software, code, branding, and materials contained within this repository are the exclusive property of **Xernerx Studios** or its licensors. Unauthorized reproduction, distribution, or commercial exploitation is strictly prohibited. See the [LICENSE](./LICENSE) file for details.
