/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { checkWebApplicantEligibility, fetchDiscordGuildMember, fetchYourAppsGuildState, syncGuildApplyPanels } from '@/lib/yourappsDiscord';
import { reconcileScheduledGuildPositions } from '@/lib/yourappsSanitize';

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

		if (FormModel) {
			const changed = await reconcileScheduledGuildPositions(FormModel, id);
			if (changed) await syncGuildApplyPanels(id);
		}

		const [profile, positions, xernerxGuild, rawMySubmissions, perPosCounts] = await Promise.all([
			ProfileModel ? ProfileModel.findOne({ id }).lean() : null,
			FormModel ? FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean() : [],
			XernerxGuildModel
				? XernerxGuildModel.findOne({ id })
						.select('id name icon banner description verified privacy owner ownerId')
						.lean()
						.catch(() => null)
				: null,
			userId && SubmissionModel ? SubmissionModel.find({ guild: id, userId }).sort({ createdAt: -1 }).limit(25).lean() : [],
			SubmissionModel
				? SubmissionModel.aggregate([
						{ $match: { guild: id } },
						{
							$group: {
								_id: '$positionId',
								activeCount: { $sum: { $cond: [{ $ne: ['$status', 'withdrawn'] }, 1, 0] } },
								approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
							},
						},
					]).catch(() => [])
				: [],
		]);

		const serverName = (xernerxGuild as any)?.name || guildState.guildName || 'Discord Server';
		const serverIcon = (xernerxGuild as any)?.icon || guildState.guildIconUrl || null;
		const serverBanner = (xernerxGuild as any)?.banner || null;

		const isPrivateGuild = (xernerxGuild as any)?.privacy === 'private';
		const isGuildOwner = Boolean(userId && ((xernerxGuild as any)?.owner === userId || (xernerxGuild as any)?.ownerId === userId));
		if (isPrivateGuild && !(userId && (memberState?.isMember || isGuildOwner))) {
			return NextResponse.json(
				{
					error: 'This server is private.',
					privateServer: true,
					authenticated: Boolean(userId),
					isMember: false,
				},
				{ status: 403 }
			);
		}

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

		const countMap = new Map<string, { activeCount: number; approvedCount: number }>();
		for (const row of perPosCounts || []) {
			if (row?._id) {
				countMap.set(String(row._id), {
					activeCount: Number(row.activeCount) || 0,
					approvedCount: Number(row.approvedCount) || 0,
				});
			}
		}

		const latestByPosition = new Map<string, any>();
		for (const sub of rawMySubmissions || []) {
			const pid = String((sub as any).positionId || '');
			if (pid && !latestByPosition.has(pid)) {
				latestByPosition.set(pid, sub);
			}
		}

		const enrichedPositions = (positions || []).map((pos: any) => {
			const counts = countMap.get(String(pos.id)) || { activeCount: 0, approvedCount: 0 };
			const eligibility =
				userId && memberState
					? checkWebApplicantEligibility({
							member: memberState,
							guildConfig: profile,
							position: pos,
							latestSubmission: latestByPosition.get(String(pos.id)) || null,
							activeSubmissionCount: counts.activeCount,
							approvedSubmissionCount: counts.approvedCount,
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
				minimumAccountAge: Number(pos.minimumAccountAge) || 0,
				opensAt: pos.opensAt || null,
				closesAt: pos.closesAt || null,
				maxSubmissions: Number(pos.maxSubmissions) || 0,
				maxApprovals: Number(pos.maxApprovals) || 0,
				submissionsCount: counts.activeCount,
				approvalsCount: counts.approvedCount,
				anonymousResponses: Boolean(pos.anonymousResponses),
				requiredRoles: Array.isArray(pos.requiredRoles) ? pos.requiredRoles : [],
				eligible: eligibility ? eligibility.ok : pos.state === 'open',
				ineligibleReason: eligibility && !eligibility.ok ? eligibility.reason : null,
			};
		});

		const safeMySubmissions = (rawMySubmissions || []).map((sub: any) => ({
			id: sub.id,
			positionId: sub.positionId,
			positionName: sub.positionName,
			status: sub.status,
			reviewReason: sub.reviewReason || null,
			interviewChannelId: sub.interviewChannelId || null,
			clarifications: Array.isArray(sub.clarifications) ? sub.clarifications : [],
			createdAt: sub.createdAt,
			reviewedAt: sub.reviewedAt || null,
		}));

		return NextResponse.json(
			{
				id,
				botPresent: true,
				server: { id, name: serverName, icon: serverIcon, banner: serverBanner },
				authenticated: Boolean(userId),
				isMember: Boolean(memberState?.isMember),
				positions: enrichedPositions,
				mySubmissions: safeMySubmissions,
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
