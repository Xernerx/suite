import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const suggestions = await models.core.Suggestion.find().sort({ createdAt: -1 }).lean();
		return NextResponse.json({ data: suggestions });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
