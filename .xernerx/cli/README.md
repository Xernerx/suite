<!-- @format -->

# `@xernerx/cli` (`suite`) — Internal Monorepo Orchestrator

Internal CLI tool (`pnpm suite <command>`) automating development servers, local database persistence, environment variable propagation, static asset syncing, locale code generation, and changeset commits across the Xernerx Suite monorepo.

---

## 🛠️ Commands

| Command                       | Description                                                                                                                     |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm suite dev`              | Starts the local WiredTiger MongoDB instance (`27017`), syncs `.env`, and launches workspace dev servers.                       |
| `pnpm suite build`            | Runs production builds across shared packages and Next.js applications.                                                         |
| `pnpm suite lint`             | Runs ESLint across all workspace packages and applications.                                                                     |
| `pnpm suite initialize`       | Syncs static branding assets from `packages/public` into each app's `public/` folder and propagates `.env`.                     |
| `pnpm suite generate-locales` | Regenerates `packages/lib/src/i18n.config.ts` from JSON dictionaries in `packages/lib/src/dictionaries/`.                       |
| `pnpm suite commit`           | Formats the repository with Prettier, checks legal version bumps (`TERMS_VERSION` / `PRIVACY_VERSION`), and creates changesets. |
