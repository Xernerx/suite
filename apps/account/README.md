<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Account Banner" width="100%">
</p>

<p align="center">
  <b>User account hub, identity management, OAuth connections, tokens, and billing history for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-account-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4003-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **Account** service (`account.xernerx.com`, dev port `4003`) functions as the central identity and user preferences hub for the Xernerx ecosystem.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                        | Description                                        |
| :---------- | :----------------------------------------------------------------- | :------------------------------------------------- |
| **Public**  | [`account.xernerx.com`](https://account.xernerx.com)               | Production account and authentication hub          |
| **Canary**  | [`account.canary.xernerx.com`](https://account.canary.xernerx.com) | Staging and pre-release authentication environment |
| **Dev**     | [`account.dev.xernerx.com`](https://account.dev.xernerx.com)       | Local development portal (`localhost:4003`)        |

---

## 🛠️ Core Views & Features

- **Account & Profile Settings (`Account.tsx`):** Manage public/private profile visibility, bio, custom theme colors (`--accent`), UI density (`--ui-gap`, `--ui-scale`, `--text-scale`), and localization preferences.
- **Public Profile Widgets:** Configure embeddable User Profile cards (`/core/users/[id]?type=svg|png|iframe`) and streak/status shields (`/v1/users/[id]/badge.svg`).
- **OAuth Connections (`Connections.tsx`):** Link and manage secondary identities (GitHub, Google, Roblox, Twitch, Spotify) via `/api/connections/[provider]`.
- **API Bearer Tokens (`Tokens.tsx`):** Generate, scope, inspect, and revoke Personal and Developer API tokens (`xnx_...`).
- **Billing & Subscriptions (`Billing.tsx`):** View active Xernerx Ultra and pass subscriptions, renewal dates, and one-click cancellation.
- **Media Library (`Media.tsx`):** Upload, preview, share, and manage personal CDN files hosted on `cdn.xernerx.com`.
- **Trusted Devices (`Devices.tsx`):** Inspect active session history and connected client devices.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Authentication:** NextAuth.js (`@xernerx/lib`)
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, `@xernerx/styles`

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
