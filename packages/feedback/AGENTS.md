<!-- @format -->

# `packages/feedback` (`@xernerx/feedback`) — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`@xernerx/feedback` provides standardized status, loading, and Next.js error boundary screens used across all suite web applications.

## 📦 Exported Surface (`index.ts`)

- `Loading`: Animated loading state screen.
- `Error`: Route-level Next.js `error.tsx` boundary screen (`{ error, reset }`).
- `GlobalError`: Root Next.js `global-error.tsx` boundary handler.
- `NotFound`: Standardized 404 (`not-found.tsx`) screen.
- `NotPermitted`: Standardized 403 Forbidden / access denied screen.

## ⚠️ Important Rules & Gotchas

1. **Next.js App Router Conventions:** Every Next.js app in `apps/*` re-exports or renders these components inside its `loading.tsx`, `error.tsx`, `global-error.tsx`, and `not-found.tsx` files. Keep props compatible with Next.js App Router expectations.
2. **Client Component Requirement:** Error boundary components in Next.js must declare `'use client';`.
3. **Localization:** All strings must resolve via `useDictionary()` under the `feedback.*` namespace.
