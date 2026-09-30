import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');

		// If query has 'all=true' and the user is an admin, return all issues including unacknowledged
		const url = new URL(req.url);
		const fetchAll = url.searchParams.get('all') === 'true';

		let filter: any = { acknowledged: true };

		if (fetchAll) {
			// Check admin auth
			const session = (await getServerSession(auth)) as any;
			if (session?.user?.id) {
				const user = await models.users.User.findOne({ id: session.user.id });
				if (user && user.roles?.includes('admin')) {
					filter = {}; // Return all issues to admins
				}
			}
		}

		const issues = await models.core.Issue.find(filter).sort({ createdAt: -1 }).lean();
		return NextResponse.json({ data: issues });
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

		if (!body.title?.trim() || !body.description?.trim() || !body.productId) {
			return NextResponse.json({ error: 'Title, description, and product are required' }, { status: 400 });
		}

		const { models } = await database('xernerx');

		// Prevent duplicates
		const existing = await models.core.Issue.findOne({ title: body.title });
		if (existing) {
			return NextResponse.json({ error: 'A bug report with this title already exists' }, { status: 409 });
		}

		const issue = await models.core.Issue.create({
			id: crypto.randomUUID(),
			title: body.title,
			description: body.description,
			productId: body.productId,
			status: 'open',
			acknowledged: false, // Default to unacknowledged for admin review
		});

		return NextResponse.json({ data: issue });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
