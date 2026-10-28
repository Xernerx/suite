<!-- @format -->

# Xernerx Haste — Agent Guidelines (`apps/haste/AGENTS.md`)

- **Port**: `4011` (`haste.xernerx.com`)
- **Database**: Dedicated `haste` cluster (`process.env.MONGO_HASTE` via `database('haste')` in `@xernerx/lib/server`).
- **Privacy**: Always enforce 3-tier privacy (`public`, `limited`, `private`). Unauthenticated users can view `public` and `limited` documents; `private` documents are strictly restricted to the owner `userId`.
- **Component Placement**: Keep all client components in `apps/haste/src/components/` under 500 lines and localized via `useDictionary()`.
