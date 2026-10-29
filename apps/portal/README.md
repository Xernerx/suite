<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Portal Banner" width="100%">
</p>

<p align="center">
  <b>The official Developer, Bot Publishing, and Organization Studio for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-portal-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4009-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **Portal** service (`portal.xernerx.com`, dev port `4009`) is the dedicated creator, bot developer, and multi-member organization studio for the Xernerx Suite.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                      | Description                                 |
| :---------- | :--------------------------------------------------------------- | :------------------------------------------ |
| **Public**  | [`portal.xernerx.com`](https://portal.xernerx.com)               | Production developer & organization studio  |
| **Canary**  | [`portal.canary.xernerx.com`](https://portal.canary.xernerx.com) | Staging and pre-release portal environment  |
| **Dev**     | [`portal.dev.xernerx.com`](https://portal.dev.xernerx.com)       | Local development studio (`localhost:4009`) |

---

## ✨ Core Routes & Features

- **`/` (Personal & Organization Workspaces):** Switch seamlessly between your Personal Bot Workspace and multi-member Developer Organizations with custom RBAC roles, member invitations, linked servers, and shared Organization Credit Treasuries.
- **`/bots/[id]` (Bot Developer Studio):** Manage bot descriptions, category tags, vanity URLs, release notes, visual slash commands, 30-day growth telemetry charts, outbound webhooks (with HMAC-SHA256 signing secrets, local Electron IPC relay, and delivery replay), and Spotlight boosts.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, Recharts, Framer Motion
- **Data & Auth:** `@xernerx/lib` (NextAuth), `@xernerx/providers`

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
