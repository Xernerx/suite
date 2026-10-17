<!-- @format -->

# `apps/www` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/www` (`xernerx.com` / `www.xernerx.com`, dev port `4000`) is the primary public marketing website, legal compliance center, staff application portal, and desktop client download hub.

## 🏗️ Key Routes & Architecture

- **`/`:** Marketing homepage showcasing the Xernerx ecosystem.
- **`/terms` & `/privacy`:** Official Terms of Service and Privacy Policy pages with intersection-observer table of contents and scroll progress bars.
- **`/applications` & `/applications/[id]`:** Public staff/role application forms dispatching submissions to `api.xernerx.com/secure/dispatch/applications`.
- **`/download`:** Native desktop client (`clients/desktop`) installer download page.
- **`/contact`:** General inquiry and support contact page.
- **`/invites` & `/invites/[id]`:** Vanity invite showcase and redirect handler.

## ⚠️ Important Rules & Gotchas

1. **Legal Policy Versioning (`terms` & `privacy`):**
    - When modifying `src/app/terms/*`, `src/app/privacy/*`, or their dictionary strings under `www.terms.*` / `www.privacy.*`, `pnpm suite commit` will prompt to bump `TERMS_VERSION` or `PRIVACY_VERSION` in `packages/components/src/TermsPrompt.tsx` so users are re-prompted for consent.
2. **Localization (`DictionaryProvider` & `t`):** All marketing and legal copy must use `useDictionary()` (`www.*` namespace in `packages/lib/src/dictionaries/en-GB.json`). Always inspect `packages/providers/src/DictionaryProvider.tsx` to verify how `t(path, variables?)` operates rather than guessing its signature.
