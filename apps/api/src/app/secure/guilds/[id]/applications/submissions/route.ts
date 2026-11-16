/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const status = url.searchParams.get('status') || '';
		const positionId = url.searchParams.get('positionId') || '';
		const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100));

		const db = await database('yourapps');
		const SubmissionModel = (db.models.guilds as any)?.Submission;
		if (!SubmissionModel) {
			return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });
		}

		const query: Record<string, any> = { guild: id };
		if (status && ['pending', 'approved', 'denied', 'withdrawn'].includes(status)) {
			query.status = status;
		}
		if (positionId) {
			query.positionId = positionId;
		}

		const [items, pending, approved, denied, total] = await Promise.all([
			SubmissionModel.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
			SubmissionModel.countDocuments({ guild: id, status: 'pending' }),
			SubmissionModel.countDocuments({ guild: id, status: 'approved' }),
			SubmissionModel.countDocuments({ guild: id, status: 'denied' }),
			SubmissionModel.countDocuments({ guild: id }),
		]);

		return NextResponse.json(
			{
				items,
				counts: { pending, approved, denied, total },
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
