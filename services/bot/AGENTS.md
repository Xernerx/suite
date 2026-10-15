<!-- @format -->

# `services/bot` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`services/bot` is the Discord bot daemon built on `discord.js` and `@xernerx/framework`, responsible for real-time guild, member, and command synchronization with the Xernerx Suite database and analytics (`@xernerx/stats`).

## 🏗️ Architecture & Entry Points

- **`src/main.ts`:** Instantiates `Client` (extending `XernerxClient` from `@xernerx/framework`) with `Guilds`, `GuildMessages`, and `GuildMembers` intents, connects to MongoDB via `@xernerx/lib/core`, and initializes `XernerxStats`.
- **`src/events/*`:** Event modules (`clientReady.ts`, `guildCreate.ts`, `guildDelete.ts`, `guildMemberAdd.ts`, `guildMemberUpdate.ts`, `guildUpdate.ts`, `messageCreate.ts`).

## ⚠️ Important Rules & Gotchas

1. **Node `>=22` & Env Loading:** Uses native `process.loadEnvFile()` targeting local `.env` or root `../../.env`.
2. **Event Compilation (`dist/events`):** `@xernerx/framework`'s `loadEvents` loads compiled event files from `dist/events/`. When adding new events in `src/events/`, ensure TypeScript compiles cleanly (`pnpm build` or `pnpm dev` via `tsc-watch`).
3. **Database Models:** Import `database` and `registry` from `@xernerx/lib/core` (or `@xernerx/lib/server`) rather than redefining Mongoose schemas locally.
