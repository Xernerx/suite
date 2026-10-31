/** @format */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';
import { ensureStoreSeed } from '@/lib/storeSeed';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-10-28.endive',
});

export async function GET() {
	try {
		await ensureStoreSeed();

		const { models } = await database('xernerx');
		const Category = models.store.Category as any;
		const Item = models.store.Item as any;

		const categories = await Category.find({ enabled: true }).sort({ order: 1 }).lean();
		const items = await Item.find({ enabled: true }).sort({ order: 1 }).lean();

		// Fetch Stripe pricing for all unique skuIds in parallel
		const uniqueSkuIds = Array.from(new Set(items.map((i: any) => i.skuId).filter(Boolean))) as string[];
		const priceCache: Record<string, { name: string; description: string | null; prices: any[] }> = {};

		await Promise.allSettled(
			uniqueSkuIds.map(async (skuId) => {
				try {
					if (skuId.startsWith('price_')) {
						const price = await stripe.prices.retrieve(skuId, { expand: ['product'] });
						const prod = typeof price.product === 'object' && price.product && !('deleted' in price.product) ? price.product : null;
						priceCache[skuId] = {
							name: prod?.name || skuId,
							description: prod?.description || null,
							prices: [
								{
									id: price.id,
									unitAmount: price.unit_amount,
									currency: price.currency,
									interval: price.recurring?.interval,
									intervalCount: price.recurring?.interval_count,
								},
							],
						};
						return;
					}

					const [product, pricesList] = await Promise.all([stripe.products.retrieve(skuId), stripe.prices.list({ product: skuId, active: true })]);

					priceCache[skuId] = {
						name: product.name,
						description: product.description,
						prices: pricesList.data.map((price) => ({
							id: price.id,
							unitAmount: price.unit_amount,
							currency: price.currency,
							interval: price.recurring?.interval,
							intervalCount: price.recurring?.interval_count,
						})),
					};
				} catch (err) {
					console.warn(`Failed to fetch Stripe details for skuId ${skuId}:`, err);
				}
			})
		);

		// Enrich items with Stripe details and discount pricing
		const enrichedItems = items.map((item: any) => {
			const stripeData = priceCache[item.skuId];
			const prices = (stripeData?.prices || []).map((p: any) => {
				let discountedAmount = p.unitAmount;
				if (item.discountPercent && item.discountPercent > 0 && p.unitAmount) {
					discountedAmount = Math.round(p.unitAmount * (1 - item.discountPercent / 100));
				}
				return {
					...p,
					discountedAmount,
				};
			});

			return {
				...item,
				stripeName: stripeData?.name || item.name,
				stripeDescription: stripeData?.description || item.description,
				prices,
			};
		});

		return NextResponse.json({
			categories,
			items: enrichedItems,
		});
	} catch (err: any) {
		console.error('Error fetching store catalog:', err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
