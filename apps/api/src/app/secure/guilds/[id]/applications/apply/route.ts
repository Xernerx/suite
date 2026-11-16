/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { checkWebApplicantEligibility, fetchDiscordGuildMember, fetchYourAppsGuildState } from '@/lib/yourappsDiscord';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
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
		const XernerxGuildModel = (xernerxDb?.models?.guilds as any)?.Guild;

		const [profile, positions, xernerxGuild, mySubmissions] = await Promise.all([
			ProfileModel ? ProfileModel.findOne({ id }).lean() : null,
			FormModel ? FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean() : [],
			XernerxGuildModel
				? XernerxGuildModel.findOne({ id })
						.select('id name icon banner description verified')
						.lean()
						.catch(() => null)
				: null,
			userId && SubmissionModel ? SubmissionModel.find({ guild: id, userId }).sort({ createdAt: -1 }).limit(25).lean() : [],
		]);

		const serverName = (xernerxGuild as any)?.name || guildState.guildName || 'Discord Server';
		const serverIcon = (xernerxGuild as any)?.icon || guildState.guildIconUrl || null;
		const serverBanner = (xernerxGuild as any)?.banner || null;

		if (!profile) {
			return NextResponse.json(
				{
					id,
					botPresent: false,
					server: { id, name: serverName, icon: serverIcon, banner: serverBanner },
					authenticated: Boolean(userId),
					isMember: Boolean(memberState?.isMember),
					positions: [],
					mySubmissions: [],
				},
				{ status: 200 }
			);
		}

		const latestByPosition = new Map<string, any>();
		for (const sub of mySubmissions || []) {
			const pid = String((sub as any).positionId || '');
			if (pid && !latestByPosition.has(pid)) {
				latestByPosition.set(pid, sub);
			}
		}

		const enrichedPositions = (positions || []).map((pos: any) => {
			const eligibility =
				userId && memberState
					? checkWebApplicantEligibility({
							member: memberState,
							guildConfig: profile,
							position: pos,
							latestSubmission: latestByPosition.get(String(pos.id)) || null,
						})
					: null;

			return {
				id: pos.id,
				name: pos.name,
				description: pos.description || '',
				category: pos.category || 'staff',
				state: pos.state || 'open',
				questionsCount: Array.isArray(pos.questions) ? pos.questions.length : 0,
				cooldown: Number(pos.cooldown) || 0,
				minimumJoinTime: Number(pos.minimumJoinTime) || 0,
				requiredRoles: Array.isArray(pos.requiredRoles) ? pos.requiredRoles : [],
				eligible: eligibility ? eligibility.ok : pos.state === 'open',
				ineligibleReason: eligibility && !eligibility.ok ? eligibility.reason : null,
			};
		});

		return NextResponse.json(
			{
				id,
				botPresent: true,
				server: { id, name: serverName, icon: serverIcon, banner: serverBanner },
				authenticated: Boolean(userId),
				isMember: Boolean(memberState?.isMember),
				positions: enrichedPositions,
				mySubmissions: mySubmissions || [],
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
