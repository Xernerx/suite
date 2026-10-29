<!-- @format -->

# `apps/haste` — Agent Guidelines (`AGENTS.md`)

> Inherits all global rules from [`../../AGENTS.md`](../../AGENTS.md).

## 🧭 Overview

`apps/haste` (`haste.xernerx.com`, dev port `4011`) is the first-party Hastebin-compatible code and text pastebin for the Xernerx Suite, backed by the dedicated `haste` MongoDB cluster (`process.env.MONGO_HASTE` via `database('haste')` in `@xernerx/lib/server`).

---

## 🏗️ Key Routes & Architecture

- **`/` (`HasteStudioClient.tsx`):**
    - Requires authentication. Unauthenticated visitors on `/` are redirected to `account.xernerx.com/login`.
    - Navigation between **New Paste** (`editor`) and **My Pastes** (`mine`) is driven exclusively by the Sidebar (`useSidebar()`) — never render duplicate in-page navigation tabs or a public directory list.
- **`/[id]` (`HasteDocumentViewer.tsx`):**
    - Renders any valid `public` or `limited` paste code for both authenticated and unauthenticated visitors, and `private` pastes for the owner.
    - Invalid, deleted, or expired `[id]` codes must render `<NotFound />` (`@xernerx/feedback`) directly on `/[id]` without redirecting.
- **`/documents` & `/documents/[userId]`:**
    - Hastebin-compatible `POST` endpoints for creating pastes from the web studio, CLI tools, or `@xernerx/commands`.
- **`/raw/[id]`:**
    - Streams raw `text/plain; charset=utf-8` content while enforcing TTL expiration and 3-tier privacy.

---

## ⚠️ Important Rules & Gotchas

1. **Respect `--page-width`:** All primary views (`HasteStudioClient`, `HasteDocumentViewer`) must use `max-w-(--page-width) mx-auto w-full` rather than hardcoded `max-w-7xl` widths.
2. **Universal 3-Tier Privacy Truth (`public` | `limited` | `private`):**
    - **`public` / `limited`:** Accessible via direct link (`/[id]` and `/raw/[id]`). `haste` does not expose a public browse list.
    - **`private`:** Strictly restricted to the paste owner (`userId`).
3. **Component Placement & 500-Line Cap:** Keep all client components in `apps/haste/src/components/` under 500 lines and localized via `useDictionary()`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
