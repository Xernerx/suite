/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['users']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		if (!isStaffOrSystem && caller.userId !== id) {
			return NextResponse.json({ error: 'Forbidden: You can only delete your own YourApps data.' }, { status: 403 });
		}

		const db = await database('yourapps');
		const SubmissionModel = (db.models.guilds as any)?.Submission;
		const DraftModel = (db.models.guilds as any)?.Draft;

		const modelsToDelete = [SubmissionModel, DraftModel].filter(Boolean);
		const results = await Promise.all(modelsToDelete.map((m: any) => m.deleteMany({ userId: id }).catch(() => ({ deletedCount: 0 }))));
		const deletedCount = results.reduce((sum, r: any) => sum + (Number(r?.deletedCount) || 0), 0);

		await recordAuditLog(req, {
			action: 'user.yourapps.delete',
			targetType: 'user',
			targetId: id,
			summary: `Deleted YourApps application submissions and drafts for user "${id}"`,
			metadata: {
				deletedDocuments: deletedCount,
			},
		});

		return NextResponse.json({ success: true, deletedCount }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
	}
}
