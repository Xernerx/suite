<!-- @format -->

# `packages/public` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`packages/public` is the canonical central repository for static branding assets (`logo.svg`, `logo.png`, `icon.png`, `banner.png`, `banner.svg`, `banner-canary.svg`, `banner-dev.svg`) and domain verification files (`ads.txt`) shared across all Next.js applications in the suite.

## ⚠️ Important Rules & Gotchas

1. **Source of Truth for Static Assets:** Do not add or edit shared logos, icons, banners, or `ads.txt` inside individual `apps/*/public` folders directly—they will be overwritten.
2. **Syncing Assets (`suite initialize`):** After adding or updating any file in `packages/public`, run `pnpm suite initialize` to copy the updated static assets into the `public/` directory of every web app.
3. **Not an NPM Package:** This directory intentionally has no `package.json` or TypeScript build step.
