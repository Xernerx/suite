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
  <img src="https://img.shields.io/badge/port-4006-informational?style=for-the-badge&logo=none" alt="Port">
  <img src="https://img.shields.io/badge/access-restricted-red?style=for-the-badge&logo=none" alt="Restricted">
</p>

---

## 🧭 Overview

The **Admin** service (`admin.xernerx.com`, dev port `4006`) is a strictly governed, RBAC-protected internal control interface for Xernerx Studios staff.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                    | Description                                        |
| :---------- | :------------------------------------------------------------- | :------------------------------------------------- |
| **Public**  | [`admin.xernerx.com`](https://admin.xernerx.com)               | Production administrative console (Restricted)     |
| **Canary**  | [`admin.canary.xernerx.com`](https://admin.canary.xernerx.com) | Staging and pre-release administrative environment |
| **Dev**     | [`admin.dev.xernerx.com`](https://admin.dev.xernerx.com)       | Local development console (`localhost:4006`)       |

---

## 🛠️ Administrative Modules

- **Overview & Telemetry (`Overview.tsx`):** Real-time version comparison (`PROD`, `CANARY`, `DEV`), live `/api/version` latency pings, Seobility SEO scores, and on-demand Chrome Lighthouse audits across all 9 suite subdomains.
- **Role-Based Access Control (`Roles.tsx`):** Create, reorder, and assign granular staff roles and permission bitmasks.
- **User & Token Management (`Users.tsx`, `Tokens.tsx`):** Moderate user accounts, assign roles, and approve or suspend developer API tokens.
- **Store Management (`Store.tsx`):** Configure store categories, pricing tiers, Stripe price mappings, and featured badges.
- **Feedback & Roadmap Moderation (`Issues.tsx`, `Roadmap.tsx`, `Suggestions.tsx`):** Triage bug reports, link resolved app versions, publish roadmap milestones, and moderate community suggestions.
- **Announcements & Invites (`Announcements.tsx`, `Invites.tsx`):** Schedule rich Discord webhook announcements and manage vanity redirect links.
- **Applications & Translations (`Applications.tsx`, `ApplicationConfigs.tsx`, `Translations.tsx`):** Configure staff application forms, review candidate submissions, and edit live localization dictionaries.
- **System Settings & Audit Logs (`Settings.tsx`, `AuditLogs.tsx`):** Manage global platform configuration, sister server syncing, and immutable staff audit trails.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Authentication & Security:** NextAuth.js + RBAC permission verification via `api.xernerx.com/secure/core/*`
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, Recharts

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
