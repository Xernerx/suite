/** @format */

import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-10-28.endive',
});

// Cache priceId -> productId lookups to avoid repeated Stripe calls
const priceProductCache = new Map<string, string>();

async function isUltraPriceId(priceId: string, ultraSkuId: string): Promise<boolean> {
	if (!priceId) return false;
	const normalized = priceId.toLowerCase();
	if (normalized.includes('ultra') || priceId === ultraSkuId) {
		return true;
	}
	if (!priceId.startsWith('price_')) return false;

	if (priceProductCache.has(priceId)) {
		return priceProductCache.get(priceId) === ultraSkuId;
	}

	try {
		const price = await stripe.prices.retrieve(priceId);
		const productId = typeof price.product === 'string' ? price.product : price.product?.id || '';
		if (productId) {
			priceProductCache.set(priceId, productId);
		}
		return productId === ultraSkuId;
	} catch {
		return false;
	}
}

export interface CreditMultiplierResult {
	baseCredits: number;
	finalCredits: number;
	multiplier: number;
	multiplierPercent: number;
	tier: 'ultra' | 'subscriber' | 'free';
}

/**
 * Computes the server-side credit multiplier for a user right before adding credits:
 * - Ultra subscription (or staffSubscription): 200% (2.0x)
 * - Any other active/trialing subscription: 125% (1.25x)
 * - Free tier: 100% (1.0x)
 */
export async function applySubscriptionCreditMultiplier(userId: string, baseCredits: number): Promise<CreditMultiplierResult> {
	const cleanBase = Math.max(0, Math.round(baseCredits));
	if (!userId || cleanBase === 0) {
		return {
			baseCredits: cleanBase,
			finalCredits: cleanBase,
			multiplier: 1,
			multiplierPercent: 100,
			tier: 'free',
		};
	}

	try {
		const { models } = await database('xernerx');
		const now = Date.now();

		const [userDoc, subDocs, ultraItem] = await Promise.all([
			models.users.User
				? models.users.User.findOne({ id: userId })
						.lean()
						.catch(() => null)
				: Promise.resolve(null),
			models.users.Subscription
				? models.users.Subscription.find({
						ownerId: userId,
						status: { $in: ['active', 'trialing'] },
					})
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
			(models.store as any)?.Item
				? (models.store as any).Item.findOne({ id: 'ultra' })
						.lean()
						.catch(() => null)
				: Promise.resolve(null),
		]);

		if ((userDoc as any)?.staffSubscription) {
			return {
				baseCredits: cleanBase,
				finalCredits: Math.round(cleanBase * 2),
				multiplier: 2,
				multiplierPercent: 200,
				tier: 'ultra',
			};
		}

		const billingSubs = Array.isArray((userDoc as any)?.billing?.subscriptions) ? (userDoc as any).billing.subscriptions : [];
		const allSubs = [...(Array.isArray(subDocs) ? subDocs : []), ...billingSubs];

		const validSubs = allSubs.filter((sub: any) => {
			if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return false;
			if (!sub.currentPeriodEnd) return true;
			const endMs = new Date(sub.currentPeriodEnd).getTime();
			return Number.isNaN(endMs) || endMs > now;
		});

		if (validSubs.length === 0) {
			return {
				baseCredits: cleanBase,
				finalCredits: cleanBase,
				multiplier: 1,
				multiplierPercent: 100,
				tier: 'free',
			};
		}

		const ultraSkuId = (ultraItem as any)?.skuId || 'prod_V0pD5uXoTQkrYS';
		let hasUltra = false;

		for (const sub of validSubs) {
			const subIdStr = String(sub.stripeSubscriptionId || '').toLowerCase();
			const priceIdStr = String(sub.priceId || '');
			if (subIdStr.includes('ultra') || (await isUltraPriceId(priceIdStr, ultraSkuId))) {
				hasUltra = true;
				break;
			}
		}

		if (hasUltra) {
			return {
				baseCredits: cleanBase,
				finalCredits: Math.round(cleanBase * 2),
				multiplier: 2,
				multiplierPercent: 200,
				tier: 'ultra',
			};
		}

		return {
			baseCredits: cleanBase,
			finalCredits: Math.round(cleanBase * 1.25),
			multiplier: 1.25,
			multiplierPercent: 125,
			tier: 'subscriber',
		};
	} catch (err) {
		console.warn('Failed to evaluate credit subscription multiplier, falling back to 100%:', err);
		return {
			baseCredits: cleanBase,
			finalCredits: cleanBase,
			multiplier: 1,
			multiplierPercent: 100,
			tier: 'free',
		};
	}
}
