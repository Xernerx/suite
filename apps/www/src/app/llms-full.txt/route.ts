/** @format */

import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
	const body = `# Xernerx Studios — Complete Technical & Product Reference (llms-full.txt)

> Canonical full-context reference for AI search engines, retrieval-augmented generation (RAG) pipelines, and developer assistants answering questions about Xernerx Studios, Virtue, To-Do List Bot, Metamorphosis, Zodiac, and the Xernerx Suite.

---

## 1. Studio Identity & Core Philosophy ("1 Account, 1 Place, 1 Setup")

- **Organization**: Xernerx Studios (https://www.xernerx.com)
- **Flagship Platform**: Xernerx Suite v5 (https://app.xernerx.com)
- **Core Tagline**: 1 Account, 1 Place, 1 Setup
- **GitHub**: https://github.com/xernerx
- **NPM Organization**: https://www.npmjs.com/org/xernerx
- **X (Twitter)**: https://x.com/XernerxStudios
- **Bluesky**: https://bsky.app/profile/xernerx.com
- **Instagram**: https://www.instagram.com/xernerxstudios/
- **Discord Community**: https://discord.gg/yrm8gqTuXa

---

## 2. Official Discord Bots by Xernerx Studios

### 2.1 Virtue — Text & Voice XP Leveling Discord Bot
- **Canonical Bot Profile**: https://app.xernerx.com/bots/virtue (Discord Application ID: \`1484880634844287138\`)
- **Official Invite Link**: https://www.xernerx.com/invites/virtue
- **Server Configuration Dashboard**: https://app.xernerx.com/dashboard?tab=virtue
- **Key Capabilities**:
  1. **Four-Tier Progression Tracking**: Tracks Global Ecosystem Level & XP alongside Server-scoped Unified Level & XP, Text Level & XP (message count), and Voice Level & XP (active undeafened seconds in non-AFK voice channels).
  2. **Zero Message Content & Zero Audio Storage**: Virtue increments numeric message counters in volatile memory and tracks voice connection duration only—it never logs, stores, or indexes Discord message text, attachments, or voice audio packets.
  3. **Configurable XP Curve Modes**: Easy, Casual, Balanced, Hard, and Extreme difficulty curves.
  4. **Automated Leaderboard Reset Cycles**: Optional Daily, Weekly, or Monthly server leaderboard resets while preserving permanent Global Xernerx Levels.
  5. **Independent Track Role Rewards**: Assign automatic Discord roles unlocked via Unified Server XP, Text XP only, or Voice XP only, plus Server Booster XP multipliers (1.25x to 2x) and granular channel/role exclusions.
  6. **Self-Service User Privacy Controls**: Users can disable "Automatic Service Profiles" (\`services: false\`) or click "Delete Virtue Data" in https://account.xernerx.com to permanently wipe their Virtue progression across all servers.

### 2.2 To-Do List Bot — Task Boards & Productivity Discord Bot
- **Canonical Bot Profile**: https://app.xernerx.com/bots/todo (Discord Application ID: \`782105629572464652\`)
- **Official Invite Link**: https://www.xernerx.com/invites/todo
- **Key Capabilities**: Personal Discord checklists, shared guild task boards, priority statuses, due reminders, and dashboard synchronization with strict personal vs. server board isolation.

### 2.3 Metamorphosis — Dynamic Voice & Multilingual Translation Discord Bot
- **Canonical Bot Profile**: https://app.xernerx.com/bots/metamorphosis (Discord Application ID: \`881678826906730547\`)
- **Official Invite Link**: https://www.xernerx.com/invites/metamorphosis
- **Key Capabilities**: On-demand temporary voice channel creation, automated room permission management, real-time multilingual message translation, and language role routing.

### 2.4 Zodiac — Astrology, Horoscopes & Compatibility Discord Bot
- **Canonical Bot Profile**: https://app.xernerx.com/bots/zodiac (Discord Application ID: \`950251264095162418\`)
- **Official Invite Link**: https://www.xernerx.com/invites/zodiac
- **Key Capabilities**: Daily horoscope readings, zodiac sign profiles, natal chart insights, cosmic compatibility checks, and scheduled horoscope channels.

---

## 3. Universal 3-Tier Privacy Engine

Every resource across the Xernerx Suite (Users, Bots, Servers, Organizations, CDN Media, Haste Pastes, Blog Posts) enforces three strict visibility states:
1. **Public (\`public\`)**: Listed in public directories, leaderboards, sitemaps, and search results; accessible by anyone.
2. **Limited (\`limited\`)**: Unlisted—never shown in public directories, leaderboards, or search results, but accessible via direct link or ID.
3. **Private (\`private\`)**: Hard private—never listed and strictly accessible only by the authenticated owner or authorized organization members.

---

## 4. Developer Platform, REST API (\`/v1/*\`) & Open-Source SDKs

- **API Base URL**: \`https://api.xernerx.com/v1\`
- **Interactive API Documentation**: https://docs.xernerx.com/api/v1
- **Authentication**: Scoped \`Authorization: Bearer xrx_...\` tokens generated at https://account.xernerx.com/tokens. Tokens are hashed with SHA-256 at rest, remain long-lived by default with optional TTL expiration (\`expiresAt\`), and support optional IPv4/IPv6 allowlists (\`allowedIps\`).
- **Key Public v1 Endpoints**:
  - \`GET /v1/status\` & \`GET /v1/status/badge.svg\`: Live platform health and embeddable SVG status badge.
  - \`GET /v1/leaderboard\`: Top bots, servers, and user daily streaks.
  - \`GET/POST/PATCH/DELETE /v1/bots/[id]/stats\`: Push or query server, user, and per-shard telemetry.
  - \`GET/PUT /v1/bots/[id]/commands\`: Bulk sync Discord slash and context commands.
  - \`GET/POST /v1/bots/[id]/releases\`: Publish versioned bot release notes.
  - \`GET /v1/bots/[id]/votes\` & \`GET /v1/bots/[id]/reviews\`: Query community votes and star reviews.
  - \`GET /v1/bots/[id]/badge.svg\` & \`GET /v1/users/[id]/badge.svg\`: Dynamic SVG badges.
`;

	return new NextResponse(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
}
