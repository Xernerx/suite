import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import crypto from 'crypto';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const organizationId = url.searchParams.get('organizationId');

		const { models } = await database('xernerx');
		const Application = models.dispatch.Application as any;

		let query: any = {};
		if (organizationId) {
			query = { 'data.metadata.organizationId': organizationId };
		}

		const applications = await Application.find(query).sort({ createdAt: -1 }).lean();

		// Flatten the `data` property so the frontend gets what it expects
		const formattedApps = applications.map((app: any) => ({
			...app,
			...(app.data || {}),
		}));

		return NextResponse.json(formattedApps);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Application = models.dispatch.Application as any;

		const newApplication = await Application.create({
			id: crypto.randomUUID(),
			ownerId: body.ownerId || body.userId || 'anonymous',
			targetId: body.targetId || body.metadata?.organizationId || 'unknown',
			status: 'pending',
			data: {
				userId: body.userId,
				type: body.type,
				metadata: body.metadata || {},
				...body.data,
			},
		});

		// Flatten for response
		const responseApp = {
			...newApplication.toObject(),
			...newApplication.data,
		};

		return NextResponse.json(responseApp, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
