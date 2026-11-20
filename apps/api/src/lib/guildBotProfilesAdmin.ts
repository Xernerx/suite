/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog } from './auditAndNotify';

const SNOWFLAKE_REGEX = /^\d{15,22}$/;

function resolveUserDisplay(userDoc: any, fallbackTag?: string, userId?: string): string {
	const name = userDoc?.discordCache?.globalName || userDoc?.name || userDoc?.discordCache?.username || fallbackTag || '';
	if (name) return String(name);
	return userId ? `User ${userId}` : 'Unknown User';
}

export async function handleGetGuildBotProfiles(guildId: string) {
	const [xernerxDb, virtueDb, yourappsDb] = await Promise.all([database('xernerx'), database('virtue').catch(() => null), database('yourapps').catch(() => null)]);

	const VGuild = (virtueDb?.models?.profiles as any)?.Guild;
	const LLevel = (virtueDb?.models?.levels as any)?.Level;
	const LText = (virtueDb?.models?.levels as any)?.Text;
	const LVoice = (virtueDb?.models?.levels as any)?.Voice;
	const YProfile = (yourappsDb?.models?.guilds as any)?.Profile;
	const YForm = (yourappsDb?.models?.guilds as any)?.Form;
	const YSubmission = (yourappsDb?.models?.guilds as any)?.Submission;
	const YDraft = (yourappsDb?.models?.guilds as any)?.Draft;

	const [vGuild, vLevelIds, vTextIds, vVoiceIds, yProfile, yForms, ySubmissions, yDrafts] = await Promise.all([
		VGuild
			? VGuild.findOne({ id: guildId })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		LLevel ? LLevel.distinct('id', { guild: guildId }).catch(() => []) : Promise.resolve([]),
		LText ? LText.distinct('id', { guild: guildId }).catch(() => []) : Promise.resolve([]),
		LVoice ? LVoice.distinct('id', { guild: guildId }).catch(() => []) : Promise.resolve([]),
		YProfile
			? YProfile.findOne({ id: guildId })
					.lean()
					.catch(() => null)
			: Promise.resolve(null),
		YForm
			? YForm.find({ guild: guildId })
					.sort({ createdAt: -1 })
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		YSubmission
			? YSubmission.find({ guild: guildId })
					.sort({ createdAt: -1 })
					.limit(300)
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
		YDraft
			? YDraft.find({ guild: guildId })
					.sort({ updatedAt: -1 })
					.limit(200)
					.lean()
					.catch(() => [])
			: Promise.resolve([]),
	]);

	const virtueMemberSet = new Set<string>();
	for (const rawId of [...(vLevelIds || []), ...(vTextIds || []), ...(vVoiceIds || [])]) {
		const uid = String(rawId || '').trim();
		if (SNOWFLAKE_REGEX.test(uid)) virtueMemberSet.add(uid);
	}
	const virtueMembersCount = virtueMemberSet.size;

	const applicantUserIds = new Set<string>();
	for (const r of [...(ySubmissions || []), ...(yDrafts || [])]) {
		const uid = String(r?.userId || '').trim();
		if (SNOWFLAKE_REGEX.test(uid)) applicantUserIds.add(uid);
	}

	const userDocs =
		applicantUserIds.size > 0
			? await (xernerxDb.models.users as any)?.User?.find({ id: { $in: Array.from(applicantUserIds) } })
					.select('id name icon discordCache')
					.lean()
					.catch(() => [])
			: [];

	const userMap = new Map<string, any>();
	for (const u of userDocs || []) {
		if (u?.id) userMap.set(String(u.id), u);
	}

	const formNameMap = new Map<string, string>();
	for (const f of yForms || []) {
		if (f?.id) formNameMap.set(String(f.id), String(f.name || f.id));
	}

	const applicantIds = new Set<string>();
	const subsByUser = new Map<string, any[]>();
	for (const s of ySubmissions || []) {
		const uid = String(s.userId || '').trim();
		if (!SNOWFLAKE_REGEX.test(uid)) continue;
		applicantIds.add(uid);
		if (!subsByUser.has(uid)) subsByUser.set(uid, []);
		subsByUser.get(uid)!.push(s);
	}
	const draftsByUser = new Map<string, any[]>();
	for (const d of yDrafts || []) {
		const uid = String(d.userId || '').trim();
		if (!SNOWFLAKE_REGEX.test(uid)) continue;
		applicantIds.add(uid);
		if (!draftsByUser.has(uid)) draftsByUser.set(uid, []);
		draftsByUser.get(uid)!.push(d);
	}

	const yourappsApplicants = Array.from(applicantIds).map((uid) => {
		const uDoc = userMap.get(uid);
		const subs = subsByUser.get(uid) || [];
		const drafts = draftsByUser.get(uid) || [];
		const fallbackTag = subs[0]?.userTag || '';
		return {
			userId: uid,
			displayName: resolveUserDisplay(uDoc, fallbackTag, uid),
			username: uDoc?.discordCache?.username || fallbackTag || null,
			submissions: subs.map((s: any) => ({
				id: String(s.id),
				positionId: String(s.positionId),
				positionName: String(s.positionName || formNameMap.get(String(s.positionId)) || s.positionId),
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
		};
	});

	const hasVirtue = Boolean(vGuild || virtueMembersCount > 0);
	const hasYourApps = Boolean(yProfile || (yForms && yForms.length > 0) || yourappsApplicants.length > 0);

	return NextResponse.json(
		{
			guildId,
			bots: [...(hasVirtue ? (['virtue'] as const) : []), ...(hasYourApps ? (['yourapps'] as const) : [])],
			virtue: {
				hasData: hasVirtue,
				configured: Boolean(vGuild),
				membersCount: virtueMembersCount,
				config: {
					mode: vGuild?.mode || 'balanced',
					xpMultiplier: Number(vGuild?.xpMultiplier ?? 1),
					boosterMultiplier: Number(vGuild?.boosterMultiplier ?? 1),
					stackRoles: vGuild?.stackRoles !== false,
					levelUp: vGuild?.levelUp !== false,
					levelChannel: vGuild?.levelChannel || null,
					levelMessage: vGuild?.levelMessage || '[@mention] reached level [@level] :tada:!',
					autoDelete: Number(vGuild?.autoDelete ?? 0),
					cycles: {
						daily: Boolean(vGuild?.cycles?.daily),
						weekly: Boolean(vGuild?.cycles?.weekly),
						monthly: Boolean(vGuild?.cycles?.monthly),
					},
					dynamicRolesEnabled: Boolean(vGuild?.dynamicRoles?.enabled),
					levelRolesCount: (Array.isArray(vGuild?.levelRoles) ? vGuild.levelRoles.length : 0) + (Array.isArray(vGuild?.roles?.levels) ? vGuild.roles.levels.length : 0),
				},
			},
			yourapps: {
				hasData: hasYourApps,
				configured: Boolean(yProfile),
				config: {
					dmNotifications: yProfile?.dmNotifications !== false,
					threadPerSubmission: Boolean(yProfile?.threadPerSubmission),
					logChannel: yProfile?.logChannel || null,
					archiveChannel: yProfile?.archiveChannel || null,
					panelChannel: yProfile?.panelChannel || null,
					panelsCount: Array.isArray(yProfile?.panels) ? yProfile.panels.length : 0,
					adminRolesCount: Array.isArray(yProfile?.adminRoles) ? yProfile.adminRoles.length : 0,
					reviewRolesCount: Array.isArray(yProfile?.reviewRoles) ? yProfile.reviewRoles.length : 0,
				},
				forms: (yForms || []).map((f: any) => ({
					id: String(f.id),
					name: String(f.name || f.id),
					category: String(f.category || 'custom'),
					state: f.state === 'closed' ? 'closed' : 'open',
					questionsCount: Array.isArray(f.questions) ? f.questions.length : 0,
				})),
				applicants: yourappsApplicants,
			},
		},
		{ status: 200 }
	);
}

export async function handlePatchGuildBotProfile(req: NextRequest, guildId: string, body: any) {
	const action = String(body?.action || '');

	if (action === 'update_virtue_config') {
		const virtueDb = await database('virtue');
		const VGuild = (virtueDb.models.profiles as any)?.Guild;
		if (!VGuild) return NextResponse.json({ error: 'Virtue models unavailable' }, { status: 500 });

		const setFields: Record<string, any> = { id: guildId };
		if (body.mode && ['easy', 'casual', 'balanced', 'hard', 'extreme'].includes(body.mode)) setFields.mode = body.mode;
		if (body.xpMultiplier !== undefined) setFields.xpMultiplier = Math.max(0.1, Number(body.xpMultiplier) || 1);
		if (body.boosterMultiplier !== undefined) setFields.boosterMultiplier = Math.max(0.1, Number(body.boosterMultiplier) || 1);
		if (body.autoDelete !== undefined) setFields.autoDelete = Math.max(0, Number(body.autoDelete) || 0);
		if (typeof body.levelMessage === 'string') setFields.levelMessage = body.levelMessage;
		if (body.stackRoles !== undefined) setFields.stackRoles = Boolean(body.stackRoles);
		if (body.levelUp !== undefined) setFields.levelUp = Boolean(body.levelUp);
		if (body.dynamicRolesEnabled !== undefined) setFields['dynamicRoles.enabled'] = Boolean(body.dynamicRolesEnabled);
		if (body.cycles && typeof body.cycles === 'object') {
			setFields['cycles.daily'] = Boolean(body.cycles.daily);
			setFields['cycles.weekly'] = Boolean(body.cycles.weekly);
			setFields['cycles.monthly'] = Boolean(body.cycles.monthly);
		}

		const updated = await VGuild.findOneAndUpdate({ id: guildId }, { $set: setFields }, { upsert: true, returnDocument: 'after' }).lean();

		await recordAuditLog(req, {
			action: 'server.bots.virtue.update',
			targetType: 'server',
			targetId: guildId,
			summary: `Updated Virtue bot configuration for server "${guildId}"`,
			metadata: setFields,
		});

		return NextResponse.json({ success: true, config: updated }, { status: 200 });
	}

	if (action === 'update_yourapps_config') {
		const yourappsDb = await database('yourapps');
		const YProfile = (yourappsDb.models.guilds as any)?.Profile;
		if (!YProfile) return NextResponse.json({ error: 'YourApps models unavailable' }, { status: 500 });

		const setFields: Record<string, any> = { id: guildId };
		if (body.dmNotifications !== undefined) setFields.dmNotifications = Boolean(body.dmNotifications);
		if (body.threadPerSubmission !== undefined) setFields.threadPerSubmission = Boolean(body.threadPerSubmission);

		const updated = await YProfile.findOneAndUpdate({ id: guildId }, { $set: setFields }, { upsert: true, returnDocument: 'after' }).lean();

		await recordAuditLog(req, {
			action: 'server.bots.yourapps.update',
			targetType: 'server',
			targetId: guildId,
			summary: `Updated YourApps bot configuration for server "${guildId}"`,
			metadata: setFields,
		});

		return NextResponse.json({ success: true, config: updated }, { status: 200 });
	}

	return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}

export async function handleDeleteGuildBotProfile(req: NextRequest, guildId: string, searchParams: URLSearchParams) {
	const bot = String(searchParams.get('bot') || '').trim();
	const userId = String(searchParams.get('userId') || '').trim();
	const submissionId = String(searchParams.get('submissionId') || '').trim();
	const draftId = String(searchParams.get('draftId') || '').trim();
	let deletedCount = 0;

	if (bot === 'virtue') {
		const virtueDb = await database('virtue').catch(() => null);
		const VGuild = (virtueDb?.models?.profiles as any)?.Guild;
		const LLevel = (virtueDb?.models?.levels as any)?.Level;
		const LText = (virtueDb?.models?.levels as any)?.Text;
		const LVoice = (virtueDb?.models?.levels as any)?.Voice;

		const res = await Promise.all([
			...(VGuild ? [VGuild.deleteMany({ id: guildId }).catch(() => ({ deletedCount: 0 }))] : []),
			...[LLevel, LText, LVoice].filter(Boolean).map((m: any) => m.deleteMany({ guild: guildId }).catch(() => ({ deletedCount: 0 }))),
		]);
		deletedCount = res.reduce((acc, r: any) => acc + (Number(r?.deletedCount) || 0), 0);
	} else if (bot === 'yourapps') {
		const yourappsDb = await database('yourapps').catch(() => null);
		const YProfile = (yourappsDb?.models?.guilds as any)?.Profile;
		const YForm = (yourappsDb?.models?.guilds as any)?.Form;
		const YSubmission = (yourappsDb?.models?.guilds as any)?.Submission;
		const YDraft = (yourappsDb?.models?.guilds as any)?.Draft;

		if (submissionId && YSubmission) {
			const r = await YSubmission.deleteOne({ id: submissionId, guild: guildId });
			deletedCount += Number(r?.deletedCount) || 0;
		} else if (draftId && YDraft) {
			const r = await YDraft.deleteOne({ id: draftId, guild: guildId });
			deletedCount += Number(r?.deletedCount) || 0;
		} else if (SNOWFLAKE_REGEX.test(userId)) {
			const res = await Promise.all([YSubmission, YDraft].filter(Boolean).map((m: any) => m.deleteMany({ userId, guild: guildId }).catch(() => ({ deletedCount: 0 }))));
			deletedCount = res.reduce((acc, r: any) => acc + (Number(r?.deletedCount) || 0), 0);
		} else {
			const res = await Promise.all([
				...(YProfile ? [YProfile.deleteMany({ id: guildId }).catch(() => ({ deletedCount: 0 }))] : []),
				...[YForm, YSubmission, YDraft].filter(Boolean).map((m: any) => m.deleteMany({ guild: guildId }).catch(() => ({ deletedCount: 0 }))),
			]);
			deletedCount = res.reduce((acc, r: any) => acc + (Number(r?.deletedCount) || 0), 0);
		}
	} else {
		return NextResponse.json({ error: 'Specify bot=virtue or bot=yourapps' }, { status: 400 });
	}

	await recordAuditLog(req, {
		action: 'server.bots.delete',
		targetType: 'server',
		targetId: guildId,
		summary: `Deleted ${bot} bot data in server "${guildId}"${userId ? ` for user "${userId}"` : ''}`,
		metadata: { bot, userId: userId || null, submissionId: submissionId || null, draftId: draftId || null, deletedCount },
	});

	return NextResponse.json({ success: true, deletedCount }, { status: 200 });
}
