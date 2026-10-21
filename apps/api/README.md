<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx API Banner" width="100%">
</p>

<p align="center">
  <b>Core routing, security enforcement, widget rendering, and token validation engine for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-api-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4001-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **API** service (`api.xernerx.com`, dev port `4001`) acts as the central backend gateway for the Xernerx Suite. It handles Bearer token validation, Discord & Stripe integrations, dynamic SVG/PNG/Iframe profile widgets, public developer endpoints, and authenticated first-party operations.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                | Description                                        |
| :---------- | :--------------------------------------------------------- | :------------------------------------------------- |
| **Public**  | [`api.xernerx.com`](https://api.xernerx.com)               | Production gateway routing live ecosystem requests |
| **Canary**  | [`api.canary.xernerx.com`](https://api.canary.xernerx.com) | Staging and pre-release validation environment     |
| **Dev**     | [`api.dev.xernerx.com`](https://api.dev.xernerx.com)       | Local development gateway (`localhost:4001`)       |

---

## 📡 API Route Namespaces

### 1. Public Developer API (`/v1/*`)

- `GET / PATCH / DELETE /v1/bots/[id]/profile` — Fetch, update, or reset a bot's public profile metadata.
- `GET / POST / PATCH / DELETE /v1/bots/[id]/stats` — Publish and query bot guild, shard, and user statistics (`@xernerx/stats`).
- `GET / PUT / DELETE /v1/bots/[id]/commands` — Bulk synchronize or clear Discord application slash commands.
- `GET /v1/bots/[id]/badge.svg`, `/v1/guilds/[id]/badge.svg`, `/v1/organizations/[id]/badge.svg`, `/v1/users/[id]/badge.svg` — Dynamic SVG shields (`?type=...&theme=dark|light&style=rounded|pill|flat`).
- `GET /v1/status/badge.svg` — Live platform operational status SVG shield.
- `GET /v1/leaderboard` — Top public bots, Discord servers, and user daily credit streaks.
- `GET /v1/changelog/rss.xml` — Aggregated RSS 2.0 XML release feed across all suite applications.

### 2. Core & Public Widget API (`/core/*` & `/info/*`)

- `GET /core/bots/[id]`, `/core/organizations/[id]`, `/core/guilds/[id]`, `/core/users/[id]` — Public entity profiles and live embeddable widgets (`?type=json|svg|png|iframe&theme=dark|light`).
- `GET /core/users/[id]/discord` & `/core/users/[id]/discord/guilds` — Discord user profile and mutual guild lookup.
- `GET /core/guilds/[id]/discord` & `/core/guilds/[id]/discord/roles` — Discord guild metadata and role hierarchy lookup.
- `GET / POST /info/roadmap`, `/info/roadmap/products`, `/info/roadmap/[id]/interact` — Public engineering roadmap and milestone reactions.
- `GET / POST /info/suggestions` & `/info/suggestions/[id]/vote` — Community feature suggestion board and voting.
- `GET / POST /info/issues` & `/info/issues/metrics` — Public bug report submission and resolution metrics.

### 3. Secure Suite Gateway (`/secure/*`)

Protected by [`src/proxy.ts`](./src/proxy.ts) via either first-party NextAuth session cookies on `*.xernerx.com` or `Authorization: Bearer xnx_...` tokens with `secure` permission:

- `/secure/users/*` — User profiles, activity history, daily credit claims, and Discord role syncing.
- `/secure/bots/*` — Bot registration, profile management, vote webhooks (`/hooks`, `/hooks/test`), voting, and reviews.
- `/secure/guilds/*` & `/secure/servers/*` — Guild onboarding, Virtue bot settings, server voting, and Discord channel/role management.
- `/secure/organizations/*` — Developer organizations and member role management.
- `/secure/store/*` & `/secure/webhooks/stripe` — Store catalog, categories, items, Stripe Checkout sessions, gifting, and subscription lifecycle.
- `/secure/tokens/*` & `/secure/validate/token` — Personal and developer API token creation, revocation, and validation.
- `/secure/core/*` — RBAC roles, system settings, sister server sync, live suite version/latency probing (`/versions`), Lighthouse audits (`/lighthouse`), and audit logs (`/audit`).
- `/secure/dispatch/*`, `/secure/announcements/*`, `/secure/invites/*`, `/secure/applications/*`, `/secure/dictionary/[language]` — Notifications, Postmark email dispatch, scheduled Discord announcements, vanity invites, staff applications, and i18n dictionary management.

---

## 🛡️ Security & Rate Limiting

- **IP Rate Limiting:** Public requests outside `*.xernerx.com` are limited to **100 requests per minute per IP**.
- **CORS:** Automatic origin reflection and credentials support for `*.xernerx.com`, plus open `Access-Control-Allow-Origin: *` on public health/version/changelog and widget routes.

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
