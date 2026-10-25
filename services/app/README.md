<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx App Banner" width="100%">
</p>

<p align="center">
  <b>Standalone Discord bot daemon powering the Xernerx Support, Documentation, and Community Hub.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-app-purple?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 🧭 Overview

The **Xernerx App** service (`services/app`) is a standalone Discord bot daemon dedicated to the Xernerx Studios support and community ecosystem, operating with independent uptime from `services/bot`.

---

## 🛠️ Core Features

- **Interactive Knowledge & Support Commands:** Provides `/docs`, `/faq`, `/changelog`, `/roadmap`, `/status`, `/suggestions`, and `/issues` commands backed by the Xernerx Suite API.
- **Role Synchronization:** Automatically synchronizes join roles and Xernerx staff/profile roles across the primary and sister Discord guilds.
- **Independent Uptime & Telemetry:** Probes `api.xernerx.com/api/version` for live presence and records its own 24-hour status & latency buckets directly to `system_status_history_24h`.

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
