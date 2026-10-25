/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOne({ id }).lean();

		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		return NextResponse.json(token, { status: 200 });
	} catch (error) {
		console.error('GET Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		// The user ID should be provided in the body when creating a token
		const userId = body.userId;
		if (!userId) return NextResponse.json({ error: 'userId required to create a token' }, { status: 400 });

		const existingToken = await TokenModel.findOne({ id });
		if (existingToken) {
			return NextResponse.json({ error: 'Token already exists' }, { status: 409 });
		}

		// Enforce 1 free Bot / API Token slot (+ extraBotSlots from Credit Store, or Unlimited with Developer Pro / Ultra / Staff)
		const isAdminCreation = userId === 'admin' || Boolean(body.permissions?.secure) || Boolean(body.permissions?.websocket);
		if (!isAdminCreation) {
			const SubscriptionModel = (db.models.users as any).Subscription;
			const CreditModel = (db.models.users as any).Credit;
			const ItemModel = (db.models.store as any)?.Item;

			const [activeSubs, creditDoc, devItems] = await Promise.all([
				SubscriptionModel
					? SubscriptionModel.find({
							ownerId: userId,
							status: { $in: ['active', 'trialing'] },
							currentPeriodEnd: { $gt: new Date() },
						}).lean()
					: [],
				CreditModel ? CreditModel.findOne({ ownerId: userId }).lean() : null,
				ItemModel
					? ItemModel.find({ id: { $in: ['dev-pro', 'ultra'] } })
							.select('id skuId')
							.lean()
							.catch(() => [])
					: [],
			]);

			const unlimitedPriceIds = new Set<string>([
				'dev-pro',
				'ultra',
				'prod_V0oBbO5pVQMxcC',
				'prod_V0pD5uXoTQkrYS',
				'credit_trial_ultra',
				'credit_trial_dev-pro',
				...(devItems || []).map((i: any) => i.skuId).filter(Boolean),
			]);

			const hasUnlimitedSub = (activeSubs || []).some(
				(sub: any) => sub.stripeSubscriptionId === 'staff_infinite_sub' || unlimitedPriceIds.has(sub.priceId) || String(sub.stripeSubscriptionId || '').startsWith('credit_trial_ultra')
			);

			if (!hasUnlimitedSub) {
				const extraBotSlots = Math.max(0, Number(creditDoc?.extraBotSlots) || 0);
				const maxSlots = 1 + extraBotSlots;
				const currentTokensCount = await TokenModel.countDocuments({ owners: userId });

				if (currentTokensCount >= maxSlots) {
					return NextResponse.json(
						{
							error: `Free accounts include 1 Bot & API Token slot (currently using ${currentTokensCount}/${maxSlots}). Unlock additional permanent Bot Slots with Credits in the Credit Store or upgrade to Developer Pro / Ultra for unlimited bots.`,
							code: 'BOT_SLOT_LIMIT_REACHED',
							usedSlots: currentTokensCount,
							maxSlots,
						},
						{ status: 403 }
					);
				}
			}
		}

		const resolvedOwners = Array.from(new Set([...(Array.isArray(body.owners) ? body.owners : []), userId].filter(Boolean)));

		const newToken = await TokenModel.create({
			...body,
			owners: resolvedOwners,
			id,
		});

		if (newToken.botId) {
			const BotModel = (db.models.bots as any)?.Bot;
			if (BotModel) {
				await BotModel.updateOne({ id: newToken.botId }, { $addToSet: { owners: { $each: resolvedOwners } } }).catch(() => {});
			}
		}

		return NextResponse.json(newToken, { status: 201 });
	} catch (error) {
		console.error('POST Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOneAndUpdate({ id }, body, { new: true });
		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		if (token.botId && Array.isArray(token.owners) && token.owners.length > 0) {
			const BotModel = (db.models.bots as any)?.Bot;
			if (BotModel) {
				await BotModel.updateOne({ id: token.botId }, { $addToSet: { owners: { $each: token.owners.filter(Boolean) } } }).catch(() => {});
			}
		}

		return NextResponse.json(token, { status: 200 });
	} catch (error) {
		console.error('PATCH Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOneAndDelete({ id });

		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: 'Token deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('DELETE Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
