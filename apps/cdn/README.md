<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx CDN Banner" width="100%">
</p>

<p align="center">
  <b>Asset delivery network, private blob storage, and media proxy pipeline for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-cdn-blue?style=for-the-badge&logo=none" alt="Service">
  <img src="https://img.shields.io/badge/port-4002-informational?style=for-the-badge&logo=none" alt="Port">
</p>

---

## 🧭 Overview

The **CDN** service (`cdn.xernerx.com`, dev port `4002`) manages media uploads, `@vercel/blob` private storage, access-controlled binary streaming, and rich media previews across the Xernerx ecosystem.

### 🌐 Subdomain Routing

| Environment | URL Pattern                                                | Description                                          |
| :---------- | :--------------------------------------------------------- | :--------------------------------------------------- |
| **Public**  | [`cdn.xernerx.com`](https://cdn.xernerx.com)               | Production static asset and media gateway            |
| **Canary**  | [`cdn.canary.xernerx.com`](https://cdn.canary.xernerx.com) | Staging and pre-release asset validation environment |
| **Dev**     | [`cdn.dev.xernerx.com`](https://cdn.dev.xernerx.com)       | Local development gateway (`localhost:4002`)         |

---

## 📡 Endpoints & Routes

- **`POST /upload` & `POST /upload/[id]`:** Multipart file upload endpoints storing private blobs in `@vercel/blob` and recording metadata in MongoDB (`models.core.Media`). Enforces role permissions (`uploadMedia` / `manageMedia`) and tier quotas (**10 uploads** on Free, **1,000 uploads** on active Ultra subscriptions).
- **`GET /media`:** Lists media records owned by the authenticated user (or all platform media when `?admin=true` with `manageMedia` permission).
- **`PATCH / DELETE /media/[id]`:** Updates media privacy (`public`, `limited`, `private`) and shared user allowlists, or permanently deletes the blob and database record.
- **`GET /raw/[id]`:** High-performance binary streaming proxy with privacy verification and immutable caching (`Cache-Control: public, max-age=31536000, immutable`).
- **`GET /view/[id]`:** Rich browser media viewer with metadata inspection, download, and sharing controls.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** Next.js (App Router) / React
- **Storage:** `@vercel/blob` (Private store with server-side stream proxy)
- **Database & Auth:** `@xernerx/lib` (Mongoose, NextAuth)

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
