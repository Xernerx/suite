<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Docs Banner" width="100%">
</p>

<p align="center">
  <b>Comprehensive developer documentation portal, interactive API playground, and package reference for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-docs-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4005-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **Docs** service (`docs.xernerx.com`, dev port `4005`) provides official developer guides, interactive REST API specifications, CDN media pipeline documentation, WebSocket RPC protocol references, and automated TypeDoc/package documentation for `@xernerx/*` NPM packages.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                  | Description                                       |
| :---------- | :----------------------------------------------------------- | :------------------------------------------------ |
| **Public**  | [`docs.xernerx.com`](https://docs.xernerx.com)               | Production documentation portal                   |
| **Canary**  | [`docs.canary.xernerx.com`](https://docs.canary.xernerx.com) | Staging and pre-release documentation environment |
| **Dev**     | [`docs.dev.xernerx.com`](https://docs.dev.xernerx.com)       | Local development portal (`localhost:4005`)       |

---

## 🛠️ Core Sections & Routes

- **`/` (Docs Hub & Deep Search):** Instant keyboard-navigable search (`Ctrl + K`) indexing all REST endpoints, CDN routes, WebSocket RPC services, and NPM packages.
- **`/api/[version]` (`v1`, `core`, `secure`):**
    - Interactive **API Playground** (`ApiPlayground.tsx`) with preset pills, custom Bearer token headers, JSON body editor, and live response/latency inspection.
    - Multi-language code examples (`TypeScript`, `JavaScript`, `Python`, `HTML`, `Markdown`) and live SVG widget/badge previews.
- **`/cdn` (Media & Storage Pipeline):** Reference for `POST /upload`, `POST /upload/[id]`, `GET /media`, `PATCH / DELETE /media/[id]`, `GET /raw/[id]`, and `GET /view/[id]`.
- **`/websocket` (Real-Time Gateway):** Architecture overview, handshake authentication, JSON-RPC request/response envelopes, and `@xernerx/websocket` client examples.
- **`/packages` & `/packages/[...package]`:** Live NPM registry and GitHub release reader for `@xernerx/framework`, `@xernerx/stats`, `@xernerx/websocket`, and ecosystem packages with version switching.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Styling & UI:** Tailwind CSS v4, `@xernerx/ui` (`CodeBlock`, `Selector`, `Input`), `@xernerx/components`, Framer Motion
- **Localization:** `@xernerx/providers` (`useDictionary`)

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
