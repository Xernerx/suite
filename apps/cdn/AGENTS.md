<!-- @format -->

# `apps/cdn` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/cdn` (`cdn.xernerx.com`, dev port `4002`) is the asset delivery network and media upload pipeline, backed by `@vercel/blob` private storage and the MongoDB `Media` model (`@xernerx/lib/server`).

## 🏗️ Key Routes & Architecture

- **`/raw/[id]` (Binary Stream Proxy):**
    - Streams binary blobs directly from `@vercel/blob` with immutable caching headers (`Cache-Control: public, max-age=31536000, immutable` for public files).
    - Enforces privacy controls: if a `Media` document has `privacy === 'private'`, access is restricted strictly to the uploader (`uploaderId`), explicitly shared user IDs, or staff with the `manageMedia` permission.
- **`/view/[id]`:**
    - Interactive browser media viewer page with metadata and download controls.
- **`/upload` & `/upload/[id]`:**
    - `/upload`: Anonymous upload endpoint (10MB limit, stored with `uploaderId: 'system-anonymous'` and `privacy: 'public'`), used by the bug reporter in `apps/info`.
    - `/upload/[id]`: Authenticated user media upload endpoint enforcing user storage/upload quotas (e.g., Free vs Ultra plan limits).
- **`/media` & `/media/[id]`:**
    - Authenticated CRUD endpoints for listing, updating privacy, and deleting media items.

## ⚠️ Important Rules & Gotchas

1. **Never Expose Raw Vercel Blob URLs Directly:** All blobs are stored with private access in `@vercel/blob` and must be served exclusively through `/raw/[id]` so privacy permissions and quotas are respected.
2. **Universal 3-Tier Privacy Truth (`public` | `limited` | `private`):**
    - **`public`:** Publicly listed and accessible by anyone.
    - **`limited`:** Unlisted in public galleries, but accessible by anyone with the direct `/raw/[id]` or `/view/[id]` link/ID.
    - **`private`:** Hard private—restricted strictly to the owner (`uploaderId`) or explicitly shared users.
3. **Quota Enforcement:** When modifying user upload handlers, ensure tier upload limits (Free vs Ultra) are checked against the user's current media count.
