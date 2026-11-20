/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { handleDeleteYourAppsGuildSetup } from '@/lib/guildSetupDeleteAuth';
import { decodeYourAppsApplicationId, deleteDiscordMessage, fetchYourAppsGuildState, syncGuildApplyPanels } from '@/lib/yourappsDiscord';
import { reconcileScheduledGuildPositions } from '@/lib/yourappsSanitize';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('yourapps');
		const ProfileModel = (db.models.guilds as any)?.Profile;
		const FormModel = (db.models.guilds as any)?.Form;
		const SubmissionModel = (db.models.guilds as any)?.Submission;

		if (!ProfileModel || !FormModel || !SubmissionModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const applicationId = decodeYourAppsApplicationId();
		const profile: any = await ProfileModel.findOne({ id }).lean();

		if (!profile) {
			return NextResponse.json(
				{
					error: 'YourApps guild setup profile not found',
					found: false,
					botPresent: false,
					applicationId,
				},
				{ status: 404 }
			);
		}

		const scheduleChanged = await reconcileScheduledGuildPositions(FormModel, id);
		if (scheduleChanged) {
			await syncGuildApplyPanels(id);
		}

		const discordState = await fetchYourAppsGuildState(id);
		if (discordState.serverRoles.length > 0 || discordState.serverChannels.length > 0) {
			const updateFields: Record<string, any> = {};
			if (discordState.serverRoles.length > 0) {
				profile.serverRoles = discordState.serverRoles;
				updateFields.serverRoles = discordState.serverRoles;
			}
			if (discordState.serverChannels.length > 0) {
				profile.serverChannels = discordState.serverChannels;
				updateFields.serverChannels = discordState.serverChannels;
			}
			await ProfileModel.updateOne({ id }, { $set: updateFields }).catch(() => null);
		}

		const [rawPositions, pendingCount, interviewCount, needsInfoCount, approvedCount, deniedCount, withdrawnCount, totalCount, perPosCounts] = await Promise.all([
			FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean(),
			SubmissionModel.countDocuments({ guild: id, status: 'pending' }),
			SubmissionModel.countDocuments({ guild: id, status: 'interview' }),
			SubmissionModel.countDocuments({ guild: id, status: 'needs_info' }),
			SubmissionModel.countDocuments({ guild: id, status: 'approved' }),
			SubmissionModel.countDocuments({ guild: id, status: 'denied' }),
			SubmissionModel.countDocuments({ guild: id, status: 'withdrawn' }),
			SubmissionModel.countDocuments({ guild: id }),
			SubmissionModel.aggregate([
				{ $match: { guild: id } },
				{
					$group: {
						_id: '$positionId',
						activeCount: { $sum: { $cond: [{ $ne: ['$status', 'withdrawn'] }, 1, 0] } },
						approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
					},
				},
			]).catch(() => []),
		]);

		const countMap = new Map<string, { activeCount: number; approvedCount: number }>();
		for (const row of perPosCounts || []) {
			if (row?._id) {
				countMap.set(String(row._id), {
					activeCount: Number(row.activeCount) || 0,
					approvedCount: Number(row.approvedCount) || 0,
				});
			}
		}

		const positions = (rawPositions || []).map((pos: any) => {
			const c = countMap.get(String(pos.id)) || { activeCount: 0, approvedCount: 0 };
			return {
				...pos,
				submissionsCount: c.activeCount,
				approvalsCount: c.approvedCount,
			};
		});

		// If `panelChannel` is configured on the server profile and positions exist, ensure a live panel message is deployed in that channel
		const primaryCh = profile.panelChannel ? String(profile.panelChannel).trim() : '';
		const currentPanels: any[] = Array.isArray(profile.panels) ? profile.panels : [];
		if (primaryCh && positions.length > 0 && !currentPanels.some((p: any) => String(p?.channelId) === primaryCh)) {
			await syncGuildApplyPanels(id);
			const refreshedPanels: any = await ProfileModel.findOne({ id })
				.select('panels')
				.lean()
				.catch(() => null);
			if (refreshedPanels && Array.isArray(refreshedPanels.panels)) {
				profile.panels = refreshedPanels.panels;
			}
		}

		return NextResponse.json(
			{
				...profile,
				found: true,
				botPresent: true,
				applicationId,
				positions,
				stats: {
					positionsTotal: positions.length,
					positionsOpen: positions.filter((p: any) => p.state === 'open').length,
					submissionsTotal: totalCount,
					pending: pendingCount,
					interview: interviewCount,
					needsInfo: needsInfoCount,
					approved: approvedCount,
					denied: deniedCount,
					withdrawn: withdrawnCount,
				},
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const ProfileModel = (db.models.guilds as any)?.Profile;

		if (!ProfileModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const existing: any = await ProfileModel.findOne({ id }).select('id panelChannel panels').lean();
		if (!existing) {
			return NextResponse.json({ error: 'YourApps guild setup profile not found', found: false }, { status: 404 });
		}

		const sanitizeIds = (val: unknown): string[] => (Array.isArray(val) ? Array.from(new Set(val.map((x) => String(x || '').trim()).filter(Boolean))).slice(0, 50) : []);

		const updateData: Record<string, any> = {};
		if (body.logChannel !== undefined) updateData.logChannel = body.logChannel ? String(body.logChannel).trim() : null;
		if (body.archiveChannel !== undefined) updateData.archiveChannel = body.archiveChannel ? String(body.archiveChannel).trim() : null;
		if (body.panelChannel !== undefined) updateData.panelChannel = body.panelChannel ? String(body.panelChannel).trim() : null;
		if (body.submissionPings !== undefined) updateData.submissionPings = sanitizeIds(body.submissionPings);
		if (body.adminRoles !== undefined) updateData.adminRoles = sanitizeIds(body.adminRoles);
		if (body.reviewRoles !== undefined) updateData.reviewRoles = sanitizeIds(body.reviewRoles);
		if (body.blacklistRoles !== undefined) updateData.blacklistRoles = sanitizeIds(body.blacklistRoles);
		if (body.dmNotifications !== undefined) updateData.dmNotifications = Boolean(body.dmNotifications);
		if (body.threadPerSubmission !== undefined) updateData.threadPerSubmission = Boolean(body.threadPerSubmission);
		if (body.selfReviewAllowed !== undefined) updateData.selfReviewAllowed = Boolean(body.selfReviewAllowed);
		if (body.pollOnSubmission !== undefined) updateData.pollOnSubmission = Boolean(body.pollOnSubmission);
		if (body.pollDurationHours !== undefined) updateData.pollDurationHours = Math.max(1, Math.min(168, Math.round(Number(body.pollDurationHours) || 48)));
		if (body.interviewMode !== undefined) updateData.interviewMode = body.interviewMode === 'channel' ? 'channel' : 'thread';
		if (body.interviewCategoryId !== undefined) updateData.interviewCategoryId = body.interviewCategoryId ? String(body.interviewCategoryId).trim() : null;

		const prevPanelChannel = existing.panelChannel ? String(existing.panelChannel).trim() : null;
		const nextPanelChannel = body.panelChannel !== undefined ? updateData.panelChannel : prevPanelChannel;

		// When the admin changes or disables `panelChannel` in Settings & Channels, clean up the old primary panel message first
		if (body.panelChannel !== undefined && prevPanelChannel && prevPanelChannel !== nextPanelChannel) {
			const existingPanels: any[] = Array.isArray(existing.panels) ? [...existing.panels] : [];
			const remainingPanels: any[] = [];
			for (const pnl of existingPanels) {
				const isOldPrimary = String(pnl?.channelId) === prevPanelChannel && (!Array.isArray(pnl?.positionIds) || pnl.positionIds.length === 0);
				if (isOldPrimary) {
					await deleteDiscordMessage(String(pnl.channelId), String(pnl.messageId));
				} else {
					remainingPanels.push(pnl);
				}
			}
			updateData.panels = remainingPanels;
		}

		let updated: any = await ProfileModel.findOneAndUpdate({ id }, { $set: updateData }, { returnDocument: 'after', runValidators: true }).lean();
		let panelError: string | undefined;

		if (nextPanelChannel) {
			const syncRes = await syncGuildApplyPanels(id);
			if (!syncRes.ok && syncRes.error) {
				panelError = syncRes.error;
			}
			const refreshed = await ProfileModel.findOne({ id })
				.lean()
				.catch(() => null);
			if (refreshed) updated = refreshed;
		}

		return NextResponse.json(panelError ? { ...updated, panelError } : updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		return await handleDeleteYourAppsGuildSetup(req, id);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}
