/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { syncGuildApplyPanels } from '@/lib/yourappsDiscord';
import { sanitizePositionPayload } from '@/lib/yourappsSanitize';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; positionId: string }> }) {
	try {
		const { id, positionId } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const updateData = sanitizePositionPayload(body, true);
		if (body.name !== undefined && !updateData.name) {
			return NextResponse.json({ error: 'Position name cannot be empty.' }, { status: 400 });
		}

		const updated = await FormModel.findOneAndUpdate({ id: positionId, guild: id }, { $set: updateData }, { returnDocument: 'after', runValidators: true }).lean();
		if (!updated) {
			return NextResponse.json({ error: 'Position not found' }, { status: 404 });
		}

		await syncGuildApplyPanels(id);

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; positionId: string }> }) {
	try {
		const { id, positionId } = await params;
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		const DraftModel = (db.models.guilds as any)?.Draft;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const deleted = await FormModel.findOneAndDelete({ id: positionId, guild: id }).lean();
		if (!deleted) {
			return NextResponse.json({ error: 'Position not found' }, { status: 404 });
		}

		if (DraftModel) {
			await DraftModel.deleteMany({ guild: id, positionId }).catch(() => null);
		}

		await syncGuildApplyPanels(id);

		return NextResponse.json({ success: true, id: positionId }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
