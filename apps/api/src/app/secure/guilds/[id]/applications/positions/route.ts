/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { syncGuildApplyPanels } from '@/lib/yourappsDiscord';
import { reconcileScheduledGuildPositions, sanitizePositionPayload } from '@/lib/yourappsSanitize';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const scheduleChanged = await reconcileScheduledGuildPositions(FormModel, id);
		if (scheduleChanged) {
			await syncGuildApplyPanels(id);
		}

		const forms = await FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean();
		return NextResponse.json({ items: forms }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const existingCount = await FormModel.countDocuments({ guild: id });
		if (existingCount >= 25) {
			return NextResponse.json({ error: 'Maximum of 25 positions reached for this server.' }, { status: 400 });
		}

		const sanitized = sanitizePositionPayload(body, false);
		if (!sanitized.name) {
			return NextResponse.json({ error: 'Position name is required.' }, { status: 400 });
		}

		const created = await FormModel.create({
			id: `pos_${crypto.randomBytes(4).toString('hex')}`,
			guild: id,
			...sanitized,
		});

		await syncGuildApplyPanels(id);

		return NextResponse.json(created?.toObject ? created.toObject() : created, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
