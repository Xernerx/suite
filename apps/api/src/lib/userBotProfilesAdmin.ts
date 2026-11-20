/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from './auditAndNotify';
import { fetchGuildInfoCached } from './discordGuildResources';

const SNOWFLAKE_REGEX = /^\d{15,22}$/;

function resolveGuildIconUrl(guildId: string, rawIcon?: string | null): string | null {
	if (!rawIcon) return null;
	const icon = String(rawIcon).trim();
	if (!icon) return null;
	if (icon.startsWith('http://') || icon.startsWith('https://')) return icon;
	return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${icon.startsWith('a_') ? 'gif' : 'png'}`;
}

export async function handleGetUserBotServerProfiles(userId: string) {
	const [xernerxDb, virtueDb, yourappsDb] = await Promise.all([database('xernerx'), database('virtue').catch(() => null), database('yourapps').catch(() => null)]);

	const VUser = (virtueDb?.models?.profiles as any)?.User;
	const LLevel = (virtueDb?.models?.levels as any)?.Level;
	const LText = (virtueDb?.models?.levels as any)?.Text;
	const LVoice = (virtueDb?.models?.levels as any)?.Voice;
	const YSubmission = (yourappsDb?.models?.guilds as any)?.Submission;
	const YDraft = (yourappsDb?.models?.guilds as any)?.Draft;
	const YForm = (yourappsDb?.models?.guilds as any)?.Form;

	const [vProfile, vLevels, vTexts, vVoices, ySubmissions, yDrafts] = await Promise.all([
		VUser
			? VUser.findOne({ id: userId })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		LLevel
			? LLevel.find({ id: userId })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		LText
			? LText.find({ id: userId })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		LVoice
			? LVoice.find({ id: userId })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		YSubmission
			? YSubmission.find({ userId })
					.sort({ createdAt: -1 })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		YDraft
			? YDraft.find({ userId })
					.sort({ updatedAt: -1 })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
	]);

	const guildIds = new Set<string>();
	for (const doc of [...(vLevels || []), ...(vTexts || []), ...(vVoices || []), ...(ySubmissions || []), ...(yDrafts || [])]) {
		const gid = String(doc?.guild || '').trim();
		if (SNOWFLAKE_REGEX.test(gid)) guildIds.add(gid);
	}

	const draftPositionIds = Array.from(new Set((yDrafts || []).map((d: any) => String(d?.positionId || '')).filter(Boolean)));
	const [guildDocs, formDocs] = await Promise.all([
		guildIds.size > 0
			? (xernerxDb.models.guilds as any)?.Guild?.find({ id: { $in: Array.from(guildIds) } })
					.select('id name icon privacy verified vanitySlug')
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		draftPositionIds.length > 0 && YForm
			? YForm.find({ id: { $in: draftPositionIds } })
					.select('id name')
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
	]);

	const guildMetaMap = new Map<string, any>();
	for (const g of guildDocs || []) {
		if (g?.id) guildMetaMap.set(String(g.id), g);
	}

	const formNameMap = new Map<string, string>();
	for (const f of formDocs || []) {
		if (f?.id && f?.name) formNameMap.set(String(f.id), String(f.name));
	}

	// Resolve missing Discord names/icons for up to 15 servers via cached lookup
	const unresolvedIds = Array.from(guildIds)
		.filter((gid) => {
			const g = guildMetaMap.get(gid);
			return !g || !g.name || g.name === 'Unknown Guild' || g.name === `Server ${gid}`;
		})
		.slice(0, 15);

	await Promise.all(
		unresolvedIds.map(async (gid) => {
			const info = await fetchGuildInfoCached(gid).catch(() => null);
			if (info?.name) {
				const prev = guildMetaMap.get(gid) || { id: gid, privacy: 'private', verified: false };
				guildMetaMap.set(gid, {
					...prev,
					name: info.name,
					icon: info.icon || prev.icon,
				});
			}
		})
	);

	const unifiedMap = new Map<string, any>();
	for (const row of vLevels || []) unifiedMap.set(String(row.guild), row);
	const textMap = new Map<string, any>();
	for (const row of vTexts || []) textMap.set(String(row.guild), row);
	const voiceMap = new Map<string, any>();
	for (const row of vVoices || []) voiceMap.set(String(row.guild), row);

	const subsByGuild = new Map<string, any[]>();
	for (const sub of ySubmissions || []) {
		const gid = String(sub.guild);
		if (!subsByGuild.has(gid)) subsByGuild.set(gid, []);
		subsByGuild.get(gid)!.push(sub);
	}

	const draftsByGuild = new Map<string, any[]>();
	for (const dr of yDrafts || []) {
		const gid = String(dr.guild);
		if (!draftsByGuild.has(gid)) draftsByGuild.set(gid, []);
		draftsByGuild.get(gid)!.push(dr);
	}

	const servers = Array.from(guildIds)
		.map((guildId) => {
			const meta = guildMetaMap.get(guildId);
			const uRow = unifiedMap.get(guildId);
			const tRow = textMap.get(guildId);
			const vRow = voiceMap.get(guildId);
			const subs = subsByGuild.get(guildId) || [];
			const drafts = draftsByGuild.get(guildId) || [];

			const hasVirtue = Boolean(uRow || tRow || vRow);
			const hasYourApps = subs.length > 0 || drafts.length > 0;
			const bots: ('virtue' | 'yourapps')[] = [];
			if (hasVirtue) bots.push('virtue');
			if (hasYourApps) bots.push('yourapps');

			return {
				guildId,
				name: meta?.name && meta.name !== 'Unknown Guild' ? String(meta.name) : `Server ${guildId}`,
				iconUrl: resolveGuildIconUrl(guildId, meta?.icon),
				privacy: meta?.privacy || 'private',
				verified: Boolean(meta?.verified),
				vanitySlug: meta?.vanitySlug || '',
				bots,
				virtue: {
					hasData: hasVirtue,
					unified: uRow ? { level: Number(uRow.level) || 0, xp: Number(uRow.xp) || 0, updatedAt: uRow.updatedAt ? new Date(uRow.updatedAt).toISOString() : null } : null,
					text: tRow
						? {
								level: Number(tRow.level) || 0,
								xp: Number(tRow.xp) || 0,
								messages: Number(tRow.messages) || 0,
								updatedAt: tRow.updatedAt ? new Date(tRow.updatedAt).toISOString() : null,
							}
						: null,
					voice: vRow
						? {
								level: Number(vRow.level) || 0,
								xp: Number(vRow.xp) || 0,
								timeSpent: Number(vRow.timeSpent) || 0,
								updatedAt: vRow.updatedAt ? new Date(vRow.updatedAt).toISOString() : null,
							}
						: null,
				},
				yourapps: {
					hasData: hasYourApps,
					submissions: subs.map((s: any) => ({
						id: String(s.id),
						positionId: String(s.positionId),
						positionName: String(s.positionName || s.positionId),
						status: s.status || 'pending',
						answers: Array.isArray(s.answers) ? s.answers : [],
						reviewedBy: s.reviewedBy || null,
						reviewedByTag: s.reviewedByTag || null,
						reviewReason: s.reviewReason || null,
						reviewedAt: s.reviewedAt ? new Date(s.reviewedAt).toISOString() : null,
						createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
					})),
					drafts: drafts.map((d: any) => ({
						id: String(d.id),
						positionId: String(d.positionId),
						positionName: formNameMap.get(String(d.positionId)) || String(d.positionId),
						currentStep: Number(d.currentStep) || 0,
						answers: Array.isArray(d.answers) ? d.answers : [],
						updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
					})),
				},
			};
		})
		.sort((a, b) => {
			const xpDiff = (b.virtue.unified?.xp ?? 0) - (a.virtue.unified?.xp ?? 0);
			if (xpDiff !== 0) return xpDiff;
			const subDiff = b.yourapps.submissions.length - a.yourapps.submissions.length;
			if (subDiff !== 0) return subDiff;
			return a.name.localeCompare(b.name);
		});

	const resolvedLang = vProfile ? vProfile.language || vProfile.locale || vProfile.preferences?.locale || vProfile.preferences?.language || 'en-GB' : null;

	return NextResponse.json(
		{
			userId,
			virtueGlobal: {
				found: Boolean(vProfile),
				language: resolvedLang,
				locale: resolvedLang,
				updatedAt: vProfile?.updatedAt ? new Date(vProfile.updatedAt).toISOString() : null,
			},
			servers,
		},
		{ status: 200 }
	);
}

export async function handlePatchUserBotServerProfile(req: NextRequest, userId: string, body: any) {
	const action = String(body?.action || 'update_virtue_server');

	if (action === 'update_virtue_global') {
		const virtueDb = await database('virtue');
		const VUser = (virtueDb.models.profiles as any)?.User;
		if (!VUser) return NextResponse.json({ error: 'Virtue models unavailable' }, { status: 500 });

		const lang = String(body?.language || body?.locale || 'en-GB').trim();
		const updated = await VUser.findOneAndUpdate(
			{ id: userId },
			{
				$set: {
					id: userId,
					language: lang,
					locale: lang,
					'preferences.locale': lang,
					'preferences.language': lang,
				},
			},
			{ upsert: true, returnDocument: 'after' }
		).lean();

		await recordAuditLog(req, {
			action: 'user.bots.virtue_global.update',
			targetType: 'user',
			targetId: userId,
			summary: `Updated global Virtue profile locale for user "${userId}" to "${lang}"`,
			metadata: { language: lang },
		});

		return NextResponse.json({ success: true, virtueGlobal: updated }, { status: 200 });
	}

	if (action === 'update_yourapps_submission') {
		const submissionId = String(body?.submissionId || '').trim();
		const status = String(body?.status || '').trim();
		if (!submissionId || !['pending', 'approved', 'denied', 'withdrawn'].includes(status)) {
			return NextResponse.json({ error: 'Invalid submissionId or status' }, { status: 400 });
		}
		const yourappsDb = await database('yourapps');
		const YSubmission = (yourappsDb.models.guilds as any)?.Submission;
		if (!YSubmission) return NextResponse.json({ error: 'YourApps models unavailable' }, { status: 500 });

		const updated = await YSubmission.findOneAndUpdate(
			{ id: submissionId, userId },
			{
				$set: {
					status,
					...(body?.reviewReason !== undefined ? { reviewReason: body.reviewReason || null } : {}),
					reviewedAt: new Date(),
				},
			},
			{ returnDocument: 'after' }
		).lean();

		if (!updated) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

		await recordAuditLog(req, {
			action: 'user.bots.yourapps.update',
			targetType: 'user',
			targetId: userId,
			summary: `Updated YourApps submission "${submissionId}" status to "${status}" for user "${userId}"`,
			metadata: { submissionId, status, guildId: (updated as any).guild },
		});

		return NextResponse.json({ success: true, submission: updated }, { status: 200 });
	}

	const guildId = String(body?.guildId || '').trim();
	if (!SNOWFLAKE_REGEX.test(guildId)) {
		return NextResponse.json({ error: 'Valid guildId is required' }, { status: 400 });
	}

	const virtueDb = await database('virtue');
	const LLevel = (virtueDb.models.levels as any)?.Level;
	const LText = (virtueDb.models.levels as any)?.Text;
	const LVoice = (virtueDb.models.levels as any)?.Voice;

	const ops: Promise<any>[] = [];
	if (body?.unified && LLevel) {
		ops.push(
			LLevel.findOneAndUpdate(
				{ id: userId, guild: guildId },
				{
					$set: {
						id: userId,
						guild: guildId,
						level: Math.max(0, Number(body.unified.level) || 0),
						xp: Math.max(0, Number(body.unified.xp) || 0),
					},
				},
				{ upsert: true }
			)
		);
	}
	if (body?.text && LText) {
		ops.push(
			LText.findOneAndUpdate(
				{ id: userId, guild: guildId },
				{
					$set: {
						id: userId,
						guild: guildId,
						level: Math.max(0, Number(body.text.level) || 0),
						xp: Math.max(0, Number(body.text.xp) || 0),
						messages: Math.max(0, Number(body.text.messages) || 0),
					},
				},
				{ upsert: true }
			)
		);
	}
	if (body?.voice && LVoice) {
		ops.push(
			LVoice.findOneAndUpdate(
				{ id: userId, guild: guildId },
				{
					$set: {
						id: userId,
						guild: guildId,
						level: Math.max(0, Number(body.voice.level) || 0),
						xp: Math.max(0, Number(body.voice.xp) || 0),
						timeSpent: Math.max(0, Number(body.voice.timeSpent) || 0),
					},
				},
				{ upsert: true }
			)
		);
	}

	await Promise.all(ops);

	await recordAuditLog(req, {
		action: 'user.bots.virtue.update',
		targetType: 'user',
		targetId: userId,
		summary: `Updated Virtue server profile for user "${userId}" in server "${guildId}"`,
		metadata: { guildId, unified: body?.unified, text: body?.text, voice: body?.voice },
	});

	return NextResponse.json({ success: true }, { status: 200 });
}

export async function handleDeleteUserBotServerProfile(req: NextRequest, userId: string, searchParams: URLSearchParams) {
	const guildId = String(searchParams.get('guildId') || '').trim();
	const bot = String(searchParams.get('bot') || 'all').trim();
	const submissionId = String(searchParams.get('submissionId') || '').trim();
	const draftId = String(searchParams.get('draftId') || '').trim();

	if (submissionId || draftId) {
		const yourappsDb = await database('yourapps');
		const YSubmission = (yourappsDb.models.guilds as any)?.Submission;
		const YDraft = (yourappsDb.models.guilds as any)?.Draft;
		let deletedCount = 0;

		if (submissionId && YSubmission) {
			const res = await YSubmission.deleteOne({ id: submissionId, userId });
			deletedCount += Number(res?.deletedCount) || 0;
		}
		if (draftId && YDraft) {
			const res = await YDraft.deleteOne({ id: draftId, userId });
			deletedCount += Number(res?.deletedCount) || 0;
		}

		await recordAuditLog(req, {
			action: 'user.bots.yourapps.delete_entry',
			targetType: 'user',
			targetId: userId,
			summary: `Deleted YourApps ${submissionId ? `submission "${submissionId}"` : `draft "${draftId}"`} for user "${userId}"`,
			metadata: { submissionId: submissionId || null, draftId: draftId || null, deletedCount },
		});

		return NextResponse.json({ success: true, deletedCount }, { status: 200 });
	}

	if (!SNOWFLAKE_REGEX.test(guildId)) {
		return NextResponse.json({ error: 'Valid guildId is required' }, { status: 400 });
	}

	let deletedCount = 0;

	if (bot === 'virtue' || bot === 'all') {
		const virtueDb = await database('virtue').catch(() => null);
		const LLevel = (virtueDb?.models?.levels as any)?.Level;
		const LText = (virtueDb?.models?.levels as any)?.Text;
		const LVoice = (virtueDb?.models?.levels as any)?.Voice;
		const results = await Promise.all([LLevel, LText, LVoice].filter(Boolean).map((m: any) => m.deleteMany({ id: userId, guild: guildId }).catch(() => ({ deletedCount: 0 }))));
		deletedCount += results.reduce((acc, r: any) => acc + (Number(r?.deletedCount) || 0), 0);
	}

	if (bot === 'yourapps' || bot === 'all') {
		const yourappsDb = await database('yourapps').catch(() => null);
		const YSubmission = (yourappsDb?.models?.guilds as any)?.Submission;
		const YDraft = (yourappsDb?.models?.guilds as any)?.Draft;
		const results = await Promise.all([YSubmission, YDraft].filter(Boolean).map((m: any) => m.deleteMany({ userId, guild: guildId }).catch(() => ({ deletedCount: 0 }))));
		deletedCount += results.reduce((acc, r: any) => acc + (Number(r?.deletedCount) || 0), 0);
	}

	await recordAuditLog(req, {
		action: 'user.bots.delete',
		targetType: 'user',
		targetId: userId,
		summary: `Reset ${bot} bot server data for user "${userId}" in server "${guildId}"`,
		metadata: { guildId, bot, deletedCount },
	});

	return NextResponse.json({ success: true, deletedCount }, { status: 200 });
}
