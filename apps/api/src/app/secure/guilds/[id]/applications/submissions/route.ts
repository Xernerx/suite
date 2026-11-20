/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

const VALID_STATUSES = ['pending', 'interview', 'needs_info', 'approved', 'denied', 'withdrawn'];

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
		if (status && VALID_STATUSES.includes(status)) {
			query.status = status;
		}
		if (positionId) {
			query.positionId = positionId;
		}

		const [rawItems, pending, interview, needsInfo, approved, denied, withdrawn, total] = await Promise.all([
			SubmissionModel.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
			SubmissionModel.countDocuments({ guild: id, status: 'pending' }),
			SubmissionModel.countDocuments({ guild: id, status: 'interview' }),
			SubmissionModel.countDocuments({ guild: id, status: 'needs_info' }),
			SubmissionModel.countDocuments({ guild: id, status: 'approved' }),
			SubmissionModel.countDocuments({ guild: id, status: 'denied' }),
			SubmissionModel.countDocuments({ guild: id, status: 'withdrawn' }),
			SubmissionModel.countDocuments({ guild: id }),
		]);

		const items = (rawItems || []).map((item: any) => {
			if (item.anonymous) {
				return {
					...item,
					userId: 'anonymous',
					userTag: 'Anonymous Respondent',
					userAvatar: '',
				};
			}
			return item;
		});

		return NextResponse.json(
			{
				items,
				counts: { pending, interview, needsInfo, approved, denied, withdrawn, total },
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
