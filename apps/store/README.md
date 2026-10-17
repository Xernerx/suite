<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Store Banner" width="100%">
</p>

<p align="center">
  <b>The official Storefront and Subscription Portal for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-store-blue?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 📖 Overview

The **Store** service (`store.xernerx.com`, dev port `4008`) is the dedicated storefront for the Xernerx Suite. It provides unified purchasing and plan management for individual consumer bot passes, server infrastructure passes, the master Ultra bundle, and Developer API plans.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                    | Description                              |
| :---------- | :------------------------------------------------------------- | :--------------------------------------- |
| **Public**  | [`store.xernerx.com`](https://store.xernerx.com)               | Production storefront and portal         |
| **Canary**  | [`store.canary.xernerx.com`](https://store.canary.xernerx.com) | Staging and pre-release environment      |
| **Dev**     | [`store.dev.xernerx.com`](https://store.dev.xernerx.com)       | Local and active development environment |

---

## ✨ Core Features

- **Consumer & Bot Passes:** Individual bot subscriptions (Zodiac, Virtue, To-Do, Metamorphosis) and server utility licenses.
- **Ultra Master Bundle:** Side-by-side comparison of the Free tier and all-inclusive Ultra plan.
- **Developer API Plans:** Tiered access for developers building bots, apps, and integrations with the Xernerx Gateway.
- **Subscription Management:** Seamless one-click cancellation and Stripe Checkout sessions via `api.xernerx.com`.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Styling & Components:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, Framer Motion
- **Data & Auth:** `@xernerx/lib` (NextAuth), `@xernerx/providers`
- **Backend API:** Interacts securely with `api.xernerx.com/secure/store/*`

---

## 📜 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
