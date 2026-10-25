<!-- @format -->

# `@xernerx/app`

## 2.1.0

### Minor Changes

- <!-- @format -->

    ### Discord Server Ecosystem Integration, Support Hub, Credit Store Coupons & Bot Release Webhooks
    - **Bot Developer `POST release` Webhook Trigger & Dispatcher (`apps/app`, `apps/api`, `apps/docs`)**:
        - Added the `POST release` event trigger toggle to the Developer Portal Webhooks configuration (`apps/app/src/components/portal/bot/WebhooksTab.tsx`) alongside existing vote, stat, and review webhook triggers.
        - Built `dispatchBotReleaseWebhooks()` in `apps/api/src/lib/webhookDispatcher.ts` and wired it into both the Developer Portal release publisher (`POST /secure/bots/[id]/releases`) and the public REST API (`POST / PUT /v1/bots/[id]/releases`).
        - Dispatches rich Discord release embeds (`🚀 vX.Y.Z — Title`, release notes body, version field, bot branding, and direct changelog URL) when targeting Discord webhook URLs, or a structured JSON payload (`{ event: 'POST release', botId, timestamp, bot, release, data: { release }, embeds }`) with `X-Xernerx-Event: POST release` headers for custom HTTP endpoints, recording every delivery in `HookModel.deliveries`.
        - Updated `POST /secure/bots/[id]/hooks/test` to include sample `release` data when testing webhooks subscribed to `POST release`, and documented the `POST release` payload in `apps/docs/src/components/api/V1PlatformEndpoints.tsx` and `apps/api/src/lib/docsBlueprintsApi.ts`.

    - **Admin Announcements Channel Panel Presets & Split `#issues` / `#suggestions` Live-Feed Webhooks (`apps/admin`, `apps/api`)**:
        - Added 1-click Discord server channel panel presets in the Admin Announcements visual builder (`apps/admin/src/components/announcements/boilerplateTemplates.ts`, `AnnouncementModal.tsx`, `Announcements.tsx`): **#welcome Panel (3 Embeds + 5 Link Buttons)**, **#rules Panel**, **#support Hub Panel**, **#ecosystem Directory Panel**, plus Terms of Service and Privacy Policy templates.
        - Separated the community live-feed webhooks into dedicated `#issues` (`issues_webhook_url`) and `#suggestions` (`suggestions_webhook_url`) settings in `apps/admin/src/components/Settings.tsx`, `apps/admin/src/components/settings/WebhooksSection.tsx`, and `apps/api/src/lib/mainDiscordServer.ts`.
        - Wired real-time Discord webhook dispatches into `POST /info/issues`, `PATCH /secure/core/issues/[id]`, `POST /info/suggestions`, `PATCH /secure/core/suggestions/[id]`, and `PATCH /secure/core/roadmap/[id]`.
        - Hardened `POST /secure/announcements/create-webhook` and `GET /secure/guilds/[id]` to iterate across `[DISCORD_BOT_TOKEN, DISCORD_CLIENT_TOKEN]`, filter channel selectors to webhook-capable channel types (`0`, `5`, `15`, `16`), support thread webhooks (`?thread_id=...`), load `public/logo.png` locally, and surface detailed Discord API error messages.

    - **Official Discord Server Membership & Support Hub (`packages/providers`, `apps/account`, `apps/admin`, `apps/api`, `services/app`)**:
        - Enhanced `SupportProvider.tsx` (`@xernerx/providers`) with the `useSupport()` hook (`isJoined`, `isChecking`, `adminServerId`, `refreshMembership`) and integrated an Official Discord Server connection card with 1-click Join (`PUT /secure/guilds/[id]/discord/join/[userId]`) and Role Sync in `apps/account/src/components/Connections.tsx`.
        - Added the Admin Support Hub (`apps/admin/src/components/Support.tsx`, `apps/admin/src/components/support/*`) and backend API (`GET / POST /secure/core/support`, `PATCH / DELETE /secure/core/support/[id]`) backed by `SupportBot`, `SupportChannel`, and `SupportTicket` Mongoose models (`@xernerx/lib`).
        - Upgraded `@xernerx/app` (`services/app`) slash commands (`/status`, `/roadmap`, `/faq`, `/docs`, `/issues`, `/suggestions`, `/changelog`, `/sync`) with interactive buttons and Link Buttons, and added automated support thread & forum post intake with interactive troubleshooting checklists and ticket resolution (`services/app/src/events/messageCreate.ts`, `interactionCreate.ts`, `lib/supportTickets.ts`).

    - **Credit Store Coupon Codes & Developer Bot Slot Quotas (`apps/store`, `apps/admin`, `apps/account`, `apps/api`, `packages/lib`)**:
        - Added the `Coupon` Mongoose model (`packages/lib/src/models/xernerx/store/Coupon.ts`), Admin Coupon management UI (`apps/admin/src/components/store/StoreCouponsTab.tsx`, `CouponModal.tsx`), and `/secure/store/coupons` CRUD endpoints supporting `credit_bonus` and `perk_unlock` coupon codes.
        - Added `+1 Bot & API Token Slot` (2,500 Credits) and `+3 Bot & API Token Slots` (6,000 Credits) developer perks to the Credit Store (`apps/api/src/lib/storeSeed.ts`, `apps/store/src/components/CreditStoreView.tsx`), and enforced bot/token slot quotas with an inline slot counter and upgrade prompt in `apps/account/src/components/Tokens.tsx` and `CreateTokenModal.tsx`.

    - **Bot Explorer & Discord Lookup Hardening (`apps/app`, `apps/api`)**:
        - Consolidated `BotCard` into `apps/app/src/components/ExploreCards.tsx` (reused by `apps/app/src/app/bots/page.tsx`), initializing stats and Discord metadata directly from `GET /secure/bots`, awaiting `useEnvironment().isReady`, and aborting in-flight requests cleanly on unmount.
        - Added a 5-minute in-memory response cache and `[DISCORD_BOT_TOKEN, DISCORD_CLIENT_TOKEN]` fallback to `GET /core/users/[id]/discord`.

### Patch Changes

- Updated dependencies
    - @xernerx/lib@1.12.0

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
