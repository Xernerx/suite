<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Feedback & Support Banner" width="100%">
</p>

<p align="center">
  <b>The official Feedback, Support, and Community Hub for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-info-blue?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 📖 Overview

The **Info** service serves as the centralized public knowledgebank and interactive feedback sandbox for Xernerx Studios. It hosts the official roadmap, community feature suggestions, bug tracker, and FAQ portals.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                  | Description                                |
| :---------- | :----------------------------------------------------------- | :----------------------------------------- |
| **Public**  | [`info.xernerx.com`](https://info.xernerx.com)               | Production Feedback & Support portal       |
| **Canary**  | [`info.canary.xernerx.com`](https://info.canary.xernerx.com) | Staging and pre-release portal environment |
| **Dev**     | [`info.dev.xernerx.com`](https://info.dev.xernerx.com)       | Local and active development environment   |

---

## ✨ Core Features

- **Transparent Roadmap:** An interactive, glassmorphic timeline of our current, future, and past engineering goals.
- **Community Sandbox:** A Reddit-style voting board where users can submit and vote on feature suggestions.
- **Bug Tracker:** A dedicated submission pipeline for users to report bugs, complete with anonymous CDN attachment support.
- **Knowledgebank:** A centralized FAQ and support index for billing, accounts, and application inquiries.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Styling & Components:** Tailwind CSS, `@xernerx/ui`, Framer Motion
- **Data & Auth:** `@xernerx/lib` (Mongoose, NextAuth)

---

## 📜 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
