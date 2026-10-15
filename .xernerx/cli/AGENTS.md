<!-- @format -->

# `.xernerx/cli` (`@xernerx/cli`) — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`.xernerx/cli` is the internal orchestration CLI (`suite`) that powers development, environment synchronization, local MongoDB emulation, locale generation, static asset syncing, formatting, and release workflows across the monorepo.

## 🛠️ Registered Commands (`commands/*`)

- `init` (`commands/init.ts`): Interactive `.env` generator and workspace synchronizer.
- `dev` (`commands/dev.ts`): Runs pre-flights (`generate-locales`, `.env` sync), boots `mongodb-memory-server` persisted in `.xernerx/database` on port `27017` (when `MONGO_XERNERX` is unset), resolves `DOMAIN`/`NEXT_PUBLIC_DOMAIN`, and launches apps/services via `concurrently`.
- `start` (`commands/start.ts`): Production starter.
- `build` (`commands/build.ts`): Workspace-wide build runner (`pnpm -r build`).
- `lint` (`commands/lint.ts`): Workspace linter.
- `clean` (`commands/clean.ts`): Purges `.next`, `dist`, `build`, and `node_modules` caches and reinstalls dependencies.
- `generate-locales` (`commands/generateLocales.ts`): Scans `packages/lib/src/dictionaries/*.json` and writes `packages/lib/src/i18n.config.ts`.
- `initialize` (`commands/initialize.ts`): Copies shared static files from `packages/public` into each web app's `public/` folder.
- `commit` (`commands/commit.ts`): Formats code with Prettier, detects legal policy edits (`TermsPrompt.tsx` version bumps), and runs `@changesets/cli`.
- `ship` (`commands/ship.ts`): Versions, tags, and publishes/pushes releases.

## ⚠️ Important Rules & Gotchas

1. **Adding New Apps or Workspaces:** When a new app (such as `apps/store`) is added to the monorepo, make sure its dev port, `.env` sync target, and `public/` asset sync target are registered in `.xernerx/cli` commands (`dev.ts`, `initialize.ts`, etc.) if applicable.
2. **Command Registration:** Register any new command in `index.ts` and implement its handler in `commands/<name>.ts`.
