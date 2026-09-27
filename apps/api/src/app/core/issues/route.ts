import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const issues = await models.core.Issue.find().sort({ createdAt: -1 }).lean();
		return NextResponse.json({ data: issues });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
