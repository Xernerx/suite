<!-- @format -->

# @xernerx/feedback

## 0.4.8

### Patch Changes

- @xernerx/providers@0.18.3
    - @xernerx/ui@0.7.13

## 0.4.7

### Patch Changes

- ### Mobile `100dvh` Viewport Lock, CSS `env(safe-area-inset-*)` Support (SO to `@zanderp25`) & `www` SEO / `--page-width` Overhaul

    Huge shoutout (`SO`) to **@zanderp25** for discovering and reproducing the mobile iOS Safari viewport/header scroll overlap issue and providing the `vh` → `dvh` and `env(safe-area-inset-*)` solution!

    - **Dynamic Viewport Height (`vh` → `dvh`) & Document Scroll Lock (`@xernerx/styles`, `@xernerx/components`, `apps/*`):**
    - Locked `html, body` to `height: 100dvh; overflow: hidden; overscroll-behavior: none;` in `packages/styles/globals.css` and mapped `h-screen`, `min-h-screen`, and `max-h-screen` utilities to `100dvh` so mobile address bars never cause the outer document viewport to scroll `<Header />` into the status bar or Dynamic Island.
    - Updated `Page.tsx` to use a `fixed inset-0 flex h-dvh` shell (`height: calc(100dvh / var(--ui-zoom, 1))`) with `min-h-0 overscroll-y-contain` on `#main-scroll-container` so touch scrolling stays strictly inside `<main>`.
    - Converted viewport-relative heights (`[...vh]`) across packages and apps to `dvh` and bound page scroll listeners directly to `#main-scroll-container`.
    - **Safe-Area Insets (`env(safe-area-inset-*)`) & `viewportFit: 'cover'`:**
    - Exported `viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }` across all 12 Next.js application root layouts.
    - Added `--safe-top`, `--safe-right`, `--safe-bottom`, and `--safe-left` tokens and applied `env(safe-area-inset-*, 0px)` offsets across `Header`, `HeaderOmnibar`, `Sidebar`, `Page`, `Footer`, `CookiePrompt`, `Modal`, `ToastProvider`, `SupportProvider`, and `CommandPaletteModal`.
    - **`www.xernerx.com` Seobility SEO & AdSense Crawler Visibility Overhaul (`www`, `@xernerx/lib`, `@xernerx/providers`):**
    - Optimized root and route metadata titles (`<580px`), meta descriptions (`<1000px`), H1 keyword parity, external link counts, and server-rendered semantic HTML fallbacks.
    - Bypassed client-side loading gates (`opacity-0`) for search engine and AdSense crawlers in `LoadingProvider.tsx` and `Page.tsx`.
    - Replaced remaining hardcoded `max-w-*` widths with `max-w-(--page-width)`.

- Updated dependencies
    - @xernerx/providers@0.18.2
    - @xernerx/ui@0.7.12

## 0.4.6

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.18.1
    - @xernerx/ui@0.7.11

## 0.4.5

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.18.0
    - @xernerx/ui@0.7.10

## 0.4.4

### Patch Changes

- Fixed a push error
- Updated dependencies
    - @xernerx/providers@0.17.1
    - @xernerx/ui@0.7.9

## 0.4.3

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.17.0
    - @xernerx/ui@0.7.8

## 0.4.2

### Patch Changes

- @xernerx/providers@0.16.1
    - @xernerx/ui@0.7.7

## 0.4.1

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.16.0
    - @xernerx/ui@0.7.6

## 0.4.0

### Minor Changes

- ### Canonical Xernerx Watermark Enforcement & `chronos` / `vortex` Landing Stage Transitions (`@xernerx/feedback`, `@xernerx/providers`, `@xernerx/components`, `www`, `api`)
    - **Canonical Xernerx Watermark on `www`, `api` & `docs` (`packages/components/src/Page.tsx`, `packages/providers/src/LoadingProvider.tsx`, `apps/api/src/app/page.tsx`)**:
        - Added `isFixedWatermarkApp` detection in `Page.tsx` for `www` (`4000`), `api` (`4001`), and `docs` (`4005`) so user-customized `uiPreferences.dotMatrixType`, `dotMatrixStage`, and `dotMatrixAnimation` settings never override the canonical Xernerx watermark or the landing page scroll transitions.
        - Enabled `sticky-ripple` background mode for `docs` (`4005` / `docs.xernerx.com`) in `LoadingProvider.tsx` and set `setDotVariant('icon')` on `apps/api/src/app/page.tsx` so both `api` and `docs` always display the centered Xernerx `icon` dot-matrix watermark.
    - **`chronos` Temporal Astrolabe Variant & Section-Aware Landing Transitions (`packages/feedback/src/dotLogoPaths.ts`, `packages/feedback/src/XernerxDotLogo.tsx`, `apps/www/src/components/HomeClient.tsx`, `apps/www/src/components/PlatformHighlights.tsx`)**:
        - Added the procedural `chronos` dot-matrix variant in `dotLogoPaths.ts` featuring a pulsing temporal core, outer dial ring with 12 milestone ticks, counter-rotating inner astrolabe gear ring, sweeping minute/hour clockwork hands, and an orbiting milestone node.
        - Created `dotLogoMorph.ts` (`createDotMorphBuffer` & `beginDotRearrangeMorph`) and wired it into `XernerxDotLogo.tsx` so switching between any two dot-matrix variants (both from the global loading state to the user's selected shape and across landing page scroll sections) physically rearranges the lit dots along 1.95-second cubic ease-in-out curved flight paths while keeping stationary ambient grid dots rendered at every matrix cell so the background lattice never develops holes.
        - Updated `HomeClient.tsx` to transition the background dot-matrix stage using live DOM section scroll positions across all 8 landing page stages:
            - **Hero**: `full` (Upper-stage `XERNERX` wordmark + crest)
            - **Selling Points & Consumer Services (`#services`)**: `icon` (Xernerx crest logo)
            - **Developer Software (`#software`)**: `prism` (Hexagonal rotating prism)
            - **About Us (`#about`)**: `infinity` (Twin-core Lemniscate of Bernoulli ribbon)
            - **Ecosystem Pillars (`#about` lower)**: `helix` (3D spinning DNA double-helix)
            - **Platform Highlights (`#highlights`)**: `orbit` (Multi-axis 3D orbital rings with revolving satellites)
            - **The Journey So Far (`#timeline`)**: `chronos` (Animated Chrono-Astrolabe clockwork dial)
            - **Closing Call to Action (`#cta`)**: `vortex` (Spiraling 3-arm galaxy portal with counter-rotating star halo)

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.15.0
    - @xernerx/ui@0.7.5

## 0.3.0

### Minor Changes

- ### Canonical Xernerx Watermark Enforcement & `chronos` / `vortex` Landing Stage Transitions (`@xernerx/feedback`, `@xernerx/providers`, `@xernerx/components`, `www`, `api`)
    - **Canonical Xernerx Watermark on `www`, `api` & `docs` (`packages/components/src/Page.tsx`, `packages/providers/src/LoadingProvider.tsx`, `apps/api/src/app/page.tsx`)**:
        - Added `isFixedWatermarkApp` detection in `Page.tsx` for `www` (`4000`), `api` (`4001`), and `docs` (`4005`) so user-customized `uiPreferences.dotMatrixType`, `dotMatrixStage`, and `dotMatrixAnimation` settings never override the canonical Xernerx watermark or the landing page scroll transitions.
        - Enabled `sticky-ripple` background mode for `docs` (`4005` / `docs.xernerx.com`) in `LoadingProvider.tsx` and set `setDotVariant('icon')` on `apps/api/src/app/page.tsx` so both `api` and `docs` always display the centered Xernerx `icon` dot-matrix watermark.
    - **`chronos` Temporal Astrolabe Variant & Section-Aware Landing Transitions (`packages/feedback/src/dotLogoPaths.ts`, `packages/feedback/src/XernerxDotLogo.tsx`, `apps/www/src/components/HomeClient.tsx`, `apps/www/src/components/PlatformHighlights.tsx`)**:
        - Added the procedural `chronos` dot-matrix variant in `dotLogoPaths.ts` featuring a pulsing temporal core, outer dial ring with 12 milestone ticks, counter-rotating inner astrolabe gear ring, sweeping minute/hour clockwork hands, and an orbiting milestone node.
        - Created `dotLogoMorph.ts` (`createDotMorphBuffer` & `beginDotRearrangeMorph`) and wired it into `XernerxDotLogo.tsx` so switching between any two dot-matrix variants (both from the global loading state to the user's selected shape and across landing page scroll sections) physically rearranges the lit dots along 1.95-second cubic ease-in-out curved flight paths while keeping stationary ambient grid dots rendered at every matrix cell so the background lattice never develops holes.
        - Updated `HomeClient.tsx` to transition the background dot-matrix stage using live DOM section scroll positions across all 8 landing page stages:
            - **Hero**: `full` (Upper-stage `XERNERX` wordmark + crest)
            - **Selling Points & Consumer Services (`#services`)**: `icon` (Xernerx crest logo)
            - **Developer Software (`#software`)**: `prism` (Hexagonal rotating prism)
            - **About Us (`#about`)**: `infinity` (Twin-core Lemniscate of Bernoulli ribbon)
            - **Ecosystem Pillars (`#about` lower)**: `helix` (3D spinning DNA double-helix)
            - **Platform Highlights (`#highlights`)**: `orbit` (Multi-axis 3D orbital rings with revolving satellites)
            - **The Journey So Far (`#timeline`)**: `chronos` (Animated Chrono-Astrolabe clockwork dial)
            - **Closing Call to Action (`#cta`)**: `vortex` (Spiraling 3-arm galaxy portal with counter-rotating star halo)

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.14.0
    - @xernerx/ui@0.7.4

## 0.2.0

### Minor Changes

- ### Landing Page Dot-Matrix Construction Stage, Live Bot Service Cards & 21-Milestone Studio Timeline (`www`, `@xernerx/feedback`, `@xernerx/lib`, `@xernerx/components`, `@xernerx/providers`)
    - **3-Act On-Grid Dot-Matrix Construction Engine (`packages/feedback/src/XernerxDotLogo.tsx`, `packages/feedback/src/dotLogoPaths.ts`, `packages/components/src/Page.tsx`)**:
        - Implemented a 3.4-second 3-act dot-matrix construction sequence on the landing page (`backgroundMode` + `xernerx:construct-logo`):
            - **Act 1 (`0.0s – 0.9s`, Matrix Lattice Scanwave)**: Dots materialize directly on their matrix grid cells (`homeX`, `homeY`) in a radial scanwave from the upper-center stage with a crisp `--accent` activation glint.
            - **Act 2 (`0.75s – 2.85s`, `XERNERX` Crest & Wordmark Ignition)**: Across the active matrix grid, a left-to-right `--accent` construction wavefront sweeps through the crest and letters of `XERNERX`, smoothly expanding and locking each logo dot into full coverage.
            - **Act 3 (`2.85s – 3.4s`, Completion Shockwave & Content Reveal)**: Fires a radial completion shockwave from the upper-stage logo across the ambient matrix lattice and dispatches `xernerx:construct-complete` so the landing page content glides up from the bottom of the screen to sit cleanly beneath the constructed `XERNERX` logo.
        - Positioned the `full` dot-matrix logo in the upper stage (`offY = Math.max(activeH * 0.05, (activeH - boxH) * 0.14)`) so the constructed wordmark remains permanently visible above the Hero card.
        - Prevented mid-animation canvas teardowns by storing construction state (`constructStartRef`, `constructPulseRef`) and theme synchronization (`resolvedThemeRef`, `colorSyncRef`) in component-level refs, ignoring minor scrollbar width deltas (`<= 24px`) in `ResizeObserver` commits, and locking `targetVariant` and `overflow-hidden` in `Page.tsx` while `stagePreview` is active.
    - **Restructured Glassmorphic Hero, Live Bot Profile Showcases & Bento Cards (`apps/www/src/components/HomeClient.tsx`, `apps/www/src/components/LandingServiceCards.tsx`, `apps/www/src/components/PlatformHighlights.tsx`, `apps/www/src/components/WwwDeepSearch.tsx`)**:
        - Replaced the legacy 2-column SVG hero layout with a full-width (`max-w-7xl`) centered glassmorphic Hero card (`pt-[52vh] sm:pt-[54vh]`) positioned cleanly beneath the constructed `XERNERX` dot-matrix stage, complete with a dot-matrix micro-grid backdrop, widened deep search bar (`max-w-2xl`), and quick-navigation pills.
        - Created `LandingServiceCards.tsx` (`ServiceProfileCard` & `DeveloperSoftwareCard`) to enrich Consumer Services cards (`Virtue`, `Xernerx Bot`, `Xernerx App`, `Dashboard`, `Store`, `Identity`) with live bot profile banners, avatars, real-time online status indicators, Discord activity strings, and live server/member telemetry fetched from `GET /info/status/bots`.
        - Upgraded Selling Point cards, About Us pillars, Platform Highlights, and the bottom CTA (`PlatformHighlights.tsx`) with subtle dot-matrix radial grid overlays and glassmorphic accents matching the fluid background canvas.
    - **Chronological 21-Milestone Journey Timeline & Accurate Virtue Leveling Copy (`apps/www/src/components/Timeline.tsx`, `packages/lib/src/dictionaries/en-GB.json`)**:
        - Expanded `www.timeline.events` into 21 strictly chronological milestones (`2021` – `2026`) covering the whole studio journey—from initial Discord bot experiments (`2021`) and early utility prototypes (`2022`) to the `@xernerx/framework` & stats engines (`2023`), `api.xernerx.com` & `app.xernerx.com` (`2024`), `account`/`docs`/`info`/`store` & Virtue (`2025`), and the Electron desktop companion, CDN media vault, and interactive dot-matrix identity (`2026`).
        - Updated `Timeline.tsx` with year badges, milestone step counters (`#01` – `#21`), and interactive dot-matrix card surfaces.
        - Updated Virtue descriptions across `en-GB.json` (`www.applications.virtue.desc`, `www.about.pillars.communities.description`, `www.timeline.events.18.description`) to accurately describe Virtue as a dedicated Discord leveling bot for text and voice XP progression, and pruned stale keys across non-`en-GB` locale dictionaries.
    - **Resilient `useTheme()` Fallback for Global Error Boundaries (`packages/providers/src/ThemeProvider.tsx`)**:
        - Added `FALLBACK_THEME_CONTEXT` to `useTheme()` so `<XernerxDotLogo />` inside `global-error.tsx` renders safely even when mounted outside `ThemeProvider`.

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.13.1
    - @xernerx/ui@0.7.3

## 0.1.2

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.13.0
    - @xernerx/ui@0.7.2

## 0.1.1

### Patch Changes

- @xernerx/providers@0.12.1
    - @xernerx/ui@0.7.1

## 0.1.0

### Minor Changes

- ### Interactive Dot-Matrix Profile Header, Badge & Customization Studio (`@xernerx/feedback`, `@xernerx/lib`, `apps/store`, `apps/account`, `apps/app`, `apps/api`, `@xernerx/components`)
    - **Full-Bleed Reactive Canvas Engine (`packages/feedback/src/XernerxDotLogo.tsx`, `packages/feedback/src/dotLogoPaths.ts`)**:
        - Built the interactive HTML5 Canvas Dot-Matrix lattice renderer supporting `logo`, `banner`, and `ambient` layouts with real-time pointer-repulsion physics, spring-back velocity damping, traveling sine waves, and 5 color variants (`classic`, `prism`, `cyber`, `aurora`, and `ember`).
        - Fixed `banner` coordinate scaling so the background lattice spans 100% of wide banner containers while centering the `XERNERX` wordmark in the upper focal band so it is never occluded by bottom-left profile avatars.
        - Added `vivid` high-contrast rendering mode (`vivid={true}`) boosting background lattice visibility, center wordmark luminance, and ambient radial glow across both Light and Dark themes.
    - **5-Theme Persistence & API Serialization (`packages/lib/src/models/xernerx/users/Credit.ts`, `apps/api/src/app/secure/users/[id]/route.ts`, `apps/api/src/app/core/users/[id]/route.ts`)**:
        - Added `dotMatrixVariant` (`'classic' | 'prism' | 'cyber' | 'aurora' | 'ember'`, default `'classic'`) to `models.users.Credit` (bumping Mongoose model cache to `__models_v19` in `packages/lib/src/database.ts`).
        - Extended `GET / PATCH /secure/users/[id]` and `GET /core/users/[id]` to validate, persist, and expose `dotMatrixVariant` alongside `unlockedBadges` and `activeBadges`.
    - **Interactive Store Preview & Account Studio (`apps/store/src/components/DotMatrixPerkPreview.tsx`, `apps/account/src/components/DotMatrixBannerStudio.tsx`)**:
        - Embedded `DotMatrixPerkPreview.tsx` directly inside the `3,500`-credit `dot_matrix_banner` card in `CreditStoreView.tsx` so shoppers can test pointer repulsion and switch between all 5 color themes before redeeming.
        - Built `DotMatrixBannerStudio.tsx` and `DotMatrixSettingsCard.tsx` in `apps/account` (`Profile.tsx` & `ProfileShowcases.tsx`), giving owners of `dot_matrix_banner` a live interactive header preview, 1-click active banner toggle, and 5-theme preset selector.
    - **Public Profile Header, Sidebar Card, Hover Popover & SVG Embed Widget (`apps/app/src/components/users/Header.tsx`, `packages/components/src/cards/SidebarUser.tsx`, `packages/components/src/cards/UserProfilePopover.tsx`, `apps/api/src/lib/widgetRenderer.ts`)**:
        - Upgraded public user profile headers (`Header.tsx`) to render the interactive `XernerxDotLogo` (`variant="banner"`, `vivid={true}`, `colorVariant={dotMatrixVariant}`) with pointer event forwarding and an animated `Dot-Matrix` HUD pill badge.
        - Upgraded `SidebarUser.tsx` and `UserProfilePopover.tsx` to render an interactive mini Dot-Matrix banner header and HUD badge when `dot_matrix_banner` is active.
        - Upgraded `widgetRenderer.ts` (`GET /core/users/[id]?widget=svg`) to render a vector SVG dot-matrix header grid and `DOT-MATRIX` pill badge using the user's selected `dotMatrixVariant` palette.

    ### Bot Milestones, Biggest Bot Profile Showcases & Official Milestone SVGs (`@xernerx/lib`, `packages/public`, `apps/app`, `apps/api`, `services/bot`)
    - **Canonical Milestone Engine (`packages/lib/src/milestones.ts`)**:
        - Created `MILESTONE_TIERS` (`10`, `25`, `50`, `100`, `250`, `500`, `1,000`, `2,500`, `5,000`, `10,000`, `25,000`, `50,000`, `100,000`), `evaluateMilestones()`, `getHighestMilestoneBadge()`, and `getMilestoneProgress()` mapped to `/servers/Servers*.svg` and `/members/Members*.svg` static assets synced across all apps via `pnpm suite initialize`.
    - **Bot Milestones View & Next-Tier Progress Queue (`apps/app/src/components/bots/Milestones.tsx`, `apps/app/src/components/bots/Profile.tsx`)**:
        - Built the dedicated **Milestones** tab and overview showcase on bot profiles displaying unlocked Server and Member milestone SVG badges, unlock timestamps, and queued progress bars toward the next milestone tier.
    - **Biggest Bot Milestones on User Profiles (`apps/app/src/components/users/BiggestBotMilestonesCard.tsx`, `apps/api/src/app/core/users/[id]/route.ts`, `apps/api/src/lib/widgetRenderer.ts`)**:
        - Automatically resolves a bot owner's largest bot in `GET /core/users/[id]`, computes its highest Server and Member milestone badges plus next-tier progress, and displays them on public user profiles (`BiggestBotMilestonesCard.tsx`) and user SVG widgets (`widgetRenderer.ts`).

    ### Universal 3-Tier Privacy Truth (`public` | `limited` | `private`) Across Web Apps, API, CDN & Bots (`AGENTS.md`, `@xernerx/lib`, `apps/api`, `apps/app`, `apps/account`, `apps/cdn`, `services/bot`)
    - **3-Tier Privacy Enforcement (`@xernerx/lib`, `apps/api`, `apps/cdn`, `services/bot`)**:
        - Standardized privacy across User Profiles, Bots, Servers/Guilds, Organizations, and CDN Media into three tiers:
            - `public`: Listed in public directories, explorers, leaderboards, and search results, and accessible by anyone.
            - `limited`: Unlisted (hidden from public directories, explorers, leaderboards, and search results) but accessible via direct link or ID.
            - `private`: Strictly owner-only (never listed and inaccessible even with a direct link or ID unless authenticated as the owner or an authorized organization/co-owner member).
        - Updated `services/bot` multi-instance daemon (`services/bot/src/instances/*`, `services/bot/src/lib/botUtils.ts`) and all `apps/api` and `apps/cdn` routes to enforce `public | limited | private` visibility boundaries.

    ### Credit Ecosystem Expansion: Tipping, Organization Treasuries, Spotlight Boosts, Daily Streak Ladder & Ledger (`apps/store`, `apps/account`, `apps/app`, `apps/admin`, `apps/api`, `@xernerx/lib`)
    - **Peer-to-Peer Credit Tipping (`apps/app/src/components/users/TipCreditsModal.tsx`, `apps/api/src/app/secure/store/credits/tip/route.ts`, `apps/api/src/app/secure/users/[id]/credits/tip/route.ts`)**:
        - Enabled users to send direct credit tips with custom notes to bot developers and community members from public user profiles, recording paired debit/credit ledger entries.
    - **Organization Credit Treasuries (`apps/app/src/components/portal/OrganizationTreasuryCard.tsx`, `apps/api/src/app/secure/organizations/[id]/treasury/route.ts`)**:
        - Added pooled organization credit treasuries allowing members to contribute credits and fund organization-owned bot/server spotlight boosts.
    - **Bot & Server Spotlight Boosts (`apps/app/src/components/SpotlightBoostModal.tsx`, `apps/api/src/app/secure/bots/[id]/boost/route.ts`, `apps/api/src/app/secure/guilds/[id]/boost/route.ts`)**:
        - Added credit-powered Spotlight Boosts to feature bots and servers in explorer spotlight carousels.
    - **Daily Streak Ladder, Transaction Ledger, Achievements & Referrals (`apps/store/src/components/DailyStreakLadder.tsx`, `apps/store/src/components/CreditLedgerCard.tsx`, `apps/account/src/components/CreditLedgerCard.tsx`, `apps/account/src/components/AchievementsReferralCard.tsx`, `apps/admin/src/components/AdminUserCreditsModal.tsx`)**:
        - Added the 7-day progressive reward streak ladder in `apps/store`, full credit transaction history ledgers in `apps/store` and `apps/account`, user achievements & referral code claiming (`/secure/users/[id]/achievements`, `/secure/users/[id]/referrals`), and an Admin User Credit & Perk Manager (`AdminUserCreditsModal.tsx`) in `apps/admin`.

    ### Developer Portal, Public API Versioning Policy (`/v1/*` → `/v2/*`), Bot Releases & Living Documentation (`apps/api`, `apps/docs`, `apps/info`, `apps/app`)
    - **Public API Versioning & Breaking-Change Policy (`AGENTS.md`, `apps/api/AGENTS.md`, `apps/docs/src/components/api/ApiOverviewAndAuth.tsx`)**:
        - Established and documented the non-breaking (`/v1/*`) vs breaking (`/v2/*` with `X-API-Version`, `Deprecation`, and `Sunset` adapter headers) public API versioning standard.
    - **Bot Releases, Webhook Delivery Replay & Growth Telemetry (`apps/api/src/app/v1/bots/[id]/releases/route.ts`, `apps/app/src/components/bots/Releases.tsx`, `apps/app/src/components/portal/BotReleasesAndCommandsManager.tsx`, `apps/app/src/components/portal/WebhookDeliveriesCard.tsx`, `apps/app/src/components/portal/bot/GrowthTelemetryTab.tsx`)**:
        - Added public (`GET / POST /v1/bots/[id]/releases`) and portal (`/secure/bots/[id]/releases`) bot release notes management, webhook delivery history inspection & 1-click payload replay (`/secure/bots/[id]/hooks/replay`), 1-click API token rolling (`/secure/tokens/[id]/roll`), and historical bot growth telemetry charts.
    - **Interactive WebSocket Playground, API Docs Sync & FAQ Expansion (`apps/docs/src/components/websocket/WebsocketPlayground.tsx`, `apps/docs/src/components/api/*.tsx`, `apps/info/src/components/faq/*.tsx`, `apps/api/src/lib/docsBlueprints*.ts`, `apps/api/src/lib/faqBlueprints*.ts`)**:
        - Added an interactive WebSocket testing playground on `docs.xernerx.com/websocket`, documented 100% of `/v1/*`, `/secure/*`, `/core/*`, and `/info/*` API routes, and expanded the `info.xernerx.com/faq` knowledgebank and public `/core/faq` & `/core/docs` blueprints.

    ### Desktop Companion v2.3, UI Primitives (`<Check />` vs `<Toggle />`) & Strict `AGENTS.md` Architecture Compliance (`clients/desktop`, `apps/www`, `@xernerx/ui`, `@xernerx/components`, `@xernerx/providers`, `@xernerx/cli`)
    - **Desktop Companion Enhancements & `/download` Parity (`clients/desktop`, `apps/www/src/components/DesktopInteractivePreview.tsx`, `apps/www/src/components/DesktopPerksBento.tsx`, `apps/www/src/components/DesktopPowerPerksRow.tsx`)**:
        - Added CDN Watch Folder auto-upload (`desktopExtras.ts`), Quick Screen Capture, Streamer Mode auto-detection, and Battery Saver power monitoring in `clients/desktop`, and synced `xernerx.com/download` interactive previews.
    - **Selection Primitive `<Check />` vs Boolean `<Toggle />` (`packages/ui/src/Check.tsx`, `packages/components/src/media/MediaGridCard.tsx`)**:
        - Introduced `<Check />` in `@xernerx/ui` strictly for item/option selection (such as multi-selecting media cards in `MediaManager.tsx`, token scopes, and role permissions) while reserving `<Toggle />` strictly for boolean On/Off state switches.
    - **Strict `AGENTS.md` Compliance & Automated Suite Linter (`.xernerx/cli/commands/lint.ts`)**:
        - Modularized all large pages and components across `apps/*` and `packages/*` so every source file strictly obeys the 500-line cap after Prettier formatting, `src/components/` placement rule, 3-route local `/api` rule, `useDictionary()` `t()` localization completeness in `en-GB.json`, and zero ESLint errors across all 19 workspace projects.

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.12.0
    - @xernerx/ui@0.7.0

## 0.0.42

### Patch Changes

- @xernerx/providers@0.11.2
    - @xernerx/ui@0.6.2

## 0.0.41

### Patch Changes

- @xernerx/providers@0.11.1
    - @xernerx/ui@0.6.1

## 0.0.40

### Patch Changes

- ### Encrypted QR Code & 6-Character Pairing Code Cross-Device Sign-In (`apps/account`, `apps/api`, `@xernerx/lib`)
    - **Passwordless Cross-Device Authentication (`/login/qr` & `/login/approve`)**: Introduced end-to-end encrypted QR Code and 6-character manual pairing code sign-in (`QrLoginPanel.tsx`, `QrApproveView.tsx`, `DevicePairingCard.tsx`, `qrMatrix.ts`) allowing users to authenticate desktop or secondary browser sessions from an already-signed-in mobile or desktop device without re-entering credentials.
    - **AES-256-GCM Ticket Exchange (`apps/api/src/app/secure/auth/qr/route.ts`)**: Built a dedicated ticket lifecycle endpoint (`PENDING` -> `APPROVED` -> `CONSUMED`) backed by AES-256-GCM encrypted session handoff payloads, 3-minute TTL expiration, and one-time consumption guards.
    - **NextAuth `xernerx-qr` Provider (`@xernerx/lib/src/auth.ts`)**: Added a dedicated NextAuth credentials provider to verify and exchange approved QR/pairing tickets directly into authenticated suite sessions.

    ### Native Desktop Client Companion v2.2, Multi-Account Switcher & Live Overlay (`clients/desktop`, `apps/app`, `apps/www`, `@xernerx/components`)
    - **Isolated Multi-Account Chromium Partitions (`clients/desktop`)**: Added native multi-account session management (`persist:xernerx-<slot>`) in `main.ts`, `metadata.ts`, and `preload.cts`, enabling instant switching between up to 5 independent Discord accounts (`DesktopAccountSwitcher.tsx`) without signing out.
    - **Always-on-Top Live Overlay Monitor (`clients/desktop/src/overlay.ts`, `apps/app/src/app/overlay/page.tsx`)**: Added a translucent, frameless Always-on-Top companion overlay window (`OverlayMonitor.tsx`) displaying live API latency, real-time WebSocket event streams, server & bot metrics, and quick navigation triggers.
    - **Custom Window Controls & Global Summon Hotkey (`HeaderWindowControls.tsx`, `clients/desktop/src/rpc.ts`)**: Added customizable desktop titlebar controls (`System`, `Windows Classic`, `macOS Traffic Lights`, and `Xernerx Glass Pills`), global summon shortcut (`Ctrl + Shift + X`), rich Discord RPC activity presence, and an integrated runtime debug log viewer (`DesktopLogsModal.tsx`).
    - **Interactive `/download` Showcase (`apps/www/src/app/download/page.tsx`)**: Rebuilt the desktop download showcase with `DesktopInteractivePreview.tsx` and `DesktopPerksBento.tsx` featuring interactive previews of multi-account switching, Discord Rich Presence, mini-overlay telemetry, QR phone pairing, and global summon hotkeys.

    ### Comprehensive Interactive FAQ Knowledgebank & Public Bot API (`apps/info`, `apps/api`, `services/bot`)
    - **9-Category, 54-Card Interactive FAQ Hub (`apps/info/src/app/faq/page.tsx`)**: Overhauled the FAQ knowledgebank across 9 domain modules (`EcosystemAndNavigation.tsx`, `DesktopAndOverlay.tsx`, `Bots.tsx`, `ServersAndOrganizations.tsx`, `AccountAndSecurity.tsx`, `BillingAndStore.tsx`, `ApiAndDevelopers.tsx`, `Translations.tsx`, `Environments.tsx`) with deep explanations of every suite app, clickable quick links, vanity URLs, copyable route badges, and interactive UI triggers (`Command Palette`, `App Drawer`, `URL Omnibar`, `Shortcuts Modal`).
    - **Public `/core/faq/**` REST API (`apps/api/src/app/core/faq/**`)**: Exposed the entire localized FAQ catalog via `GET /core/faq`, `GET /core/faq/categories`, `GET /core/faq/search`, `GET /core/faq/[category]`, and `GET /core/faq/[category]/[id]` (`faqCatalog.ts`, `faqBlueprints.ts`, `faqBlueprintsPlatform.ts`) complete with pre-built `discordEmbed` objects, quick links, and multi-locale resolution (`?lang=`).
    - **Public `/core/docs/**` Catalog API & Discord Bot `/faq` + `/docs` Slash Commands (`apps/api/src/app/core/docs/**`, `services/bot`)**: Added `GET /core/docs` and `GET /core/docs/[id]` (`docsCatalog.ts`, `docsBlueprints.ts`, `docsBlueprintsApi.ts`) and wired interactive `/faq` and `/docs` slash commands in `services/bot` with live autocomplete, category browsing, and localized embeds.

    ### Developer Documentation Portal Overhaul & Token-Gated Access (`apps/docs`)
    - **REST API Reference Redesign (`/api/[version]`)**: Added `ApiOverviewAndAuth.tsx` (copyable Base URLs for `v1`, `core`, and `secure`, visual 3-step Token Lifecycle `Pending -> Active -> Scoped`, and clickable Namespace Switcher) and `V1PlatformEndpoints.tsx` (`/v1/leaderboard`, `/v1/changelog/rss.xml`, `/api/version`, `/api/changelog`). Reorganized the sidebar into logical domain groups with live `Ctrl + K` filtering, HTTP method filter pills, `Expand All` / `Collapse All` controls, auth scope badges, 1-click Copy Full URL buttons, and `Test` in Playground triggers.
    - **CDN, WebSocket & NPM Package Docs Upgrade (`/cdn`, `/websocket`, `/packages`)**: Unified all documentation portals with `CdnOverviewAndAuth.tsx`, `CdnEndpoints.tsx`, interactive RPC service & action filtering in `WebsocketServicesSection.tsx`, 1-click `pnpm add` copy bars, symbol kind filter tabs (`ALL`, `Classes`, `Interfaces`, `Functions`), and `Ctrl + K` search bars.
    - **Dynamic Token-Gated Access (`useDocsAccess.ts`)**: Added `useDocsAccess()` to inspect the active user's personal API tokens (`permissions.websocket`, `permissions.secure`) alongside admin roles to conditionally unlock and render the `/websocket` and `/api/secure` documentation views and homepage cards.

    ### Live Status Telemetry, Dynamic SVG Shields, Analytics Charts & Daily Credit Gifts (`apps/info`, `apps/api`, `apps/app`, `apps/account`)
    - **24-Hour Service Uptime Bars & Bot Shard Telemetry (`apps/info`, `apps/api/src/app/info/status/**`)**: Added `Status24hBar.tsx` and `StatusBotsSection.tsx` backed by `/info/status/history` and `/info/status/bots` plus live bot shard telemetry reporting (`services/bot/src/events/presenceUpdate.ts`).
    - **Dynamic SVG Shields & Embeddable Widgets (`apps/api/src/app/v1/**/badge.svg`, `WidgetSettingsCard.tsx`)**: Added dynamic SVG status/metric badges for bots, servers, organizations, and users (`badgeRenderer.ts`) and a shared `WidgetSettingsCard` component in `@xernerx/components`.
    - **Unified `MetricsChart` Time-Series Analytics (`apps/app/src/components/MetricsChart.tsx`)**: Built an interactive SVG time-series analytics chart used across Bot Stats (`bots/Stats.tsx`), Server Stats (`servers/ServerStatsView.tsx`), and Dashboard Statistics (`dashboard/Statistics.tsx`).
    - **Daily Credit Mystery Gift & 48h Streak System (`SidebarUser.tsx`, `Billing.tsx`, `apps/api/src/app/secure/users/[id]/credits/claim`)**: Added daily credit mystery gift claiming with a 24-hour cooldown and 48-hour streak retention window, surfaced in both `SidebarUser.tsx` and `apps/account` Billing.

    ### Workspace Preferences, Translation Studio & Strict `AGENTS.md` Architecture Compliance (`packages/*`, `apps/*`)
    - **Workspace & Appearance Customizer (`Preferences.tsx`, `ThemeProvider.tsx`, `@xernerx/styles`)**: Added granular workspace toggles for Header/Sidebar visibility, left/right layout alignment, reduced motion, shortcut hints, Discord avatar decorations/nameplates, and developer mode persisted via `pref_*` functional cookies and user settings.
    - **Community Translation Studio (`apps/admin/src/components/translations/*`, `apps/api/src/app/secure/dictionary/[language]`)**: Modularized the Translation Studio with community submission review workflows, auto-translate batching, and progress tracking.
    - **Shared Primitives & Media Manager (`@xernerx/ui`, `@xernerx/components`, `@xernerx/feedback`)**: Added `Badge`, `CopyButton`, and `EmptyState` to `@xernerx/ui`; extracted shared `MediaManager`, `AsyncUserMultiSelector`, and `BotProfilePreview` into `@xernerx/components`; and upgraded `@xernerx/feedback` error boundaries with collapsible stack traces and 1-click error diagnostics.
    - **Full Monorepo `AGENTS.md` Audit & Localization (`packages/lib/src/dictionaries/*`)**: Modularized all large views under the 500-line inline code cap, moved all co-located components into `src/components/`, enforced the strict 3-route local `/api` rule, added SEO metadata (`opengraph-image.tsx`, `sitemap.ts`, `robots.ts`) and vanity redirects across apps, updated Terms of Service, Privacy Policy, and Cookie Policy (`2026-10-21`), and added 1,200+ localization keys across `en-GB` and supported locales.

- Updated dependencies
    - @xernerx/providers@0.11.0
    - @xernerx/ui@0.6.0

## 0.0.39

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.10.0
    - @xernerx/ui@0.5.2

## 0.0.38

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.9.1
    - @xernerx/ui@0.5.1

## 0.0.37

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.9.0
    - @xernerx/ui@0.5.0

## 0.0.36

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.8.0
    - @xernerx/ui@0.4.3

## 0.0.35

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.7.0
    - @xernerx/ui@0.4.2

## 0.0.34

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.6
    - @xernerx/ui@0.4.1

## 0.0.33

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.4.0
    - @xernerx/providers@0.6.5

## 0.0.32

### Patch Changes

- @xernerx/providers@0.6.4
    - @xernerx/ui@0.3.15

## 0.0.31

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.3.14
    - @xernerx/providers@0.6.3

## 0.0.30

### Patch Changes

- ### 🚀 Minor Features

    #### Main Organization Product Autocomplete & Discord Bot Referencing (`admin`, `api`, `info`, `@xernerx/lib`)
    - **Main Organization Setting (`apps/admin`):** Added a **Main Organization** (`main_org_id`) selector to the Admin Settings page (`Settings.tsx`) populated from `/secure/organizations`.
    - **Main Organization Product Autocomplete (`apps/api`):** Updated `GET /info/roadmap/products` to read `main_org_id`, query all bots belonging to the main organization (`models.bots.Bot`), resolve their live Discord names and avatars, and return both the combined product names (`data`) and bot metadata (`bots`).
    - **Bot Reference by ID & Live Discord Rendering (`@xernerx/lib`, `apps/admin`, `apps/info`):**
        - Added optional `botId` field to `core.RoadmapItem`, `core.Issue`, and `core.Suggestion` Mongoose schemas.
        - Added **Bot ID** inputs with Main Organization bot autocomplete and live Discord profile preview badges (via `GET /core/users/[id]/discord`) to Admin `Roadmap.tsx` and `Issues.tsx`, and updated `Suggestions.tsx` to carry `botId` over when moving a suggestion to the Roadmap.
        - Updated `info.xernerx.com` (`roadmap/page.tsx`, `bugs/page.tsx`, and `suggestions/page.tsx`) as well as Admin `Roadmap.tsx`, `Issues.tsx`, and `Suggestions.tsx` to resolve referenced bots directly from Discord (`/core/users/[id]/discord`) and render the bot's Discord avatar and name on product selector dropdowns, roadmap timeline cards, mobile stacks, known issues, bug reports, and suggestions.

    #### Support Category in Shared Footer (`@xernerx/components`, `@xernerx/lib`)
    - **Dedicated Support Column (`packages/components/src/Footer.tsx`):** Expanded the footer grid to 4 columns and added a **Support** category linking to the Help Center (`info.xernerx.com`), Issues (`/bugs`), Suggestions (`/suggestions`), Roadmap (`/roadmap`), FAQ (`/faq`), and Contact (`xernerx.com/contact`).
    - **Localization (`@xernerx/lib`):** Added `en-GB` and `nl` translations for the Support footer section, Main Organization settings, and Roadmap/Issues Bot ID fields.

    ***

    ### 🛠️ Patches & Bug Fixes (`@xernerx/lib`, `@xernerx/providers`, `@xernerx/feedback`, `admin`, `api`)
    - **Shared Single-Pool MongoDB Connection Architecture (`@xernerx/lib`):**
        - Refactored `packages/lib/src/database.ts` to share a single underlying `MongoClient` (`maxPoolSize: 3`, `minPoolSize: 0`, `maxIdleTimeMS: 15000`, `serverSelectionTimeoutMS: 5000`) across all logical databases (`xernerx`, `virtue`, `global`) via `rootConn.useDb(name, { useCache: true })`, and automatically close legacy leaked connections cached on `global.mongoose` during HMR.
    - **Graceful Database Error Handling & Admin Sidebar Preservation (`apps/admin`, `@xernerx/providers`, `@xernerx/feedback`):**
        - Updated `apps/admin/src/app/layout.tsx` and `apps/admin/src/app/page.tsx` to catch database connection/timeout errors (`profiles.findOne()`, `roles.find()`) and render an inline Database Connection Error alert card inside the dashboard while keeping the Admin sidebar and navigation shell accessible.
        - Updated `useDictionary()` in `packages/providers/src/DictionaryProvider.tsx` to return a safe fallback translator instead of throwing when rendered inside root `global-error.tsx` boundaries.
    - **Defensive Array Normalization & Settings Fallback (`apps/admin`, `apps/api`, `@xernerx/providers`):**
        - Updated `GET /secure/core/settings/[id]` to return `{ id, value: null }` (`200 OK`) instead of `404` when a setting has not yet been initialized.
        - Added defensive `Array.isArray` normalization across Admin components (`Settings`, `Announcements`, `ApplicationConfigs`, `ApplicationReviews`, `Invites`, `Issues`, `ReturnPage`, `Roadmap`, `Roles`, `StoreManagement`, `Suggestions`, `Tokens`, `Translations`, `Users`) and providers (`NotificationProvider`, `PermissionProvider`, `ShortcutsProvider`) to prevent `.map is not a function` runtime errors when API routes return error payloads.

- Updated dependencies
    - @xernerx/providers@0.6.2
    - @xernerx/ui@0.3.13

## 0.0.29

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.6.1
    - @xernerx/ui@0.3.12

## 0.0.28

### Patch Changes

- ### 🚀 Major & Minor Features

    #### Dedicated Storefront Application (`store`, `account` [BREAKING], `api`, `admin`, `@xernerx/lib`)
    - **Extracted `apps/store` (`store.xernerx.com`, port `4008`) [BREAKING for `account`]:** Migrated `/store` and `/store/[id]/cancel` out of `apps/account` into a dedicated Next.js storefront application (`apps/store`) with `DynamicCategoryView`, `DynamicFeaturedCard`, `DynamicItemCard`, and subscription cancellation routes.
    - **Centralized Store Backend API (`apps/api`):** Moved all Stripe store endpoints out of frontend apps into `apps/api/src/app/secure/store/*` (`catalog`, `categories`, `categories/[id]`, `items`, `items/[id]`, `checkout`, `[id]/product`, `[id]/cancel`).
    - **Database-Driven Store Catalog (`@xernerx/lib`, `apps/admin`):**
        - Added `store.Category` and `store.Item` Mongoose models to `@xernerx/lib` (`registry.ts`) and added the `manageStore` RBAC permission (`permissions.ts`).
        - Built the `StoreManagement` admin console (`StoreCategoriesTab`, `StoreItemsTab`, `CategoryModal`, `ItemModal`) in `apps/admin` to manage store categories, Stripe-linked products/prices, feature lists, badges, and discounts.

    #### Cookie Policy & Consent Versioning (`www`, `@xernerx/providers`, `@xernerx/components`, `@xernerx/cli`)
    - **Dedicated Cookie Policy Page (`apps/www`):** Added `/cookies` (`apps/www/src/app/cookies/page.tsx`) and updated `/privacy` with expanded data sharing, rights, and children's privacy sections.
    - **Consent Versioning & Re-Prompting (`@xernerx/providers`, `@xernerx/components`):** Added `COOKIES_VERSION` timestamp validation (`agreedAt`), `isPromptOpen`, `openPrompt()`, and `closePrompt()` to `CookieProvider`, and added a Cookie Policy link and interactive "Cookie Preferences" trigger to `Footer` and `CookiePrompt`.
    - **Automated Policy Version Bumping (`@xernerx/cli`):** Updated `suite commit` (`commands/commit.ts`) to detect changes to `/cookies` or cookie dictionary keys and prompt to bump `COOKIES_VERSION` alongside `TERMS_VERSION` and `PRIVACY_VERSION`.

    #### Hierarchical `AGENTS.md` System & Automated CLI Architecture Linter (`@xernerx/cli`, all workspaces)
    - **Per-Workspace `AGENTS.md` Guidelines:** Added 24 hierarchical `AGENTS.md` files (root `AGENTS.md`, `apps/AGENTS.md`, and individual `AGENTS.md` files across every `apps/*`, `packages/*`, `services/*`, `clients/*`, and `.xernerx/*` workspace).
    - **Automated Architecture & i18n Linter (`@xernerx/cli`):** Upgraded `pnpm suite lint` (`commands/lint.ts`) with `runSuiteArchitectureLint()` to automatically enforce:
        1. **500-Line Inline Code Cap** across all `.ts`/`.tsx` files in `apps/*/src`.
        2. **Strict `src/components/` Placement** (no non-route files inside `apps/*/src/app`).
        3. **Strict 3-Route Local `/api` Rule** in frontend apps (`/api/auth/[...nextauth]`, `/api/changelog`, `/api/version`).
        4. **`DictionaryProvider` `t(path, variables?)` Signature Validation** (blocking invalid 2nd/3rd fallback string arguments).
        5. **100% `en-GB.json` Key Resolution** across all static `t('...')` calls in `apps/*` and `packages/*`.

    #### Provider & Localization Expansion (`@xernerx/lib`, `@xernerx/providers`)
    - **Complete Suite Localization (`@xernerx/lib`):** Added 900+ localization keys to `packages/lib/src/dictionaries/en-GB.json` (and synced locale dictionaries + `i18n.config.ts`) so every component and page across `apps/*` and `packages/components` consumes `useDictionary()`.
    - **`UserProvider` & `EnvironmentProvider` Improvements (`@xernerx/providers`):**
        - Optimized `UserProvider` to fetch Discord and Xernerx user profiles in parallel (`Promise.allSettled`) with in-flight request deduplication (`inFlightRef`) and `mutate()` support.
        - Updated `EnvironmentProvider` with `store.xernerx.com` (`4008`) port mapping and improved local hostname/IP resolution.

    ***

    ### 🛠️ Patches, Refactors & Bug Fixes (`app`, `admin`, `account`, `docs`, `cdn`, `desktop`, `info`, `@xernerx/ui`, `@xernerx/feedback`, `@xernerx/styles`, `bot`, `websocket`)
    - **500-Line Component Decomposition:**
        - **`apps/account`:** Decomposed `Tokens.tsx` (885 $\rightarrow$ 134 lines) into `src/components/tokens/*` (`TokenCard`, `BotProfilePreview`, `AsyncUserMultiSelector`, `CreateTokenModal`, `ManageTokenModal`).
        - **`apps/admin`:** Decomposed `Announcements.tsx`, `ApplicationConfigs.tsx`, `Roles.tsx`, `Tokens.tsx`, `Translations.tsx`, and `Users.tsx` into modular sub-components under `src/components/{announcements,applications,roles,tokens,translations,users}/*`.
        - **`apps/app`:** Decomposed `dashboard/page.tsx`, `portal/page.tsx`, `portal/bots/[id]/page.tsx`, `dashboard/General.tsx`, and `portal/Bots.tsx` into focused sub-components under `src/components/{dashboard,portal}/*`, and removed unused legacy `src/components/{account,admin}/*` directories.
        - **`apps/docs`:** Decomposed `V1Endpoints.tsx` and `websocket/page.tsx` into modular sub-components under `src/components/{api,websocket}/*`.
    - **Strict `src/components/` & `src/lib/` Relocation:**
        - Moved co-located route components out of `src/app/` into `src/components/` across `apps/app` (`bots/*`, `organization/*`), `apps/docs` (`api/*`, `packages/*`), and `apps/www` (`changelog/*`).
        - Moved non-route sync helpers out of `apps/api/src/app/secure/core/**` into `apps/api/src/lib/sync/{settings,users}.ts`.
    - **3-Route Local `/api` Cleanup & Desktop Health Check (`apps/app`, `clients/desktop`):**
        - Updated `clients/desktop/src/main.ts` to ping `${WEB_URL}/api/version` instead of `/api/status` and removed `apps/app/src/app/api/status/route.ts`.
    - **CDN Viewer Localization (`apps/cdn`):**
        - Extracted `UnauthorizedView` and `MediaFileDownload` into `apps/cdn/src/components/` and localized `MediaActions` tooltips.
    - **Dependencies & Tooling Alignment:**
        - Upgraded Next.js (`^16.4.1`), React (`^19.3.1`), Mongoose (`^9.11.2`), Framer Motion (`^14.2.0`), Lucide React (`^1.57.0`), Electron (`44.7.2`), and TypeScript (`^6.0.3`) across workspaces.

- Updated dependencies
    - @xernerx/providers@0.6.0
    - @xernerx/ui@0.3.11

## 0.0.27

### Patch Changes

- ### 🚀 Major & Minor Features

    #### Dedicated Storefront Application (`store`, `account` [BREAKING], `api`, `admin`, `@xernerx/lib`)
    - **Extracted `apps/store` (`store.xernerx.com`, port `4008`) [BREAKING for `account`]:** Migrated `/store` and `/store/[id]/cancel` out of `apps/account` into a dedicated Next.js storefront application (`apps/store`) with `DynamicCategoryView`, `DynamicFeaturedCard`, `DynamicItemCard`, and subscription cancellation routes.
    - **Centralized Store Backend API (`apps/api`):** Moved all Stripe store endpoints out of frontend apps into `apps/api/src/app/secure/store/*` (`catalog`, `categories`, `categories/[id]`, `items`, `items/[id]`, `checkout`, `[id]/product`, `[id]/cancel`).
    - **Database-Driven Store Catalog (`@xernerx/lib`, `apps/admin`):**
        - Added `store.Category` and `store.Item` Mongoose models to `@xernerx/lib` (`registry.ts`) and added the `manageStore` RBAC permission (`permissions.ts`).
        - Built the `StoreManagement` admin console (`StoreCategoriesTab`, `StoreItemsTab`, `CategoryModal`, `ItemModal`) in `apps/admin` to manage store categories, Stripe-linked products/prices, feature lists, badges, and discounts.

    #### Cookie Policy & Consent Versioning (`www`, `@xernerx/providers`, `@xernerx/components`, `@xernerx/cli`)
    - **Dedicated Cookie Policy Page (`apps/www`):** Added `/cookies` (`apps/www/src/app/cookies/page.tsx`) and updated `/privacy` with expanded data sharing, rights, and children's privacy sections.
    - **Consent Versioning & Re-Prompting (`@xernerx/providers`, `@xernerx/components`):** Added `COOKIES_VERSION` timestamp validation (`agreedAt`), `isPromptOpen`, `openPrompt()`, and `closePrompt()` to `CookieProvider`, and added a Cookie Policy link and interactive "Cookie Preferences" trigger to `Footer` and `CookiePrompt`.
    - **Automated Policy Version Bumping (`@xernerx/cli`):** Updated `suite commit` (`commands/commit.ts`) to detect changes to `/cookies` or cookie dictionary keys and prompt to bump `COOKIES_VERSION` alongside `TERMS_VERSION` and `PRIVACY_VERSION`.

    #### Hierarchical `AGENTS.md` System & Automated CLI Architecture Linter (`@xernerx/cli`, all workspaces)
    - **Per-Workspace `AGENTS.md` Guidelines:** Added 24 hierarchical `AGENTS.md` files (root `AGENTS.md`, `apps/AGENTS.md`, and individual `AGENTS.md` files across every `apps/*`, `packages/*`, `services/*`, `clients/*`, and `.xernerx/*` workspace).
    - **Automated Architecture & i18n Linter (`@xernerx/cli`):** Upgraded `pnpm suite lint` (`commands/lint.ts`) with `runSuiteArchitectureLint()` to automatically enforce:
        1. **500-Line Inline Code Cap** across all `.ts`/`.tsx` files in `apps/*/src`.
        2. **Strict `src/components/` Placement** (no non-route files inside `apps/*/src/app`).
        3. **Strict 3-Route Local `/api` Rule** in frontend apps (`/api/auth/[...nextauth]`, `/api/changelog`, `/api/version`).
        4. **`DictionaryProvider` `t(path, variables?)` Signature Validation** (blocking invalid 2nd/3rd fallback string arguments).
        5. **100% `en-GB.json` Key Resolution** across all static `t('...')` calls in `apps/*` and `packages/*`.

    #### Provider & Localization Expansion (`@xernerx/lib`, `@xernerx/providers`)
    - **Complete Suite Localization (`@xernerx/lib`):** Added 900+ localization keys to `packages/lib/src/dictionaries/en-GB.json` (and synced locale dictionaries + `i18n.config.ts`) so every component and page across `apps/*` and `packages/components` consumes `useDictionary()`.
    - **`UserProvider` & `EnvironmentProvider` Improvements (`@xernerx/providers`):**
        - Optimized `UserProvider` to fetch Discord and Xernerx user profiles in parallel (`Promise.allSettled`) with in-flight request deduplication (`inFlightRef`) and `mutate()` support.
        - Updated `EnvironmentProvider` with `store.xernerx.com` (`4008`) port mapping and improved local hostname/IP resolution.

    ***

    ### 🛠️ Patches, Refactors & Bug Fixes (`app`, `admin`, `account`, `docs`, `cdn`, `desktop`, `info`, `@xernerx/ui`, `@xernerx/feedback`, `@xernerx/styles`, `bot`, `websocket`)
    - **500-Line Component Decomposition:**
        - **`apps/account`:** Decomposed `Tokens.tsx` (885 $\rightarrow$ 134 lines) into `src/components/tokens/*` (`TokenCard`, `BotProfilePreview`, `AsyncUserMultiSelector`, `CreateTokenModal`, `ManageTokenModal`).
        - **`apps/admin`:** Decomposed `Announcements.tsx`, `ApplicationConfigs.tsx`, `Roles.tsx`, `Tokens.tsx`, `Translations.tsx`, and `Users.tsx` into modular sub-components under `src/components/{announcements,applications,roles,tokens,translations,users}/*`.
        - **`apps/app`:** Decomposed `dashboard/page.tsx`, `portal/page.tsx`, `portal/bots/[id]/page.tsx`, `dashboard/General.tsx`, and `portal/Bots.tsx` into focused sub-components under `src/components/{dashboard,portal}/*`, and removed unused legacy `src/components/{account,admin}/*` directories.
        - **`apps/docs`:** Decomposed `V1Endpoints.tsx` and `websocket/page.tsx` into modular sub-components under `src/components/{api,websocket}/*`.
    - **Strict `src/components/` & `src/lib/` Relocation:**
        - Moved co-located route components out of `src/app/` into `src/components/` across `apps/app` (`bots/*`, `organization/*`), `apps/docs` (`api/*`, `packages/*`), and `apps/www` (`changelog/*`).
        - Moved non-route sync helpers out of `apps/api/src/app/secure/core/**` into `apps/api/src/lib/sync/{settings,users}.ts`.
    - **3-Route Local `/api` Cleanup & Desktop Health Check (`apps/app`, `clients/desktop`):**
        - Updated `clients/desktop/src/main.ts` to ping `${WEB_URL}/api/version` instead of `/api/status` and removed `apps/app/src/app/api/status/route.ts`.
    - **CDN Viewer Localization (`apps/cdn`):**
        - Extracted `UnauthorizedView` and `MediaFileDownload` into `apps/cdn/src/components/` and localized `MediaActions` tooltips.
    - **Dependencies & Tooling Alignment:**
        - Upgraded Next.js (`^16.4.1`), React (`^19.3.1`), Mongoose (`^9.11.2`), Framer Motion (`^14.2.0`), Lucide React (`^1.57.0`), Electron (`44.7.2`), and TypeScript (`^6.0.3`) across workspaces.

- Updated dependencies
    - @xernerx/providers@0.5.0
    - @xernerx/ui@0.3.10

## 0.0.26

### Patch Changes

- @xernerx/providers@0.4.1
    - @xernerx/ui@0.3.9

## 0.0.25

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.4.0
    - @xernerx/ui@0.3.8

## 0.0.24

### Patch Changes

- @xernerx/providers@0.3.16
    - @xernerx/ui@0.3.7

## 0.0.23

### Patch Changes

- Fixed an issue where changelogs were not being pushed as entries
- Updated dependencies
    - @xernerx/providers@0.3.15
    - @xernerx/ui@0.3.6

## 0.0.22

### Patch Changes

- Updated dependencies and fixed a loading state issue on app
- Updated dependencies
    - @xernerx/providers@0.3.14
    - @xernerx/ui@0.3.5

## 0.0.21

### Patch Changes

- Updated dependencies
    - @xernerx/providers@0.3.13
    - @xernerx/ui@0.3.4

## 0.0.20

### Patch Changes

- @xernerx/providers@0.3.12
- @xernerx/ui@0.3.3

## 0.0.19

### Patch Changes

- Comprehensive Russian & English Ecosystem Localization Phase 2

    - **Ecosystem-wide Localization Wrappers:** Swept `admin`, `account`, `docs`, `cdn`, and `www` applications, systematically replacing hardcoded English strings with `@xernerx/providers` `useDictionary` hooks.
    - **Deep Dictionary Integrations:** Centralized hundreds of new configuration keys into `@xernerx/lib` (`ru.json` and `en-GB.json`), including complex nested objects for the Admin dashboard matrix, application package documentation, Account Media Library, and dynamic notification settings (`api`, `billing`, `apps`, `virtue`).
    - **Server/Client Boundary Separation:** Resolved React boundary crashes by explicitly splitting async data-fetching Server Components (like `PackageDetails`) away from new `'use client'` components strictly dedicated to translation contexts.
    - **Turbopack Cache Busting:** Mitigated Next.js 16 caching glitches by introducing manual invalidation markers (`// Force recompile`) when heavily rewriting ASTs with new context hooks.
    - **Interpolation Identifier Fixes:** Audited and resolved deep dictionary mapping bugs where the localization parser crashed because interpolation variables (e.g. `{current}`, `{error}`) were incorrectly translated into literal Cyrillic identifiers in the JSON tree.
    - **Widget Translation Parity:** Restored and translated hidden edge-cases in `@xernerx/components`, including the `SidebarUser` daily gift claiming states and success/error notification toasts.
    - **Cross-App Deep Linking:** Upgraded inter-app navigation URLs (like `Switch to Admin` and `Go to Translations` from the Account app) to support `?view=` query parameters, landing users securely into explicit Admin views (`?view=media`, `?view=translations`).

- Updated dependencies
    - @xernerx/providers@0.3.11
    - @xernerx/ui@0.3.2

## 0.0.18

### Patch Changes

- @xernerx/providers@0.3.10
- @xernerx/ui@0.3.1

## 0.0.17

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.3.0
    - @xernerx/providers@0.3.9

## 0.0.16

### Patch Changes

- fix build
- Updated dependencies
    - @xernerx/providers@0.3.8
    - @xernerx/ui@0.2.11

## 0.0.15

### Patch Changes

- @xernerx/providers@0.3.7
- @xernerx/ui@0.2.10

## 0.0.14

### Patch Changes

- Xerple and Crean
- Xerple and Crean
- Updated dependencies
- Updated dependencies
    - @xernerx/providers@0.3.6
    - @xernerx/ui@0.2.9

## 0.0.13

### Patch Changes

- @xernerx/providers@0.3.5
- @xernerx/ui@0.2.8

## 0.0.12

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.7

## 0.0.11

### Patch Changes

- @xernerx/ui@0.2.6

## 0.0.10

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.2.5

## 0.0.9

### Patch Changes

- Added permissions to admin and master control to all required items
- Updated dependencies
    - @xernerx/ui@0.2.4

## 0.0.8

### Patch Changes

- Updated dependencies
- Updated dependencies
    - @xernerx/ui@0.2.3

## 0.0.7

### Patch Changes

- linted prettier
- Updated dependencies
    - @xernerx/ui@0.2.2

## 0.0.6

### Patch Changes

- deps update
- Updated dependencies
    - @xernerx/ui@0.2.1

## 0.0.5

### Patch Changes

- Added Database rendering and UI changes

    ## @xernerx/lib
    - Added Database
    - Updated en-GB, en-US and nl

    ## @xernerx/ui
    - Added Confirm
    - Added Slider

    ## auth
    - Added Profile
    - Fixed an issue where deleting user data would just log an error
    - Added client sync to appearance
    - Added ui zoom to appearance
    - Added ui spacing to appearance
    - Added text size to appearance
    - Added visual language indicator to Language
    - Added notification togglers in Notifications (Actual notifications will be implemented later)
    - Added Tokens
    - Added docs and api route

    ## www
    - Updated appearance rendering

    ## api
    - Added a new api routing, this is now the core api experience

    ## docs
    - Added a new docs renderer, this is now the core docs experience

    ## @xernerx/components
    - Updated UI elements and logic

    ## @xernerx/providers
    - Updated UI elements and logic

    ## @xernerx/feedback
    - Updated UI elements

    ## @xernerx/styles
    - Updated UI variables
    - Added highlight accent coloring

- Updated dependencies
    - @xernerx/ui@0.2.0

## 0.0.4

### Patch Changes

- Fixed an issue where gitignore ignored too much
- Updated dependencies
    - @xernerx/ui@0.1.1

## 0.0.3

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.1.0

## 0.0.2

### Patch Changes

- Updated dependencies
    - @xernerx/ui@0.0.1

## 0.0.1

### Patch Changes

- <!-- @format -->

    Updated UI

    ## @xernerx/components
    - Fixed an issue where sidebar was incorrectly shown on mobile
    - Changed the way the banner is positioned on mobile
    - Fixed an issue where suite navigation on mobile didn't show on mobile
    - Fixed an issue where user was hidden under the viewport on the sidebar
    - Added a button on the header for navigation when sidebar is hidden
    - Added a top load animation to the top of the pages

    ## @xernerx/providers
    - Added an EnvironmentProvider, allowing for dev, canary and public distinction
    - Added a ShortcutProvider allowing shortcuts to be used
    - Fixed an issue where SidebarProvider no longer showed categories
    - Fixed an issue where ToastProvider didn't use the center on mobile

    ## @xernerx/feedback
    - Added Loading
    - Added Error
    - Added GlobalError
    - Added NotFound

    ## @xernerx/lib
    - Added navigation for url endpoints of suite services

    ## auth
    - Updated UI based on packages

    ## cdn
    - Updated UI based on packages

    ## www
    - Updated UI based on packages
    - Completely rewritten all pages
