/** @format */

import { database } from '@xernerx/lib/server';
import { STORE_PACKS_AND_SLOTS_ITEMS } from './storeSeedPacksAndSlots';
import { STORE_STAGE_AND_SURFACES_ITEMS } from './storeSeedStageAndSurfaces';
import { STORE_COSMETICS_AND_BADGES_ITEMS } from './storeSeedCosmeticsAndBadges';

export { pack, perk, STORE_PACKS_AND_SLOTS_ITEMS } from './storeSeedPacksAndSlots';
export { STORE_STAGE_AND_SURFACES_ITEMS } from './storeSeedStageAndSurfaces';
export { STORE_COSMETICS_AND_BADGES_ITEMS } from './storeSeedCosmeticsAndBadges';

const CREDIT_STORE_ITEMS = [...STORE_PACKS_AND_SLOTS_ITEMS, ...STORE_STAGE_AND_SURFACES_ITEMS, ...STORE_COSMETICS_AND_BADGES_ITEMS];

export async function ensureStoreSeed() {
	const { models } = await database('xernerx');
	const Category = models.store.Category as any;
	const Item = models.store.Item as any;

	const count = await Category.countDocuments();
	if (count === 0) {
		await Category.create([
			{ id: 'consumers', name: 'Bots, Servers & Ultra', description: 'Individual bot passes and the all-in-one Ultra bundle.', icon: 'Bot', order: 0, enabled: true },
			{ id: 'developers', name: 'Developer API', description: 'Developer API access, higher rate limits, and custom domains.', icon: 'Code', order: 1, enabled: true },
			{ id: 'servers', name: 'Servers', description: 'Dedicated guild & server infrastructure passes.', icon: 'Server', order: 2, enabled: true },
		]);

		await Item.create([
			{
				id: 'ultra',
				name: 'Ultra Ecosystem',
				description: 'Includes all user and server subscriptions of our bots in a single master pass.',
				categoryId: 'consumers',
				skuId: 'prod_V0pD5uXoTQkrYS',
				itemType: 'subscription',
				isFeatured: true,
				badge: 'Ultimate Ecosystem',
				discountPercent: 0,
				features: [
					'Access to all consumer bots (Zodiac, Virtue, To-Do List Bot, Metamorphosis)',
					'200% Credit Multiplier on all earned credits',
					'All server-level utility subscriptions',
					'Priority support channel access',
					'1,000 Media Uploads (CDN)',
				],
				order: 0,
				enabled: true,
			},
			{
				id: 'bot-virtue',
				name: 'Virtue — Premium User Pass',
				description: 'Official Discord App Subscription for Virtue — unlock +50% XP across all sources plus custom Level Modes, Boost Multipliers, and Seasonal Wipes on any server you own.',
				categoryId: 'consumers',
				skuId: '1568740534753693860',
				itemType: 'subscription',
				isFeatured: false,
				badge: 'Official Discord Pass',
				discountPercent: 0,
				features: [
					'Increased XP — Get 50% more XP from all sources',
					'Level Modes — Set up custom server XP curves on servers you own',
					'Boost Multipliers — Configure faster level progression for Server Boosters',
					'Seasonal Wipes — Run automated seasonal level & XP resets on servers you own',
					'125% Credit Multiplier on earned Xernerx credits',
				],
				order: 1,
				enabled: true,
			},
			...[
				{ id: 'bot-zodiac', name: 'Zodiac Pass', feat: 'Direct developer support', order: 2 },
				{ id: 'bot-todo', name: 'To-Do List Bot Pass', feat: 'Unlimited task boards', order: 3 },
				{ id: 'bot-metamorphosis', name: 'Metamorphosis Pass', feat: 'Dynamic logging channels', order: 4 },
			].map((b) => ({
				id: b.id,
				name: b.name,
				description: 'Individual bot license pass via Discord App Subscriptions.',
				categoryId: 'consumers',
				skuId: '',
				itemType: 'subscription',
				isFeatured: false,
				discountPercent: 0,
				features: [`Premium ${b.name.replace(' Pass', '')} access`, '125% Credit Multiplier on earned credits', b.feat],
				order: b.order,
				enabled: false,
			})),
			{
				id: 'dev-pro',
				name: 'Developer Pro',
				description: 'Advanced API rate limits, unlimited bots, and real-time online/offline status webhooks.',
				categoryId: 'developers',
				skuId: 'prod_V0oBbO5pVQMxcC',
				itemType: 'subscription',
				isFeatured: false,
				badge: 'Developer Pro',
				discountPercent: 0,
				features: ['Advanced API access', 'Extended rate limits', 'Unlimited Projects', 'Bot Online & Offline POST Webhooks'],
				order: 0,
				enabled: true,
			},
		]);
	}

	const creditsCat = await Category.findOne({ id: 'credits' }).lean();
	if (!creditsCat) {
		await Category.create({
			id: 'credits',
			name: 'Credits & Perks',
			description: 'Top up ecosystem credits or redeem your balance for CDN slots, profile showcases, trial passes, and vanity badges.',
			icon: 'Coins',
			order: 3,
			enabled: true,
		});
	}

	await Item.deleteMany({
		id: {
			$in: ['perk-font-packs-bundle', 'perk-font-cyber-geometric', 'perk-font-editorial-serif', 'perk-font-retro-arcade', 'perk-font-technical-mono', 'perk-font-rounded-pop'],
		},
	});

	for (const creditItem of CREDIT_STORE_ITEMS) {
		await Item.updateOne({ id: creditItem.id }, { $setOnInsert: creditItem }, { upsert: true });
	}
	for (const refreshId of [
		'perk-badge-dotmatrix',
		'perk-stage-styles-bundle',
		'perk-stage-constellation',
		'perk-stage-hexgrid',
		'perk-stage-aurora',
		'perk-stage-glyphs',
		'perk-ambient-scenes',
		'perk-surface-styles',
		'perk-profile-frames',
		'perk-profile-nameplates',
	]) {
		const seedItem = CREDIT_STORE_ITEMS.find((i) => i.id === refreshId);
		if (seedItem) {
			await Item.updateOne(
				{ id: refreshId },
				{
					$set: {
						name: seedItem.name,
						description: seedItem.description,
						perkType: seedItem.perkType,
						creditCost: seedItem.creditCost,
						badge: seedItem.badge,
						features: seedItem.features,
						order: seedItem.order,
					},
				}
			);
		}
	}

	await Item.updateOne(
		{ id: 'dev-pro' },
		{
			$addToSet: {
				features: 'Bot Online & Offline POST Webhooks',
			},
		}
	).catch(() => null);

	// Migrate legacy Stripe bot SKUs to Discord SKUs (Virtue active; Zodiac/To-Do/Metamorphosis disabled until Discord SKUs are created)
	await Item.updateOne(
		{ id: 'bot-virtue' },
		{
			$set: {
				id: 'bot-virtue',
				name: 'Virtue — Premium User Pass',
				categoryId: 'consumers',
				skuId: '1568740534753693860',
				badge: 'Official Discord Pass',
				description: 'Official Discord App Subscription for Virtue — unlock +50% XP across all sources plus custom Level Modes, Boost Multipliers, and Seasonal Wipes on any server you own.',
				features: [
					'Increased XP — Get 50% more XP from all sources',
					'Level Modes — Set up custom server XP curves on servers you own',
					'Boost Multipliers — Configure faster level progression for Server Boosters',
					'Seasonal Wipes — Run automated seasonal level & XP resets on servers you own',
					'125% Credit Multiplier on earned Xernerx credits',
				],
				discountPercent: 0,
				isFeatured: false,
				order: 2,
				enabled: true,
			},
		},
		{ upsert: true }
	).catch(() => null);

	await Item.updateMany(
		{
			id: { $in: ['bot-zodiac', 'bot-todo', 'bot-metamorphosis'] },
			skuId: { $in: ['prod_V0pSuzpbmBFsRv', 'prod_V0pREm72CzuoVc', 'prod_V0pQ0EDH0iEDIm'] },
		},
		{
			$set: {
				skuId: '',
				enabled: false,
			},
		}
	).catch(() => null);
}
