<!-- @format -->

# `clients/mobile` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`clients/mobile` is a reserved workspace directory for the upcoming cross-platform Xernerx Suite mobile application.

## ⚠️ Important Rules & Gotchas

1. **Currently Uninitialized:** This directory currently only holds synchronized `.env` / `.env.example` files and does not yet have a `package.json` or application source tree.
2. **Future Scaffolding:** When scaffolding the mobile client (e.g., React Native / Expo), ensure it uses `pnpm` workspace linking for shared types/utilities from `@xernerx/lib` (client-safe exports only) and matches the suite's formatting standards (`/** @format */`).
