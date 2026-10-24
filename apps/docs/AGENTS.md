<!-- @format -->

# `apps/docs` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/docs` (`docs.xernerx.com`, dev port `4005`) is the developer documentation portal, interactive API reference explorer, and multi-version `@xernerx/*` package documentation reader.

## 🏗️ Key Routes & Architecture

- **`/`:** Documentation overview and quickstart guides.
- **`/api` & `/api/[version]`:** Interactive API endpoint documentation covering Core, Secure (`/secure/*`), and Public Developer (`/v1/*`) endpoints.
- **`/cdn` & `/websocket`:** Integration guides, authentication flows, and payload schemas for the CDN and WebSocket gateway.
- **`/packages` & `/packages/[...package]`:** Dynamic catch-all documentation browser for `@xernerx/*` packages with version switching and sidebar navigation.

## ⚠️ Important Rules & Gotchas

1. **Code Syntax Highlighting:** Use the shared `CodeBlock` primitive from `@xernerx/ui` (or configured `react-syntax-highlighter` styles) to keep code snippets consistent with the suite theme.
2. **Keep Specs & API Versions Synced:** When adding or changing public/secure endpoints in `apps/api`, `apps/cdn`, or `services/websocket`, update the corresponding endpoint definitions and examples in `apps/docs`. When a breaking change introduces a new public API version (e.g. `/v2/*`), register the new version in `/api/[version]/page.tsx` and document the migration differences.
3. **Localization (`DictionaryProvider` & `t`):** Use `useDictionary()` (`docs.*` namespace) for UI chrome and navigation labels. Always inspect `packages/providers/src/DictionaryProvider.tsx` to verify how `t(path, variables?)` operates rather than guessing its signature.
