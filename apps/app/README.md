<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx App Banner" width="100%">
</p>

<p align="center">
  <b>Unified user dashboard and workspace control center for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-app-blue?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 🧭 Overview

The **App** service is the primary user-facing control center where users spend the majority of their time within the ecosystem. It provides comprehensive management tools for bots, servers, and organizations.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                | Description                                   |
| :---------- | :--------------------------------------------------------- | :-------------------------------------------- |
| **Public**  | [`app.xernerx.com`](https://app.xernerx.com)               | Production workspace control center           |
| **Canary**  | [`app.canary.xernerx.com`](https://canary.app.xernerx.com) | Staging and pre-release workspace environment |
| **Dev**     | [`app.dev.xernerx.com`](https://dev.app.xernerx.com)       | Local and active development environment      |

---

## 🛠️ Core Features

- **Server Explorer & Stats:** Comprehensive discovery and real-time performance tracking for connected servers.
- **Bot Management:** Dedicated hosting controls, monitoring, and statistics for active bots.
- **Bot Integration:** Seamless setup workflows for Xernerx Studios bots on user-owned servers.
- **Organization Setup:** Centralized workspace and team management configuration.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Real-Time & State:** WebSockets, Framer Motion
- **Database & Authentication:** Mongoose / MongoDB, NextAuth.js
- **UI & Visualization:** Tailwind CSS, Recharts, Lucide Icons

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
