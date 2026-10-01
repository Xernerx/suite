import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const userId = session.user.id;
		const { id } = await params;

		let body;
		try {
			body = await req.json();
		} catch (e) {
			body = {};
		}
		const action = body.action || 'upvote'; // default to upvote for backwards compatibility

		const { models } = await database('xernerx');
		const suggestion = await models.core.Suggestion.findOne({ id });
		if (!suggestion) return NextResponse.json({ error: 'Not found' }, { status: 404 });

		// Ensure arrays exist
		if (!suggestion.upvotes) suggestion.upvotes = [];
		if (!suggestion.downvotes) suggestion.downvotes = [];

		if (action === 'upvote') {
			// Remove downvote if exists
			suggestion.downvotes = suggestion.downvotes.filter((u: string) => u !== userId);

			// Toggle upvote
			if (suggestion.upvotes.includes(userId)) {
				suggestion.upvotes = suggestion.upvotes.filter((u: string) => u !== userId);
			} else {
				suggestion.upvotes.push(userId);
			}
		} else if (action === 'downvote') {
			// Remove upvote if exists
			suggestion.upvotes = suggestion.upvotes.filter((u: string) => u !== userId);

			// Toggle downvote
			if (suggestion.downvotes.includes(userId)) {
				suggestion.downvotes = suggestion.downvotes.filter((u: string) => u !== userId);
			} else {
				suggestion.downvotes.push(userId);
			}
		}

		await suggestion.save();
		return NextResponse.json({ data: suggestion });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
