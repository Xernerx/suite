/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const guildParam = req.nextUrl.searchParams.get('guild')?.trim() || null;
		const userParam = req.nextUrl.searchParams.get('user')?.trim() || null;
		const authHeaderParam = req.headers.get('authorization');
		const { models } = await database('xernerx');

		// 1. Strictly fetch ONLY users who have explicitly set privacy === 'public'
		const publicUsers = (await models.users.User.find({ privacy: 'public' }).select('id name icon verified description').lean()) as any[];
		const publicUserMap = new Map<string, any>();
		for (const u of publicUsers) {
			if (u?.id) publicUserMap.set(String(u.id), u);
		}
		const publicUserIds = Array.from(publicUserMap.keys());

		const BotModel = (models.bots as any).Bot;
		const GuildModel = (models.guilds as any).Guild;
		const LevelModel = (models.users as any).Level;

		// 2. Fetch Top Public Bots, Top Public Servers, Top Public User Streaks, and Top Public User Levels in parallel
		// Strictly enforce { privacy: 'public' } across bots, servers, and users
		const [bots, servers, rawCredits, rawGlobalLevels] = await Promise.all([
			BotModel.aggregate([
				{ $match: { privacy: 'public' } },
				{
					$lookup: {
						from: 'stats',
						let: { botId: '$id' },
						pipeline: [{ $match: { $expr: { $eq: ['$id', '$$botId'] } } }, { $sort: { timestamp: -1 } }, { $limit: 1 }],
						as: 'statsData',
					},
				},
				{ $unwind: { path: '$statsData', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: 'votes',
						let: { botId: '$id' },
						pipeline: [{ $match: { $expr: { $eq: ['$botId', '$$botId'] } } }, { $count: 'count' }],
						as: 'voteData',
					},
				},
				{
					$addFields: {
						computedVoteCount: {
							$max: [
								{ $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] },
								{ $ifNull: ['$statsData.voteCount', 0] },
								{ $ifNull: ['$statsData.votes', 0] },
								{ $ifNull: ['$voteCount', 0] },
							],
						},
						computedGuildCount: {
							$ifNull: ['$statsData.guildCount', { $ifNull: ['$statsData.servers', 0] }],
						},
						computedUserCount: {
							$ifNull: ['$statsData.userCount', { $ifNull: ['$statsData.users', 0] }],
						},
					},
				},
				{ $sort: { computedVoteCount: -1, computedGuildCount: -1, computedUserCount: -1 } },
				{ $limit: 30 },
				{
					$project: {
						_id: 0,
						id: 1,
						name: 1,
						avatar: 1,
						description: 1,
						verified: { $ifNull: ['$verified', false] },
						tags: { $ifNull: ['$tags', []] },
						voteCount: '$computedVoteCount',
						guildCount: '$computedGuildCount',
						userCount: '$computedUserCount',
					},
				},
			]),
			GuildModel.aggregate([
				{ $match: { privacy: 'public' } },
				{
					$lookup: {
						from: 'stats',
						let: { guildId: '$id' },
						pipeline: [{ $match: { $expr: { $eq: ['$id', '$$guildId'] } } }, { $sort: { timestamp: -1 } }, { $limit: 1 }],
						as: 'statsData',
					},
				},
				{ $unwind: { path: '$statsData', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: 'votes',
						let: { guildId: '$id' },
						pipeline: [{ $match: { $expr: { $eq: ['$guildId', '$$guildId'] } } }, { $count: 'count' }],
						as: 'voteData',
					},
				},
				{
					$addFields: {
						computedVoteCount: {
							$max: [{ $ifNull: [{ $arrayElemAt: ['$voteData.count', 0] }, 0] }, { $ifNull: ['$statsData.voteCount', 0] }, { $ifNull: ['$voteCount', 0] }],
						},
						computedMemberCount: {
							$max: [{ $ifNull: ['$statsData.members', 0] }, { $ifNull: ['$memberCount', 0] }],
						},
					},
				},
				{ $sort: { computedVoteCount: -1, computedMemberCount: -1 } },
				{ $limit: 30 },
				{
					$project: {
						_id: 0,
						id: 1,
						name: 1,
						icon: 1,
						banner: 1,
						description: 1,
						verified: { $ifNull: ['$verified', false] },
						bot: { $ifNull: ['$bot', false] },
						voteCount: '$computedVoteCount',
						memberCount: '$computedMemberCount',
					},
				},
			]),
			publicUserIds.length > 0
				? (models.users.Credit.find({ ownerId: { $in: publicUserIds } })
						.sort({ streak: -1, balance: -1 })
						.limit(30)
						.lean() as Promise<any[]>)
				: Promise.resolve([]),
			LevelModel
				? (LevelModel.find({ $or: [{ level: { $gt: 0 } }, { xp: { $gt: 0 } }] })
						.sort({ level: -1, xp: -1 })
						.limit(30)
						.lean() as Promise<any[]>)
				: Promise.resolve([]),
		]);

		const streaks = (rawCredits || [])
			.filter((c: any) => publicUserMap.has(String(c.ownerId)))
			.map((c: any) => {
				const u = publicUserMap.get(String(c.ownerId));
				return {
					id: String(c.ownerId),
					name: u?.name || null,
					icon: u?.icon || null,
					description: u?.description || '',
					verified: Boolean(u?.verified),
					streak: c.streak || 0,
					balance: c.balance || 0,
				};
			});

		let virtueGuilds: Array<{ id: string; name: string; icon?: string | null }> = [];
		let guildLevels: { guildId: string; guildName?: string | null; server: any[]; text: any[]; voice: any[] } | null = null;
		const extraUsersMap = new Map<string, any>();

		try {
			const virtueDb = await database('virtue');
			const VGuild = (virtueDb.models.profiles as any)?.Guild;
			const PLevel = (virtueDb.models.profiles as any)?.Level;
			const PText = (virtueDb.models.profiles as any)?.Text;
			const PVoice = (virtueDb.models.profiles as any)?.Voice;
			const LLevel = (virtueDb.models.levels as any)?.Level;
			const LText = (virtueDb.models.levels as any)?.Text;
			const LVoice = (virtueDb.models.levels as any)?.Voice;

			const distinctBoth = async (m1: any, m2: any, field: string, filter: any = {}) => {
				const [r1, r2] = await Promise.all([
					m1 ? m1.distinct(field, filter).catch(() => []) : Promise.resolve([]),
					m2 && m2 !== m1 ? m2.distinct(field, filter).catch(() => []) : Promise.resolve([]),
				]);
				return Array.from(new Set([...(r1 || []), ...(r2 || [])]));
			};

			const findTopBoth = async (m1: any, m2: any, filter: any) => {
				const [r1, r2] = await Promise.all([
					m1
						? m1
								.find(filter)
								.sort({ level: -1, xp: -1 })
								.limit(50)
								.lean()
								.catch(() => [])
						: Promise.resolve([]),
					m2 && m2 !== m1
						? m2
								.find(filter)
								.sort({ level: -1, xp: -1 })
								.limit(50)
								.lean()
								.catch(() => [])
						: Promise.resolve([]),
				]);
				const byUser = new Map<string, any>();
				for (const doc of [...(r1 || []), ...(r2 || [])]) {
					const uid = String(doc?.ownerId || doc?.userId || doc?.id || '');
					if (!uid) continue;
					const existing = byUser.get(uid);
					if (
						!existing ||
						(Number(doc.level) || 0) > (Number(existing.level) || 0) ||
						((Number(doc.level) || 0) === (Number(existing.level) || 0) && (Number(doc.xp) || 0) > (Number(existing.xp) || 0))
					) {
						byUser.set(uid, doc);
					}
				}
				return Array.from(byUser.values())
					.sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0) || (Number(b.xp) || 0) - (Number(a.xp) || 0))
					.slice(0, 30);
			};

			const userDiscordGuildMap = new Map<string, { id: string; name: string; icon?: string | null }>();
			const userMemberGuildIds = new Set<string>();

			if (userParam) {
				const userMatch = { $or: [{ id: userParam }, { userId: userParam }, { ownerId: userParam }] };
				const [uLevelGuilds, uTextGuilds, uVoiceGuilds, userDoc] = await Promise.all([
					distinctBoth(LLevel, PLevel, 'guild', userMatch),
					distinctBoth(LText, PText, 'guild', userMatch),
					distinctBoth(LVoice, PVoice, 'guild', userMatch),
					models.users?.User?.findOne({ id: userParam })
						.select('token accounts')
						.lean()
						.catch(() => null),
				]);

				for (const gid of [...(uLevelGuilds || []), ...(uTextGuilds || []), ...(uVoiceGuilds || [])]) {
					if (gid && String(gid) !== '__global__') userMemberGuildIds.add(String(gid));
				}

				let resolvedAuth = authHeaderParam;
				if (!resolvedAuth || resolvedAuth === 'Bearer undefined' || resolvedAuth === 'Bearer null') {
					const fallbackToken = (userDoc as any)?.accounts?.discord?.access_token || (userDoc as any)?.token;
					if (fallbackToken) resolvedAuth = `Bearer ${fallbackToken}`;
				}

				if (resolvedAuth) {
					const dRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
						headers: { Authorization: resolvedAuth },
						next: { revalidate: 60 },
					}).catch(() => null);
					if (dRes && dRes.ok) {
						const dGuilds = await dRes.json().catch(() => []);
						if (Array.isArray(dGuilds)) {
							for (const dg of dGuilds) {
								if (dg?.id) {
									const gid = String(dg.id);
									userMemberGuildIds.add(gid);
									userDiscordGuildMap.set(gid, { id: gid, name: dg.name, icon: dg.icon || null });
								}
							}
						}
					}
				}
			}

			const [allVGuilds, allLevelGuilds, allTextGuilds, allVoiceGuilds] = userParam
				? await Promise.all([
						VGuild ? VGuild.distinct('id', { id: { $ne: '__global__' } }).catch(() => []) : Promise.resolve([]),
						distinctBoth(LLevel, PLevel, 'guild'),
						distinctBoth(LText, PText, 'guild'),
						distinctBoth(LVoice, PVoice, 'guild'),
					])
				: [[], [], [], []];

			const knownVirtueSet = new Set<string>(
				[...(allVGuilds || []), ...(allLevelGuilds || []), ...(allTextGuilds || []), ...(allVoiceGuilds || [])].map((g: any) => String(g || '')).filter((g) => g && g !== '__global__')
			);

			const filteredUserGuildIds = userParam ? Array.from(userMemberGuildIds).filter((gid) => knownVirtueSet.has(gid) || userDiscordGuildMap.has(gid)) : [];

			const vGuildIds = Array.from(new Set([...filteredUserGuildIds, ...(guildParam && (!userParam || userMemberGuildIds.has(guildParam)) ? [guildParam] : [])]));

			if (vGuildIds.length > 0) {
				const matchedGuilds = GuildModel
					? await GuildModel.find({ id: { $in: vGuildIds } })
							.select('id name icon privacy')
							.lean()
							.catch(() => [])
					: [];
				const gMap = new Map<string, any>();
				for (const g of matchedGuilds || []) {
					if (g?.id) gMap.set(String(g.id), g);
				}
				virtueGuilds = vGuildIds
					.filter((gid) => knownVirtueSet.has(gid) || gMap.has(gid) || gid === guildParam)
					.map((gid) => {
						const g = gMap.get(gid);
						const dg = userDiscordGuildMap.get(gid);
						return {
							id: gid,
							name: g?.name || dg?.name || `Server ${gid.slice(-4)}`,
							icon: g?.icon || dg?.icon || null,
						};
					});
			}

			const activeGuildId = guildParam || null;

			if (activeGuildId) {
				const q = { $or: [{ guild: activeGuildId }, { guildId: activeGuildId }] };
				const [rawSDocs, tDocs, vDocs] = await Promise.all([findTopBoth(LLevel, PLevel, q), findTopBoth(LText, PText, q), findTopBoth(LVoice, PVoice, q)]);

				// Merge / synthesize Server Level for members who have Text/Voice XP if unified Level isn't populated yet
				const serverByUser = new Map<string, any>();
				for (const doc of rawSDocs) {
					const uid = String(doc?.ownerId || doc?.userId || doc?.id || '');
					if (uid) serverByUser.set(uid, doc);
				}
				const combinedTrackUsers = new Map<string, { id: string; xp: number; maxLevel: number }>();
				for (const doc of [...tDocs, ...vDocs]) {
					const uid = String(doc?.ownerId || doc?.userId || doc?.id || '');
					if (!uid) continue;
					const prev = combinedTrackUsers.get(uid) || { id: uid, xp: 0, maxLevel: 0 };
					prev.xp += Number(doc.xp) || 0;
					prev.maxLevel = Math.max(prev.maxLevel, Number(doc.level) || 0);
					combinedTrackUsers.set(uid, prev);
				}
				for (const [uid, comb] of combinedTrackUsers.entries()) {
					const existing = serverByUser.get(uid);
					if (!existing || ((Number(existing.level) || 0) === 0 && (Number(existing.xp) || 0) === 0)) {
						serverByUser.set(uid, {
							id: uid,
							guild: activeGuildId,
							level: comb.maxLevel,
							xp: comb.xp,
						});
					}
				}
				const sDocs = Array.from(serverByUser.values())
					.sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0) || (Number(b.xp) || 0) - (Number(a.xp) || 0))
					.slice(0, 30);

				const levelUserIds = Array.from(
					new Set([...(rawGlobalLevels || []), ...(sDocs || []), ...(tDocs || []), ...(vDocs || [])].map((d: any) => String(d?.ownerId || d?.userId || d?.id || '')).filter(Boolean))
				);

				if (levelUserIds.length > 0) {
					const foundUsers = await models.users.User.find({ id: { $in: levelUserIds } })
						.select('id name icon verified description privacy')
						.lean()
						.catch(() => []);
					for (const u of foundUsers || []) {
						if (u?.id) extraUsersMap.set(String(u.id), u);
					}
				}

				const mapDoc = (doc: any, track: 'global' | 'server' | 'text' | 'voice') => {
					const uid = String(doc.ownerId || doc.userId || doc.id || '');
					const u = publicUserMap.get(uid) || extraUsersMap.get(uid);
					return {
						id: uid,
						name: u?.name || doc.name || null,
						icon: u?.icon || null,
						description: u?.description || '',
						verified: Boolean(u?.verified),
						level: Number(doc.level) || 0,
						xp: Number(doc.xp) || 0,
						messages: track === 'text' ? Number(doc.messages) || 0 : undefined,
						timeSpent: track === 'voice' ? Number(doc.timeSpent ?? (doc.voiceMinutes ? doc.voiceMinutes * 60 : 0)) || 0 : undefined,
						track,
					};
				};

				const matchedG = virtueGuilds.find((g) => g.id === activeGuildId);
				guildLevels = {
					guildId: activeGuildId,
					guildName: matchedG?.name || null,
					server: (sDocs || []).filter((d: any) => Number(d?.level) > 0 || Number(d?.xp) > 0).map((d: any) => mapDoc(d, 'server')),
					text: (tDocs || []).filter((d: any) => Number(d?.level) > 0 || Number(d?.xp) > 0).map((d: any) => mapDoc(d, 'text')),
					voice: (vDocs || []).filter((d: any) => Number(d?.level) > 0 || Number(d?.xp) > 0).map((d: any) => mapDoc(d, 'voice')),
				};
			} else {
				const levelUserIds = Array.from(new Set((rawGlobalLevels || []).map((d: any) => String(d?.ownerId || d?.userId || d?.id || '')).filter(Boolean)));
				if (levelUserIds.length > 0) {
					const foundUsers = await models.users.User.find({ id: { $in: levelUserIds } })
						.select('id name icon verified description privacy')
						.lean()
						.catch(() => []);
					for (const u of foundUsers || []) {
						if (u?.id) extraUsersMap.set(String(u.id), u);
					}
				}
			}
		} catch {}

		const mapGlobalLevelDoc = (doc: any) => {
			const uid = String(doc.ownerId || doc.userId || doc.id || '');
			const u = publicUserMap.get(uid) || extraUsersMap.get(uid);
			return {
				id: uid,
				name: u?.name || doc.name || null,
				icon: u?.icon || null,
				description: u?.description || '',
				verified: Boolean(u?.verified),
				level: Number(doc.level) || 0,
				xp: Number(doc.xp) || 0,
				track: 'global' as const,
			};
		};

		const levels = (rawGlobalLevels || []).filter((l: any) => Boolean(l?.ownerId || l?.id) && (Number(l?.level) > 0 || Number(l?.xp) > 0)).map((l: any) => mapGlobalLevelDoc(l));

		return NextResponse.json({
			bots: bots || [],
			servers: servers || [],
			streaks,
			levels,
			virtueGuilds,
			...(guildLevels ? { guildLevels } : {}),
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
