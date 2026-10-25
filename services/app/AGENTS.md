<!-- @format -->

# `services/app` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`services/app` is the standalone **Xernerx App** Discord bot daemon (`@xernerx/app`) built on `discord.js` and `@xernerx/framework`, serving the official Xernerx Support & Community servers with interactive documentation (`/docs`), FAQ (`/faq`), system status (`/status`), roadmap (`/roadmap`), changelog (`/changelog`), suggestions (`/suggestions`), and issues (`/issues`) commands, as well as staff/community role synchronization.

## 🏗️ Architecture & Entry Points

- **`src/main.ts`:** Instantiates `XernerxAppClient` using `DISCORD_CLIENT_TOKEN`, loads slash commands from `dist/commands/slash` and events from `dist/events`, and connects to Discord independently of `services/bot`.
- **`src/commands/slash/*`:** Interactive slash commands (`/docs`, `/faq`, `/changelog`, `/roadmap`, `/status`, `/suggestions`, `/issues`).
- **`src/events/*`:** Event handlers (`clientReady.ts`, `guildMemberAdd.ts`, `guildMemberUpdate.ts`, `interactionCreate.ts`).
- **`src/lib/*`:** API client (`api.ts`), catalog fallbacks (`catalogFallbacks.ts`), and self-uptime & command sync helpers (`botUtils.ts`).
