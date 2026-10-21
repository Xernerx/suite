<!-- @format -->

# `@xernerx/components` — Shared Application Shell

Provides the unified layout frame, navigation chrome, command palette, and global modals shared across all Xernerx Suite web applications (`apps/*`).

---

## 🧩 Key Exports

- **`AppLayout`:** Top-level application shell composing `Header`, collapsible `Sidebar`, `Footer`, notification drawers, and global keyboard shortcut listeners.
- **`Header` & `Sidebar`:** Responsive navigation bar, subdomain app switcher drawer (`Ctrl + Space` / `Alt + A`), account menu, and view/route sidebar (`Ctrl + B`).
- **`CommandPaletteModal`:** Global command palette (`Ctrl + K` / `Ctrl + Shift + K`) and URL omnibar (`Ctrl + .`).
- **`Footer`:** Standardized ecosystem footer displaying live app version, environment badge, and cross-subdomain links.
