/** @format */

import { database } from '@xernerx/lib/server';

export async function ensureStoreSeed() {
	const { models } = await database('xernerx');
	const Category = models.store.Category as any;
	const Item = models.store.Item as any;

	const count = await Category.countDocuments();
	if (count > 0) return;

	// Seed default categories
	await Category.create([
		{
			id: 'consumers',
			name: 'Bots, Servers & Ultra',
			description: 'Individual bot passes and the all-in-one Ultra bundle.',
			icon: 'Bot',
			order: 0,
			enabled: true,
		},
		{
			id: 'developers',
			name: 'Developer API',
			description: 'Developer API access, higher rate limits, and custom domains.',
			icon: 'Code',
			order: 1,
			enabled: true,
		},
		{
			id: 'servers',
			name: 'Servers',
			description: 'Dedicated guild & server infrastructure passes.',
			icon: 'Server',
			order: 2,
			enabled: true,
		},
	]);

	// Seed default products
	await Item.create([
		{
			id: 'ultra',
			name: 'Ultra Ecosystem',
			description: 'Includes all user and server subscriptions of our bots in a single master pass.',
			categoryId: 'consumers',
			skuId: 'prod_V0pD5uXoTQkrYS',
			isFeatured: true,
			badge: 'Ultimate Ecosystem',
			discountPercent: 0,
			features: ['Access to all consumer bots (Zodiac, Virtue, To-Do, Metamorphosis)', 'All server-level utility subscriptions', 'Priority support channel access', '1,000 Media Uploads (CDN)'],
			order: 0,
			enabled: true,
		},
		{
			id: 'bot-zodiac',
			name: 'Zodiac Pass',
			description: 'Individual bot license pass with premium feature access.',
			categoryId: 'consumers',
			skuId: 'prod_V0pSuzpbmBFsRv',
			isFeatured: false,
			discountPercent: 0,
			features: ['Premium Zodiac access', 'Direct developer support'],
			order: 1,
			enabled: true,
		},
		{
			id: 'bot-virtue',
			name: 'Virtue Pass',
			description: 'Individual bot license pass with premium feature access.',
			categoryId: 'consumers',
			skuId: 'prod_V0pRf7S9w9Pjb9',
			isFeatured: false,
			discountPercent: 0,
			features: ['Premium Virtue access', 'Advanced moderation suite'],
			order: 2,
			enabled: true,
		},
		{
			id: 'bot-todo',
			name: 'To-Do Pass',
			description: 'Individual bot license pass with premium feature access.',
			categoryId: 'consumers',
			skuId: 'prod_V0pREm72CzuoVc',
			isFeatured: false,
			discountPercent: 0,
			features: ['Premium To-Do access', 'Unlimited task boards'],
			order: 3,
			enabled: true,
		},
		{
			id: 'bot-metamorphosis',
			name: 'Metamorphosis Pass',
			description: 'Individual bot license pass with premium feature access.',
			categoryId: 'consumers',
			skuId: 'prod_V0pQ0EDH0iEDIm',
			isFeatured: false,
			discountPercent: 0,
			features: ['Premium Metamorphosis access', 'Dynamic logging channels'],
			order: 4,
			enabled: true,
		},
		{
			id: 'dev-pro',
			name: 'Developer Pro',
			description: 'Advanced API rate limits and custom domains.',
			categoryId: 'developers',
			skuId: 'prod_V0oBbO5pVQMxcC',
			isFeatured: false,
			badge: 'Developer Pro',
			discountPercent: 0,
			features: ['Advanced API access', 'Extended rate limits', 'Unlimited Projects'],
			order: 0,
			enabled: true,
		},
	]);
}
