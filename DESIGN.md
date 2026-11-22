<!-- @format -->

# Xernerx Suite — Design System Specification (`DESIGN.md`)

> Canonical visual, token, layout, and component specification for all **Xernerx Suite** web applications (`apps/*`), shared UI packages (`@xernerx/ui`, `@xernerx/components`, `@xernerx/feedback`), the Electron companion client (`clients/desktop`), and the native React Native (Expo) companion (`clients/mobile`, mirrored via `clients/mobile/src/theme/tokens.ts` and `clients/mobile/src/components/ui/`).
>
> **Core Aesthetic:** **Modern Round Glassmorphism Pop** — tactile rounded geometry, translucent frosted layers, dynamic user-chosen `--accent` identity, seamless Light/Dark adaptation, and user-controlled layout/text scaling.
>
> **Official Brand & Press Kit (`BRAND.md`):** For the organization-wide brand identity, **27-color Xernerx accent palette**, official logos/icons/banners (`logo-*`, `icon-*`, `banner-*`), first-party Discord application palettes & imagery (**Virtue** & **YourApps**), and `@xernerx/*` SDK package media assets, see **[`../.github/BRAND.md`](../.github/BRAND.md)** ([`github.com/Xernerx/.github/blob/main/BRAND.md`](https://github.com/Xernerx/.github/blob/main/BRAND.md)) and the machine-readable manifest at **[`./packages/public/brand.json`](./packages/public/brand.json)** ([`../.github/brand/brand.json`](../.github/brand/brand.json)).

---

## 1. Styling Engine & Architecture

- **Tailwind CSS v4** (`@tailwindcss/postcss`) configured centrally in [`packages/styles/globals.css`](./packages/styles/globals.css).
- **Never** create legacy `tailwind.config.js` or `tailwind.config.ts` files.
- All shared UI packages (`packages/ui/src`, `packages/components/src`, `packages/providers/src`, `packages/feedback/src`) are registered via `@source` directives in `packages/styles/globals.css`.
- Viewport utilities (`h-screen`, `min-h-screen`, `max-h-screen`) map to `100dvh` for safe mobile/desktop viewport handling.

---

## 2. Design Tokens (`packages/styles/globals.css`)

### Color Palette (Light & Dark Modes)

Never hardcode dark-only or light-only surface classes (`bg-black`, `bg-zinc-900`, `text-white` on non-accent backgrounds, `border-white/10`). Always bind to theme-aware CSS custom properties:

| Token               | Light Mode (`:root`)                                        | Dark Mode (`html.dark`)                  | Usage                                                                                           |
| :------------------ | :---------------------------------------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `--background`      | `#fafafa`                                                   | `#09090b`                                | Root canvas & recessed wells                                                                    |
| `--foreground`      | `#f4f4f5`                                                   | `#18181b`                                | Elevated cards, modals, panels, bars                                                            |
| `--border`          | `#53535b`                                                   | `#f4f4f5`                                | Subtle borders via `border-(--border)/10` (or `/15`–`/20`)                                      |
| `--text`            | `#09090b`                                                   | `#fafafa`                                | Primary copy & headings                                                                         |
| `--text-muted`      | `#52525b`                                                   | `#a1a1aa`                                | Secondary labels, hints, metadata                                                               |
| `--accent`          | `#8b7cf6` _(Xerple — user-customizable)_                    | `#8b7cf6` _(Xerple — user-customizable)_ | Primary brand/user interactive identity                                                         |
| `--accent-readable` | Dynamic contrast-safe accent                                | Dynamic contrast-safe accent             | Auto-applied to `.text-(--accent)` & `.border-(--accent)*` so monochrome accents remain legible |
| `--accent-contrast` | `#fafafa`                                                   | `#fafafa`                                | Foreground text on solid `bg-(--accent)` surfaces                                               |
| `--hover-accent`    | `color-mix(in srgb, var(--accent) 85%, white 15%)`          | Same                                     | Hover state on accent buttons/controls                                                          |
| `--active-accent`   | `color-mix(in srgb, var(--accent-readable) 85%, black 15%)` | Same                                     | Active/pressed state on accent controls                                                         |
| `--accent-green`    | `#16a34a`                                                   | `#39ff14`                                | **Semantic only:** success, online, operational                                                 |
| `--accent-orange`   | `#ff6600`                                                   | `#ff6600`                                | **Semantic only:** warnings, degraded states                                                    |
| `--accent-red`      | `#ff3333`                                                   | `#ff3333`                                | **Semantic only:** destructive actions, errors, down states                                     |

### Accent Discipline (No Off-Palette Rainbows)

- **Always favor `var(--accent)`:** Use `bg-(--accent)`, `text-(--accent)`, `border-(--accent)/30`, `bg-(--accent)/10`, and `hover:bg-(--hover-accent)` for active states, highlights, icons, pills, and flourishes.
- **Forbidden:** Never introduce off-palette decorative Tailwind colors (`purple-500`, `blue-500`, `sky-500`, `amber-500`, `orange-500`, `#5865F2`, etc.) for standard UI elements.
- **Sole Exception — Top-3 Leaderboard Podium Ranks:**
    - `#1` Gold: `amber-400` / `amber-500`
    - `#2` Silver: `slate-300` / `slate-400`
    - `#3` Bronze: `amber-600` / `amber-700`

### Official 27-Color Palette, Applications & SDK Brand Assets ([`../.github/BRAND.md`](../.github/BRAND.md))

All static brand marks, application imagery, and SDK package graphics live canonically in [`packages/public/`](./packages/public) (synced to every web app via `pnpm suite initialize`) and are mirrored in [`../.github/brand/`](../.github/brand) alongside [`../.github/BRAND.md`](../.github/BRAND.md):

- **27 Official Xernerx Preset Accents (`logo-<color>.{svg,png}`, `icon-<color>.{svg,png,ico}`, `banner-<color>.{svg,png}`):**
    - `purple` (`#8b7cf6` — _Xerple_, default), `violet` (`#7c3aed`), `indigo` (`#6366f1`), `cobalt` (`#2563eb`), `blue` (`#3b82f6`), `sky` (`#38bdf8`), `cyan` (`#06b6d4`), `mint` (`#2dd4bf`), `emerald` (`#10b981`), `green` (`#a4b795`), `neon` (`#39ff14`), `lime` (`#acc813`), `yellow` (`#eab308`), `gold` (`#f59e0b`), `orange` (`#f97316`), `peach` (`#fdba74`), `coral` (`#fb7185`), `crimson` (`#ef4444`), `red` (`#ef4444`), `berry` (`#e11d48`), `pink` (`#ec4899`), `magenta` (`#d946ef`), `lavender` (`#c084fc`), `slate` (`#64748b`), `charcoal` (`#27272a`), `white` (`#ffffff`), `black` (`#09090b`).
- **First-Party Discord Bots (`packages/public/bots/{virtue,yourapps,todo,zodiac,metamorphosis}/` & `../.github/brand/bots/`, directory pages at `https://app.xernerx.com/bots/<bot>`):**
    - **Virtue** (_"Track. Grow. Ascend."_): Primary accent **Celestial Gold** (`gold` `#f59e0b`), **Warm Champagne** (`peach` `#fdba74`), **Radiant Ivory** (`#fff7ed`), and **Obsidian Void** (`#18191d`), with production and grayscale beta/canary assets (`icon.png`, `icon.ico`, `banner.png`, `icon-beta.png`, `icon-beta.ico`, `banner-beta.png`).
    - **YourApps** (_"Discord Forms & Applications"_): Primary accent **Paper Plane Orange** (`orange` `#f97316`), **Sparkle Peach** (`peach` `#fdba74`), **Ocean Teal** (`#1e5f74`), and **Deep Navy Canvas** (`#162238`), with production and grayscale beta/canary assets (`icon.png`, `icon.ico`, `banner.png`, `icon-beta.png`, `icon-beta.ico`, `banner-beta.png`).
    - **To-Do List Bot (TDL)** (_"Collaborative Discord Task Boards & Checklists"_): Official bot color **TDL Leaf Green** (`#71cc2e`), **Checkmark Coral** (`coral` `#ff6363`), **Clipboard Gold** (`yellow` `#f5b82e`), **Mint Sage Gradient** (`mint` `#8de0a6`), and **Sky Azure Gradient** (`sky` `#4392c7`), with production and grayscale beta/canary assets.
    - **Zodiac** (_"Daily Horoscopes & Astrology"_): Official bot color **Zodiac Bronze** (`#8b520f`), **Crescent Amber Gold** (`#fbb040`), **Constellation Periwinkle** (`#6d78ad`), and **Midnight Cosmos Navy** (`#00104a`), with production and grayscale beta/canary assets.
    - **Metamorphosis** (_"Dynamic Voice & Community Automation"_): Primary accent **Dialogue Sky Blue** (`#199fd9`), **Crisp White** (`#ffffff`), and **Obsidian Black** (`#000000`), with production and grayscale beta/canary assets.
    - **Roblox Utilities** (_Additional Service Brand Color_): Official **Warm Alabaster** (`#f5f3f1`).
- **Official SDK Package Media (`packages/public/packages/{banners,icons}/` & `../.github/brand/packages/`):**
    - `xernerx` (`XRX` · `purple` / _Xerple_ `#8b7cf6`), `@xernerx/framework` (`XF` · `indigo` `#6366f1`), `@xernerx/commands` (`XC` · `cyan` `#06b6d4`), `@xernerx/extension-builder` (`XE` · `gold` `#f59e0b`), `@xernerx/hooks` (`XH` · `emerald` `#10b981`), `@xernerx/stats` (`XS` · `coral` `#f43f5e`), `@xernerx/terminal` (`XT` · `magenta` `#d946ef`), `@xernerx/websocket` (`XW` · `blue` `#3b82f6`).

### Typography

| Role                       | CSS Custom Property | Fallback Stack                         | Usage                                                                                   |
| :------------------------- | :------------------ | :------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Display & Primary Sans** | `--font-fredoka`    | `system-ui, -apple-system, sans-serif` | Page/card headings (`style={{ fontFamily: 'var(--font-fredoka)' }}`) and base body font |
| **Monospace / Code**       | `--font-cascadia`   | `ui-monospace, monospace`              | `<code>`, `<pre>`, `<kbd>`, IDs, tokens, endpoints, shortcut badges                     |

### Dynamic Layout, Scaling & Safe-Area Tokens

All views must respect user-configured scaling preferences:

| Token                            | Default                       | Required Usage Pattern                                                                                                                                |
| :------------------------------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--page-width`                   | `90%`                         | Constrain primary page/view containers with `max-w-(--page-width) mx-auto w-full` — **never** hardcode `max-w-7xl`, `max-w-6xl`, or `max-w-[1400px]`. |
| `--ui-gap`                       | `16px`                        | Use `style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}`, `gap-(--ui-gap)`, `p-(--ui-gap)`, or `calc(var(--ui-gap) * 0.5 / 0.75 / 1.25)`.     |
| `--text-scale`                   | `14px`                        | Applied on `html { font-size: var(--text-scale, 14px); }` — use relative `rem`/Tailwind text classes so typography scales smoothly.                   |
| `--ui-scale` / `--ui-zoom`       | `100` / `1`                   | Applied via `html { zoom: var(--ui-zoom, calc(var(--ui-scale, 100) * 1%)); }`.                                                                        |
| `--safe-{top,right,bottom,left}` | `env(safe-area-inset-*, 0px)` | Mobile/notch-safe inset spacing for fixed bars and overlays.                                                                                          |

---

## 3. Geometry, Surfaces & Elevation Recipes

### Rounded Geometry

| Element Category                               | Required Radius                                       | Avoid                                      |
| :--------------------------------------------- | :---------------------------------------------------- | :----------------------------------------- |
| Primary cards, panels, modals, drawers         | `rounded-3xl`                                         | `rounded-sm`, `rounded-md`, `rounded-none` |
| Inner sub-cards, buttons, form controls, wells | `rounded-2xl` (or `rounded-xl` for compact list rows) | Sharp corners on interactive controls      |
| Pills, tags, status badges, chips, avatars     | `rounded-full`                                        | Boxy badges                                |

### Surface Layering Recipes

> Note: `packages/styles/globals.css` automatically mixes `bg-(--foreground)/10..80`, `bg-(--background)/25..95`, and `bg-(--accent*)/5..20` over `--background` via `color-mix()` on rounded surfaces so ambient dot-matrix canvases do not bleed through while honoring user cosmetic surface themes (`data-surface-style`: `crystal`, `holographic`, `neon`, `obsidian` and `data-overlay-skin`: `hud_tactical`, `frosted_prism`, `neon_arcade`, `minimal_pill`).

- **Primary Card / Panel:**
    ```tsx
    className = 'rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm';
    style = {{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
    ```
- **Featured / Active Accent Card:**
    ```tsx
    className = 'rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--accent)/30 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]';
    ```
- **Inner Recessed Well / Nested Section:**
    ```tsx
    className = 'rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4';
    ```
- **Status / Category Pill:**
    ```tsx
    className = 'rounded-full bg-(--accent)/10 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-semibold text-(--accent)';
    ```

### Motion & Accessibility

- Reduced motion is enforced globally via `html.reduce-motion` (`0.01ms` transitions/animations). Keep Framer Motion transitions snappy (`duration: 0.2`, ease `[0.16, 1, 0.3, 1]`).
- All Lucide icons automatically inherit user icon-pack styling (`html[data-icon-style='duotone' | 'bold' | 'precision'] svg.lucide`).
- Custom Enter-to-submit handlers on `<Input>` / `<textarea>` must guard IME composition (`if (e.nativeEvent.isComposing || e.keyCode === 229) return;`).

---

## 4. Shared Component Catalog & Selection Rules

Always inspect and reuse `@xernerx/ui` and `@xernerx/components` before writing custom markup.

### `@xernerx/ui` Primitives (`packages/ui/src/`)

| Component                                                                                                                                                                 | When to Use                                                                                                  |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------- |
| `<Button />`                                                                                                                                                              | All primary, secondary, ghost, and destructive actions (supports `loading` state).                           |
| `<Input />`                                                                                                                                                               | All text, number, email, URL, and password inputs (`h-10 px-4 text-sm`, matching `<Selector />`).            |
| `<Input variant="textarea" />`                                                                                                                                            | Multi-line text fields.                                                                                      |
| `<Input variant="search" shortcut={true} />`                                                                                                                              | **Mandatory** for page-level search bars — hooks into global `Ctrl + K` shortcut.                            |
| `<Selector />` / `<MultiSelector />`                                                                                                                                      | Single-select and multi-select dropdowns (never raw `<select>`).                                             |
| `<Toggle />`                                                                                                                                                              | **Strictly for On / Off boolean settings** (enabling or disabling a feature/flag).                           |
| `<Check />`                                                                                                                                                               | **Strictly for selecting items** (multi-select cards, list items, checkboxes, option picks).                 |
| `<Modal />`                                                                                                                                                               | Dialogs, forms, and input prompts (replaces native `window.prompt()`).                                       |
| `<Confirm />`                                                                                                                                                             | Destructive/important confirmation dialogs with optional keyword confirmation (replaces `window.confirm()`). |
| `<PreventLossConfirmation />`                                                                                                                                             | Unsaved-changes guard banner/modal.                                                                          |
| `<Badge />`, `<Tabs />`, `<Tooltip />`, `<CollapsibleCard />`, `<EmptyState />`, `<Divider />`, `<Slider />`, `<CodeBlock />`, `<CopyButton />`, `<Markdown />`, `<Ad />` | Standard display, navigation, and content primitives.                                                        |

### `@xernerx/components` Application Shell (`packages/components/src/`)

`AppLayout`, `Header`, `HeaderOmnibar`, `HeaderWindowControls`, `Sidebar`, `Footer`, `Page`, `MediaManager`, `MediaCropModal`, `OverlayBotRunnerCard`, `FirstSignInOnboarding`, `TermsPrompt`, `CookiePrompt`, `BlacklistGate`, `GiveawayBanner`, `AdBanner`, `SpotlightBoostModal`, `VersionTracker`, `WidgetSettingsCard`.

### Strict UI Prohibitions

1. **No raw form controls:** Never render raw `<input type="text">`, `<input type="number">`, `<textarea>`, `<select>`, or `<input type="checkbox">` for standard form fields.
    - _Sole architectural exception:_ Low-level modals inside `@xernerx/providers` (`CommandPaletteModal.tsx`, `NavigationModal.tsx`) render a styled `<input type="text">` directly because `@xernerx/ui` depends on `@xernerx/providers` (importing `<Input />` would introduce a circular dependency); they must still enforce IME-safe `Enter` handling and design tokens.
2. **No native browser or mobile dialogs:** Never use `window.alert()`, `window.confirm()`, `window.prompt()`, or React Native `Alert.alert()`. Use `useToast().toast()`, `<Confirm />` / `<ConfirmModal />`, and `<Modal />` + `<Input />`.
3. **No custom search markup:** Always use `<Input variant="search" shortcut={true} />` for page-level search bars.

---

## 5. Global Keyboard Shortcuts (`ShortcutsProvider`)

Never bind shortcuts that collide with the reserved suite shortcuts below (especially `Ctrl + /` and `Ctrl + ~`). Register view-specific shortcuts via `useShortcuts().registerShortcut()`.

| Shortcut                    | Global Action                                                                                    |
| :-------------------------- | :----------------------------------------------------------------------------------------------- |
| `Ctrl + /`                  | Open Help & Shortcuts modal                                                                      |
| `Ctrl + K`                  | Focus page `<Input variant="search" shortcut={true} />`, or open Command Palette if none mounted |
| `Ctrl + Shift + K`          | Always open global Command Palette (`CommandPaletteModal.tsx`)                                   |
| `Ctrl + Space` / `Alt + A`  | Open App Drawer Navigation modal                                                                 |
| `Ctrl + B`                  | Toggle Sidebar                                                                                   |
| `Ctrl + .`                  | Focus URL Omnibar                                                                                |
| `Ctrl + I`                  | Toggle Notifications                                                                             |
| `Ctrl + ,`                  | Open Account Settings                                                                            |
| `Ctrl + S` / `Ctrl + Enter` | Save unsaved changes                                                                             |
| `Alt + R`                   | Reset unsaved changes                                                                            |
| `Alt + 1..9`                | Switch sidebar views                                                                             |
| `Ctrl + Shift + C`          | Copy current URL                                                                                 |
| `Esc`                       | Close active modals / popovers                                                                   |
