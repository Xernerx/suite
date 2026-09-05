/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { randomUUID } from 'crypto';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const db = await database('xernerx');
		const HookModel = (db.models.bots as any).Hook;

		const hooks = await HookModel.find({ botId: id }).lean();
		return NextResponse.json(hooks, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch hooks:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const body = await request.json();
		const hooks = Array.isArray(body) ? body : [];

		const db = await database('xernerx');
		const BotProfileModel = (db.models.bots as any).Bot;
		const HookModel = (db.models.bots as any).Hook;

		const bot = await BotProfileModel.findOne({ id }).lean();
		if (!bot || (!bot.owners.includes(session.user.id) && bot.owners[0] !== session.user.id)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		if (hooks.some((h: any) => !h.url || h.url.trim() === '')) {
			return NextResponse.json({ error: 'Webhook URL cannot be empty.' }, { status: 400 });
		}

		await HookModel.deleteMany({ botId: id });
		if (hooks.length > 0) {
			await HookModel.insertMany(
				hooks.map((h: any) => ({
					id: h.id || randomUUID(),
					botId: id,
					url: h.url,
					events: h.events || [],
				}))
			);
		}

		return NextResponse.json({ success: true, message: 'Hooks synced successfully' }, { status: 200 });
	} catch (error) {
		console.error('Failed to sync hooks:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
