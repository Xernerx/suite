---
name: xernerx-legal-and-org
description: >-
    Organization-wide legal, licensing, security policy, and .github community
    health synchronization across the entire Xernerx Studios parent directory
    (suite, virtue, yourapps, @xernerx/* packages, docs, examples, and .github).
    Use whenever changing auth, cookies, localStorage, bots, billing, privacy,
    security, licenses, or README/org policy files.
---

<!-- @format -->

# Xernerx Studios Legal, Licensing & Org Policy Sync

This policy scope is **never limited to `suite` alone** — elevate 1 directory level up (`..` / `d:\Xernerx Studios\`) so every repository in the Xernerx Studios organization stays accurately represented.

## 1. Parent `Xernerx Studios/` Directory Map (`..`)

| Root Path (`..`)                | Repository / Package         | License                         | Purpose                                                                                                                                |
| :------------------------------ | :--------------------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------- |
| `../suite`                      | `suite`                      | Xernerx Proprietary & SaaS v1.0 | Xernerx Suite monorepo (`apps/*`, `packages/*`, `services/*`, `clients/*`, `.xernerx/cli`)                                             |
| `../apps/virtue`                | `virtue` (`v2.x`)            | Xernerx Proprietary & SaaS v1.0 | Standalone Virtue Discord leveling bot (`Guilds`, `GuildMessages`, `GuildVoiceStates`), Dynamic Hoist Roles, `/boost`, cycles, & cards |
| `../apps/yourapps`              | `yourapps` (`v1.x`)          | Xernerx Proprietary & SaaS v1.0 | Standalone YourApps Discord forms & applications bot (`Guilds`, `GuildMessages`), Modals V2, drafts, Apply panels, & role workflows    |
| `../packages/xernerx`           | `xernerx`                    | Apache-2.0                      | All-in-one Xernerx Suite SDK & bot framework meta-package                                                                              |
| `../packages/framework`         | `@xernerx/framework`         | Apache-2.0                      | Modular Discord.js bot client, sharding, event & extension loader, `XernerxUser` enrichment                                            |
| `../packages/commands`          | `@xernerx/commands`          | Apache-2.0                      | Slash, Context Menu, and Message command builder, validator, and handler                                                               |
| `../packages/extension-builder` | `@xernerx/extension-builder` | Apache-2.0                      | Base `ExtensionBuilder` contract for `@xernerx/framework` extensions                                                                   |
| `../packages/hooks`             | `@xernerx/hooks`             | Apache-2.0                      | HMAC-SHA256 webhook receiver (`HooksClient` / `XernerxHooks`) & zero-DB engagement cache (`voted`, `reviewed`, `tipped`)               |
| `../packages/stats`             | `@xernerx/stats`             | Apache-2.0                      | Automated bot telemetry, guild count, and statistics reporter                                                                          |
| `../packages/terminal`          | `@xernerx/terminal`          | Apache-2.0                      | Scoped CLI logger and structured terminal output utility                                                                               |
| `../packages/websocket`         | `@xernerx/websocket`         | Apache-2.0                      | Bidirectional WebSocket RPC client for Xernerx services                                                                                |
| `../docs`                       | `docs`                       | Xernerx Proprietary & SaaS v1.0 | Canonical open-source package docs (`docs/packages/*`) & TypeDoc artifact registry (`docs.json` & HTML)                                |
| `../examples`                   | `examples`                   | Xernerx Proprietary & SaaS v1.0 | TypeScript (`@xernerx/*`) and JavaScript (`xernerx`) Discord bot starter templates & sharding examples                                 |
| `../.github`                    | `.github`                    | Xernerx Proprietary & SaaS v1.0 | Org profile (`profile/README.md`) & inherited org-wide community health standards                                                      |

## 2. Organization-Wide `.github` Inheritance Rule

`../.github` (`github.com/Xernerx/.github`) is the single canonical repository housing `profile/README.md`, `README.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `FUNDING.yml`, `PULL_REQUEST_TEMPLATE.md`, and `ISSUE_TEMPLATE/*` inherited by every repo in the `Xernerx` organization.

- **Never** create duplicate `SECURITY.md`, `CODE_OF_CONDUCT.md`, or `CONTRIBUTING.md` files inside `suite`, `../apps/*`, `../packages/*`, `../docs`, or `../examples` (which would shadow `../.github`). Update them directly in `../.github`.

## 3. Audit & Update Checklist

Whenever changes affect authentication, session cookies, `localStorage` keys, Desktop/Mobile client storage, Discord bot capabilities/intents/telemetry (`Virtue`, `YourApps`, `To-Do List Bot`, `Metamorphosis`, `Zodiac`, `Xernerx App`, `Xernerx Bot`), open-source NPM packages (`../packages/*`), `../docs`, `../examples`, API/WebSocket security, CDN/Haste storage, Blog, Stripe billing, Credit Store perks, or privacy controls:

- [ ] **All 5 Web Policy Pages:** `apps/www/src/app/{terms,privacy,cookies,security,license}/page.tsx` and their dictionary strings in `packages/lib/src/dictionaries/en-GB.json` (`www.terms.*`, `www.privacy.*`, `www.cookies.*`, `www.security.*`, `www.license.*`).
- [ ] **Version / Review Date Bumps:** Bump `TERMS_VERSION`, `PRIVACY_VERSION`, `COOKIES_VERSION`, or the `/security` review date when policies materially change (verified by `pnpm suite commit`).
- [ ] **Org `.github` & Repo Markdown:** Update `../.github/{profile/README.md, README.md, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SUPPORT.md}` and root `README.md` across affected sibling repos.
- [ ] **Exact License Parity:** Keep `LICENSE` in `suite`, `../apps/virtue`, `../apps/yourapps`, and `../.github` byte-for-byte identical to `PLAIN_TEXT_LICENSE` in `apps/www/src/app/license/page.tsx`.
