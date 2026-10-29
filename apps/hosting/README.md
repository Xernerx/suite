<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Hosting Banner" width="100%">
</p>

<p align="center">
  <b>Internal multi-node server hosting and Easypanel infrastructure console for Xernerx Studios.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-hosting-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4010-informational?style=for-the-badge&logo=none" alt="Port">
  <img src="https://img.shields.io/badge/access-restricted-red?style=for-the-badge&logo=none" alt="Restricted">
</p>

---

## 🧭 Overview

The **Hosting** service (`hosting.xernerx.com`, dev port `4010`) is a staff-guarded infrastructure portal providing unified console access to the `one-dummi` and `two-dummi` Easypanel hosting nodes.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                        | Description                                    |
| :---------- | :----------------------------------------------------------------- | :--------------------------------------------- |
| **Public**  | [`hosting.xernerx.com`](https://hosting.xernerx.com)               | Production infrastructure console (Restricted) |
| **Canary**  | [`hosting.canary.xernerx.com`](https://hosting.canary.xernerx.com) | Staging and pre-release infrastructure console |
| **Dev**     | [`hosting.dev.xernerx.com`](https://hosting.dev.xernerx.com)       | Local development console (`localhost:4010`)   |

---

## 🛠️ Core Features

- **Zero-Reload Multi-Node Switching (`HostingConsoleClient.tsx`):** Persistent iframe workspaces for `one-dummi` (`109.199.104.225:3000`) and `two-dummi` (`45.90.109.198:3000`) with instant node switching.
- **Side-by-Side Split View:** Compare and manage both Easypanel infrastructure nodes simultaneously.
- **Direct Node Launchers:** Quick-open external node dashboards and refresh individual node frames.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Authentication & Security:** NextAuth.js + RBAC staff permission verification
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
