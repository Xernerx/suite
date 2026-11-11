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

const VIRTUE_PUBLIC_APP_ID = '1484880634844287138';
const VIRTUE_DEFAULT_SKU_ID = '1568740534753693860';
const VIRTUE_DEFAULT_THUMBNAIL_ID = '1569029335900225747';
const VIRTUE_DEFAULT_BANNER_HASH = '34673c3bb1900169de38a5e40a56f34d';
const VIRTUE_DEFAULT_ICON_HASH = 'bb9495686b0bab5efa38119c8e2f0bb3';

const DEFAULT_VIRTUE_BENEFITS = [
	{
		id: '1568758982917496893',
		name: 'Increased XP',
		description: 'Get 50% more XP from all sources.',
		emoji: '⚡',
	},
	{
		id: '1568758982917496894',
		name: 'Level Modes',
		description: 'In your owned servers setup the server level XP curve, allowing for faster or slower level progression.',
		emoji: '✨',
	},
	{
		id: '1568758982917496895',
		name: 'Boost Multipliers',
		description: 'In your owned servers setup boost multipliers for faster level progression.',
		emoji: '🚀',
	},
	{
		id: '1568758982917496896',
		name: 'Seasonal Wipes',
		description: 'In your owned servers setup seasonal level and XP wipes, simulating seasons.',
		emoji: '📅',
	},
];

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

		// Fetch Virtue published storefront listings, directory assets, & user entitlements
		const discordAuthToken = (process.env.DISCORD_BOT_TOKEN || process.env.VIRTUE_BOT_TOKEN || '').trim();
		const virtueToken = process.env.VIRTUE_BOT_TOKEN?.trim();
		const virtueTokenAppId = decodeBotIdFromToken(virtueToken);

		let virtuePublishedListings: any[] = [];
		let virtueDirectoryApp: any = null;
		let virtueUserEntitlements: any[] = [];

		const [listingsRes, dirRes, entRes] = await Promise.allSettled([
			discordAuthToken
				? fetch(`https://discord.com/api/v10/store/published-listings/skus?application_id=${VIRTUE_PUBLIC_APP_ID}`, {
						headers: { Authorization: `Bot ${discordAuthToken}` },
						next: { revalidate: 300 },
					} as any)
				: Promise.resolve(null),
			fetch(`https://discord.com/api/v10/application-directory-static/applications/${VIRTUE_PUBLIC_APP_ID}`, {
				next: { revalidate: 300 },
			} as any),
			userId && virtueToken && virtueTokenAppId
				? fetch(`https://discord.com/api/v10/applications/${virtueTokenAppId}/entitlements?user_id=${encodeURIComponent(userId)}&exclude_ended=true`, {
						headers: { Authorization: `Bot ${virtueToken}` },
					})
				: Promise.resolve(null),
		]);

		if (listingsRes.status === 'fulfilled' && listingsRes.value?.ok) {
			const parsed = await listingsRes.value.json().catch(() => []);
			if (Array.isArray(parsed)) {
				virtuePublishedListings = parsed.filter((l: any) => l?.sku && l.sku.type !== 6 && !l.sku.deleted);
			}
		}

		if (dirRes.status === 'fulfilled' && dirRes.value?.ok) {
			virtueDirectoryApp = await dirRes.value.json().catch(() => null);
		}

		if (entRes.status === 'fulfilled' && entRes.value?.ok) {
			const parsed = await entRes.value.json().catch(() => []);
			if (Array.isArray(parsed)) {
				virtueUserEntitlements = parsed;
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

			if (isVirtueItem || isSnowflakeSku) {
				const matchedListing =
					virtuePublishedListings.find((l: any) => String(l.sku?.id || l.id) === String(item.skuId)) ||
					virtuePublishedListings.find((l: any) => l.sku?.type === 5) ||
					virtuePublishedListings[0] ||
					null;

				const matchedSku = matchedListing?.sku || null;
				const discordSkuId = String(matchedSku?.id || (isSnowflakeSku ? item.skuId.trim() : VIRTUE_DEFAULT_SKU_ID));
				const discordAppId = String(matchedSku?.application_id || item.metadata?.discordAppId || VIRTUE_PUBLIC_APP_ID);
				const discordStoreUrl = `https://discord.com/application-directory/${discordAppId}/store/${discordSkuId}`;

				const thumbnailId = matchedListing?.thumbnail?.id || VIRTUE_DEFAULT_THUMBNAIL_ID;
				const bannerHash = virtueDirectoryApp?.bot?.banner || VIRTUE_DEFAULT_BANNER_HASH;
				const iconHash = virtueDirectoryApp?.icon || virtueDirectoryApp?.bot?.avatar || VIRTUE_DEFAULT_ICON_HASH;

				const thumbnailUrl = thumbnailId ? `https://cdn.discordapp.com/app-assets/${discordAppId}/store/${thumbnailId}.png?size=512` : null;
				const bannerUrl = bannerHash ? `https://cdn.discordapp.com/banners/${discordAppId}/${bannerHash}.png?size=600` : null;
				const appIconUrl = iconHash ? `https://cdn.discordapp.com/app-icons/${discordAppId}/${iconHash}.png?size=256` : null;

				const benefits =
					Array.isArray(matchedListing?.benefits) && matchedListing.benefits.length > 0
						? matchedListing.benefits.map((b: any) => ({
								id: String(b.id),
								name: String(b.name || ''),
								description: String(b.description || ''),
								emoji: b.icon?.emoji || '✨',
							}))
						: DEFAULT_VIRTUE_BENEFITS;

				const activeEntitlement =
					virtueUserEntitlements.find((e: any) => String(e.sku_id) === discordSkuId) || (isVirtueItem && virtueUserEntitlements.length > 0 ? virtueUserEntitlements[0] : null);
				const rawUnitAmount = typeof matchedSku?.price?.amount === 'number' ? matchedSku.price.amount : typeof item.metadata?.unitAmount === 'number' ? item.metadata.unitAmount : 199;
				const rawCurrency = matchedSku?.price?.currency || item.metadata?.currency || 'usd';

				return {
					...item,
					skuId: discordSkuId,
					name: item.name || matchedSku?.name || 'Virtue — Premium User Pass',
					stripeName: matchedSku?.name || item.name,
					stripeDescription: matchedListing?.description?.trim() || item.description,
					discordSku: {
						skuId: discordSkuId,
						applicationId: discordAppId,
						slug: matchedSku?.slug || 'premium-user',
						summary: matchedListing?.summary || matchedSku?.name || 'Premium User',
						storeUrl: discordStoreUrl,
						thumbnailUrl,
						bannerUrl,
						appIconUrl,
						benefits,
						hasEntitlement: Boolean(activeEntitlement),
						entitlementEndsAt: activeEntitlement?.ends_at || null,
					},
					prices: [
						{
							id: `discord_sku:${discordAppId}:${discordSkuId}`,
							unitAmount: rawUnitAmount,
							discountedAmount: rawUnitAmount,
							currency: rawCurrency,
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
