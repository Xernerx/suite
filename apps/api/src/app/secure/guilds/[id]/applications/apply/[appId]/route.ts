/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { checkWebApplicantEligibility, fetchDiscordGuildMember, fetchYourAppsGuildState, postSubmissionToDiscordLogChannel } from '@/lib/yourappsDiscord';

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

		const [profile, position, xernerxGuild, latestSub, draft] = await Promise.all([
			ProfileModel ? ProfileModel.findOne({ id }).lean() : null,
			FormModel ? FormModel.findOne({ id: appId, guild: id }).lean() : null,
			XernerxGuildModel
				? XernerxGuildModel.findOne({ id })
						.select('id name icon banner description verified')
						.lean()
						.catch(() => null)
				: null,
			userId && SubmissionModel ? SubmissionModel.findOne({ guild: id, positionId: appId, userId }).sort({ createdAt: -1 }).lean() : null,
			userId && DraftModel ? DraftModel.findOne({ id: `${id}:${userId}:${appId}` }).lean() : null,
		]);

		const serverName = (xernerxGuild as any)?.name || guildState.guildName || 'Discord Server';
		const serverIcon = (xernerxGuild as any)?.icon || guildState.guildIconUrl || null;
		const serverBanner = (xernerxGuild as any)?.banner || null;

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
					})
				: null;

		const serverRoles = guildState.serverRoles.length > 0 ? guildState.serverRoles : Array.isArray((profile as any).serverRoles) ? (profile as any).serverRoles : [];
		const serverChannels = guildState.serverChannels.length > 0 ? guildState.serverChannels : Array.isArray((profile as any).serverChannels) ? (profile as any).serverChannels : [];

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
					questions: Array.isArray((position as any).questions) ? (position as any).questions : [],
					cooldown: Number((position as any).cooldown) || 0,
					minimumJoinTime: Number((position as any).minimumJoinTime) || 0,
					requiredRoles: Array.isArray((position as any).requiredRoles) ? (position as any).requiredRoles : [],
				},
				draftAnswers: Array.isArray((draft as any)?.answers) ? (draft as any).answers : [],
				latestSubmission: latestSub || null,
				serverRoles,
				serverChannels,
			},
			{ status: 200 }
		);
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

		const [profile, position, latestSub] = await Promise.all([
			ProfileModel.findOne({ id }).lean(),
			FormModel.findOne({ id: appId, guild: id }).lean(),
			SubmissionModel.findOne({ guild: id, positionId: appId, userId }).sort({ createdAt: -1 }).lean(),
		]);

		if (!profile || !position) {
			return NextResponse.json({ error: 'Application position not found.' }, { status: 404 });
		}

		const eligibility = checkWebApplicantEligibility({
			member: memberState,
			guildConfig: profile,
			position,
			latestSubmission: latestSub,
		});
		if (!eligibility.ok) {
			return NextResponse.json({ error: eligibility.reason }, { status: 403 });
		}

		const questions: any[] = Array.isArray((position as any).questions) ? (position as any).questions : [];
		const formattedAnswers: Array<{ questionId: string; question: string; type: string; answer: string }> = [];

		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			const qId = String(q.id);
			const val = String(rawAnswers[qId] ?? '').trim();

			if (q.required !== false && (!val || (q.type === 'checkbox' && val !== 'Yes'))) {
				return NextResponse.json(
					{
						error: q.type === 'checkbox' ? `Question #${i + 1} ("${q.question}") must be checked.` : `Question #${i + 1} ("${q.question}") is required.`,
					},
					{ status: 400 }
				);
			}

			if (val && q.type === 'number' && Number.isNaN(Number(val))) {
				return NextResponse.json({ error: `Question #${i + 1} ("${q.question}") expects a valid number.` }, { status: 400 });
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

		const created = await SubmissionModel.create({
			id: submissionId,
			guild: id,
			positionId: appId,
			positionName: String((position as any).name || 'Application').slice(0, 80),
			userId,
			userTag,
			userAvatar,
			status: 'pending',
			answers: formattedAnswers,
		});

		if (DraftModel) {
			await DraftModel.deleteOne({ id: `${id}:${userId}:${appId}` }).catch(() => null);
		}

		const plainSub = created?.toObject ? created.toObject() : created;

		const logResult = await postSubmissionToDiscordLogChannel({
			guildId: id,
			guildConfig: profile,
			position,
			submission: plainSub,
		});

		if (logResult.logChannelId && logResult.logMessageId) {
			await SubmissionModel.updateOne(
				{ id: submissionId },
				{
					$set: {
						logChannelId: logResult.logChannelId,
						logMessageId: logResult.logMessageId,
						...(logResult.threadId ? { threadId: logResult.threadId } : {}),
					},
				}
			).catch(() => null);
		}

		return NextResponse.json({ ok: true, submission: plainSub }, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
