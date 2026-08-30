<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Suite Banner" width="100%">
</p>

<p align="center">
  <b>Enterprise-grade infrastructure, modular frameworks, and modern full-stack applications.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/ecosystem-monorepo-informational?style=for-the-badge&logo=pnpm" alt="Ecosystem">
  <img src="https://img.shields.io/badge/stack-Next.js_%7C_TypeScript_%7C_Tailwind-blue?style=for-the-badge&logo=next.js" alt="Tech Stack">
</p>

---

## 🧭 Ecosystem Directory

### 🌐 Core Applications & Subdomains

| Service                                 | Public                                               | Canary                                         | Dev                                      | Description                                                           |
| :-------------------------------------- | :--------------------------------------------------- | :--------------------------------------------- | :--------------------------------------- | :-------------------------------------------------------------------- |
| **[Admin](./apps/admin/README.md)**     | [`admin.xernerx.com`](https://admin.xernerx.com)     | [`canary`](https://canary.admin.xernerx.com)   | [`dev`](https://dev.admin.xernerx.com)   | Internal administrative portal and ecosystem management console       |
| **[API](./apps/api/README.md)**         | [`api.xernerx.com`](https://api.xernerx.com)         | [`canary`](https://api.canary.xernerx.com)     | [`dev`](https://api.dev.xernerx.com)     | Core routing, security enforcement, and token validation engine       |
| **[App](./apps/app/README.md)**         | [`app.xernerx.com`](https://app.xernerx.com)         | [`canary`](https://app.canary.xernerx.com)     | [`dev`](https://app.dev.xernerx.com)     | Unified user dashboard and workspace control center                   |
| **[Account](./apps/account/README.md)** | [`account.xernerx.com`](https://account.xernerx.com) | [`canary`](https://account.canary.xernerx.com) | [`dev`](https://account.dev.xernerx.com) | Authentication, settings, profiles, localization, and token lifecycle |
| **[CDN](./apps/cdn/README.md)**         | [`cdn.xernerx.com`](https://cdn.xernerx.com)         | [`canary`](https://cdn.canary.xernerx.com)     | [`dev`](https://cdn.dev.xernerx.com)     | Asset delivery and media pipeline infrastructure                      |
| **[Docs](./apps/docs/README.md)**       | [`docs.xernerx.com`](https://docs.xernerx.com)       | [`canary`](https://docs.canary.xernerx.com)    | [`dev`](https://docs.dev.xernerx.com)    | Developer documentation, guides, and architectural specs              |
| **[Www](./apps/www/README.md)**         | [`xernerx.com`](https://www.xernerx.com)             | [`canary`](https://canary.xernerx.com)         | [`dev`](https://dev.xernerx.com)         | Institutional landing pages, history, legal terms, and privacy policy |

### ⚡ Infrastructure & Services

| Service                                         | Source Path          | Description                                                                |
| :---------------------------------------------- | :------------------- | :------------------------------------------------------------------------- |
| **[Bot](./services/bot/README.md)**             | `services/bot`       | Modular Discord applications, automation tools, and productivity utilities |
| **[Desktop](./clients/desktop/README.md)**      | `clients/desktop`    | High-performance native companion desktop clients                          |
| **[Mobile](./clients/mobile/README.md)**        | `clients/mobile`     | Cross-platform mobile applications                                         |
| **[Websocket](./services/websocket/README.md)** | `services/websocket` | Real-time event gateway and communication pipeline                         |

---

## 🛠️ Architecture & Principles

The Xernerx Suite is engineered around strict architectural standards:

- **First Principles Engineering:** Focused on high performance, zero bloat, and long-term maintainability.
- **Unified Design Language:** Built using custom modular UI components (`@xernerx/ui`) supporting dynamic layout density, live typography scaling, and real-time theme syncing.
- **Edge & Cloud Deployment:** Seamlessly distributed across Vercel and self-hosted server environments managed via Easypanel and Cloudflare tunnels.

---

## 📄 License

All software, code, branding, and materials contained within this repository are the exclusive property of **Xernerx Studios** or its licensors. Unauthorized reproduction, distribution, or commercial exploitation is strictly prohibited. See the [LICENSE](./LICENSE) file for details.
