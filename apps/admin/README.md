<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Admin Banner" width="100%">
</p>

<p align="center">
  <b>Internal administrative portal and global management console for the Xernerx Suite ecosystem.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-admin-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/access-restricted-red?style=for-the-badge&logo=none" alt="Restricted">
</p>

---

## 🧭 Overview

The **Admin** service is a strictly governed, internal-only control interface designed exclusively for Xernerx Studios staff. It offers profound visibility and authoritative control over the entire ecosystem, enabling rapid incident response, broad user management, and fine-grained feature manipulation.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                    | Description                                        |
| :---------- | :------------------------------------------------------------- | :------------------------------------------------- |
| **Public**  | [`admin.xernerx.com`](https://admin.xernerx.com)               | Production administrative console (Restricted)     |
| **Canary**  | [`admin.canary.xernerx.com`](https://canary.admin.xernerx.com) | Staging and pre-release administrative environment |
| **Dev**     | [`admin.dev.xernerx.com`](https://dev.admin.xernerx.com)       | Local and active development environment           |

---

## 🛠️ Core Features

- **Ecosystem Observability:** Real-time metrics and deep analytical oversight across all interconnected services and micro-deployments.
- **Global User & Organization Management:** Authoritative tools for moderating users, handling organization states, and resolving disputes.
- **Dynamic Configuration:** Live feature-flag toggling, routing rules adjustments, and environment variable tuning without redeployments.
- **Audit Logging:** Comprehensive, immutable event tracking for all administrative and automated system actions.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Authentication & Security:** NextAuth.js (Role-Based Access Control)
- **Styling & Components:** Tailwind CSS, `@xernerx/ui`, `@xernerx/styles`
- **Data Visualization:** Recharts

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
