---
name: xernerx-localization
description: >-
    Localization and dictionary workflow for Xernerx Suite using DictionaryProvider,
    useDictionary(), and JSON locale files. Use whenever adding, updating, or
    removing user-facing UI strings, editing packages/lib/src/dictionaries/*.json,
    or regenerating i18n.config.ts.
---

<!-- @format -->

# Xernerx Suite Localization Workflow

## 1. Always Use `useDictionary()` — Inspect `t()` Before Calling

Never hardcode user-facing UI strings in apps or shared components. Consume `const { t } = useDictionary();` from `@xernerx/providers`.

- **Exact signature** (defined in [`packages/providers/src/DictionaryProvider.tsx`](../../../packages/providers/src/DictionaryProvider.tsx)):
    ```ts
    t(path: string, variables?: Record<string, string | number>): string
    ```
- **Resolution behavior:**
    1. Resolves dot-separated `path` (e.g. `'account.store.title'`) in the active locale dictionary.
    2. Automatically falls back to `en-GB.json` if undefined.
    3. Returns the raw `path` string if missing from both.
    4. Interpolates `{key}` placeholders from the optional 2nd `variables` object (e.g. `t('welcome.user', { name: 'Alex' })`).
- **Never pass a 3rd fallback string argument** (e.g. `t('key', {}, 'Fallback')` is invalid — there is no 3rd parameter). Always add missing keys directly to `packages/lib/src/dictionaries/en-GB.json`.

## 2. Editing `en-GB.json` & Pruning Stale Translations

`packages/lib/src/dictionaries/en-GB.json` is the canonical source of truth for all localization keys.

- **Adding a new key:** Add it to `packages/lib/src/dictionaries/en-GB.json`. Do not machine-translate it into other locale files unless explicitly requested — missing keys automatically fall back to `en-GB.json` and appear in the Admin Translations portal (`apps/admin`).
- **Updating or deleting an existing key in `en-GB.json` (MANDATORY):**
    - You **must** delete that corresponding key path from **every other** locale file in `packages/lib/src/dictionaries/*.json` (excluding `en-GB.json`: e.g. `en-US.json`, `es.json`, `fr.json`, `nl.json`, `ru.json`, `se.json`).
    - Prune any parent objects that become empty after deletion.
    - This guarantees non-English locales immediately fall back to the updated `en-GB.json` text instead of serving stale copy, and re-queues the key as untranslated in `apps/admin`.

## 3. Regenerating & Validating Locales

- **Never** manually edit `packages/lib/src/i18n.config.ts`; it is auto-generated.
- If adding/removing locale files or updating locale metadata, run:
    ```bash
    pnpm suite generate-locales
    ```
- Always validate JSON syntax and `{placeholder}` parity across all locale files before finishing:
    ```bash
    node .xernerx/cli/verify-canary.mjs --local-only
    ```
