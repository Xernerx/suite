<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx API Banner" width="100%">
</p>

<p align="center">
  <b>Core routing, security enforcement, and token validation engine for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-api-blue?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 🧭 Overview

The **API** service acts as the central gateway and routing engine for the Xernerx Suite. It manages security enforcement, request validation, authentication lifecycles, and database interactions across the entire ecosystem.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                | Description                                        |
| :---------- | :--------------------------------------------------------- | :------------------------------------------------- |
| **Public**  | [`api.xernerx.com`](https://api.xernerx.com)               | Production gateway routing live ecosystem requests |
| **Canary**  | [`api.canary.xernerx.com`](https://canary.api.xernerx.com) | Staging and pre-release validation environment     |
| **Dev**     | [`api.dev.xernerx.com`](https://dev.api.xernerx.com)       | Local and active development environment           |

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Database Management:** Mongoose / MongoDB
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
