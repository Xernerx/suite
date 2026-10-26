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

			levelsRaw = (Array.isArray(ll) && ll.length > 0 ? ll : pl) || [];
			textRaw = (Array.isArray(lt) && lt.length > 0 ? lt : pt) || [];
			voiceRaw = (Array.isArray(lv) && lv.length > 0 ? lv : pv) || [];
		} catch (e) {
			console.warn('[GuildLeaderboard] Failed to query Virtue levels:', e);
		}

		const allUserIds = Array.from(new Set([...levelsRaw, ...textRaw, ...voiceRaw].map((entry: any) => String(entry?.userId || entry?.id || '')).filter(Boolean)));

		const users =
			allUserIds.length > 0
				? await UserModel.find({ id: { $in: allUserIds } })
						.select('id name icon privacy')
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
			const isPrivate = profile?.privacy === 'private';

			const level = Number(entry?.level ?? 0);
			const xp = Number(entry?.xp ?? 0);
			const nextLevelXp = Math.max(100, (level + 1) * 500);
			const rawTimeSpent = Number(entry?.voiceMinutes ?? entry?.timeSpent ?? 0);
			const voiceMinutes = entry?.voiceMinutes !== undefined ? Number(entry.voiceMinutes) : rawTimeSpent > 1000 ? Math.round(rawTimeSpent / 60) : rawTimeSpent;

			if (isPrivate) {
				return {
					id: null,
					userId: null,
					name: 'Private User',
					avatarUrl: null,
					level,
					xp,
					nextLevelXp,
					messages: type === 'text' ? Number(entry?.messages ?? 0) : undefined,
					voiceMinutes: type === 'voice' ? voiceMinutes : undefined,
					isPrivate: true,
					user: null,
				};
			}

			const avatarUrl = profile?.icon ? (String(profile.icon).startsWith('http') ? profile.icon : `https://cdn.discordapp.com/avatars/${uid}/${profile.icon}.png?size=128`) : null;

			return {
				id: uid,
				userId: uid,
				name: profile?.name || entry?.name || undefined,
				avatarUrl,
				level,
				xp,
				nextLevelXp,
				messages: type === 'text' ? Number(entry?.messages ?? 0) : undefined,
				voiceMinutes: type === 'voice' ? voiceMinutes : undefined,
				isPrivate: false,
				user: profile
					? {
							id: uid,
							username: profile.name,
							global_name: profile.name,
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
