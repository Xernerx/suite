/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database, sendWebhook } from '@xernerx/lib/server';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const targetId = searchParams.get('targetId');
		const senderId = searchParams.get('senderId');
		const category = searchParams.get('category');
		const type = searchParams.get('type');
		const status = searchParams.get('status');

		const { models } = await database('xernerx');
		const Dispatch = models.dispatch.Invite as any;

		let query: any = {};
		if (targetId) {
			query.$or = [{ targetId: targetId }, { targetId: 'global' }];
		}
		if (senderId) query.senderId = senderId;
		if (category) query.category = category;
		if (type) query.type = type;
		if (status) query.status = status;

		const dispatchItems = await Dispatch.find(query).sort({ createdAt: -1 }).lean();

		return NextResponse.json(dispatchItems);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Dispatch = models.dispatch.Invite as any;

		if (body.category === 'application') {
			return NextResponse.json({ error: 'Applications must use the /secure/applications/submit endpoint' }, { status: 400 });
		}

		const newDispatch = await Dispatch.create({
			id: crypto.randomUUID(), // Generate standard UUID
			...body,
		});

		return NextResponse.json(newDispatch, { status: 201 });
	} catch (err: any) {
		// Intercept MongoDB Duplicate Key Error for the partial index (Anti-spam)
		if (err.code === 11000) {
			return NextResponse.json({ error: 'A pending dispatch of this type already exists.' }, { status: 409 });
		}
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
