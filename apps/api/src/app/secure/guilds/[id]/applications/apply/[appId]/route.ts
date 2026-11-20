/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import {
	checkWebApplicantEligibility,
	fetchDiscordGuildMember,
	fetchGuildMembersPreview,
	fetchYourAppsGuildState,
	postSubmissionToDiscordLogChannel,
	syncGuildApplyPanels,
} from '@/lib/yourappsDiscord';
import { isQuestionActive, reconcileScheduledGuildPositions, validateQuestionAnswer } from '@/lib/yourappsSanitize';

export async function GET(_: Request, { params }: { params: Promise<{ id: string; appId: string }> }) {
	try {
		const { id, appId } = await params;
		const session = (await getServerSession(auth)) as any;
		const userId: string | null = session?.user?.id ? String(session.user.id) : null;

		const [yourappsDb, xernerxDb, guildState, memberState] = await Promise.all([
			database('yourapps'),
			database('xernerx').catch(() => null),
			fetchYourAppsGuildState(id),
			userId ? fetchDiscordGuildMember(id, userId) : Promise.resolve(null),
		]);

		const ProfileModel = (yourappsDb.models.guilds as any)?.Profile;
		const FormModel = (yourappsDb.models.guilds as any)?.Form;
		const SubmissionModel = (yourappsDb.models.guilds as any)?.Submission;
		const DraftModel = (yourappsDb.models.guilds as any)?.Draft;
		const XernerxGuildModel = (xernerxDb?.models?.guilds as any)?.Guild;

		if (FormModel) {
			const changed = await reconcileScheduledGuildPositions(FormModel, id);
			if (changed) await syncGuildApplyPanels(id);
		}

		const [profile, position, xernerxGuild, latestSub, draft, activeSubCount, approvedSubCount] = await Promise.all([
			ProfileModel ? ProfileModel.findOne({ id }).lean() : null,
			FormModel ? FormModel.findOne({ id: appId, guild: id }).lean() : null,
			XernerxGuildModel
				? XernerxGuildModel.findOne({ id })
						.select('id name icon banner description verified privacy owner ownerId')
						.lean()
						.catch(() => null)
				: null,
			userId && SubmissionModel ? SubmissionModel.findOne({ guild: id, positionId: appId, userId }).sort({ createdAt: -1 }).lean() : null,
			userId && DraftModel ? DraftModel.findOne({ id: `${id}:${userId}:${appId}` }).lean() : null,
			SubmissionModel ? SubmissionModel.countDocuments({ guild: id, positionId: appId, status: { $ne: 'withdrawn' } }).catch(() => 0) : 0,
			SubmissionModel ? SubmissionModel.countDocuments({ guild: id, positionId: appId, status: 'approved' }).catch(() => 0) : 0,
		]);

		const serverName = (xernerxGuild as any)?.name || guildState.guildName || 'Discord Server';
		const serverIcon = (xernerxGuild as any)?.icon || guildState.guildIconUrl || null;
		const serverBanner = (xernerxGuild as any)?.banner || null;

		const isPrivateGuild = (xernerxGuild as any)?.privacy === 'private';
		const isGuildOwner = Boolean(userId && ((xernerxGuild as any)?.owner === userId || (xernerxGuild as any)?.ownerId === userId));
		if (isPrivateGuild && !(userId && (memberState?.isMember || isGuildOwner))) {
			return NextResponse.json(
				{
					found: false,
					privateServer: true,
					authenticated: Boolean(userId),
					isMember: false,
					error: 'This server is private.',
				},
				{ status: 403 }
			);
		}

		if (!profile || !position) {
			return NextResponse.json(
				{
					found: false,
					botPresent: Boolean(profile),
					server: { id, name: serverName, icon: serverIcon, banner: serverBanner },
					authenticated: Boolean(userId),
				},
				{ status: 404 }
			);
		}

		const eligibility =
			userId && memberState
				? checkWebApplicantEligibility({
						member: memberState,
						guildConfig: profile,
						position,
						latestSubmission: latestSub,
						activeSubmissionCount: activeSubCount,
						approvedSubmissionCount: approvedSubCount,
					})
				: null;

		const serverRoles = guildState.serverRoles.length > 0 ? guildState.serverRoles : Array.isArray((profile as any).serverRoles) ? (profile as any).serverRoles : [];
		const serverChannels = guildState.serverChannels.length > 0 ? guildState.serverChannels : Array.isArray((profile as any).serverChannels) ? (profile as any).serverChannels : [];

		const questions: any[] = Array.isArray((position as any).questions) ? (position as any).questions : [];
		const needsMemberList = questions.some((q) => q?.type === 'user' || q?.type === 'mentionable');
		const guildMembers = needsMemberList && userId ? await fetchGuildMembersPreview(id) : [];

		return NextResponse.json(
			{
				found: true,
				botPresent: true,
				server: { id, name: serverName, icon: serverIcon, banner: serverBanner },
				authenticated: Boolean(userId),
				isMember: Boolean(memberState?.isMember),
				eligible: eligibility ? eligibility.ok : false,
				ineligibleReason: eligibility && !eligibility.ok ? eligibility.reason : !userId ? 'Sign in with Discord to apply.' : null,
				position: {
					id: (position as any).id,
					guild: (position as any).guild,
					name: (position as any).name,
					description: (position as any).description || '',
					category: (position as any).category || 'staff',
					state: (position as any).state || 'open',
					questions,
					cooldown: Number((position as any).cooldown) || 0,
					minimumJoinTime: Number((position as any).minimumJoinTime) || 0,
					minimumAccountAge: Number((position as any).minimumAccountAge) || 0,
					opensAt: (position as any).opensAt || null,
					closesAt: (position as any).closesAt || null,
					maxSubmissions: Number((position as any).maxSubmissions) || 0,
					maxApprovals: Number((position as any).maxApprovals) || 0,
					anonymousResponses: Boolean((position as any).anonymousResponses),
					requiredRoles: Array.isArray((position as any).requiredRoles) ? (position as any).requiredRoles : [],
				},
				draftAnswers: Array.isArray((draft as any)?.answers) ? (draft as any).answers : [],
				draftUpdatedAt: (draft as any)?.updatedAt || null,
				latestSubmission: latestSub
					? {
							id: (latestSub as any).id,
							status: (latestSub as any).status,
							createdAt: (latestSub as any).createdAt,
						}
					: null,
				serverRoles,
				serverChannels,
				guildMembers,
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; appId: string }> }) {
	try {
		const { id, appId } = await params;
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const userId = String(session.user.id);
		const body = await req.json().catch(() => ({}));
		const rawAnswers: Record<string, string> = body?.answers && typeof body.answers === 'object' ? body.answers : {};

		const [yourappsDb, xernerxDb] = await Promise.all([database('yourapps'), database('xernerx').catch(() => null)]);
		const FormModel = (yourappsDb.models.guilds as any)?.Form;
		const DraftModel = (yourappsDb.models.guilds as any)?.Draft;
		const XernerxGuildModel = (xernerxDb?.models?.guilds as any)?.Guild;
		if (!FormModel || !DraftModel) {
			return NextResponse.json({ error: 'YourApps models not initialized.' }, { status: 500 });
		}

		if (XernerxGuildModel) {
			const guildDoc: any = await XernerxGuildModel.findOne({ id })
				.select('privacy owner ownerId')
				.lean()
				.catch(() => null);
			if (guildDoc?.privacy === 'private' && guildDoc.owner !== userId && guildDoc.ownerId !== userId) {
				const memberState = await fetchDiscordGuildMember(id, userId);
				if (!memberState.isMember) {
					return NextResponse.json({ error: 'This server is private.' }, { status: 403 });
				}
			}
		}

		const position: any = await FormModel.findOne({ id: appId, guild: id }).lean();
		if (!position) {
			return NextResponse.json({ error: 'Position not found.' }, { status: 404 });
		}

		const questions: any[] = Array.isArray(position.questions) ? position.questions : [];
		const draftId = `${id}:${userId}:${appId}`;
		const answers = questions
			.filter((q) => rawAnswers[String(q.id)] !== undefined)
			.map((q) => ({
				questionId: String(q.id),
				question: String(q.question || '').slice(0, 256),
				type: String(q.type || 'paragraph'),
				answer: String(rawAnswers[String(q.id)] ?? '').slice(0, 2000),
			}));

		const hasNonEmpty = answers.some((a) => a.answer.trim().length > 0);
		if (!hasNonEmpty) {
			await DraftModel.deleteOne({ id: draftId }).catch(() => null);
			return NextResponse.json({ ok: true, cleared: true }, { status: 200 });
		}

		const saved = await DraftModel.findOneAndUpdate(
			{ id: draftId },
			{
				$set: {
					id: draftId,
					guild: id,
					userId,
					positionId: appId,
					currentStep: 0,
					answers,
				},
			},
			{ upsert: true, returnDocument: 'after' }
		).lean();

		return NextResponse.json({ ok: true, updatedAt: (saved as any)?.updatedAt || new Date().toISOString() }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; appId: string }> }) {
	try {
		const { id, appId } = await params;
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Please sign in with Discord before submitting an application.' }, { status: 401 });
		}

		const userId = String(session.user.id);
		const body = await req.json().catch(() => ({}));
		const rawAnswers: Record<string, string> = body?.answers && typeof body.answers === 'object' ? body.answers : {};

		const [yourappsDb, xernerxDb, memberState] = await Promise.all([database('yourapps'), database('xernerx').catch(() => null), fetchDiscordGuildMember(id, userId)]);

		const ProfileModel = (yourappsDb.models.guilds as any)?.Profile;
		const FormModel = (yourappsDb.models.guilds as any)?.Form;
		const SubmissionModel = (yourappsDb.models.guilds as any)?.Submission;
		const DraftModel = (yourappsDb.models.guilds as any)?.Draft;
		const XernerxUserModel = (xernerxDb?.models?.users as any)?.User;

		if (!ProfileModel || !FormModel || !SubmissionModel) {
			return NextResponse.json({ error: 'YourApps models not initialized.' }, { status: 500 });
		}

		if (XernerxUserModel) {
			const userDoc = await XernerxUserModel.findOne({ id: userId })
				.select('blacklisted services')
				.lean()
				.catch(() => null);
			if ((userDoc as any)?.blacklisted || (userDoc as any)?.services === false) {
				return NextResponse.json({ error: 'Submissions are unavailable while Xernerx Service Profiles are disabled on your account.' }, { status: 403 });
			}
		}

		await reconcileScheduledGuildPositions(FormModel, id);

		const [profile, position, latestSub, activeSubCount, approvedSubCount, priorUserCount] = await Promise.all([
			ProfileModel.findOne({ id }).lean(),
			FormModel.findOne({ id: appId, guild: id }).lean(),
			SubmissionModel.findOne({ guild: id, positionId: appId, userId }).sort({ createdAt: -1 }).lean(),
			SubmissionModel.countDocuments({ guild: id, positionId: appId, status: { $ne: 'withdrawn' } }).catch(() => 0),
			SubmissionModel.countDocuments({ guild: id, positionId: appId, status: 'approved' }).catch(() => 0),
			SubmissionModel.countDocuments({ guild: id, userId }).catch(() => 0),
		]);

		if (!profile || !position) {
			return NextResponse.json({ error: 'Application position not found.' }, { status: 404 });
		}

		const eligibility = checkWebApplicantEligibility({
			member: memberState,
			guildConfig: profile,
			position,
			latestSubmission: latestSub,
			activeSubmissionCount: activeSubCount,
			approvedSubmissionCount: approvedSubCount,
		});
		if (!eligibility.ok) {
			return NextResponse.json({ error: eligibility.reason }, { status: 403 });
		}

		const questions: any[] = Array.isArray((position as any).questions) ? (position as any).questions : [];
		const formattedAnswers: Array<{ questionId: string; question: string; type: string; answer: string }> = [];

		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			if (!isQuestionActive(q, rawAnswers)) {
				continue;
			}
			const qId = String(q.id);
			const val = String(rawAnswers[qId] ?? '').trim();

			const errMsg = validateQuestionAnswer(q, val, i + 1);
			if (errMsg) {
				return NextResponse.json({ error: errMsg }, { status: 400 });
			}

			formattedAnswers.push({
				questionId: qId,
				question: String(q.question).slice(0, 256),
				type: String(q.type || 'paragraph'),
				answer: val.slice(0, 2000),
			});
		}

		const submissionId = `app_${crypto.randomBytes(4).toString('hex')}`;
		const userTag = memberState.userTag || String(session.user.name || userId);
		const userAvatar = memberState.userAvatar || (session.user.image ? String(session.user.image) : '');
		const isAnonymous = Boolean((position as any).anonymousResponses);

		const created = await SubmissionModel.create({
			id: submissionId,
			guild: id,
			positionId: appId,
			positionName: String((position as any).name || 'Application').slice(0, 80),
			userId,
			userTag,
			userAvatar,
			anonymous: isAnonymous,
			status: 'pending',
			answers: formattedAnswers,
			applicantMeta: {
				accountCreatedAt: memberState.accountCreatedAtMs ? new Date(memberState.accountCreatedAtMs) : null,
				guildJoinedAt: memberState.joinedAtMs ? new Date(memberState.joinedAtMs) : null,
				rolesSnapshot: Array.isArray(memberState.roles) ? memberState.roles.slice(0, 40) : [],
				priorSubmissionsCount: Number(priorUserCount) || 0,
			},
		});

		if (DraftModel) {
			await DraftModel.deleteOne({ id: `${id}:${userId}:${appId}` }).catch(() => null);
		}

		const maxSubs = Number((position as any).maxSubmissions) || 0;
		if (maxSubs > 0 && activeSubCount + 1 >= maxSubs) {
			await FormModel.updateOne({ id: appId, guild: id }, { $set: { state: 'closed' } }).catch(() => null);
			await syncGuildApplyPanels(id);
		}

		const plainSub = created?.toObject ? created.toObject() : created;

		const logResult = await postSubmissionToDiscordLogChannel({
			guildId: id,
			guildConfig: profile,
			position,
			submission: plainSub,
			sourceNote: 'Submitted on Web',
		});

		if (logResult.logChannelId || logResult.logMessageId || logResult.threadId || logResult.pollMessageId) {
			await SubmissionModel.updateOne(
				{ id: submissionId },
				{
					$set: {
						...(logResult.logChannelId ? { logChannelId: logResult.logChannelId } : {}),
						...(logResult.logMessageId ? { logMessageId: logResult.logMessageId } : {}),
						...(logResult.threadId ? { threadId: logResult.threadId } : {}),
						...(logResult.pollMessageId ? { pollMessageId: logResult.pollMessageId } : {}),
					},
				}
			).catch(() => null);
		}

		return NextResponse.json({ ok: true, submission: { id: plainSub.id, status: plainSub.status, positionId: plainSub.positionId } }, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
