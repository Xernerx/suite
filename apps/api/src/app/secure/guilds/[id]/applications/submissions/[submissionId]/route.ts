/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import {
	applyMemberRoleChanges,
	applySubmissionDecisionInDiscord,
	closeSubmissionInterviewInDiscord,
	fetchDiscordGuildMember,
	notifyClarificationRequestedInDiscord,
	notifyClarificationRespondedInDiscord,
	openSubmissionInterviewInDiscord,
	syncGuildApplyPanels,
	syncSubmissionLogMessageInDiscord,
} from '@/lib/yourappsDiscord';

async function isAuthorizedGuildReviewer(guildId: string, userId: string, guildConfig: any, position: any): Promise<boolean> {
	if (!userId) return false;
	const member = await fetchDiscordGuildMember(guildId, userId);
	if (!member.isMember) return false;
	if (member.isAdminOrManageGuild) return true;
	const adminRoles: string[] = Array.isArray(guildConfig?.adminRoles) ? guildConfig.adminRoles.map(String) : [];
	if (adminRoles.some((r) => member.roles.includes(r))) return true;
	const posReviewRoles: string[] = Array.isArray(position?.reviewRolesOverride) ? position.reviewRolesOverride.map(String).filter(Boolean) : [];
	const reviewRoles: string[] = posReviewRoles.length > 0 ? posReviewRoles : Array.isArray(guildConfig?.reviewRoles) ? guildConfig.reviewRoles.map(String) : [];
	return reviewRoles.some((r) => member.roles.includes(r));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; submissionId: string }> }) {
	try {
		const { id, submissionId } = await params;
		const body = await req.json().catch(() => ({}));
		const action = body?.action ? String(body.action).toLowerCase() : '';

		const session: any = await getServerSession(auth as any).catch(() => null);
		const actorId = String(session?.user?.id || '').trim();
		const actorTag = String(session?.user?.name || '').trim();

		if (!actorId) {
			return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
		}

		const db = await database('yourapps');
		const ProfileModel = (db.models.guilds as any)?.Profile;
		const FormModel = (db.models.guilds as any)?.Form;
		const SubmissionModel = (db.models.guilds as any)?.Submission;

		if (!SubmissionModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const existing: any = await SubmissionModel.findOne({ id: submissionId, guild: id }).lean();
		if (!existing) {
			return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
		}

		const [guildConfig, position, xDb] = await Promise.all([
			ProfileModel ? ProfileModel.findOne({ id }).lean() : null,
			FormModel ? FormModel.findOne({ id: existing.positionId, guild: id }).lean() : null,
			database('xernerx').catch(() => null),
		]);

		let guildName: string | undefined;
		if (xDb) {
			const XGuild = (xDb.models.guilds as any)?.Guild;
			const gDoc: any = XGuild
				? await XGuild.findOne({ id })
						.select('name')
						.lean()
						.catch(() => null)
				: null;
			if (gDoc?.name) guildName = String(gDoc.name);
		}

		// 1. Applicant Self-Service Actions (Withdraw / Respond to Clarification)
		if (action === 'withdraw') {
			if (String(existing.userId) !== actorId) {
				return NextResponse.json({ error: 'Only the applicant can withdraw this submission.' }, { status: 403 });
			}
			if (!['pending', 'needs_info', 'interview'].includes(String(existing.status))) {
				return NextResponse.json({ error: `Cannot withdraw a submission that is already ${existing.status}.` }, { status: 400 });
			}

			const pendingRoles: string[] = Array.isArray((position as any)?.pendingRoles) ? (position as any).pendingRoles.map(String).filter(Boolean) : [];
			if (pendingRoles.length > 0 && !existing.anonymous) {
				await applyMemberRoleChanges({ guildId: id, userId: actorId, removeRoles: pendingRoles }).catch(() => false);
			}
			if (existing.interviewChannelId) {
				await closeSubmissionInterviewInDiscord({
					channelId: String(existing.interviewChannelId),
					mode: existing.interviewMode,
					closedById: actorId,
				}).catch(() => null);
			}

			const updated: any = await SubmissionModel.findOneAndUpdate(
				{ id: submissionId, guild: id },
				{ $set: { status: 'withdrawn', interviewChannelId: null } },
				{ returnDocument: 'after' }
			).lean();

			await syncSubmissionLogMessageInDiscord({ guildId: id, position, submission: updated });
			return NextResponse.json({ ok: true, status: 'withdrawn' }, { status: 200 });
		}

		if (action === 'respond_info') {
			if (String(existing.userId) !== actorId) {
				return NextResponse.json({ error: 'Only the applicant can respond to this clarification.' }, { status: 403 });
			}
			const responseText = String(body?.response || '')
				.trim()
				.slice(0, 2000);
			if (!responseText) {
				return NextResponse.json({ error: 'Please enter a response.' }, { status: 400 });
			}

			const clarifications: any[] = Array.isArray(existing.clarifications) ? [...existing.clarifications] : [];
			for (let i = clarifications.length - 1; i >= 0; i--) {
				if (!clarifications[i].response) {
					clarifications[i] = {
						...clarifications[i],
						response: responseText,
						respondedAt: new Date(),
					};
					break;
				}
			}

			const updated: any = await SubmissionModel.findOneAndUpdate({ id: submissionId, guild: id }, { $set: { status: 'pending', clarifications } }, { returnDocument: 'after' }).lean();

			await notifyClarificationRespondedInDiscord({ guildId: id, submission: updated, response: responseText });
			return NextResponse.json({ ok: true, status: 'pending', clarifications: updated?.clarifications || clarifications }, { status: 200 });
		}

		// 2. All Remaining Actions Require Guild Reviewer / Admin Permission
		const canReview = await isAuthorizedGuildReviewer(id, actorId, guildConfig, position);
		if (!canReview) {
			return NextResponse.json({ error: 'You do not have permission to review submissions for this position.' }, { status: 403 });
		}

		const finalizeDecision = async (decision: 'approved' | 'denied', reason: string | null, reviewerOverrideId?: string, reviewerOverrideTag?: string) => {
			const revId = reviewerOverrideId || actorId;
			const revTag = reviewerOverrideTag ?? actorTag;

			const discordOutcome = await applySubmissionDecisionInDiscord({
				guildId: id,
				guildName,
				guildConfig,
				position,
				submission: existing,
				decision,
				reviewerId: revId,
				reviewerTag: revTag,
				reason,
			});

			const updated: any = await SubmissionModel.findOneAndUpdate(
				{ id: submissionId, guild: id },
				{
					$set: {
						status: decision,
						reviewedBy: revId,
						reviewedByTag: revTag || null,
						reviewReason: reason,
						reviewedAt: new Date(),
						interviewChannelId: null,
						...(discordOutcome.archiveMessageId ? { archiveMessageId: discordOutcome.archiveMessageId } : {}),
					},
				},
				{ returnDocument: 'after' }
			).lean();

			const maxApps = Number((position as any)?.maxApprovals) || 0;
			if (decision === 'approved' && FormModel && maxApps > 0 && (position as any)?.state === 'open') {
				const approvedTotal = await SubmissionModel.countDocuments({ guild: id, positionId: existing.positionId, status: 'approved' }).catch(() => 0);
				if (approvedTotal >= maxApps) {
					await FormModel.updateOne({ id: existing.positionId, guild: id }, { $set: { state: 'closed' } }).catch(() => null);
					await syncGuildApplyPanels(id);
				}
			}

			return { ...updated, rolesApplied: discordOutcome.rolesApplied };
		};

		if (action === 'vote') {
			if (!guildConfig?.selfReviewAllowed && String(existing.userId) === actorId) {
				return NextResponse.json({ error: 'Self-review is disabled: you cannot vote on your own application.' }, { status: 403 });
			}
			const dir = body?.vote === 'down' ? 'down' : 'up';
			const currentVotes: any[] = Array.isArray(existing.votes) ? [...existing.votes] : [];
			const idx = currentVotes.findIndex((v) => String(v.userId) === actorId);
			if (idx >= 0) {
				if (currentVotes[idx].vote === dir) currentVotes.splice(idx, 1);
				else currentVotes[idx] = { userId: actorId, userTag: actorTag, vote: dir, createdAt: new Date() };
			} else {
				currentVotes.push({ userId: actorId, userTag: actorTag, vote: dir, createdAt: new Date() });
			}

			let updated: any = await SubmissionModel.findOneAndUpdate({ id: submissionId, guild: id }, { $set: { votes: currentVotes } }, { returnDocument: 'after' }).lean();

			existing.votes = currentVotes;
			const upCount = currentVotes.filter((v) => v.vote === 'up').length;
			const downCount = currentVotes.filter((v) => v.vote === 'down').length;
			const netVotes = upCount - downCount;

			const autoApprove = Number((position as any)?.autoApproveVotes) || 0;
			const autoDeny = Number((position as any)?.autoDenyVotes) || 0;

			if (['pending', 'interview', 'needs_info'].includes(String(existing.status))) {
				if (autoApprove > 0 && netVotes >= autoApprove) {
					updated = await finalizeDecision('approved', `Auto-approved by staff consensus (+${netVotes} net votes).`, actorId, actorTag);
					return NextResponse.json(updated, { status: 200 });
				}
				if (autoDeny > 0 && downCount - upCount >= autoDeny) {
					updated = await finalizeDecision('denied', `Auto-denied by staff consensus (-${downCount - upCount} net votes).`, actorId, actorTag);
					return NextResponse.json(updated, { status: 200 });
				}
			}

			await syncSubmissionLogMessageInDiscord({ guildId: id, position, submission: updated });
			return NextResponse.json(updated, { status: 200 });
		}

		if (action === 'note') {
			const content = String(body?.content || '')
				.trim()
				.slice(0, 1000);
			if (!content) {
				return NextResponse.json({ error: 'Note content cannot be empty.' }, { status: 400 });
			}
			const noteEntry = {
				id: `note_${crypto.randomBytes(4).toString('hex')}`,
				authorId: actorId,
				authorTag: actorTag,
				content,
				createdAt: new Date(),
			};
			const updated = await SubmissionModel.findOneAndUpdate(
				{ id: submissionId, guild: id },
				{ $push: { internalNotes: { $each: [noteEntry], $slice: -50 } } },
				{ returnDocument: 'after' }
			).lean();

			await syncSubmissionLogMessageInDiscord({ guildId: id, position, submission: updated });
			return NextResponse.json(updated, { status: 200 });
		}

		if (action === 'request_info') {
			if (existing.anonymous) {
				return NextResponse.json({ error: 'Clarifications cannot be requested on anonymous submissions.' }, { status: 400 });
			}
			const prompt = String(body?.prompt || '')
				.trim()
				.slice(0, 1000);
			if (!prompt) {
				return NextResponse.json({ error: 'Enter the follow-up question to send to the applicant.' }, { status: 400 });
			}
			const clarEntry = {
				id: `clar_${crypto.randomBytes(4).toString('hex')}`,
				prompt,
				requestedBy: actorId,
				requestedByTag: actorTag,
				requestedAt: new Date(),
				response: null,
				respondedAt: null,
			};
			const updated = await SubmissionModel.findOneAndUpdate(
				{ id: submissionId, guild: id },
				{
					$set: { status: 'needs_info' },
					$push: { clarifications: { $each: [clarEntry], $slice: -20 } },
				},
				{ returnDocument: 'after' }
			).lean();

			await notifyClarificationRequestedInDiscord({ guildId: id, guildName, guildConfig, submission: updated, prompt });
			return NextResponse.json(updated, { status: 200 });
		}

		if (action === 'open_interview') {
			const opened = await openSubmissionInterviewInDiscord({
				guildId: id,
				guildConfig,
				position,
				submission: existing,
				openedById: actorId,
			});
			if (!opened.ok || !opened.channelId) {
				return NextResponse.json({ error: opened.error || 'Could not open interview room in Discord.' }, { status: 400 });
			}

			const updated = await SubmissionModel.findOneAndUpdate(
				{ id: submissionId, guild: id },
				{
					$set: {
						status: 'interview',
						interviewChannelId: opened.channelId,
						interviewMode: opened.mode || 'thread',
					},
				},
				{ returnDocument: 'after' }
			).lean();

			await syncSubmissionLogMessageInDiscord({ guildId: id, position, submission: updated });
			return NextResponse.json(updated, { status: 200 });
		}

		if (action === 'close_interview') {
			if (existing.interviewChannelId) {
				await closeSubmissionInterviewInDiscord({
					channelId: String(existing.interviewChannelId),
					mode: existing.interviewMode,
					closedById: actorId,
				});
			}
			const nextStatus = existing.status === 'interview' ? 'pending' : existing.status;
			const updated = await SubmissionModel.findOneAndUpdate({ id: submissionId, guild: id }, { $set: { status: nextStatus, interviewChannelId: null } }, { returnDocument: 'after' }).lean();

			await syncSubmissionLogMessageInDiscord({ guildId: id, position, submission: updated });
			return NextResponse.json(updated, { status: 200 });
		}

		// 3. Final Approve / Deny Decision
		const decision = String(body?.status || '').toLowerCase();
		if (decision !== 'approved' && decision !== 'denied') {
			return NextResponse.json({ error: 'Decision status must be "approved" or "denied".' }, { status: 400 });
		}

		if (!guildConfig?.selfReviewAllowed && String(existing.userId) === actorId) {
			return NextResponse.json({ error: 'Self-review is disabled: another reviewer must decide on your application.' }, { status: 403 });
		}

		const minVotes = Number((position as any)?.minVotesToApprove) || 0;
		if (decision === 'approved' && minVotes > 0) {
			const upVotes = (Array.isArray(existing.votes) ? existing.votes : []).filter((v: any) => v.vote === 'up').length;
			if (upVotes < minVotes) {
				return NextResponse.json({ error: `This position requires at least ${minVotes} staff upvote${minVotes === 1 ? '' : 's'} before approval (currently ${upVotes}).` }, { status: 400 });
			}
		}

		const reason = body?.reason ? String(body.reason).trim().slice(0, 1000) : null;
		const finalized = await finalizeDecision(decision as 'approved' | 'denied', reason);
		return NextResponse.json(finalized, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; submissionId: string }> }) {
	try {
		const { id, submissionId } = await params;
		const db = await database('yourapps');
		const SubmissionModel = (db.models.guilds as any)?.Submission;
		if (!SubmissionModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const deleted = await SubmissionModel.findOneAndDelete({ id: submissionId, guild: id }).lean();
		if (!deleted) {
			return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
		}

		return NextResponse.json({ success: true, id: submissionId }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
