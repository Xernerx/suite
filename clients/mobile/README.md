<!-- @format -->

# `clients/mobile` — Xernerx Mobile (Native React Native / Expo)

Native **iOS & Android** React Native companion application for the **Xernerx Suite** (no web target, no WebView wrapper around Next.js apps).

## ✨ Core Capabilities

- **Outlook & GitHub-Style Push Sign-In Approvals:** Receives targeted push sign-in requests from `account.xernerx.com` / Xernerx Desktop with **2-digit number matching**, IP/device/location context, anti-MFA-fatigue lockouts, and optional **Face ID / Touch ID / Biometric** verification.
- **Native Scan-to-Sign-In (QR & 6-Char Code):** Built-in `expo-camera` QR scanner with torch toggle to approve or deny `/login` QR challenges, plus bidirectional **Share QR / 6-char code** pairing from `Account → Devices`.
- **Full Native Account Hub:** Profile & 3-tier Privacy (`public` / `limited` / `private`), Security & Biometrics, Active Devices & Session Revocation, Activity History, Linked Connections, Appearance & Dynamic `--accent` Sync, Notifications Inbox, Language/Locale Sync, Billing/Credits Ledger + Daily Gift Claim, and Developer API Tokens.
- **RBAC-Gated Staff Admin Console:** Automatically unlocked when your Xernerx account holds `permissions.access === true` — includes live telemetry, Users & Moderation, Application Reviews, Support Tickets, Product Feedback/Bug/Roadmap Triage, Audit Logs, Global Status Broadcasts, and Core System Settings.

## 🚀 Development Commands

```bash
# Sync shared Xernerx branding assets from packages/public
pnpm --filter mobile initialize

# Start the full Xernerx Suite (includes Mobile Metro on exp://<LAN-IP>:8081)
pnpm dev

# Start interactive Expo CLI for Mobile (QR code + a/i/r shortcuts)
pnpm suite dev --only mobile

# Or start Mobile directly
pnpm --filter mobile dev

# Typecheck
pnpm --filter mobile typecheck

# Native prebuild / simulator runs
pnpm --filter mobile android
pnpm --filter mobile ios
```

> **Discord OAuth & QR Sign-In:** **Continue with Discord** routes through `account.xernerx.com/login/mobile`, reusing the suite's already-registered Discord OAuth callback automatically — no extra Discord Developer Portal redirect URI is required. You can also sign in instantly via **Scan Share QR** from `account.xernerx.com/?tab=devices`.
