<!-- @format -->

# `apps/*` — Frontend Application Guidelines (`AGENTS.md`)

All Next.js applications inside `apps/*` (`www`, `account`, `app`, `store`, `docs`, `admin`, `info`, `cdn`) must strictly follow these structural and architectural rules.

---

## 🧱 1. Component Reuse First (`@xernerx/ui` & `@xernerx/components`)

- **Always check shared packages before writing custom UI markup:**
    - Check [`@xernerx/ui`](../packages/ui/index.ts) for primitives: `Button`, `Input`, `Toggle`, `Slider`, `Selector`, `MultiSelector`, `Confirm`, `Modal`, `CollapsibleCard`, `Tabs`, `Divider`, `Tooltip`, `CodeBlock`, `PreventLossConfirmation`.
    - Check [`@xernerx/components`](../packages/components/index.ts) for shared shells and domain widgets: `AppLayout`, `Page`, `Header`, `Sidebar`, `Footer`, `BotCard`, `BotRow`, `AdBanner`, `CookiePrompt`, `VersionTracker`.
- **Toggles Instead of Checkboxes (`Toggle.tsx`):** Never render raw native `<input type="checkbox">` elements. Always use `Toggle` from `@xernerx/ui` for boolean settings, switches, and binary state controls.
- Only create an app-local component when it is specific to a single app's domain.

---

## 📏 2. 500-Line Inline Code Limit

- **No route or component file may exceed 500 lines of inline JSX/UI code.**
- Once a `page.tsx` or component approaches or exceeds 500 lines of inline markup/state logic, split its sections/tabs/modals into dedicated sub-components.
- _Exception:_ A file over 500 lines that consists primarily of orchestrating/composing imported components (rather than raw inline markup) is acceptable.

---

## 📁 3. Component Directory Structure (`src/components/`)

- **All app-specific components must live in `apps/<app-name>/src/components/`** (directly next to `src/app/`).
- **NEVER co-locate components inside Next.js App Router route directories** (e.g., do not put helper components inside `src/app/dashboard/components/` or `src/app/bots/[id]/MyComponent.tsx`).
- Route directories (`src/app/**`) may only contain Next.js App Router convention files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `route.ts`).

---

## 🔌 4. Strict 3-Route Local `/api` Rule

- Frontend applications in `apps/*` must **only** contain the 3 standard local Next.js API routes inside `src/app/api/`:
    1. `src/app/api/auth/[...nextauth]/route.ts`
    2. `src/app/api/changelog/route.ts`
    3. `src/app/api/version/route.ts`
- **All other API endpoints (including Stripe checkout/billing/products, database CRUD, Discord actions, etc.) MUST live in `apps/api` (`api.xernerx.com/secure/*` or `/v1/*`)** and be called via `useEnvironment().getEnvUrl('api', '/secure/...')`.

---

## 🌐 5. Localization (`DictionaryProvider` & `t` Function)

- **Always use `DictionaryProvider` and `useDictionary()`:** Every user-facing string in `apps/*` must be localized using `const { t } = useDictionary();` from `@xernerx/providers`.
- **Inspect [`packages/providers/src/DictionaryProvider.tsx`](../packages/providers/src/DictionaryProvider.tsx) — Never Guess How `t` Works:**
    - Before writing or refactoring localized code, read `DictionaryProvider.tsx` to verify how `t` and the context value operate:
        - Context provides: `{ dictionary, currentLocale, locales, currentLanguage, t }`.
        - Signature: `t(path: string, variables?: Record<string, string | number>)`.
        - Variable replacement uses single curly braces `{variableName}` in the JSON dictionary string and passes `{ variableName: value }` as the second argument.
        - **Never pass a 3rd fallback string argument** (`t('key', {}, 'fallback')` does not exist). `DictionaryProvider` automatically falls back to `en-GB.json` (`fallbackDictionary`), so every new string must be added to [`packages/lib/src/dictionaries/en-GB.json`](../packages/lib/src/dictionaries/en-GB.json).
