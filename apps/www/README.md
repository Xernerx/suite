<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Landing Page Banner" width="100%">
</p>

<p align="center">
  <b>Public marketing showcase, institutional timeline, legal policies, staff applications, and desktop client download portal.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-www-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4000-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **WWW** service (`xernerx.com` / `www.xernerx.com`, dev port `4000`) serves as the public landing page and institutional portal for Xernerx Studios.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                                         | Description                                 |
| :---------- | :---------------------------------------------------------------------------------- | :------------------------------------------ |
| **Public**  | [`xernerx.com`](https://xernerx.com) / [`www.xernerx.com`](https://www.xernerx.com) | Production marketing and landing portal     |
| **Canary**  | [`www.canary.xernerx.com`](https://www.canary.xernerx.com)                          | Staging and pre-release portal environment  |
| **Dev**     | [`www.dev.xernerx.com`](https://www.dev.xernerx.com)                                | Local development portal (`localhost:4000`) |

---

## 🛠️ Core Routes & Features

- **`/` (Landing Showcase & Timeline):** Product showcase, ecosystem statistics, and interactive company history timeline.
- **`/applications` & `/applications/[id]`:** Public career & staff application portal integrated with `api.xernerx.com/secure/applications/*`.
- **`/download`:** Native desktop companion client installer download hub (`clients/desktop`).
- **`/invites`:** Official Discord community and bot invite directory.
- **`/terms`, `/privacy`, `/cookies`:** Versioned legal agreements and privacy disclosures.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, Framer Motion

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
