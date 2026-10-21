<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Feedback & Support Banner" width="100%">
</p>

<p align="center">
  <b>The official Feedback, Support, Status, and Community Hub for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-info-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4007-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 📖 Overview

The **Info** service (`info.xernerx.com`, dev port `4007`) serves as the centralized public knowledgebank, release changelog reader, live service status monitor, and interactive feedback hub for Xernerx Studios.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                  | Description                                 |
| :---------- | :----------------------------------------------------------- | :------------------------------------------ |
| **Public**  | [`info.xernerx.com`](https://info.xernerx.com)               | Production Feedback & Support portal        |
| **Canary**  | [`info.canary.xernerx.com`](https://info.canary.xernerx.com) | Staging and pre-release portal environment  |
| **Dev**     | [`info.dev.xernerx.com`](https://info.dev.xernerx.com)       | Local development portal (`localhost:4007`) |

---

## ✨ Core Routes & Features

- **`/roadmap` (Interactive Roadmap):** Filterable timeline of planned, in-progress, and completed engineering milestones with community reactions and known-issues tracking.
- **`/suggestions` (Community Sandbox):** Voting board where users submit feature ideas, filter by product/tag, and cast upvotes or downvotes.
- **`/issues` & `/bugs` (Bug Tracker):** Dedicated bug reporting pipeline with severity classification, reproduction steps, CDN screenshot attachments, and live release status badges (`Pending`, `Canary`, `Production`).
- **`/faq` (Knowledgebank):** Searchable (`Ctrl + K`) multi-category FAQ covering **Translations**, **Environments**, **Bots & Boosts**, **Account, Privacy & Tokens**, **Store, Billing & Quotas**, and **API, Widgets & Developers**.
- **`/changelog` (Platform Release Notes):** Aggregated Markdown release history fetched live from each suite service's `/api/changelog` endpoint with deep-linkable version anchors.
- **`/status` (System Status):** Real-time health, version, and latency overview across all Xernerx Suite subdomains.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, Framer Motion
- **Data & Auth:** `@xernerx/lib`, `@xernerx/providers`

---

## 📜 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
