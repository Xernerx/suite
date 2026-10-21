<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx App Banner" width="100%">
</p>

<p align="center">
  <b>Unified user dashboard, bot & server explorer, Virtue control center, and Developer Portal for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-app-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4004-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **App** service (`app.xernerx.com`, dev port `4004`) is the primary workspace and discovery hub for users, server administrators, and bot developers across the Xernerx ecosystem.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                | Description                                   |
| :---------- | :--------------------------------------------------------- | :-------------------------------------------- |
| **Public**  | [`app.xernerx.com`](https://app.xernerx.com)               | Production workspace control center           |
| **Canary**  | [`app.canary.xernerx.com`](https://app.canary.xernerx.com) | Staging and pre-release workspace environment |
| **Dev**     | [`app.dev.xernerx.com`](https://app.dev.xernerx.com)       | Local development portal (`localhost:4004`)   |

---

## 🛠️ Core Routes & Features

- **Discovery Hub (`/`, `/bots`, `/servers`, `/leaderboard`, `/supporters`):** Explore verified and community Discord bots, public servers, top voter/streak leaderboards, and platform supporters.
- **Public Profiles (`/bots/[id]`, `/servers/[id]`, `/organization/[id]`, `/users/[id]`):** Rich profile pages featuring live statistics charts, slash command browsers, community reviews, voting, and embeddable widgets.
- **Server Dashboard (`/dashboard`):** Manage connected Discord servers, configure **Virtue** bot modules,webhooks, custom links, and public server profile widgets.
- **Developer Portal (`/portal`, `/portal/bots/[id]`):** Register and manage Discord bots and developer organizations, configure vote webhooks, inspect API statistics, and generate embed codes (`WidgetSettingsCard.tsx`).

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Real-Time & State:** WebSockets, Framer Motion, `@xernerx/providers`
- **UI & Visualization:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, Recharts, Lucide Icons

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
