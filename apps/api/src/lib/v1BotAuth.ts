/** @format */

import { NextRequest } from 'next/server';
import { database } from '@xernerx/lib/server';

export interface V1BotAuthResult {
	error?: string;
	status?: number;
	bot?: any;
	botId?: string;
	hasFullAccess?: boolean;
	isSystemToken?: boolean;
	tokenDoc?: any;
	db?: any;
	TokenModel?: any;
	BotModel?: any;
	StatModel?: any;
	CommandModel?: any;
	VoteModel?: any;
	HookModel?: any;
}

export async function fetchDiscordBotIdentity(botId: string): Promise<{ name: string | null; avatar: string | null }> {
	const discordToken = process.env.DISCORD_CLIENT_TOKEN || process.env.DISCORD_BOT_TOKEN;
	if (!discordToken || !/^\d{17,20}$/.test(botId)) {
		return { name: null, avatar: null };
	}

	try {
		const res = await fetch(`https://discord.com/api/v10/users/${botId}`, {
			headers: { Authorization: `Bot ${discordToken}` },
		});
		if (res.ok) {
			const user = await res.json();
			return {
				name: user.global_name || user.username || null,
				avatar: user.avatar || null,
			};
		}
	} catch (e) {
		console.error(`Failed to fetch Discord user for bot ${botId}:`, e);
	}

	return { name: null, avatar: null };
}

/**
 * Authenticates any `/v1/bots/[id]/*` request.
 * When `isMutation` is true (POST, PUT, PATCH, DELETE), automatically:
 * 1. Creates the bot profile in `BotModel` if it does not exist yet (fetching name & avatar from Discord).
 * 2. Binds the token (`tokenDoc.botId = bot.id`, `tokenDoc.status = 'active'`).
 * 3. Binds the token's user owners and the bot's user owners together (`bot.owners` <-> `tokenDoc.owners`).
 */
export async function authenticateV1BotRequest(req: NextRequest, rawBotId: string, options: { isMutation?: boolean } = {}): Promise<V1BotAuthResult> {
	const { isMutation = false } = options;
	const cleanId = (rawBotId || '').trim();
	if (!cleanId || ['undefined', 'null', 'nan'].includes(cleanId.toLowerCase())) {
		return { error: 'Bot not found (invalid bot ID)', status: 404 };
	}

	const authHeader = req.headers.get('Authorization');

	if (!authHeader) {
		return { error: 'Missing Authorization header', status: 401 };
	}

	const tokenValue = authHeader.replace(/^Bearer\s+/i, '').trim();
	if (!tokenValue) {
		return { error: 'Missing Authorization token', status: 401 };
	}

	const db = await database('xernerx');
	const TokenModel = (db.models.users as any).Token;
	const BotModel = (db.models.bots as any).Bot || (db.models.bots as any).Profile;
	const StatModel = (db.models.bots as any).Stat;
	const CommandModel = (db.models.bots as any).Command;
	const VoteModel = (db.models.bots as any).Vote;
	const HookModel = (db.models.bots as any).Hook;

	if (!TokenModel || !BotModel) {
		return { error: 'Database models not found', status: 500 };
	}

	const isSystemToken = Boolean((process.env.XERNERX_TOKEN && tokenValue === process.env.XERNERX_TOKEN) || (process.env.XERNERX_APP_TOKEN && tokenValue === process.env.XERNERX_APP_TOKEN));

	const tokenDoc = await TokenModel.findOneAndUpdate({ id: tokenValue }, { $inc: { requestCount: 1 }, $set: { lastUsedAt: new Date() } }, { returnDocument: 'after' });

	if (!tokenDoc && !isSystemToken) {
		return { error: 'Invalid token', status: 401 };
	}

	if (tokenDoc && (tokenDoc.status === 'inactive' || tokenDoc.status === 'suspended')) {
		return { error: 'Token is inactive or suspended', status: 403 };
	}

	if (tokenDoc && (tokenDoc as any).expiresAt) {
		const expMs = new Date((tokenDoc as any).expiresAt).getTime();
		if (!Number.isNaN(expMs) && expMs <= Date.now()) {
			return { error: 'Token has expired. Extend or remove its expiration in your token settings.', status: 401 };
		}
	}

	if (tokenDoc && Array.isArray((tokenDoc as any).allowedIps) && (tokenDoc as any).allowedIps.length > 0) {
		const cleanList = (tokenDoc as any).allowedIps.map((ip: any) => String(ip || '').trim()).filter(Boolean);
		if (cleanList.length > 0) {
			const forwardedFor = req.headers.get('x-forwarded-for');
			const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || '').replace(/^::ffff:/i, '');
			const isLocalDev = process.env.ENVIRONMENT?.toLowerCase() === 'development' && (clientIp === '127.0.0.1' || clientIp === '::1' || !clientIp);
			if (clientIp && !isLocalDev) {
				const allowed = cleanList.some((entry: string) => {
					const norm = entry.replace(/^::ffff:/i, '');
					if (norm === clientIp || norm === '*') return true;
					if (norm.endsWith('.*')) return clientIp.startsWith(norm.slice(0, -1));
					return false;
				});
				if (!allowed) {
					return { error: 'Forbidden: Client IP is not in this token allowlist', status: 403 };
				}
			}
		}
	}

	if (tokenDoc) {
		const ownerIds = Array.isArray(tokenDoc.owners) ? tokenDoc.owners.map(String).filter(Boolean) : [];
		if (ownerIds.length > 0 && (db.models.users as any)?.User) {
			const blacklistedOwner = await (db.models.users as any).User.findOne({ id: { $in: ownerIds }, blacklisted: true })
				.select('id')
				.lean()
				.catch(() => null);
			if (blacklistedOwner) {
				return { error: 'Forbidden: Token owner account is restricted', status: 403 };
			}
		}
	}

	let bot = await BotModel.findOne({ $or: [{ id: rawBotId }, { vanitySlug: rawBotId.toLowerCase() }] });
	const resolvedBotId = bot?.id || rawBotId;

	if (isMutation) {
		// If token is already bound to a different bot ID, verify whether that old bot still exists
		if (tokenDoc?.botId && tokenDoc.botId !== resolvedBotId && !isSystemToken) {
			const boundBotExists = await BotModel.exists({ id: tokenDoc.botId });
			if (boundBotExists) {
				return { error: 'Token is not assigned to this bot ID', status: 403 };
			}
		}

		const tokenOwners: string[] = Array.isArray(tokenDoc?.owners) ? tokenDoc.owners.filter(Boolean) : [];

		if (!bot) {
			// Auto-create bot profile on first POST / PUT / PATCH / DELETE
			const discordIdentity = await fetchDiscordBotIdentity(resolvedBotId);
			const botName = discordIdentity.name || (isSystemToken ? 'Xernerx App' : 'Unknown Bot');
			const botAvatar = discordIdentity.avatar || null;

			bot = await BotModel.create({
				id: resolvedBotId,
				bot: true,
				name: botName,
				avatar: botAvatar,
				privacy: 'private',
				owners: tokenOwners,
			});

			if (tokenDoc) {
				await TokenModel.updateOne(
					{ id: tokenValue },
					{
						$set: {
							botId: resolvedBotId,
							status: 'active',
							owners: tokenOwners,
						},
					}
				);
				tokenDoc.botId = resolvedBotId;
				tokenDoc.status = 'active';
			}
		} else {
			const botOwners: string[] = Array.isArray(bot.owners) ? bot.owners.filter(Boolean) : [];
			const hasAccess = isSystemToken || tokenDoc?.botId === bot.id || tokenOwners.some((owner: string) => botOwners.includes(owner)) || botOwners.length === 0;

			if (!hasAccess) {
				return { error: 'Bot ID is already assigned to another profile', status: 403 };
			}

			// Synchronize owners between Token and Bot so both the bot and token are bound to the user
			const mergedOwners = Array.from(new Set([...botOwners, ...tokenOwners]));
			const botUpdates: Record<string, any> = {};

			if (mergedOwners.length !== botOwners.length || mergedOwners.some((o) => !botOwners.includes(o))) {
				botUpdates.owners = mergedOwners;
				bot.owners = mergedOwners;
			}

			if (!bot.name || bot.name === 'Unknown Bot' || !bot.avatar) {
				const discordIdentity = await fetchDiscordBotIdentity(bot.id);
				if (discordIdentity.name && (!bot.name || bot.name === 'Unknown Bot')) {
					botUpdates.name = discordIdentity.name;
					bot.name = discordIdentity.name;
				}
				if (discordIdentity.avatar && !bot.avatar) {
					botUpdates.avatar = discordIdentity.avatar;
					bot.avatar = discordIdentity.avatar;
				}
			}

			if (Object.keys(botUpdates).length > 0) {
				await BotModel.updateOne({ id: bot.id }, { $set: botUpdates });
			}

			if (tokenDoc) {
				const needsTokenUpdate = tokenDoc.botId !== bot.id || tokenDoc.status !== 'active' || mergedOwners.length !== tokenOwners.length || mergedOwners.some((o) => !tokenOwners.includes(o));

				if (needsTokenUpdate) {
					await TokenModel.updateOne(
						{ id: tokenValue },
						{
							$set: {
								botId: bot.id,
								status: 'active',
								owners: mergedOwners,
							},
						}
					);
					tokenDoc.botId = bot.id;
					tokenDoc.status = 'active';
					tokenDoc.owners = mergedOwners;
				}
			}
		}

		return {
			bot,
			botId: bot.id,
			hasFullAccess: true,
			isSystemToken,
			tokenDoc,
			db,
			TokenModel,
			BotModel,
			StatModel,
			CommandModel,
			VoteModel,
			HookModel,
		};
	}

	// Non-mutation (GET)
	if (!bot) {
		return { error: 'Bot not found', status: 404 };
	}

	const tokenOwners: string[] = Array.isArray(tokenDoc?.owners) ? tokenDoc.owners.filter(Boolean) : [];
	const botOwners: string[] = Array.isArray(bot.owners) ? bot.owners.filter(Boolean) : [];
	const hasFullAccess = isSystemToken || tokenDoc?.botId === bot.id || tokenOwners.some((owner: string) => botOwners.includes(owner));

	return {
		bot,
		botId: bot.id,
		hasFullAccess,
		isSystemToken,
		tokenDoc,
		db,
		TokenModel,
		BotModel,
		StatModel,
		CommandModel,
		VoteModel,
		HookModel,
	};
}
