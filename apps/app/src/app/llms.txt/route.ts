/** @format */

import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
	const body = `# Xernerx App — Discord Bot Directory, Server Explorer & Dashboard (app.xernerx.com/llms.txt)

> Discover, compare, and vote for verified Discord bots and public servers, view global XP and daily streak leaderboards, and configure official Xernerx Studios bots in one unified dashboard.

## Official Xernerx Studios Discord Bots

- [Virtue — Text & Voice XP Leveling Bot](https://app.xernerx.com/bots/virtue): Global and server XP leveling, voice duration XP, configurable XP curves, Daily/Weekly/Monthly resets, booster multipliers, and track-specific role rewards.
- [YourApps — Discord Forms, Staff Recruitment & Applications Bot](https://app.xernerx.com/bots/yourapps): Discord-native forms and community applications featuring 13-type Modals V2, conditional web portals, resumable drafts, interactive Apply panels, reviewer consensus voting, and automated role workflows.
- [To-Do List Bot — Task Boards & Productivity Bot](https://app.xernerx.com/bots/todo): Collaborative server task boards, personal checklists, priority tracking, and reminders.
- [Metamorphosis — Real-Time Multilingual Discord Translator](https://app.xernerx.com/bots/metamorphosis): Real-time multilingual translation, automatic translated channels, and cross-language community tools.
- [Zodiac — Astrology & Horoscopes Bot](https://app.xernerx.com/bots/zodiac): Daily horoscopes, zodiac sign profiles, natal charts, and compatibility readings.

## Key Directory & Community Routes

- [Explore Discord Bots](https://app.xernerx.com/bots): Browse top-voted, promoted, verified, and newly added Discord bots.
- [Explore Discord Servers](https://app.xernerx.com/servers): Discover public Discord communities, member growth charts, and Virtue XP leaderboards.
- [Global Ecosystem Leaderboards](https://app.xernerx.com/leaderboard): Top Discord bots by votes/servers/users, top servers, and longest daily user streaks.
- [Explore Users & Bot Creators](https://app.xernerx.com/users): Public user profiles, daily streaks, and published bots.
- [Server Configuration Dashboard](https://app.xernerx.com/dashboard): Manage server listings, analytics, Virtue progression settings, and YourApps application positions.
`;

	return new NextResponse(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
}
