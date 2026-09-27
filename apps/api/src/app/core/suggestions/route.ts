import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const suggestions = await models.core.Suggestion.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
		return NextResponse.json({ data: suggestions });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { models } = await database('xernerx');

		// Prevent duplicates
		const existing = await models.core.Suggestion.findOne({ title: body.title });
		if (existing) {
			return NextResponse.json({ error: 'A suggestion with this title already exists' }, { status: 409 });
		}

		const suggestion = await models.core.Suggestion.create({
			id: crypto.randomUUID(),
			...body,
			authorId: session.user.id,
			status: 'pending',
			upvotes: [session.user.id],
		});
		return NextResponse.json({ data: suggestion });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
