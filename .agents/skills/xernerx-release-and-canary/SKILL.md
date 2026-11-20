---
name: xernerx-release-and-canary
description: >-
    Release management, audience-segmented changelogs, 1-app-per-changeset rules,
    branch governance (community / canary / main), and 5-gate Canary soak
    promotion for Xernerx Suite. Use whenever writing .changeset/*.md files,
    editing CHANGELOG.md, committing releases, or managing canary-to-main
    promotions.
---

<!-- @format -->

# Xernerx Release, Changesets & Canary Promotion

## 1. Audience Segmentation (End-User vs. Developer vs. Internal)

Keep UI placement, changesets, announcements, and docs strictly segmented by audience:

| Tier             | Target Workspaces & Surfaces                                                                   | Audience                                             | Tone & Boundaries                                                                                                                                                                 |
| :--------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. End-User**  | `www`, `app`, `account`, `store`, `info`, `haste`, `cdn`, `blog`, `desktop`                    | Community members, voters, server members, bot users | **Consumer-first & benefit-driven.** Never expose raw embed snippets, webhook secrets, internal file paths (`packages/lib/...`), or DB schema names in consumer UI or changelogs. |
| **2. Developer** | `portal`, `docs`, `api` (`/v1/*`), `services/websocket`, `@xernerx/*` SDKs                     | Bot owners, org managers, API/SDK integrators        | **Technical & actionable.** Document endpoints, payloads, widgets, rate limits, and SDK details; keep developer tooling in `portal` and `docs` instead of cluttering `app`.       |
| **3. Internal**  | `admin`, `hosting`, `.xernerx/cli`, `/secure/admin/*`, `/secure/core/*`, compiler/DB refactors | Staff, moderators, translators, infra engineers      | **Operational & internal-only.** Never surface internal tools or code-hygiene refactors as end-user announcements or consumer FAQ items.                                          |

## 2. Strict 1-App-Per-Changeset & Mandatory Changelog Structure

- **1-App-Per-Changeset:** Every modified app, service, or package **must** have its own separate `.changeset/<pkg-name>.md` file. Never list two or more packages in the YAML frontmatter of a single `.changeset/*.md` file.
- **Mandatory Format** (omit empty `### Added`, `### Changed`, or `### Deleted` sections):
    ```markdown
    ## Title

    Shortdescription

    ### Added

    - **Feature Name**: Detailed description of what was added.

    ### Changed

    - **Updated Feature**: Detailed description of what was updated or improved.

    ### Deleted

    - **Removed Feature**: Detailed description of what was removed.
    ```
- Run `pnpm suite commit` to format code, check legal/security policy version updates, and create changesets.

## 3. Branch Governance & Canary Soak Pipeline

- **`community`**: External contributor fork/PR target (auto-synced from `canary` via `.github/workflows/sync-community.yml`; never auto-merged back into `canary`).
- **`canary`**: Locked to Xernerx Studios members (`Protect Canary` ruleset + `validate-main-target`). Deploys to all 13 `*.canary.xernerx.com` subdomains.
- **`main`**: Production (`Protect Main` ruleset). Promoted automatically from `canary` via `.github/workflows/promote-main.yml` at **`00:00 UTC`** once the latest `canary` commit is **`>= 24h` old** (append `[wip]` or `[hold]` to a commit message to pause auto-promotion).

### 5-Gate Promotion Verification (`.xernerx/cli/verify-canary.mjs`)

Before merging `canary → main` (automatically or via `pnpm suite promote`):

1. **Dictionary Integrity:** JSON syntax + `{placeholder}` parity against `en-GB.json` (`--local-only`).
2. **GitHub CI & All-13-App Vercel Deploy Statuses:** Zero failed/pending statuses or check-runs on `origin/canary` HEAD.
3. **Vercel 23h Soak-Error Audit:** Every active `suite` `canary` deploy is `READY` with `0` HTTP `5xx` requests (`vercel logs requests`) and `0` `fatal` runtime crashes (`vercel logs runtime`).
4. **Live 13-App Canary Smoke Check:** All 13 `*.canary.xernerx.com/api/version` endpoints healthy.
5. **Concurrent API & WebSocket Stress Gate:** 24 concurrent requests with `0` errors and `p95 <= 9000ms`.
