/** @format */

import zlib from 'zlib';
import { Client, Guild } from 'discord.js';
import { createLogger, database } from '@xernerx/lib/core';

const appBotLog = createLogger('APP-BOT');

const MAIN_SERVER_FALLBACK_ID = '687429190165069838';
const XERNERX_BOTS_ROLE_ID = '697481051940847756';
const SETTING_STATE_ID = 'main_server_bot_emoji_state';

/**
 * Explicit canonical emoji names for known Xernerx bots in the main server.
 * Any future production bot with the `Xernerx Bots` role automatically falls back to `normalizeBotEmojiName(username)`.
 */
export const BOT_EMOJI_NAME_OVERRIDES: Record<string, string> = {
	'1484880634844287138': 'Virtue',
	'1319029435655000234': 'Xernerx',
	'1317801434389151774': 'XernerxApp',
	'1317801881518477322': 'Aidex',
	'950251264095162418': 'Zodiac',
	'886804747984703509': 'Amplifier',
	'881678826906730547': 'Metamorphosis',
	'871981757531050064': 'PortalQuiz',
	'801124523478614038': 'PortalStatus',
	'782105629572464652': 'ToDoList',
	'715351718078054490': 'RobloxUtilities',
	'619328560141697036': 'YourApps',
};

const EXTRA_INCLUDED_BOT_IDS = new Set<string>(['886804747984703509']);

interface DecodedPng {
	width: number;
	height: number;
	pixels: Buffer; // RGBA (width * height * 4)
}

interface StoredBotEmojiState {
	avatarHash: string | null;
	emojiId: string;
	emojiName: string;
	updatedAt: number;
}

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(buf: Buffer): number {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) {
		c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const typeBuf = Buffer.from(type, 'ascii');
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
	return Buffer.concat([len, typeBuf, data, crcBuf]);
}

export function decodePng(buf: Buffer): DecodedPng {
	let offset = 8;
	let width = 0;
	let height = 0;
	let bitDepth = 8;
	let colorType = 6;
	let palette: Buffer | null = null;
	let trns: Buffer | null = null;
	const idatChunks: Buffer[] = [];

	while (offset < buf.length) {
		const len = buf.readUInt32BE(offset);
		const type = buf.toString('ascii', offset + 4, offset + 8);
		const data = buf.subarray(offset + 8, offset + 8 + len);
		if (type === 'IHDR') {
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			bitDepth = data[8];
			colorType = data[9];
		} else if (type === 'PLTE') {
			palette = Buffer.from(data);
		} else if (type === 'tRNS') {
			trns = Buffer.from(data);
		} else if (type === 'IDAT') {
			idatChunks.push(data);
		} else if (type === 'IEND') {
			break;
		}
		offset += 12 + len;
	}

	if (!width || !height || bitDepth !== 8) {
		throw new Error(`Unsupported PNG format (${width}x${height}, bitDepth=${bitDepth}, colorType=${colorType})`);
	}

	const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
	const bpp = channels;
	const stride = width * bpp + 1;
	const raw = zlib.inflateSync(Buffer.concat(idatChunks));
	const pixels = Buffer.alloc(width * height * 4);

	for (let y = 0; y < height; y++) {
		const filter = raw[y * stride];
		for (let x = 0; x < width * bpp; x++) {
			let val = raw[y * stride + 1 + x];
			const a = x >= bpp ? raw[y * stride + 1 + x - bpp] : 0;
			const b = y > 0 ? raw[(y - 1) * stride + 1 + x] : 0;
			const c = x >= bpp && y > 0 ? raw[(y - 1) * stride + 1 + x - bpp] : 0;

			if (filter === 1) {
				val = (val + a) & 0xff;
			} else if (filter === 2) {
				val = (val + b) & 0xff;
			} else if (filter === 3) {
				val = (val + Math.floor((a + b) / 2)) & 0xff;
			} else if (filter === 4) {
				const p = a + b - c;
				const pa = Math.abs(p - a);
				const pb = Math.abs(p - b);
				const pc = Math.abs(p - c);
				const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
				val = (val + pr) & 0xff;
			}
			raw[y * stride + 1 + x] = val;
		}

		for (let x = 0; x < width; x++) {
			const src = y * stride + 1 + x * bpp;
			const dst = (y * width + x) * 4;
			if (colorType === 6) {
				pixels[dst] = raw[src];
				pixels[dst + 1] = raw[src + 1];
				pixels[dst + 2] = raw[src + 2];
				pixels[dst + 3] = raw[src + 3];
			} else if (colorType === 2) {
				pixels[dst] = raw[src];
				pixels[dst + 1] = raw[src + 1];
				pixels[dst + 2] = raw[src + 2];
				pixels[dst + 3] = 255;
			} else if (colorType === 4) {
				pixels[dst] = raw[src];
				pixels[dst + 1] = raw[src];
				pixels[dst + 2] = raw[src];
				pixels[dst + 3] = raw[src + 1];
			} else if (colorType === 0) {
				pixels[dst] = raw[src];
				pixels[dst + 1] = raw[src];
				pixels[dst + 2] = raw[src];
				pixels[dst + 3] = 255;
			} else if (colorType === 3 && palette) {
				const idx = raw[src];
				pixels[dst] = palette[idx * 3] ?? 0;
				pixels[dst + 1] = palette[idx * 3 + 1] ?? 0;
				pixels[dst + 2] = palette[idx * 3 + 2] ?? 0;
				pixels[dst + 3] = trns && idx < trns.length ? trns[idx] : 255;
			}
		}
	}

	return { width, height, pixels };
}

export function encodeRgbaPng(width: number, height: number, pixels: Buffer): Buffer {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // 8-bit depth
	ihdr[9] = 6; // RGBA
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const stride = width * 4 + 1;
	const raw = Buffer.alloc(height * stride);
	for (let y = 0; y < height; y++) {
		raw[y * stride] = 0; // Filter type 0 (None)
		pixels.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
	}

	const compressed = zlib.deflateSync(raw, { level: 9 });
	return Buffer.concat([signature, makePngChunk('IHDR', ihdr), makePngChunk('IDAT', compressed), makePngChunk('IEND', Buffer.alloc(0))]);
}

function resizeTo128(decoded: DecodedPng): DecodedPng {
	if (decoded.width === 128 && decoded.height === 128) return decoded;
	const out = Buffer.alloc(128 * 128 * 4);
	for (let y = 0; y < 128; y++) {
		const srcY = Math.min(decoded.height - 1, Math.floor((y * decoded.height) / 128));
		for (let x = 0; x < 128; x++) {
			const srcX = Math.min(decoded.width - 1, Math.floor((x * decoded.width) / 128));
			const srcIdx = (srcY * decoded.width + srcX) * 4;
			const dstIdx = (y * 128 + x) * 4;
			out[dstIdx] = decoded.pixels[srcIdx];
			out[dstIdx + 1] = decoded.pixels[srcIdx + 1];
			out[dstIdx + 2] = decoded.pixels[srcIdx + 2];
			out[dstIdx + 3] = decoded.pixels[srcIdx + 3];
		}
	}
	return { width: 128, height: 128, pixels: out };
}

/**
 * Applies a 128x128 anti-aliased circular mask matching the existing main-server bot emojis.
 */
export function createCircularAvatarPng(avatarPngBuffer: Buffer): { pngBuffer: Buffer; decoded: DecodedPng } {
	const base = resizeTo128(decodePng(avatarPngBuffer));
	const out = Buffer.from(base.pixels);
	const center = 64;
	const radius = 64;

	for (let y = 0; y < 128; y++) {
		for (let x = 0; x < 128; x++) {
			const idx = (y * 128 + x) * 4;
			const dist = Math.hypot(x + 0.5 - center, y + 0.5 - center);
			if (dist >= radius) {
				out[idx] = 0;
				out[idx + 1] = 0;
				out[idx + 2] = 0;
				out[idx + 3] = 0;
			} else if (dist > radius - 1) {
				const coverage = radius - dist;
				out[idx + 3] = Math.round(out[idx + 3] * coverage);
			}
		}
	}

	return {
		pngBuffer: encodeRgbaPng(128, 128, out),
		decoded: { width: 128, height: 128, pixels: out },
	};
}

/**
 * Computes the mean per-channel RGB difference (0..255) inside the inner circle (radius <= 56)
 * so edge masking differences or minor CDN compression artifacts do not trigger false positives.
 */
export function computeInnerCircleRgbDiff(a: DecodedPng, b: DecodedPng): number {
	const normA = resizeTo128(a);
	const normB = resizeTo128(b);
	let diffSum = 0;
	let channelCount = 0;

	for (let y = 8; y < 120; y++) {
		for (let x = 8; x < 120; x++) {
			if (Math.hypot(x + 0.5 - 64, y + 0.5 - 64) > 56) continue;
			const i = (y * 128 + x) * 4;
			diffSum += Math.abs(normA.pixels[i] - normB.pixels[i]) + Math.abs(normA.pixels[i + 1] - normB.pixels[i + 1]) + Math.abs(normA.pixels[i + 2] - normB.pixels[i + 2]);
			channelCount += 3;
		}
	}

	return channelCount > 0 ? diffSum / channelCount : 0;
}

export function normalizeBotEmojiName(botId: string, username: string): string {
	if (BOT_EMOJI_NAME_OVERRIDES[botId]) {
		return BOT_EMOJI_NAME_OVERRIDES[botId];
	}
	const stripped = username.replace(/\s+bot$/i, '').trim();
	const pascal = stripped
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
	return pascal.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 28) || `Bot_${botId.slice(-6)}`;
}

export function isExcludedEnvironmentBot(username: string): boolean {
	return /\b(dev|canary|local)\b/i.test(username);
}

let syncInProgress = false;

export async function syncMainServerBotIconEmojis(client: Client): Promise<void> {
	if (syncInProgress) return;
	syncInProgress = true;

	try {
		const db = await database('xernerx');
		const SettingModel = (db.models.core as any).Setting;

		const [adminServerSetting, stateSetting] = await Promise.all([SettingModel.findOne({ id: 'admin_server_id' }).lean(), SettingModel.findOne({ id: SETTING_STATE_ID }).lean()]);

		const mainServerId = adminServerSetting?.value ? String(adminServerSetting.value) : MAIN_SERVER_FALLBACK_ID;
		const guild: Guild | null = client.guilds.cache.get(mainServerId) || (await client.guilds.fetch(mainServerId).catch(() => null));

		if (!guild) {
			return;
		}

		let storedState: Record<string, StoredBotEmojiState> = {};
		if (stateSetting?.value) {
			try {
				const parsed = JSON.parse(stateSetting.value);
				if (parsed && typeof parsed === 'object') {
					storedState = parsed;
				}
			} catch {}
		}

		await Promise.all([guild.members.fetch().catch(() => null), guild.emojis.fetch().catch(() => null)]);

		const xernerxBotsRole = guild.roles.cache.get(XERNERX_BOTS_ROLE_ID) || guild.roles.cache.find((r) => r.name.toLowerCase() === 'xernerx bots');
		const roleId = xernerxBotsRole?.id || XERNERX_BOTS_ROLE_ID;

		const targetMembers = Array.from(guild.members.cache.values()).filter((member) => {
			if (!member.user?.bot) return false;
			if (isExcludedEnvironmentBot(member.user.username)) return false;
			return member.roles.cache.has(roleId) || EXTRA_INCLUDED_BOT_IDS.has(member.user.id) || Boolean(BOT_EMOJI_NAME_OVERRIDES[member.user.id]);
		});

		let stateChanged = false;

		for (const member of targetMembers) {
			const botUser = await client.users.fetch(member.user.id, { force: true }).catch(() => member.user);
			const botId = botUser.id;
			const baseName = normalizeBotEmojiName(botId, botUser.username);
			const avatarHash = botUser.avatar || null;
			const avatarUrl = botUser.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });

			const existingEmoji = guild.emojis.cache.find((e) => !e.animated && e.name === baseName);
			const prev = storedState[botId];

			if (existingEmoji && prev && prev.avatarHash === avatarHash && prev.emojiId === existingEmoji.id && prev.emojiName === baseName) {
				continue;
			}

			try {
				const avatarRes = await fetch(avatarUrl);
				if (!avatarRes.ok) continue;
				const avatarBuf = Buffer.from(await avatarRes.arrayBuffer());
				const { pngBuffer: circularPngBuffer, decoded: newAvatarDecoded } = createCircularAvatarPng(avatarBuf);

				if (!existingEmoji) {
					const created = await guild.emojis.create({
						attachment: circularPngBuffer,
						name: baseName,
						reason: `Created circular bot icon emoji for ${botUser.username}`,
					});
					appBotLog.info(`Created new bot icon emoji :${created.name}: (${created.id}) for ${botUser.username}`);
					storedState[botId] = {
						avatarHash,
						emojiId: created.id,
						emojiName: baseName,
						updatedAt: Date.now(),
					};
					stateChanged = true;
					continue;
				}

				const emojiUrl = `https://cdn.discordapp.com/emojis/${existingEmoji.id}.png?size=128`;
				const emojiRes = await fetch(emojiUrl);
				if (!emojiRes.ok) continue;
				const emojiBuf = Buffer.from(await emojiRes.arrayBuffer());
				const existingDecoded = decodePng(emojiBuf);
				const avgDiff = computeInnerCircleRgbDiff(existingDecoded, newAvatarDecoded);

				if (avgDiff < 12) {
					storedState[botId] = {
						avatarHash,
						emojiId: existingEmoji.id,
						emojiName: baseName,
						updatedAt: Date.now(),
					};
					stateChanged = true;
					continue;
				}

				const versionPattern = new RegExp(`^${baseName}_v(\\d+)$`, 'i');
				let maxVersion = 0;
				for (const emoji of guild.emojis.cache.values()) {
					if (!emoji.name) continue;
					const match = emoji.name.match(versionPattern);
					if (match) {
						const ver = Number(match[1]);
						if (Number.isFinite(ver) && ver > maxVersion) {
							maxVersion = ver;
						}
					}
				}

				const nextVersionName = `${baseName}_v${maxVersion + 1}`;
				await existingEmoji.edit({
					name: nextVersionName,
					reason: `Versioned old ${baseName} bot icon to :${nextVersionName}: after avatar update`,
				});
				appBotLog.info(`Versioned previous :${baseName}: emoji (${existingEmoji.id}) -> :${nextVersionName}:`);

				const created = await guild.emojis.create({
					attachment: circularPngBuffer,
					name: baseName,
					reason: `Updated circular bot icon emoji for ${botUser.username} (previous archived as :${nextVersionName}:)`,
				});
				appBotLog.info(`Created updated bot icon emoji :${created.name}: (${created.id}) for ${botUser.username} (diff=${avgDiff.toFixed(1)})`);

				storedState[botId] = {
					avatarHash,
					emojiId: created.id,
					emojiName: baseName,
					updatedAt: Date.now(),
				};
				stateChanged = true;
			} catch (err) {
				appBotLog.error(`Failed syncing bot icon emoji for ${botUser.username} (${botId}): ${(err as any)?.message || err}`);
			}
		}

		if (stateChanged) {
			await SettingModel.findOneAndUpdate(
				{ id: SETTING_STATE_ID },
				{
					$set: {
						id: SETTING_STATE_ID,
						value: JSON.stringify(storedState),
						valueType: 'json',
						description: 'Tracks synced circular bot icon emojis and avatar hashes in the main server',
					},
				},
				{ upsert: true }
			);
		}
	} catch (error) {
		appBotLog.error(`Failed to sync main server bot icon emojis: ${(error as any)?.message || error}`);
	} finally {
		syncInProgress = false;
	}
}
