<!-- @format -->

# Changelog

## 1.1.0

### Minor Changes

- ### 🚀 Xernerx Haste (`apps/haste` — `haste.xernerx.com`, Port `4011`)
    - **First-Party Code Pastebin & Studio (`apps/haste`)**: Added the `apps/haste` workspace on dev port `4011` (`haste.xernerx.com`) with `HasteStudioClient`, `HasteExplorerList`, and `HasteDocumentViewer` featuring syntax language selection, TTL expirations (`1h`, `24h`, `7d`, `30d`, `never`), Universal 3-Tier Privacy (`public`, `limited`, `private`), `?fork=[id]` preloading, `Ctrl + S` shortcut publishing, raw streaming (`/raw/[id]`), and owner management controls.
    - **Hastebin Protocol & REST v1 Endpoints (`apps/haste`, `apps/api`)**: Added `POST /documents/[userId]`, `POST /documents`, `GET /raw/[id]`, `GET & POST /v1/haste`, `GET, PATCH & DELETE /v1/haste/[id]`, and `GET /v1/haste/[id]/raw` with lightweight Xernerx `userId` verification against `models.users.User` and automatic outer Discord triple-backtick code-fence unwrapping.
    - **Dedicated `MONGO_HASTE` Cluster & TTL Model (`@xernerx/lib/server`)**: Added `packages/lib/src/models/haste/documents/Document.ts` with a MongoDB TTL index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`) and bound `database('haste')` strictly to `process.env.MONGO_HASTE` with no fallback.

    ### 📦 `@xernerx/*` Ecosystem & Engagement Updates
    - **Bot User Engagement Endpoint & Signed Webhooks (`apps/api`, `apps/portal`, `apps/docs`)**: Added `GET /v1/bots/[id]/users/[userId]` returning `voted`, `lastVotedAt`, `nextVoteAt`, `reviewed`, `rating`, and `tipped` status, HMAC-SHA256 webhook signature headers (`x-xernerx-signature`), and real-time webhook triggers for votes, reviews, and credit tips.
    - **Updated `@xernerx/*` Package Dependencies (`services/*`, `apps/*`, `packages/*`, `.xernerx/cli`, `clients/desktop`)**: Bumped `@xernerx/terminal` to `^1.1.15` workspace-wide, updated `services/app` and `services/bot` to `@xernerx/commands@^0.2.6`, `@xernerx/framework@^1.1.1`, and `@xernerx/stats@^1.0.14`, and registered `XernerxStats` via `extensionHandler.loadExtensions`.
    - **Developer Documentation & Catalog Sync (`apps/docs`, `apps/info`, `apps/api`)**: Documented `/v1/haste`, `/v1/bots/[id]/users/[userId]`, `@xernerx/hooks`, and `@xernerx/extension-builder`, updated `@xernerx/stats` (`get`, `post`, `update`, `delete`) and `@xernerx/commands` (`get`, `post`, `delete`, `clear`) SDK examples, and added the Xernerx Haste FAQ entry.
    - **Suite CLI, Desktop & Branding Polish (`.xernerx/cli`, `clients/desktop`, `packages/public`)**: Added lazy port proxy (`lazyProxy.ts`), `@xernerx/terminal` logging integration (`terminal.ts`), draggable desktop loader bar (`loading.html`), and environment-specific Canary/Dev branding assets across all 13 applications.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.16.0
    - @xernerx/providers@0.17.0
    - @xernerx/components@0.11.0
    - @xernerx/feedback@0.4.3
    - @xernerx/ui@0.7.8

## 1.0.0

### Major Changes

- Initial release of **Xernerx Haste** (`haste.xernerx.com`, Port `4011`) — dedicated code & text pastebin with TTL expirations, 3-tier privacy (`public`, `limited`, `private`), raw text streaming (`/raw/[id]`), and Hastebin-compatible `/documents` API.
