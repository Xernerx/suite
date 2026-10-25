<!-- @format -->

# `@xernerx/app`

## 2.0.1

### Patch Changes

- <!-- @format -->

    ### Added & Enhanced
    - **Universal `/v1/bots/[id]` Auto-Profile Creation & Token/Bot/User Binding (`apps/api/src/lib/v1BotAuth.ts`, `apps/api/src/app/v1/bots/[id]/*`)**:
        - Centralized `/v1/bots/[id]` authentication and mutation handling in `authenticateV1BotRequest`.
        - Any `POST`, `PUT`, `PATCH`, or `DELETE` request across `/v1/bots/[id]`, `/v1/bots/[id]/profile`, `/v1/bots/[id]/stats`, `/v1/bots/[id]/commands`, and `/v1/bots/[id]/releases` now automatically creates the bot profile from Discord if it does not exist yet, binds the API token (`botId` and `status: 'active'`), and synchronizes user `owners` between the token and the bot profile.
        - Added full `POST`, `PUT`, `PATCH`, and `DELETE` method support across `/v1/bots/[id]/*` endpoints and documented the expanded release methods in `apps/docs`.
    - **Token & Bot Owner Synchronization (`apps/api/src/app/secure/tokens/*`, `apps/api/src/app/secure/bots/*`)**:
        - Exposed `botId` and `owners` in `GET /secure/tokens` and ensured token creation/updates sync `owners` with any bound bot profile.
        - Updated `GET /secure/bots?owner=...` to automatically resolve and sync bots bound via the user's API tokens, and updated bot profile deletion (`DELETE`) to reset bound tokens back to `pending`.
    - **Automatic Stale Locale Key Pruning & Lint Enforcement (`.xernerx/cli/commands/commit.ts`, `.xernerx/cli/commands/lint.ts`, `packages/lib/src/dictionaries/*`)**:
        - Updated `suite commit` to automatically prune any translation keys modified or removed in `en-GB.json` from all non-English locale dictionaries (`en-US.json`, `es.json`, `fr.json`, `nl.json`, `ru.json`, `se.json`) so updated keys immediately fall back to `en-GB.json` and queue for re-translation.
        - Added Section 4b stale/orphaned i18n key verification to `suite lint`.
    - **Discord Daemon Startup & Stats Sync (`services/app/src/main.ts`, `services/bot/src/main.ts`)**:
        - Added `DISCORD_BOT_TOKEN` fallback alongside `DISCORD_CLIENT_TOKEN` in `@xernerx/app` and enabled `XernerxStats` initialization in `bot` whenever `XERNERX_TOKEN` is configured.

- Updated dependencies
    - @xernerx/lib@1.11.1

## 2.0.0

### Major Changes

- Changed the single bot instance runner into their own dedicated bot runtimes.

## 1.0.0

### Major Changes

- Initial standalone workspace extraction for **Xernerx App** (`services/app`), separating its runtime, build pipeline, and uptime tracking completely from `services/bot`.
