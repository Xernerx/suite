/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = (await getServerSession(auth)) as any;
		const sessionUserId = session?.user?.id;

		const xernerxDb = await database('xernerx');
		const GuildModel = (xernerxDb.models.guilds as any).Guild;
		const UserModel = (xernerxDb.models.users as any).User;

		const guild = await GuildModel.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		if (!guild) {
			return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
		}

		// Enforce 3-tier privacy truth: private guilds are only accessible to their owner
		const isOwner = Boolean(sessionUserId && (guild.owner === sessionUserId || guild.ownerId === sessionUserId));
		if (guild.privacy === 'private' && !isOwner) {
			return NextResponse.json({ error: 'This server is private.' }, { status: 403 });
		}

		const guildId = guild.id;

		let levelsRaw: any[] = [];
		let textRaw: any[] = [];
		let voiceRaw: any[] = [];

		try {
			const virtueDb = await database('virtue');
			const LevelsOverall = (virtueDb.models.levels as any)?.Level;
			const ProfilesOverall = (virtueDb.models.profiles as any)?.Level;
			const LevelsText = (virtueDb.models.levels as any)?.Text;
			const LevelsVoice = (virtueDb.models.levels as any)?.Voice;
			const ProfilesText = (virtueDb.models.profiles as any)?.Text;
			const ProfilesVoice = (virtueDb.models.profiles as any)?.Voice;

			const query = { $or: [{ guildId }, { guild: guildId }] };

			const [ll, pl, lt, pt, lv, pv] = await Promise.all([
				LevelsOverall
					? LevelsOverall.find(query)
							.sort({ level: -1, xp: -1 })
							.limit(50)
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				ProfilesOverall
					? ProfilesOverall.find(query)
							.sort({ level: -1, xp: -1 })
							.limit(50)
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				LevelsText
					? LevelsText.find(query)
							.sort({ level: -1, xp: -1 })
							.limit(50)
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				ProfilesText
					? ProfilesText.find(query)
							.sort({ level: -1, xp: -1 })
							.limit(50)
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				LevelsVoice
					? LevelsVoice.find(query)
							.sort({ level: -1, xp: -1 })
							.limit(50)
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
				ProfilesVoice
					? ProfilesVoice.find(query)
							.sort({ level: -1, xp: -1 })
							.limit(50)
							.lean()
							.catch(() => [])
					: Promise.resolve([]),
			]);

			const mergeDocs = (a: any[], b: any[]) => {
				const byUser = new Map<string, any>();
				for (const doc of [...(a || []), ...(b || [])]) {
					const uid = String(doc?.userId || doc?.ownerId || doc?.id || '');
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
				return Array.from(byUser.values()).sort((x, y) => (Number(y.level) || 0) - (Number(x.level) || 0) || (Number(y.xp) || 0) - (Number(x.xp) || 0));
			};

			textRaw = mergeDocs(lt, pt);
			voiceRaw = mergeDocs(lv, pv);

			const serverByUser = new Map<string, any>();
			for (const doc of mergeDocs(ll, pl)) {
				const uid = String(doc?.userId || doc?.ownerId || doc?.id || '');
				if (uid) serverByUser.set(uid, doc);
			}
			const combinedTrackUsers = new Map<string, { id: string; xp: number; maxLevel: number }>();
			for (const doc of [...textRaw, ...voiceRaw]) {
				const uid = String(doc?.userId || doc?.ownerId || doc?.id || '');
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
						userId: uid,
						guild: guildId,
						level: comb.maxLevel,
						xp: comb.xp,
					});
				}
			}
			levelsRaw = Array.from(serverByUser.values())
				.sort((x, y) => (Number(y.level) || 0) - (Number(x.level) || 0) || (Number(y.xp) || 0) - (Number(x.xp) || 0))
				.slice(0, 50);
		} catch (e) {
			console.warn('[GuildLeaderboard] Failed to query Virtue levels:', e);
		}

		const allUserIds = Array.from(new Set([...levelsRaw, ...textRaw, ...voiceRaw].map((entry: any) => String(entry?.userId || entry?.id || '')).filter(Boolean)));

		const users =
			allUserIds.length > 0
				? await UserModel.find({ id: { $in: allUserIds } })
						.select('id name icon privacy vanitySlug discordCache')
						.lean()
						.catch(() => [])
				: [];
		const userMap = new Map<string, any>();
		for (const u of users) {
			if (u?.id) userMap.set(String(u.id), u);
		}

		const enrichEntry = (entry: any, type: 'levels' | 'text' | 'voice') => {
			const uid = String(entry?.userId || entry?.id || '');
			const profile = userMap.get(uid);
			const dc = profile?.discordCache;

			const level = Number(entry?.level ?? 0);
			const xp = Number(entry?.xp ?? 0);
			const nextLevelXp = Math.max(100, (level + 1) * 500);
			const rawTimeSpent = Number(entry?.voiceMinutes ?? entry?.timeSpent ?? 0);
			const voiceMinutes = entry?.voiceMinutes !== undefined ? Number(entry.voiceMinutes) : rawTimeSpent > 1000 ? Math.round(rawTimeSpent / 60) : rawTimeSpent;

			const avatarUrl =
				dc?.avatarUrl ||
				(dc?.avatar ? `https://cdn.discordapp.com/avatars/${uid}/${dc.avatar}.png?size=128` : null) ||
				(profile?.icon ? (String(profile.icon).startsWith('http') ? profile.icon : `https://cdn.discordapp.com/avatars/${uid}/${profile.icon}.png?size=128`) : null);

			const username = dc?.username || profile?.name || entry?.username || entry?.name || undefined;
			const globalName = dc?.globalName || profile?.name || dc?.username || entry?.global_name || entry?.name || undefined;

			return {
				id: uid,
				userId: uid,
				vanitySlug: profile?.vanitySlug || undefined,
				name: globalName || username,
				username,
				global_name: globalName,
				avatarUrl,
				level,
				xp,
				nextLevelXp,
				messages: type === 'text' ? Number(entry?.messages ?? 0) : undefined,
				voiceMinutes: type === 'voice' ? voiceMinutes : undefined,
				isPrivate: false,
				user:
					username || globalName || avatarUrl
						? {
								id: uid,
								vanitySlug: profile?.vanitySlug || undefined,
								username,
								global_name: globalName,
								avatar: dc?.avatar || null,
								avatarUrl,
							}
						: null,
			};
		};

		return NextResponse.json(
			{
				levels: levelsRaw.map((e) => enrichEntry(e, 'levels')),
				text: textRaw.map((e) => enrichEntry(e, 'text')),
				voice: voiceRaw.map((e) => enrichEntry(e, 'voice')),
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to fetch guild leaderboard:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
