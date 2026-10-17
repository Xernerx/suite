<!-- @format -->

# `packages/styles` (`@xernerx/styles`) — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`@xernerx/styles` defines the central **Tailwind CSS v4** configuration, `@tailwindcss/typography` plugin setup, `@source` scanning paths, and CSS custom property design tokens (`globals.css`) consumed by every web application in the Xernerx Suite.

## 🎨 Design Tokens & CSS Variables (`globals.css`)

- **Colors & Surfaces:**
    - `--accent`, `--hover-accent`, `--active-accent`
    - `--background`, `--foreground`, `--border`
    - `--text`, `--text-muted`
- **Dynamic Layout & Scaling:**
    - `--text-scale`: Controls root `html` font size.
    - `--ui-scale`: Controls root `html` zoom (`calc(var(--ui-scale) * 1%)`).
    - `--ui-gap`: Controls dynamic layout density spacing.

## ⚠️ Important Rules & Gotchas

1. **Tailwind CSS v4 Only:** Do not create `tailwind.config.js` or `tailwind.config.ts` files. All theme extensions belong in `packages/styles/globals.css` using `@theme` and CSS variables.
2. **`@source` Scanning:** `globals.css` declares `@source` directives pointing to `../ui/src`, `../components/src`, and `../providers/src`. If a new shared UI package is created, add its `@source` path here so Tailwind v4 scans its utility classes.
3. **App Consumption:** Individual apps import this file via `@import '@xernerx/styles/globals.css';` in their `src/app/globals.css`.
