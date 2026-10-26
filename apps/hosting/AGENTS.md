<!-- @format -->

# Xernerx Hosting — Agent Guidelines (`apps/hosting`)

`apps/hosting` (`hosting.xernerx.com`, dev port `4010`) is the staff-guarded server infrastructure & Easypanel multi-node console (`one-dummi`, `two-dummi`, and side-by-side split view).

- **Strictly Session & RBAC Guarded**: Like `apps/admin`, the entire `hosting.xernerx.com` domain is guarded in `src/app/layout.tsx` by NextAuth session + `permissions.access` RBAC verification.
- **Persistent Multi-Node Iframes**: Both `one-dummi` and `two-dummi` iframes stay mounted in the DOM so switching between servers or into Split View happens with 0ms reload and preserves live container terminals/logs.
- **Local API Rule**: Only `/api/auth/[...nextauth]`, `/api/changelog`, and `/api/version` are housed locally.
