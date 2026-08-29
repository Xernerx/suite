<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Auth Banner" width="100%">
</p>

<p align="center">
  <b>User account hub and identity management service for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-auth-blue?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 🧭 Overview

The **Auth** service functions as the central user account hub for the Xernerx ecosystem. It manages all user-centric operations, identity verification, profile configurations, localization settings, and the complete token lifecycle.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                  | Description                                        |
| :---------- | :----------------------------------------------------------- | :------------------------------------------------- |
| **Public**  | [`auth.xernerx.com`](https://auth.xernerx.com)               | Production account and authentication hub          |
| **Canary**  | [`auth.canary.xernerx.com`](https://canary.auth.xernerx.com) | Staging and pre-release authentication environment |
| **Dev**     | [`auth.dev.xernerx.com`](https://dev.auth.xernerx.com)       | Local and active development environment           |

---

## 🛠️ Core Features

- **Account Management:** Centralized hub for user profile handling, preferences, and personal settings.
- **Authentication & Tokens:** Secure login workflows and token lifecycle management via NextAuth.js.
- **Localization:** Language preferences and regional configuration management.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Authentication:** NextAuth.js
- **Styling & Components:** Tailwind CSS, `@xernerx/ui`, `@xernerx/styles`

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
