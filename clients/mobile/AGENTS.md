<!-- @format -->

# `clients/mobile` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`clients/mobile` is the native **iOS & Android** React Native (Expo SDK 58 + Expo Router) companion application for **Xernerx Suite**. It houses:

1. **Authenticator & Sign-In Approvals** (`app/(tabs)/index.tsx`, `app/(tabs)/scan.tsx`, `src/components/ui/ApprovalPromptSheet.tsx`) — Outlook/GitHub-style 2-digit number-matching approval prompts + native camera QR scan-to-sign-in.
2. **Full Account Hub** (`app/(tabs)/account.tsx`, `app/account/*`) — native screens talking directly to `api.xernerx.com/secure/*`.
3. **RBAC-Gated Staff Admin** (`app/(tabs)/admin.tsx`, `app/admin/*`) — shown strictly when `permissions.access === true` and gated per granular role permission.

## ⚠️ Strict Rules & Invariants

1. **Native Mobile Only — Zero WebView Wrappers & Zero Web Target:**
   - Never wrap `account.xernerx.com`, `admin.xernerx.com`, or any Next.js app in a `WebView`.
   - Keep `platforms: ['ios', 'android']` in `app.config.ts` — desktop already lives in `clients/desktop` (Electron).
2. **Authentication Architecture:**
   - Mobile authenticates with `Authorization: Bearer xrx_mob_<64hex>` issued by `/secure/auth/mobile/exchange` (stored exclusively in `expo-secure-store`).
   - Backend validates mobile tokens in `apps/api/src/proxy.ts` via `/secure/auth/mobile/validate` and resolves real per-user RBAC permissions in `apps/api/src/lib/auditAndNotify.ts` (`resolveCallerAuth`). Never grant system token privileges to mobile sessions.
3. **Design System Parity (`DESIGN.md`):**
   - Use `src/theme/tokens.ts` (`RADII`, `FONTS`, `buildPalette`) and shared native primitives in `src/components/ui/` (`GlassCard`, `Button`, `Input`, `Toggle`, `Badge`, `ConfirmModal`).
   - Never use native `Alert.alert` for confirmations — use `<ConfirmModal />` and `useToast().toast()`.
4. **Formatting & Assets:**
   - Start every `.ts`/`.tsx`/`.js` file with `/** @format */`.
   - Never edit files in `clients/mobile/public/` directly — they are synced from `packages/public/` via `pnpm suite initialize`.
