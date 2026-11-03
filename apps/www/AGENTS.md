<!-- @format -->

# `apps/www` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/www` (`xernerx.com` / `www.xernerx.com`, dev port `4000`) is the primary public marketing website, legal compliance center, staff application portal, and desktop client download hub.

## 🏗️ Key Routes & Architecture

- **`/`:** Marketing homepage showcasing the Xernerx ecosystem.
- **`/terms`, `/privacy`, `/cookies` & `/security`:** Official Terms of Service, Privacy Policy, Cookie Policy, and Platform & Bot Security Architecture pages with intersection-observer table of contents, scroll progress bars, and contextual FAQs.
- **`/applications` & `/applications/[id]`:** Public staff/role application forms dispatching submissions to `api.xernerx.com/secure/dispatch/applications`.
- **`/download`:** Native desktop client (`clients/desktop`) installer download page.
- **`/contact`:** General inquiry and support contact page.
- **`/invites` & `/invites/[id]`:** Vanity invite showcase and redirect handler.

## ⚠️ Important Rules & Gotchas

1. **Legal & Security Policy Accuracy & Versioning (`terms`, `privacy`, `cookies`, `security`):**
    - Whenever any change in the monorepo affects authentication, cookies, `localStorage` keys, Desktop App storage, bot data/telemetry (`Virtue`, `To-Do List Bot`, `Metamorphosis`, `Zodiac`), API/WebSocket security, CDN/Haste storage, Stripe billing, Credit Store perks, or privacy controls, audit and update `src/app/{terms,privacy,cookies,security}/page.tsx` and `www.{terms,privacy,cookies,security}.*` in `packages/lib/src/dictionaries/en-GB.json`.
    - When modifying `src/app/terms/*`, `src/app/privacy/*`, `src/app/cookies/*`, `src/app/security/*`, or their dictionary strings under `www.{terms,privacy,cookies,security}.*`, `pnpm suite commit` will prompt to bump `TERMS_VERSION` / `PRIVACY_VERSION` in `packages/components/src/TermsPrompt.tsx`, `COOKIES_VERSION` in `packages/providers/src/CookieProvider.tsx`, or the `Last Reviewed` date in `src/app/security/page.tsx`.
2. **Keep `/download` Preview Conformant with Actual App UI:**
    - Whenever any UI, layout, header, sidebar, overlay, or desktop feature changes across `@xernerx/components`, `apps/app`, or `clients/desktop`, update `src/app/download/page.tsx`, `src/components/DesktopInteractivePreview.tsx`, and `src/components/DesktopPerksBento.tsx` so the interactive showcase always matches how the real application looks.
3. **Keep `Ctrl + K` Command Palette & `WwwDeepSearch` Synced:**
    - Whenever adding a new page or feature in `apps/www` or across the suite, register it in `src/components/WwwDeepSearch.tsx`, `packages/providers/src/commandPaletteCatalog.ts`, and `packages/components/src/HeaderOmnibar.tsx`.
4. **Localization (`DictionaryProvider` & `t`):** All marketing and legal copy must use `useDictionary()` (`www.*` namespace in `packages/lib/src/dictionaries/en-GB.json`). Always inspect `packages/providers/src/DictionaryProvider.tsx` to verify how `t(path, variables?)` operates rather than guessing its signature.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
