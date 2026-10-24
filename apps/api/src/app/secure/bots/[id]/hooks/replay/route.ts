/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { collectBotDeliveries, dispatchBotWebhook } from '@/lib/webhookDispatcher';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = (await getServerSession(auth)) as any;
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const deliveryId = String(body.deliveryId || '').trim();
		const requestedUrl = body.hookUrl ? String(body.hookUrl).trim() : '';

		if (!deliveryId) {
			return NextResponse.json({ error: 'deliveryId is required' }, { status: 400 });
		}

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

		const hooks = await HookModel.find({ botId: id }).lean();
		let targetDelivery: any = null;
		let targetHookUrl = requestedUrl;

		for (const hook of hooks) {
			if (!Array.isArray(hook.deliveries)) continue;
			const found = hook.deliveries.find((d: any) => d.id === deliveryId);
			if (found) {
				targetDelivery = found;
				if (!targetHookUrl) {
					targetHookUrl = found.url || hook.url;
				}
				break;
			}
		}

		if (!targetDelivery || !targetHookUrl) {
			return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
		}

		const delivery = await dispatchBotWebhook({
			botId: id,
			url: targetHookUrl,
			event: targetDelivery.event || 'REPLAY',
			payload: targetDelivery.payload || {},
			headers: {
				'X-Xernerx-Replay-Of': deliveryId,
			},
		});

		const updatedHooks = await HookModel.find({ botId: id }).lean();
		const deliveries = collectBotDeliveries(updatedHooks);

		return NextResponse.json({
			ok: delivery.ok,
			status: delivery.status,
			latencyMs: delivery.latencyMs,
			responseSnippet: delivery.responseSnippet,
			delivery,
			deliveries,
		});
	} catch (error: any) {
		console.error('Failed to replay webhook delivery:', error);
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
