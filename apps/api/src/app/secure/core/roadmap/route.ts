/** @format */

import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const items = await models.core.RoadmapItem.find().sort({ createdAt: -1 }).lean();
		return NextResponse.json({ data: items });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const caller = await resolveCallerAuth(req, ['manageRoadmap']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Roadmap management permission required' }, { status: caller.userId ? 403 : 401 });
		}

		const body = await req.json();
		const { models } = await database('xernerx');
		const item = await models.core.RoadmapItem.create({
			id: crypto.randomUUID(),
			...body,
		});
		await recordAuditLog(req, {
			action: 'roadmap.created',
			targetType: 'setting',
			targetId: item.id,
			summary: `Created roadmap item "${item.title || item.id}"`,
		});
		return NextResponse.json({ data: item });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
