<!-- @format -->

# `services/websocket` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`services/websocket` (default port `5000`) is the persistent bidirectional WebSocket gateway and microservice router connecting Xernerx bots, services, and clients with the backend.

## 🏗️ Architecture & Routing

- **`src/main.ts`:** Starts an HTTP server (`/health` endpoint + CORS) and a `ws.WebSocketServer` that authenticates connections and dispatches JSON messages formatted as `{ id, service, method, body }`.
- **`src/lib/auth.ts`:** Authenticates clients via query param (`?token=`), `Authorization: Bearer` header, or an `{ service: 'auth', body: { token } }` handshake message using JWT (`jose`) or Mongoose `Tokens` model lookup.
- **Dynamic Service Handlers (`src/app/<service>/server.ts`):**
    - Currently includes: `auth`, `metamorphosis`, `virtue`, `xernerx`, `zodiac`.
    - Each service exports a default async handler `(msg: { method, action, body }, ws: AuthedWebSocket) => Promise<unknown>`.

## ⚠️ Important Rules & Gotchas

1. **Adding a New Service Route:** Create `src/app/<service-name>/server.ts` with a default export function. The router dynamically resolves services by folder name.
2. **Correlation IDs (`id`):** Always preserve and return the incoming message `id` in responses so callers can correlate async request/response promises.
3. **Logging:** Always log events and errors using `@xernerx/terminal` (`Terminal`) instead of raw `console.log`.
4. **Sync Docs & FAQ on WebSocket Changes:** Whenever adding, modifying, or removing a WebSocket service (`src/app/<service>/server.ts`) or action, always update `apps/docs/src/app/websocket/page.tsx`, `packages/lib/src/dictionaries/en-GB.json` (`docs.websocket.*`), `apps/api/src/lib/docsBlueprints.ts`, and (when user/developer questions may arise) the FAQ in `apps/info/src/components/faq/*` and `apps/api/src/lib/faqBlueprints*.ts`.
