/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { randomUUID } from 'crypto';
import { collectBotDeliveries, hasBotApiTierSubscription } from '@/lib/webhookDispatcher';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const db = await database('xernerx');
		const BotProfileModel = (db.models.bots as any).Bot;
		const HookModel = (db.models.bots as any).Hook;

		const [bot, hooks] = await Promise.all([
			BotProfileModel ? BotProfileModel.findOne({ id }).select('id owners organization').lean() : Promise.resolve(null),
			HookModel.find({ botId: id }).lean(),
		]);
		const deliveries = collectBotDeliveries(hooks);
		const hasApiTier = await hasBotApiTierSubscription(bot || id, [session.user.id]);

		return NextResponse.json({ hooks, deliveries, hasApiTier }, { status: 200 });
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

		const hasApiTier = await hasBotApiTierSubscription(bot, [session.user.id]);
		const requestsStatusWebhook = hooks.some((h: any) => Array.isArray(h?.events) && (h.events.includes('POST online') || h.events.includes('POST offline')));
		if (requestsStatusWebhook && !hasApiTier) {
			return NextResponse.json(
				{
					error: 'POST online and POST offline webhooks require an active Developer API (Developer Pro or Ultra) subscription.',
					code: 'API_TIER_REQUIRED',
				},
				{ status: 403 }
			);
		}

		const existingHooks = await HookModel.find({ botId: id }).lean();
		const deliveriesByUrl = new Map<string, any[]>();
		const secretByUrl = new Map<string, string>();
		for (const existing of existingHooks) {
			if (existing.url && Array.isArray(existing.deliveries) && existing.deliveries.length > 0) {
				const prev = deliveriesByUrl.get(existing.url) || [];
				deliveriesByUrl.set(existing.url, [...prev, ...existing.deliveries].slice(-25));
			}
			if (existing.url && typeof (existing as any).secret === 'string' && (existing as any).secret) {
				secretByUrl.set(existing.url, (existing as any).secret);
			}
		}

		await HookModel.deleteMany({ botId: id });
		if (hooks.length > 0) {
			await HookModel.insertMany(
				hooks.map((h: any) => ({
					id: h.id || randomUUID(),
					botId: id,
					url: h.url,
					secret: typeof h.secret === 'string' ? h.secret.trim() : secretByUrl.get(h.url) || '',
					events: h.events || [],
					deliveries: Array.isArray(h.deliveries) && h.deliveries.length > 0 ? h.deliveries.slice(-25) : deliveriesByUrl.get(h.url) || [],
				}))
			);
		}

		const updatedHooks = await HookModel.find({ botId: id }).lean();
		const deliveries = collectBotDeliveries(updatedHooks);

		return NextResponse.json({ success: true, message: 'Hooks synced successfully', hooks: updatedHooks, deliveries, hasApiTier }, { status: 200 });
	} catch (error) {
		console.error('Failed to sync hooks:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
