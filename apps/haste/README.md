<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Haste Banner" width="100%">
</p>

<p align="center">
  <b>First-party code and text pastebin, syntax viewer, and raw text streaming gateway for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-haste-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4011-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **Haste** service (`haste.xernerx.com`, dev port `4011`) is the official Hastebin-compatible code and text pastebin for the Xernerx ecosystem, supporting syntax highlighting, configurable TTL expirations, 3-tier privacy controls, and raw plain-text streaming.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                    | Description                                           |
| :---------- | :------------------------------------------------------------- | :---------------------------------------------------- |
| **Public**  | [`haste.xernerx.com`](https://haste.xernerx.com)               | Production code and text pastebin                     |
| **Canary**  | [`haste.canary.xernerx.com`](https://haste.canary.xernerx.com) | Staging and pre-release pastebin environment          |
| **Dev**     | [`haste.dev.xernerx.com`](https://haste.dev.xernerx.com)       | Local development pastebin gateway (`localhost:4011`) |

---

## 📡 Endpoints & Routes

- **`/` (`HasteStudioClient.tsx`):** Authenticated paste editor and personal paste manager (`My Pastes`) with syntax selection, TTL expiration (`1h`, `24h`, `7d`, `30d`, `never`), and 3-tier privacy (`public`, `limited`, `private`). Redirects unauthenticated visitors to `account.xernerx.com/login`.
- **`/[id]` (`HasteDocumentViewer.tsx`):** Direct paste viewer with syntax highlighting, one-click copy, raw link, file download, forking (`/?fork=[id]`), and owner metadata controls. Displays a `404` (`<NotFound />`) when an invalid or expired code is requested.
- **`POST /documents` & `POST /documents/[userId]`:** Hastebin-compatible document creation endpoints backed by `MONGO_HASTE` (`models.documents.Document`).
- **`GET /raw/[id]`:** Streams raw `text/plain; charset=utf-8` paste contents while enforcing 3-tier privacy and TTL expiration.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Database & Auth:** `@xernerx/lib` (`database('haste')`, NextAuth)
- **Styling & UI:** Tailwind CSS v4, `@xernerx/ui`, `@xernerx/components`, `@xernerx/feedback`

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
