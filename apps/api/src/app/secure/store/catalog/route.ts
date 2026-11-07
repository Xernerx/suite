/** @format */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { ensureStoreSeed } from '@/lib/storeSeed';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-10-28.endive',
});

function decodeBotIdFromToken(token?: string): string | null {
	if (!token || !token.includes('.')) return null;
	try {
		const id = Buffer.from(token.split('.')[0], 'base64').toString('utf8').trim();
		return /^\d{17,20}$/.test(id) ? id : null;
	} catch {
		return null;
	}
}

export async function GET() {
	try {
		await ensureStoreSeed();

		const authSession = await getServerSession(auth).catch(() => null);
		const userId = (authSession?.user as any)?.id ? String((authSession?.user as any).id) : null;

		const { models } = await database('xernerx');
		const Category = models.store.Category as any;
		const Item = models.store.Item as any;

		const categories = await Category.find({ enabled: true }).sort({ order: 1 }).lean();
		const items = await Item.find({ enabled: true }).sort({ order: 1 }).lean();

		// Fetch Virtue Discord SKUs & user entitlements if VIRTUE_BOT_TOKEN is configured
		const virtueToken = process.env.VIRTUE_BOT_TOKEN?.trim();
		const virtueAppId = decodeBotIdFromToken(virtueToken);
		let virtueDiscordSkus: any[] = [];
		let virtueUserEntitlements: any[] = [];

		if (virtueToken && virtueAppId) {
			const [skusRes, entRes] = await Promise.allSettled([
				fetch(`https://discord.com/api/v10/applications/${virtueAppId}/skus`, {
					headers: { Authorization: `Bot ${virtueToken}` },
				}),
				userId
					? fetch(`https://discord.com/api/v10/applications/${virtueAppId}/entitlements?user_id=${encodeURIComponent(userId)}&exclude_ended=true`, {
							headers: { Authorization: `Bot ${virtueToken}` },
						})
					: Promise.resolve(null),
			]);

			if (skusRes.status === 'fulfilled' && skusRes.value?.ok) {
				const parsed = await skusRes.value.json().catch(() => []);
				if (Array.isArray(parsed)) {
					virtueDiscordSkus = parsed.filter((s: any) => s && s.type !== 6 && !s.deleted);
				}
			}
			if (entRes.status === 'fulfilled' && entRes.value?.ok) {
				const parsed = await entRes.value.json().catch(() => []);
				if (Array.isArray(parsed)) {
					virtueUserEntitlements = parsed;
				}
			}
		}

		const DEPRECATED_BOT_STRIPE_SKUS = new Set(['prod_V0pSuzpbmBFsRv', 'prod_V0pRf7S9w9Pjb9', 'prod_V0pREm72CzuoVc', 'prod_V0pQ0EDH0iEDIm']);

		// Fetch Stripe pricing for all unique Stripe skuIds in parallel (skip Discord SKUs & deprecated bot Stripe SKUs)
		const uniqueSkuIds = Array.from(
			new Set(
				items
					.filter((i: any) => i.id !== 'bot-virtue')
					.map((i: any) => (typeof i.skuId === 'string' ? i.skuId.trim() : ''))
					.filter((sku: string) => sku && !/^\d{17,20}$/.test(sku) && !sku.startsWith('discord_') && !DEPRECATED_BOT_STRIPE_SKUS.has(sku))
			)
		) as string[];
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

		// Enrich items with Stripe or Discord SKU details
		const enrichedItems = items.map((item: any) => {
			const isVirtueItem = item.id === 'bot-virtue';
			const isSnowflakeSku = typeof item.skuId === 'string' && /^\d{17,20}$/.test(item.skuId.trim());
			const matchedDiscordSku = isVirtueItem
				? virtueDiscordSkus.find((s: any) => String(s.id) === String(item.skuId)) ||
					virtueDiscordSkus[0] || {
						id: isSnowflakeSku ? item.skuId.trim() : 'virtue_pass',
						name: item.name,
						application_id: item.metadata?.discordAppId || virtueAppId || '1484880634844287138',
					}
				: isSnowflakeSku
					? { id: item.skuId.trim(), name: item.name, application_id: item.metadata?.discordAppId || virtueAppId }
					: null;

			if (matchedDiscordSku) {
				const discordSkuId = String(matchedDiscordSku.id);
				const discordAppId = String(matchedDiscordSku.application_id || item.metadata?.discordAppId || virtueAppId || '1484880634844287138');
				const discordStoreUrl = /^\d{17,20}$/.test(discordSkuId)
					? `https://discord.com/application-directory/${discordAppId}/store/${discordSkuId}`
					: `https://discord.com/application-directory/${discordAppId}/store`;
				const activeEntitlement =
					virtueUserEntitlements.find((e: any) => String(e.sku_id) === discordSkuId) || (isVirtueItem && virtueUserEntitlements.length > 0 ? virtueUserEntitlements[0] : null);
				const rawUnitAmount =
					typeof matchedDiscordSku.price?.amount === 'number' ? matchedDiscordSku.price.amount : typeof item.metadata?.unitAmount === 'number' ? item.metadata.unitAmount : 499;

				return {
					...item,
					skuId: discordSkuId,
					stripeName: matchedDiscordSku.name || item.name,
					stripeDescription: matchedDiscordSku.summary || item.description,
					discordSku: {
						skuId: discordSkuId,
						applicationId: discordAppId,
						slug: matchedDiscordSku.slug || null,
						storeUrl: discordStoreUrl,
						hasEntitlement: Boolean(activeEntitlement),
						entitlementEndsAt: activeEntitlement?.ends_at || null,
					},
					prices: [
						{
							id: `discord_sku:${discordAppId}:${discordSkuId}`,
							unitAmount: rawUnitAmount,
							discountedAmount: rawUnitAmount,
							currency: matchedDiscordSku.price?.currency || 'eur',
							interval: 'month',
							intervalCount: 1,
						},
					],
				};
			}

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
