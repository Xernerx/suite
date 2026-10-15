<!-- @format -->

# `apps/info` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/info` (`info.xernerx.com`, dev port `4007`) is the public community feedback, roadmap, bug reporting, and knowledgebase support hub.

## 🏗️ Key Routes & Architecture

- **`/`:** Support & feedback directory landing page.
- **`/roadmap`:** Interactive glassmorphic timeline displaying past, active, and planned milestones fetched from `/secure/core/roadmap`.
- **`/suggestions`:** Community feature request board with upvoting and status filtering (`/secure/core/suggestions`).
- **`/bugs`:** Bug reporting portal that uploads screenshot attachments to `cdn.xernerx.com/upload` before submitting issue payloads to `/secure/core/issues`.
- **`/faq`:** Tabbed knowledgebase covering Bots, Environments, and Translations.

## ⚠️ Important Rules & Gotchas

1. **CDN Attachment Flow:** Bug reports upload attachments via the anonymous `cdn.xernerx.com/upload` endpoint first, then pass the resulting CDN asset URLs to the issue creation endpoint on `api.xernerx.com`.
2. **Environment URLs:** Always resolve `api` and `cdn` endpoints via `useEnvironment().getEnvUrl()`.
3. **Localization (`DictionaryProvider` & `t`):** All copy belongs under the `info.*` namespace in `packages/lib/src/dictionaries/en-GB.json` consumed via `useDictionary()`. Always inspect `packages/providers/src/DictionaryProvider.tsx` to verify how `t(path, variables?)` operates rather than guessing its signature.
