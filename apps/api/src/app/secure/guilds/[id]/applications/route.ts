/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { decodeYourAppsApplicationId, fetchYourAppsGuildState } from '@/lib/yourappsDiscord';

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

		// Bot presence is determined strictly by existence in guilds.profiles
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

		const [positions, pendingCount, approvedCount, deniedCount, totalCount] = await Promise.all([
			FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean(),
			SubmissionModel.countDocuments({ guild: id, status: 'pending' }),
			SubmissionModel.countDocuments({ guild: id, status: 'approved' }),
			SubmissionModel.countDocuments({ guild: id, status: 'denied' }),
			SubmissionModel.countDocuments({ guild: id }),
		]);

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
					approved: approvedCount,
					denied: deniedCount,
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

		const existing = await ProfileModel.findOne({ id }).select('id').lean();
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

		const updated = await ProfileModel.findOneAndUpdate({ id }, { $set: updateData }, { returnDocument: 'after', runValidators: true }).lean();
		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
