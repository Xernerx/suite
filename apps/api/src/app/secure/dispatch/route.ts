/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

		// Auto-delete read notifications older than 30 days
		const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
		await Dispatch.deleteMany({
			status: 'read',
			$or: [{ readAt: { $ne: null, $lte: thirtyDaysAgo } }, { readAt: null, updatedAt: { $lte: thirtyDaysAgo } }, { readAt: { $exists: false }, updatedAt: { $lte: thirtyDaysAgo } }],
		}).catch(() => {});

		const query: any = {};
		if (targetId) {
			query.$or = [{ targetId: targetId }, { targetId: 'global' }];
			query.deletedBy = { $ne: targetId };
		}
		if (senderId) query.senderId = senderId;
		if (category) query.category = category;
		if (type) query.type = type;
		if (status) query.status = status;

		let dispatchItems = await Dispatch.find(query).sort({ createdAt: -1 }).lean();

		if (targetId) {
			const cutoffMs = Date.now() - THIRTY_DAYS_MS;
			dispatchItems = dispatchItems.filter((item: any) => {
				const isReadByTarget = item.status === 'read' || (Array.isArray(item.readBy) && item.readBy.includes(targetId));
				if (!isReadByTarget) return true;
				const refDate = item.readAt || item.updatedAt || item.createdAt;
				const refMs = refDate ? new Date(refDate).getTime() : NaN;
				return Number.isNaN(refMs) || refMs > cutoffMs;
			});
		}

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
