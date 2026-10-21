<!-- @format -->

# `@xernerx/ui` — Primitive UI Component Library

Shared design-system primitives built for the **Modern Round Glassmorphism Pop** aesthetic across all Xernerx Suite applications.

---

## 🧩 Exported Components

- **`Button`:** Tactile rounded button supporting `primary`, `secondary`, `danger`, `ghost`, and `outline` variants.
- **`Modal` & `Confirm`:** Accessible glassmorphic dialogs replacing native browser `prompt()` and `confirm()` dialogs.
- **`Input`:** Unified text, number, password, `textarea`, and `search` (`shortcut={true}` for global `Ctrl + K`) form control.
- **`Selector` & `MultiSelector`:** Custom glassmorphic single-select and multi-select dropdowns replacing native `<select>`.
- **`Toggle`:** Animated boolean switch replacing native checkboxes.
- **`CodeBlock`:** Tabbed syntax-highlighted code viewer (`typescript`, `javascript`, `python`, `json`, `html`, `svg`, `markdown`, `url`, `bash`) with one-click copy and optional live `preview` slot.
- **`CollapsibleCard`:** Expandable FAQ and settings accordion card.

---

## 🛠️ Engineering Rules

- Never render raw `<input>`, `<textarea>`, `<select>`, or native browser `alert()` / `confirm()` / `prompt()` in suite applications; always import primitives from `@xernerx/ui`.
- Respects theme CSS custom properties (`--background`, `--foreground`, `--accent`, `--text`, `--text-muted`, `--border`, `--ui-gap`).
