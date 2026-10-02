import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const issues = await models.core.Issue.find({ status: 'resolved' }).sort({ resolvedAt: -1 }).limit(10).lean();

		let totalMs = 0;
		let count = 0;
		for (const issue of issues) {
			if (issue.createdAt && issue.resolvedAt) {
				totalMs += new Date(issue.resolvedAt).getTime() - new Date(issue.createdAt).getTime();
				count++;
			}
		}

		const avgTimeMs = count > 0 ? totalMs / count : 0;

		return NextResponse.json({ data: { avgTimeMs, recentResolutions: issues } });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
