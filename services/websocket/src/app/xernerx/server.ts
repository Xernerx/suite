/** @format */

import { database } from '@xernerx/lib/core';

async function getModel(action: string) {
	const db = await database('xernerx');

	switch (action) {
		case 'users':
		case 'user':
		case 'profile':
		case 'profiles':
			return (db.models.users as any)?.User;

		case 'levels':
		case 'level':
			return (db.models.users as any)?.Level;

		case 'credits':
		case 'credit':
			return (db.models.users as any)?.Credit;

		case 'tokens':
		case 'token':
			return (db.models.users as any)?.Token;

		case 'appearance':
		case 'appearances':
			return (db.models.users as any)?.Appearance;

		case 'subscriptions':
		case 'subscription':
			return (db.models.users as any)?.Subscription;

		case 'guilds':
		case 'guild':
			return (db.models.guilds as any)?.Guild;

		case 'bots':
		case 'bot':
			return (db.models.bots as any)?.Bot;

		default:
			return null;
	}
}

function getFilter(action: string, body: any) {
	switch (action) {
		case 'levels':
		case 'level':
		case 'credits':
		case 'credit':
		case 'subscriptions':
		case 'subscription':
			return {
				ownerId: body.ownerId || body.id,
			};

		case 'users':
		case 'user':
		case 'profile':
		case 'profiles':
		case 'tokens':
		case 'token':
		case 'appearance':
		case 'appearances':
		case 'guilds':
		case 'guild':
		case 'bots':
		case 'bot':
			return {
				id: body.id,
			};

		default:
			throw new Error(`Unsupported action: ${action}`);
	}
}

export default async function Server(msg: any) {
	const model = await getModel(msg.action);

	if (!model) {
		throw new Error(`Unknown action: ${msg.action}`);
	}

	switch (msg.method) {
		case 'get':
			return model.findOne(getFilter(msg.action, msg.body)).lean();

		case 'create':
			try {
				const res = await model.create(msg.body);
				return res?.toObject ? res.toObject() : res;
			} catch (error: any) {
				if (error?.code === 11000) {
					return model.findOne(getFilter(msg.action, msg.body)).lean();
				}
				throw error;
			}

		case 'update': {
			if ((msg.action === 'credits' || msg.action === 'credit') && typeof msg.body?.balance === 'number' && !msg.body?.skipMultiplier) {
				try {
					const db = await database('xernerx');
					const filter = getFilter(msg.action, msg.body);
					const ownerId = filter.ownerId;
					const existing = (await model.findOne(filter).lean()) as any;
					const prevBalance = existing?.balance || 0;
					const gained = msg.body.balance - prevBalance;

					if (ownerId && gained > 0) {
						const now = Date.now();
						const [userDoc, subDocs, ultraItem] = await Promise.all([
							(db.models.users as any)?.User?.findOne({ id: ownerId })
								.lean()
								.catch(() => null),
							(db.models.users as any)?.Subscription?.find({ ownerId, status: { $in: ['active', 'trialing'] } })
								.lean()
								.catch(() => []),
							(db.models.store as any)?.Item?.findOne({ id: 'ultra' })
								.lean()
								.catch(() => null),
						]);

						const billingSubs = Array.isArray(userDoc?.billing?.subscriptions) ? userDoc.billing.subscriptions : [];
						const validSubs = [...(Array.isArray(subDocs) ? subDocs : []), ...billingSubs].filter((s: any) => {
							if (!s || (s.status !== 'active' && s.status !== 'trialing')) return false;
							if (!s.currentPeriodEnd) return true;
							const endMs = new Date(s.currentPeriodEnd).getTime();
							return Number.isNaN(endMs) || endMs > now;
						});

						const ultraSkuId = ultraItem?.skuId || 'prod_V0pD5uXoTQkrYS';
						const hasUltra =
							Boolean(userDoc?.staffSubscription) ||
							validSubs.some(
								(s: any) =>
									String(s.stripeSubscriptionId || '')
										.toLowerCase()
										.includes('ultra') ||
									String(s.priceId || '')
										.toLowerCase()
										.includes('ultra') ||
									s.priceId === ultraSkuId
							);

						const multiplier = hasUltra ? 2 : validSubs.length > 0 ? 1.25 : 1;
						msg.body.balance = prevBalance + Math.round(gained * multiplier);
					}
				} catch {}
			}

			return model
				.findOneAndUpdate(
					getFilter(msg.action, msg.body),
					{
						$set: msg.body,
					},
					{
						returnDocument: 'after',
						runValidators: true,
						upsert: true,
					}
				)
				.lean();
		}

		case 'delete':
			return model.findOneAndDelete(getFilter(msg.action, msg.body)).lean();

		default:
			throw new Error(`Unknown method: ${msg.method}`);
	}
}
