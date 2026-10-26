<!-- @format -->

# `apps/portal` — Developer & Organization Portal Guidelines (`AGENTS.md`)

> Inherits all global rules from [`../../AGENTS.md`](../../AGENTS.md).

`apps/portal` (`portal.xernerx.com`, dev port `4009`) is the dedicated Developer & Organization Console for the Xernerx Suite, hosting Personal & Organization Workspaces (`/`), Organization Credit Treasuries, RBAC Roles & Member Management, and Discord Bot Management (`/bots/[id]`).

---

## 📌 Rules Specific to `apps/portal`

1. **Feature Surface:**
    - **Developer & Organization Workspaces (`/`):** Personal bot overview and Organization management (`OrgWorkspaceHeader`, `OrgInfoTab`, `OrgMembersTab`, `OrgRolesTab`, `OrgBotsTab`, `OrgServersTab`, `OrgLinksTab`, `OrgSettingsTab`, `OrganizationTreasuryCard`).
    - **Bot Console (`/bots/[id]`):** Bot configuration (`GeneralTab`, `BotReleasesAndCommandsManager`, `GrowthTelemetryTab`, `LinksTab`, `WebhooksTab`, `WebhookDeliveriesCard`, `SettingsTab`).
2. **Strict 3-Route Local `/api` Rule:**
    - Only `/api/auth/[...nextauth]`, `/api/changelog`, and `/api/version` are permitted inside `apps/portal/src/app/api/`.
    - All mutations and fetches must route to `api.xernerx.com` (`/secure/bots/*`, `/secure/organizations/*`, `/secure/dispatch/*`, `/core/*`) via `getEnvUrl()`.
3. **Component Architecture & 500-Line Cap:**
    - All components live in `apps/portal/src/components/`. Keep every file under 500 lines.
