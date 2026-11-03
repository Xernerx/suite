<!-- @format -->

# `packages/ui` (`@xernerx/ui`) — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`@xernerx/ui` is the low-level design system primitive library for the Xernerx Suite, offering reusable, theme-aware building blocks.

## 📦 Exported Primitives (`index.ts`)

- **Inputs & Actions:** `Button`, `Input`, `Toggle`, `Check`, `Slider`, `Selector`, `MultiSelector`, `Confirm`, `Markdown` (`editable` Write / Split / Preview)
- **Layout & Containers:** `Modal` (`size` & `maxWidth`), `CollapsibleCard`, `Tabs`, `Divider`, `Tooltip`, `CodeBlock`, `Markdown`
- **Safety Guards:** `PreventLossConfirmation`

## ⚠️ Important Rules & Gotchas

1. **`<Toggle />` vs `<Check />`:** Use `Toggle` (`Toggle.tsx`) strictly for **On / Off** boolean state switches. Use `Check` (`Check.tsx`) strictly for **selecting** items (checkboxes, multi-select cards, list item selection, and option selection).
2. **Unified `<Markdown />` Component (`Markdown.tsx`):** All Markdown rendering and editing across the suite must use `<Markdown />`. Clipboard image/video paste-to-CDN (`allowAdminMediaPaste`) is strictly restricted to `apps/admin` (enforced by prop opt-in, `admin.xernerx.com` / port `4006` origin check, staff RBAC permissions, and server-side verification in `apps/cdn`).
3. **Keep Primitives Domain-Agnostic:** Components in `@xernerx/ui` should not contain business logic or app-specific API calls. High-level, domain-coupled components (like `BotCard` or `AppLayout`) belong in `@xernerx/components`.
4. **Theme Token Compliance:** Always style primitives using CSS variables (`bg-(--background)`, `bg-(--foreground)`, `border-(--border)/10`, `text-(--text)`, `bg-(--accent)`) so they automatically adapt to light/dark themes and user-selected accent colors.
5. **Client Directive & Motion:** Include `'use client';` at the top of interactive components and use `framer-motion` for transitions/modals.
