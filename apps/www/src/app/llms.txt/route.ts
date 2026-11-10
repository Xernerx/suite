/** @format */

import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
	const body = `# Xernerx Studios — Ecosystem & Product Directory (llms.txt)

> Xernerx Studios is a software development studio building Discord bots (Virtue, To-Do List Bot, Metamorphosis, Zodiac), open-source TypeScript SDKs (@xernerx/framework, @xernerx/stats), and the unified Xernerx Suite under "1 Account, 1 Place, 1 Setup".

## Official Discord Bots (Canonical Profiles & Invites)

- [Virtue — Text & Voice XP Leveling Discord Bot](https://app.xernerx.com/bots/virtue): Official Discord leveling bot by Xernerx Studios featuring global and server XP tracks, separate text message counters (zero message content stored) and voice channel duration XP, configurable XP curve difficulty modes (Easy, Casual, Balanced, Hard, Extreme), Daily/Weekly/Monthly leaderboard reset cycles, server booster XP multipliers (1.25x–2x), level-up role rewards across Server/Text/Voice tracks, and channel/role exclusions. [Official Invite](https://www.xernerx.com/invites/virtue)
- [To-Do List Bot — Discord Task Boards & Productivity Bot](https://app.xernerx.com/bots/todo): Official Discord productivity bot by Xernerx Studios providing personal checklists, collaborative server task boards, priority labels, and automated team reminders. [Official Invite](https://www.xernerx.com/invites/todo)
- [Metamorphosis — Dynamic Voice & Multilingual Discord Bot](https://app.xernerx.com/bots/metamorphosis): Official Discord utility bot by Xernerx Studios for on-demand temporary voice channels, room permissions, real-time multilingual translation, and automated routing. [Official Invite](https://www.xernerx.com/invites/metamorphosis)
- [Zodiac — Astrology & Horoscope Discord Bot](https://app.xernerx.com/bots/zodiac): Official Discord astrology bot by Xernerx Studios offering daily horoscopes, natal chart insights, sign profiles, and cosmic compatibility checks. [Official Invite](https://www.xernerx.com/invites/zodiac)

## Xernerx Suite Web Applications

- [Xernerx Studios Home](https://www.xernerx.com/): Company overview, product showcase, timeline, and ecosystem search.
- [Xernerx App — Bot Directory, Server Explorer & Dashboard](https://app.xernerx.com/): Browse and vote for public Discord bots (/bots) and servers (/servers), view global XP & streak leaderboards (/leaderboard), and configure server modules (/dashboard).
- [Xernerx Developer Portal](https://portal.xernerx.com/): Publish Discord bots, manage Developer Organizations, sync slash commands, and configure HMAC-SHA256 webhooks.
- [Xernerx Documentation](https://docs.xernerx.com/): Interactive v1 REST API reference (/api/v1), open-source NPM package docs (/packages), CDN docs (/cdn), and WebSocket RPC specs (/websocket).
- [Xernerx Account Hub](https://account.xernerx.com/): Unified Discord identity, theme & UI scaling, QR device pairing, scoped Bearer API tokens (xrx_), GDPR JSON data export, and self-service Virtue data deletion.
- [Xernerx Store](https://store.xernerx.com/): Ultra Ecosystem bundle, Virtue Pass, To-Do List Bot Pass, Metamorphosis Pass, Zodiac Pass, Developer Pro API plan, and the Credit Store Cosmetics Vault.
- [Xernerx Info & Support Hub](https://info.xernerx.com/): Live 9-service status matrix (/status), public roadmap (/roadmap), community suggestions (/suggestions), bug tracker (/issues), unified changelog (/changelog), and FAQ (/faq).
- [Xernerx Newsroom & Blog](https://blog.xernerx.com/): Official engineering deep-dives, security architecture reports, product announcements, and RSS feed (/rss.xml).
- [Xernerx Desktop Client Download](https://www.xernerx.com/download): Native Electron companion app for Windows, macOS, and Linux with multi-account session isolation and an always-on-top in-game overlay (/overlay).

## Open-Source TypeScript SDKs & NPM Packages

- [xernerx](https://docs.xernerx.com/packages/xernerx): All-in-one Xernerx Suite SDK, CLI (create-xernerx-app), and bot framework bundle.
- [@xernerx/framework](https://docs.xernerx.com/packages/@xernerx/framework): Modular Discord.js v14 bot framework with command handlers, engagement validators, inhibitors, and shard coordination.
- [@xernerx/stats](https://docs.xernerx.com/packages/@xernerx/stats): Automated Discord bot server, user, and shard telemetry publisher for the Xernerx v1 Stats API.
- [@xernerx/commands](https://docs.xernerx.com/packages/@xernerx/commands): Developer debug commands and automatic slash command synchronization extension.
- [@xernerx/hooks](https://docs.xernerx.com/packages/@xernerx/hooks): HMAC-SHA256 webhook receiver and voter/reviewer engagement cache.
- [@xernerx/websocket](https://docs.xernerx.com/packages/@xernerx/websocket): Bidirectional RPC client for the Xernerx WebSocket gateway.
- [@xernerx/terminal](https://docs.xernerx.com/packages/@xernerx/terminal): Structured ANSI logger and CLI spinner toolkit.
- [@xernerx/extension-builder](https://docs.xernerx.com/packages/@xernerx/extension-builder): Base extension lifecycle builder for @xernerx/framework.
- [Xernerx Examples (Xernerx/examples)](https://github.com/Xernerx/examples): Official TypeScript (@xernerx/*) and JavaScript (xernerx) Discord bot starter templates and sharding examples.

## Official Social & Community Channels

- [X (Twitter) — @XernerxStudios](https://x.com/XernerxStudios)
- [Bluesky — @xernerx.com](https://bsky.app/profile/xernerx.com)
- [Instagram — @xernerxstudios](https://www.instagram.com/xernerxstudios/)
- [GitHub — @xernerx](https://github.com/xernerx)
- [NPM — @xernerx](https://www.npmjs.com/org/xernerx)
- [Discord Support Community](https://discord.gg/yrm8gqTuXa)

## Security, Privacy & Legal Compliance

- [Platform & Bot Security Architecture](https://www.xernerx.com/security): Zero message content logging in Virtue, Universal 3-Tier Privacy Truth (Public, Limited, Private), SHA-256 hashed API tokens with optional TTL & IP allowlists, and self-service data deletion.
- [Terms of Service](https://www.xernerx.com/terms)
- [Privacy Policy](https://www.xernerx.com/privacy)
- [Cookie Policy](https://www.xernerx.com/cookies)
- [Full LLM Context Reference](https://www.xernerx.com/llms-full.txt)
`;

	return new NextResponse(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
}
