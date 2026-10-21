<!-- @format -->

<p align="center">
  <img src="https://www.xernerx.com/banner.png" alt="Xernerx Bot Banner" width="100%">
</p>

<p align="center">
  <b>High-performance Discord bot daemon serving as the data synchronization bridge for the Xernerx Suite.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge&logo=none" alt="Status">
  <img src="https://img.shields.io/badge/service-bot-blue?style=for-the-badge&logo=none" alt="Service">
</p>

---

## 🧭 Overview

The **Bot** service (`services/bot`) is a dedicated Discord bot daemon that acts as the real-time bridge between Discord guilds, members, and the Xernerx Suite backend.

---

## 🛠️ Core Features

- **Guild & Member Synchronization:** Continuously synchronizes guild metadata, roles, channels, and member states with the Xernerx platform.
- **Framework Integration:** Built on `@xernerx/framework` for modular command handling, event listeners, and operational extensions.
- **Telemetry & Statistics:** Publishes live guild, shard, and user metrics via `@xernerx/stats` and communicates with the WebSocket gateway via `@xernerx/websocket`.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime:** Node.js / TypeScript
- **Discord Integration:** `discord.js` (`^14.22.1`)
- **Framework & SDKs:** `@xernerx/framework`, `@xernerx/stats`, `@xernerx/websocket`

---

## 📄 License

Exclusive property of **Xernerx Studios**. See the [LICENSE](../../LICENSE) file for details.
