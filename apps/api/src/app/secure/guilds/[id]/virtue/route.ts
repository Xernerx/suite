/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

function decodeBotIdFromToken(token?: string): string | null {
	if (!token || !token.includes('.')) return null;
	try {
		const id = Buffer.from(token.split('.')[0], 'base64').toString('utf8').trim();
		return /^\d{17,20}$/.test(id) ? id : null;
	} catch {
		return null;
	}
}

const VIRTUE_OR_ULTRA_IDS = new Set([
	'ultra',
	'bot-virtue',
	'discord_virtue',
	'virtue',
	'credit_trial_ultra',
	'credit_trial_bot-virtue',
	'staff_infinite_sub',
	'prod_V0pD5uXoTQkrYS',
	'price_1UAA6hH0UrDYoToMPWTsgJjD',
	'price_1U0ncoH0UrDYoToMQ6aTtz1G',
	'price_1U0nbeH0UrDYoToM58B2ZmMf',
	'price_1U0no9H0UrDYoToMv1buQ3KM',
	'price_1U0nmvH0UrDYoToM1yWyPkEz',
	'price_1U0oO5Ha7VTBTnBRaUwYmdkk',
]);

async function resolveGuildDiscordPremium(guildId: string): Promise<{
	serverPremium: boolean;
	serverPremiumSkuId: string | null;
	applicationId: string | null;
	ownerId: string | null;
}> {
	const virtueToken = process.env.VIRTUE_BOT_TOKEN?.trim();
	const appId = decodeBotIdFromToken(virtueToken);
	const candidateTokens = Array.from(new Set([virtueToken, process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean) as string[]));

	let ownerId: string | null = null;
	for (const token of candidateTokens) {
		try {
			const gRes = await fetch(`https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}`, {
				headers: { Authorization: `Bot ${token}` },
				cache: 'no-store',
			});
			if (gRes.ok) {
				const gData = await gRes.json().catch(() => null);
				if (gData?.owner_id) {
					ownerId = String(gData.owner_id).trim();
					break;
				}
			}
		} catch {}
	}

	const xDb = await database('xernerx').catch(() => null);
	if (!ownerId && xDb) {
		const XGuild = (xDb.models.guilds as any)?.Profile || (xDb.models.guilds as any)?.Guild;
		if (XGuild) {
			const xGuildDoc: any = await XGuild.findOne({ id: guildId })
				.select('owner')
				.lean()
				.catch(() => null);
			if (xGuildDoc?.owner) {
				ownerId = String(xGuildDoc.owner).trim();
			}
		}
	}

	let serverPremium = false;
	let primarySkuId: string | null = null;
	const now = Date.now();

	if (ownerId && xDb) {
		try {
			const XUser = (xDb.models.users as any)?.Profile || (xDb.models.users as any)?.User;
			const XSub = (xDb.models.billing as any)?.Subscription || (xDb.models.store as any)?.Subscription;
			const [userDoc, subDocs] = await Promise.all([
				XUser
					? XUser.findOne({ id: ownerId })
							.lean()
							.catch(() => null)
					: null,
				XSub
					? XSub.find({ ownerId })
							.lean()
							.catch(() => [])
					: [],
			]);

			if ((userDoc as any)?.staffSubscription === true) {
				serverPremium = true;
			} else {
				const rawSubs: any[] = [
					...(Array.isArray((userDoc as any)?.subscriptions) ? (userDoc as any).subscriptions : []),
					...(Array.isArray((userDoc as any)?.billing?.subscriptions) ? (userDoc as any).billing.subscriptions : []),
					...(Array.isArray(subDocs) ? subDocs : []),
				];
				serverPremium = rawSubs.some((sub) => {
					if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return false;
					if (sub.currentPeriodEnd) {
						const endMs = new Date(sub.currentPeriodEnd).getTime();
						if (!Number.isNaN(endMs) && endMs <= now) return false;
					}
					const priceId = String(sub.priceId || '').trim();
					const subId = String(sub.stripeSubscriptionId || '').trim();
					return (
						VIRTUE_OR_ULTRA_IDS.has(priceId) ||
						VIRTUE_OR_ULTRA_IDS.has(subId) ||
						priceId.toLowerCase().includes('ultra') ||
						priceId.toLowerCase().includes('virtue') ||
						subId.toLowerCase().includes('ultra') ||
						subId.toLowerCase().includes('virtue')
					);
				});
			}
		} catch {}
	}

	if (virtueToken && appId) {
		try {
			const [entRes, skusRes] = await Promise.allSettled([
				ownerId
					? fetch(`https://discord.com/api/v10/applications/${appId}/entitlements?user_id=${encodeURIComponent(ownerId)}&exclude_ended=true`, {
							headers: { Authorization: `Bot ${virtueToken}` },
							cache: 'no-store',
						})
					: Promise.resolve(null),
				fetch(`https://discord.com/api/v10/applications/${appId}/skus`, {
					headers: { Authorization: `Bot ${virtueToken}` },
					cache: 'no-store',
				}),
			]);

			if (skusRes.status === 'fulfilled' && skusRes.value?.ok) {
				const skus = await skusRes.value.json().catch(() => []);
				if (Array.isArray(skus)) {
					const validSkus = skus.filter((s: any) => s && s.type !== 6 && !s.deleted);
					if (validSkus[0]?.id) {
						primarySkuId = String(validSkus[0].id);
					}
				}
			}

			if (!serverPremium && entRes.status === 'fulfilled' && entRes.value?.ok) {
				const entitlements = await entRes.value.json().catch(() => []);
				if (Array.isArray(entitlements)) {
					serverPremium = entitlements.some((ent: any) => {
						if (!ent || ent.deleted || ent.consumed) return false;
						if (String(ent.user_id || '') !== String(ownerId)) return false;
						if (ent.ends_at && Date.parse(ent.ends_at) <= now) return false;
						return true;
					});
				}
			}
		} catch {}
	}

	return {
		serverPremium,
		serverPremiumSkuId: primarySkuId,
		applicationId: appId,
		ownerId,
	};
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('virtue');
		const GuildModel = (db.models.profiles as any)?.Guild;

		if (!GuildModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const profile: any = await GuildModel.findOne({ id }).lean();

		if (!profile) {
			return NextResponse.json({ error: 'Virtue guild setup profile not found', found: false }, { status: 404 });
		}

		const candidateTokens = Array.from(new Set([process.env.VIRTUE_BOT_TOKEN, process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_TOKEN].filter(Boolean) as string[]));
		for (const token of candidateTokens) {
			try {
				const [roleRes, channelRes] = await Promise.all([
					fetch(`https://discord.com/api/v10/guilds/${id}/roles`, {
						headers: { Authorization: `Bot ${token}` },
						cache: 'no-store',
					}).catch(() => null),
					fetch(`https://discord.com/api/v10/guilds/${id}/channels`, {
						headers: { Authorization: `Bot ${token}` },
						cache: 'no-store',
					}).catch(() => null),
				]);

				const updateFields: Record<string, unknown> = {};

				if (roleRes && roleRes.ok) {
					const roles = await roleRes.json();
					if (Array.isArray(roles)) {
						profile.serverRoles = roles
							.filter((r: any) => r && r.id && r.id !== id && !r.managed)
							.sort((a: any, b: any) => (Number(b.position) || 0) - (Number(a.position) || 0))
							.map((r: any) => ({
								id: String(r.id),
								name: String(r.name),
								color: Number(r.color) || 0,
								position: Number(r.position) || 0,
								managed: Boolean(r.managed),
							}));
						updateFields.serverRoles = profile.serverRoles;
					}
				}

				if (channelRes && channelRes.ok) {
					const channels = await channelRes.json();
					if (Array.isArray(channels)) {
						profile.serverChannels = channels
							.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 5 || Number(c.type) === 2 || Number(c.type) === 13))
							.sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
							.map((c: any) => ({
								id: String(c.id),
								name: String(c.name),
								type: Number(c.type) || 0,
							}));
						updateFields.serverChannels = profile.serverChannels;
					}
				}

				if (Object.keys(updateFields).length > 0) {
					await GuildModel.updateOne({ id }, { $set: updateFields }).catch(() => null);
					break;
				}
			} catch {
				// Try next candidate token
			}
		}

		const premiumInfo = await resolveGuildDiscordPremium(id);
		profile.serverPremium = premiumInfo.serverPremium;
		profile.serverPremiumSkuId = premiumInfo.serverPremiumSkuId;
		profile.applicationId = premiumInfo.applicationId;

		return NextResponse.json(profile, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('virtue');
		const GuildModel = (db.models.profiles as any)?.Guild;

		if (!GuildModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const premiumInfo = await resolveGuildDiscordPremium(id);

		const {
			_id: _omitId,
			__v: _omitV,
			createdAt: _omitCreated,
			updatedAt: _omitUpdated,
			serverPremium: _omitPrem,
			serverPremiumSkuId: _omitSku,
			applicationId: _omitApp,
			...cleanBody
		} = body || {};

		if (!premiumInfo.serverPremium) {
			cleanBody.mode = 'balanced';
			cleanBody.boosterMultiplier = 1;
			cleanBody.cycles = { daily: false, weekly: false, monthly: false };
			if (cleanBody.dynamicRoles && typeof cleanBody.dynamicRoles === 'object') {
				cleanBody.dynamicRoles = {
					...cleanBody.dynamicRoles,
					enabled: false,
				};
			}
		}

		const stripSubdocId = (arr: any[]) => arr.map(({ _id: _itemOmitId, ...item }: any) => item);
		if (cleanBody.dynamicRoles && typeof cleanBody.dynamicRoles === 'object') {
			const existingDoc: any = await GuildModel.findOne({ id })
				.select('dynamicRoles')
				.lean()
				.catch(() => null);
			const existingManaged = Array.isArray(existingDoc?.dynamicRoles?.managed) ? stripSubdocId(existingDoc.dynamicRoles.managed) : [];
			const incomingManaged = Array.isArray(cleanBody.dynamicRoles.managed) ? stripSubdocId(cleanBody.dynamicRoles.managed) : existingManaged;
			const rawTrack = String(cleanBody.dynamicRoles.track || 'server')
				.trim()
				.toLowerCase();
			cleanBody.dynamicRoles = {
				enabled: premiumInfo.serverPremium ? Boolean(cleanBody.dynamicRoles.enabled) : false,
				anchorRoleId: cleanBody.dynamicRoles.anchorRoleId ? String(cleanBody.dynamicRoles.anchorRoleId).trim() : null,
				nameTemplate: String(cleanBody.dynamicRoles.nameTemplate || 'Level [@level]').trim() || 'Level [@level]',
				maxRoles: Math.min(250, Math.max(2, Number(cleanBody.dynamicRoles.maxRoles) || 250)),
				track: ['server', 'unified', 'text', 'voice'].includes(rawTrack) ? rawTrack : 'server',
				gradientEnabled: Boolean(cleanBody.dynamicRoles.gradientEnabled),
				colorStart: /^#[0-9a-fA-F]{6}$/.test(String(cleanBody.dynamicRoles.colorStart || '').trim()) ? String(cleanBody.dynamicRoles.colorStart).trim() : '#7c5cff',
				colorEnd: /^#[0-9a-fA-F]{6}$/.test(String(cleanBody.dynamicRoles.colorEnd || '').trim()) ? String(cleanBody.dynamicRoles.colorEnd).trim() : '#00e5ff',
				managed: incomingManaged,
			};
		}
		if (Array.isArray(cleanBody.levelRoles)) {
			cleanBody.levelRoles = stripSubdocId(cleanBody.levelRoles);
		}
		if (Array.isArray(cleanBody.textLevelRoles)) {
			cleanBody.textLevelRoles = stripSubdocId(cleanBody.textLevelRoles);
		}
		if (Array.isArray(cleanBody.voiceLevelRoles)) {
			cleanBody.voiceLevelRoles = stripSubdocId(cleanBody.voiceLevelRoles);
		}
		if (cleanBody.roles && typeof cleanBody.roles === 'object') {
			if (Array.isArray(cleanBody.roles.levels)) {
				cleanBody.roles.levels = stripSubdocId(cleanBody.roles.levels);
			}
			if (Array.isArray(cleanBody.roles.textLevels)) {
				cleanBody.roles.textLevels = stripSubdocId(cleanBody.roles.textLevels);
			}
			if (Array.isArray(cleanBody.roles.voiceLevels)) {
				cleanBody.roles.voiceLevels = stripSubdocId(cleanBody.roles.voiceLevels);
			}
		}

		const updated: any = await GuildModel.findOneAndUpdate({ id }, { $set: cleanBody }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();
		if (updated && typeof updated === 'object') {
			updated.serverPremium = premiumInfo.serverPremium;
			updated.serverPremiumSkuId = premiumInfo.serverPremiumSkuId;
			updated.applicationId = premiumInfo.applicationId;
		}

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
