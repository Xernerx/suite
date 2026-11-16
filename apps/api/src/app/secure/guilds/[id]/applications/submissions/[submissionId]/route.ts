/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { applySubmissionDecisionInDiscord } from '@/lib/yourappsDiscord';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; submissionId: string }> }) {
	try {
		const { id, submissionId } = await params;
		const body = await req.json();
		const decision = String(body?.status || '').toLowerCase();

		if (decision !== 'approved' && decision !== 'denied') {
			return NextResponse.json({ error: 'Decision status must be "approved" or "denied".' }, { status: 400 });
		}

		const session: any = await getServerSession(auth as any).catch(() => null);
		const reviewerId = String(session?.user?.id || body?.reviewedBy || '').trim() || 'dashboard';
		const reviewerTag = String(session?.user?.name || body?.reviewedByTag || '').trim();
		const reason = body?.reason ? String(body.reason).trim().slice(0, 1000) : null;

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

		const discordOutcome = await applySubmissionDecisionInDiscord({
			guildId: id,
			guildName,
			guildConfig,
			position,
			submission: existing,
			decision: decision as 'approved' | 'denied',
			reviewerId,
			reviewerTag,
			reason,
		});

		const updated = await SubmissionModel.findOneAndUpdate(
			{ id: submissionId, guild: id },
			{
				$set: {
					status: decision,
					reviewedBy: reviewerId,
					reviewedByTag: reviewerTag || null,
					reviewReason: reason,
					reviewedAt: new Date(),
					...(discordOutcome.archiveMessageId ? { archiveMessageId: discordOutcome.archiveMessageId } : {}),
				},
			},
			{ returnDocument: 'after' }
		).lean();

		return NextResponse.json({ ...updated, rolesApplied: discordOutcome.rolesApplied }, { status: 200 });
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
