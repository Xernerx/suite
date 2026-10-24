/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { randomUUID } from 'crypto';
import { collectBotDeliveries } from '@/lib/webhookDispatcher';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const db = await database('xernerx');
		const HookModel = (db.models.bots as any).Hook;

		const hooks = await HookModel.find({ botId: id }).lean();
		const deliveries = collectBotDeliveries(hooks);

		return NextResponse.json({ hooks, deliveries }, { status: 200 });
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
		const hooks = Array.isArray(body) ? body : Array.isArray(body?.hooks) ? body.hooks : [];

		const db = await database('xernerx');
		const BotProfileModel = (db.models.bots as any).Bot;
		const HookModel = (db.models.bots as any).Hook;

		const bot = await BotProfileModel.findOne({ id }).lean();
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
		}

		let isAuthorized = Array.isArray(bot.owners) && bot.owners.includes(session.user.id);
		if (!isAuthorized && bot.organization) {
			const OrganizationModel = (db.models.organizations as any).Organization;
			const org = await OrganizationModel.findById(bot.organization).lean();
			if (org && (org.owner === session.user.id || (Array.isArray(org.members) && org.members.includes(session.user.id)))) {
				isAuthorized = true;
			}
		}

		if (!isAuthorized) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		if (hooks.some((h: any) => !h.url || h.url.trim() === '')) {
			return NextResponse.json({ error: 'Webhook URL cannot be empty.' }, { status: 400 });
		}

		const existingHooks = await HookModel.find({ botId: id }).lean();
		const deliveriesByUrl = new Map<string, any[]>();
		for (const existing of existingHooks) {
			if (existing.url && Array.isArray(existing.deliveries) && existing.deliveries.length > 0) {
				const prev = deliveriesByUrl.get(existing.url) || [];
				deliveriesByUrl.set(existing.url, [...prev, ...existing.deliveries].slice(-25));
			}
		}

		await HookModel.deleteMany({ botId: id });
		if (hooks.length > 0) {
			await HookModel.insertMany(
				hooks.map((h: any) => ({
					id: h.id || randomUUID(),
					botId: id,
					url: h.url,
					events: h.events || [],
					deliveries: Array.isArray(h.deliveries) && h.deliveries.length > 0 ? h.deliveries.slice(-25) : deliveriesByUrl.get(h.url) || [],
				}))
			);
		}

		const updatedHooks = await HookModel.find({ botId: id }).lean();
		const deliveries = collectBotDeliveries(updatedHooks);

		return NextResponse.json({ success: true, message: 'Hooks synced successfully', hooks: updatedHooks, deliveries }, { status: 200 });
	} catch (error) {
		console.error('Failed to sync hooks:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
