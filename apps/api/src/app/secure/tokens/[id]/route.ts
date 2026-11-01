/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['tokens']);
		if (!caller.authenticated) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const token = await TokenModel.findOne({ id }).lean();

		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		const owners: string[] = Array.isArray(token.owners) ? token.owners.map(String) : [];
		if (!caller.authorized && (!caller.userId || !owners.includes(caller.userId))) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		return NextResponse.json(token, { status: 200 });
	} catch (error) {
		console.error('GET Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['tokens']);
		if (!caller.authenticated) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const body = await req.json();
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		// Only staff with 'tokens' permission may create admin/system tokens or specify an arbitrary userId
		const userId = caller.authorized ? body.userId || caller.userId : caller.userId;
		if (!userId) return NextResponse.json({ error: 'userId required to create a token' }, { status: 400 });

		const existingToken = await TokenModel.findOne({ id });
		if (existingToken) {
			return NextResponse.json({ error: 'Token already exists' }, { status: 409 });
		}

		if (!caller.authorized) {
			body.permissions = { secure: false, websocket: false };
			if (!body.botId) {
				body.status = 'pending';
			}
		}

		// Enforce 1 free Bot / API Token slot (+ extraBotSlots from Credit Store, or Unlimited with Developer Pro / Ultra / Staff)
		const isAdminCreation = caller.authorized && (userId === 'admin' || Boolean(body.permissions?.secure) || Boolean(body.permissions?.websocket));
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

		await recordAuditLog(req, {
			action: 'token.create',
			targetType: 'token',
			targetId: id,
			summary: `Created API token "${newToken.name || id}"`,
			metadata: { botId: newToken.botId || null, status: newToken.status || 'active', owners: resolvedOwners },
		});

		return NextResponse.json(newToken, { status: 201 });
	} catch (error) {
		console.error('POST Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['tokens']);
		if (!caller.authenticated) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const body = await req.json();
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const existingToken = await TokenModel.findOne({ id }).lean();
		if (!existingToken) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		const existingOwners: string[] = Array.isArray(existingToken.owners) ? existingToken.owners.map(String) : [];
		if (!caller.authorized && (!caller.userId || !existingOwners.includes(caller.userId))) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...cleanBody } = body || {};
		if (!caller.authorized) {
			delete cleanBody.permissions;
			delete cleanBody.botId;
			if (cleanBody.status === 'active' && !existingToken.botId) {
				cleanBody.status = 'pending';
			}
		}
		const token = await TokenModel.findOneAndUpdate({ id }, cleanBody, { returnDocument: 'after' });
		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		if (token.botId && Array.isArray(token.owners) && token.owners.length > 0) {
			const BotModel = (db.models.bots as any)?.Bot;
			if (BotModel) {
				await BotModel.updateOne({ id: token.botId }, { $addToSet: { owners: { $each: token.owners.filter(Boolean) } } }).catch(() => {});
			}
		}

		await recordAuditLog(req, {
			action: cleanBody.token ? 'token.regenerate' : 'token.update',
			targetType: 'token',
			targetId: id,
			summary: cleanBody.token ? `Regenerated API token "${token.name || id}"` : `Updated API token "${token.name || id}"`,
			metadata: { botId: token.botId || null, status: token.status || 'active' },
		});

		return NextResponse.json(token, { status: 200 });
	} catch (error) {
		console.error('PATCH Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const caller = await resolveCallerAuth(req, ['tokens']);
		if (!caller.authenticated) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const db = await database('xernerx');
		const TokenModel = (db.models.users as any).Token;

		const existingToken = await TokenModel.findOne({ id }).lean();
		if (!existingToken) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		const existingOwners: string[] = Array.isArray(existingToken.owners) ? existingToken.owners.map(String) : [];
		if (!caller.authorized && (!caller.userId || !existingOwners.includes(caller.userId))) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const token = await TokenModel.findOneAndDelete({ id });

		if (!token) {
			return NextResponse.json({ error: 'Token not found' }, { status: 404 });
		}

		await recordAuditLog(req, {
			action: 'token.delete',
			targetType: 'token',
			targetId: id,
			summary: `Deleted API token "${token.name || id}"`,
			metadata: { botId: token.botId || null },
		});

		return NextResponse.json({ success: true, message: 'Token deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('DELETE Token Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
