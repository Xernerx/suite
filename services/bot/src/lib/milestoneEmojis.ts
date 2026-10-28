/** @format */

import fs from 'fs';
import path from 'path';
import { Client } from 'discord.js';
import { createLogger, MEMBER_MILESTONES, SERVER_MILESTONES } from '@xernerx/lib/core';

const botLog = createLogger('BOT');

let emojiCacheLoadedAt = 0;
const EMOJI_CACHE_TTL_MS = 5 * 60 * 1000;
let syncInProgress = false;

function normalizeEmojiKey(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getCandidateEmojiNames(type: 'servers' | 'members', tier: number): string[] {
	const prefix = type === 'servers' ? 'Servers' : 'Members';
	const singular = type === 'servers' ? 'Server' : 'Member';
	if (!tier || tier <= 0) {
		return [prefix, `${prefix}_0`, `${singular}_0`, prefix.toLowerCase(), `${prefix.toLowerCase()}_0`];
	}
	return [`${prefix}_${tier}`, `${prefix.toLowerCase()}_${tier}`, `${prefix}${tier}`, `${prefix.toLowerCase()}${tier}`, `${singular}_${tier}`, `${singular.toLowerCase()}_${tier}`];
}

export async function ensureMilestoneEmojisLoaded(client: Client): Promise<void> {
	if (!client.application) return;
	const now = Date.now();
	if (client.application.emojis.cache.size > 0 && now - emojiCacheLoadedAt < EMOJI_CACHE_TTL_MS) {
		return;
	}
	try {
		client.application.emojis.cache.clear();
		await client.application.emojis.fetch();
		emojiCacheLoadedAt = Date.now();
	} catch {}
}

export function getMilestoneEmoji(client: Client, type: 'servers' | 'members', tier: number): string {
	const fallback = type === 'servers' ? '🖥️' : '👥';
	const cache = client.application?.emojis?.cache;
	if (!cache || cache.size === 0) return fallback;

	const candidates = getCandidateEmojiNames(type, tier).map(normalizeEmojiKey);
	const found = cache.find((emoji) => Boolean(emoji.name && candidates.includes(normalizeEmojiKey(emoji.name))));
	if (!found) return fallback;

	return found.animated ? `<a:${found.name}:${found.id}>` : `<:${found.name}:${found.id}>`;
}

function resolvePublicDir(): string | null {
	const candidates = [path.resolve(process.cwd(), 'packages/public'), path.resolve(process.cwd(), '../../packages/public')];
	for (const dir of candidates) {
		if (fs.existsSync(dir)) return dir;
	}
	return null;
}

export async function syncMilestoneApplicationEmojis(client: Client): Promise<void> {
	if (syncInProgress || !client.application) return;
	syncInProgress = true;

	try {
		await ensureMilestoneEmojisLoaded(client);
		const publicDir = resolvePublicDir();
		if (!publicDir) return;

		const desiredAssets: { name: string; type: 'servers' | 'members'; tier: number; relPng: string }[] = [
			{ name: 'Servers', type: 'servers', tier: 0, relPng: 'servers/Servers.png' },
			...SERVER_MILESTONES.map((m) => ({
				name: `Servers_${m.tier}`,
				type: 'servers' as const,
				tier: m.tier,
				relPng: m.badgePng.replace(/^\//, ''),
			})),
			{ name: 'Members', type: 'members', tier: 0, relPng: 'members/Members.png' },
			...MEMBER_MILESTONES.map((m) => ({
				name: `Members_${m.tier}`,
				type: 'members' as const,
				tier: m.tier,
				relPng: m.badgePng.replace(/^\//, ''),
			})),
		];

		let uploaded = 0;
		for (const item of desiredAssets) {
			const existingCandidates = getCandidateEmojiNames(item.type, item.tier).map(normalizeEmojiKey);
			const alreadyExists = client.application.emojis.cache.some((e) => Boolean(e.name && existingCandidates.includes(normalizeEmojiKey(e.name))));
			if (alreadyExists) continue;

			const pngPath = path.join(publicDir, item.relPng);
			if (!fs.existsSync(pngPath)) continue;

			try {
				await client.application.emojis.create({
					attachment: pngPath,
					name: item.name,
				});
				uploaded++;
			} catch {
				break;
			}
		}

		if (uploaded > 0) {
			emojiCacheLoadedAt = Date.now();
			botLog.log(`Synced ${uploaded} milestone badge emoji(s) to application emojis.`);
		}
	} catch {
	} finally {
		syncInProgress = false;
	}
}

export function formatMilestoneProgressBar(percent: number, length = 10): string {
	const clamped = Math.max(0, Math.min(100, Math.round(percent)));
	const filled = Math.round((clamped / 100) * length);
	const empty = Math.max(0, length - filled);
	return `${'▰'.repeat(filled)}${'▱'.repeat(empty)}`;
}
