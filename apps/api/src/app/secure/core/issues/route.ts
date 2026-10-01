import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const items = await models.core.Issue.find().sort({ createdAt: -1 }).lean();
		return NextResponse.json({ data: items });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const item = await models.core.Issue.create({
			id: crypto.randomUUID(),
			...body,
		});
		return NextResponse.json({ data: item });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
