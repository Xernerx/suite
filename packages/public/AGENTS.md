<!-- @format -->

# `packages/public` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`packages/public` is the canonical central repository for static branding assets (`logo.svg`, `icon.svg`, `banner.svg`, `banner-canary.svg`, and `banner-dev.svg` using `currentColor`, plus `logo.png`, `icon.png`, `icon.ico`, `banner.png` and their `-black`, `-blue`, `-cyan`, `-gold`, `-green`, `-orange`, `-pink`, `-red`, and `-white` raster variants), tiered milestone badge icons (`servers/Servers.svg`, `servers/Servers-1.svg`..`Servers-16.svg`, `members/Members.svg`, `members/Members-1.svg`..`Members-16.svg` and `.png` counterparts), and domain/crawler files (`ads.txt`) shared across all Next.js applications in the suite.

## ⚠️ Important Rules & Gotchas

1. **Source of Truth for Static Assets:** Do not add or edit shared logos, icons, banners, or `ads.txt` inside individual `apps/*/public` folders directly—they will be overwritten. (Note: `/sitemap.xml` is dynamically generated per app via `src/app/sitemap.ts`.)
2. **Syncing Assets (`suite initialize`):** After adding or updating any file in `packages/public`, run `pnpm suite initialize` to copy the updated static assets into the `public/` directory of every web app.
3. **Not an NPM Package:** This directory intentionally has no `package.json` or TypeScript build step.
