<!-- @format -->

# Xernerx Haste (`apps/haste`)

**Xernerx Haste** (`haste.xernerx.com`, Dev Port `4011`) is the official first-party code and text pastebin for the Xernerx Suite and `@xernerx/commands`.

## Key Features

- **Dedicated Mongo Cluster (`MONGO_HASTE`)**: Stores documents in the `haste` database with automatic MongoDB TTL expiration (`1h`, `24h`, `7d`, `30d`, or `never`).
- **Lightweight User ID Verification (`POST /documents` & `POST /v1/haste`)**: Any registered Xernerx user can create hastes by passing their `userId` (via session, JSON body, query `?userId=...`, `x-user-id` header, or `/documents/[userId]`).
- **Universal 3-Tier Privacy (`public` | `limited` | `private`)**:
    - `public`: Viewable by anyone (including unauthenticated users) and listed in the public feed.
    - `limited`: Viewable by anyone with the direct link (`haste.xernerx.com/[id]`), never listed publicly.
    - `private`: Strictly accessible only by the document owner.
- **Raw Streaming (`/raw/[id]`)**: Serves raw `text/plain; charset=utf-8` content for `curl`, CLI pipelines, and Discord bot viewers.
