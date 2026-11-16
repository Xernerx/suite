/** @format */

export const pack = (id: string, name: string, description: string, skuId: string, creditAmount: number, badge: string, isFeatured: boolean, features: string[], order: number) => ({
	id,
	name,
	description,
	categoryId: 'credits',
	skuId,
	itemType: 'credit_pack',
	creditCost: 0,
	creditAmount,
	perkType: 'none',
	perkValue: null,
	durationDays: 0,
	isFeatured,
	badge,
	discountPercent: 0,
	features,
	order,
	enabled: true,
});

export const perk = (
	id: string,
	name: string,
	description: string,
	creditCost: number,
	perkType: string,
	perkValue: string | number | null,
	durationDays: number,
	badge: string,
	isFeatured: boolean,
	features: string[],
	order: number
) => ({
	id,
	name,
	description,
	categoryId: 'credits',
	skuId: '',
	itemType: 'credit_perk',
	creditCost,
	creditAmount: 0,
	perkType,
	perkValue,
	durationDays,
	isFeatured,
	badge,
	discountPercent: 0,
	features,
	order,
	enabled: true,
});

export const STORE_PACKS_AND_SLOTS_ITEMS = [
	// Stripe Credit Top-Up Packs
	pack(
		'credits-500',
		'500 Credits Pack',
		'Base pack of 500 ecosystem credits (€5.00 standard tier).',
		'prod_VVSmsiI2diTKyl',
		500,
		'Starter Pack',
		false,
		['500 Instant Ecosystem Credits', 'Redeemable for CDN slots, showcases, trials & badges'],
		0
	),
	pack(
		'credits-1200',
		'1,200 Credits Pack',
		'1,000 base credits + 200 bonus credits (€10.00 value tier).',
		'prod_credits_1200',
		1200,
		'+20% Bonus',
		false,
		['1,200 Instant Ecosystem Credits', 'Includes 200 free bonus credits'],
		1
	),
	pack(
		'credits-3250',
		'3,250 Credits Vault',
		'2,500 base credits + 750 bonus credits (€25.00 popular bundle).',
		'prod_credits_3250',
		3250,
		'+30% Bonus',
		true,
		['3,250 Instant Ecosystem Credits', 'Includes 750 free bonus credits', 'Enough for +3 CDN Slots or a 3-Slot Showcase Pack'],
		2
	),
	pack(
		'credits-7000',
		'7,000 Credits Treasury',
		'5,000 base credits + 2,000 bonus credits (€50.00 maximum value chest).',
		'prod_credits_7000',
		7000,
		'+40% Best Value',
		false,
		['7,000 Instant Ecosystem Credits', 'Includes 2,000 free bonus credits', 'Ideal for High-Spender badges & bulk slot upgrades'],
		3
	),

	// CDN Upload Slots
	perk(
		'perk-cdn-1',
		'+1 CDN Media Slot',
		'Permanently expand your Media Library upload limit by 1 slot.',
		1000,
		'cdn_slots',
		1,
		0,
		'CDN Storage',
		false,
		['+1 Permanent CDN Upload Slot', 'Stacks infinitely on top of your base 10 free slots'],
		10
	),
	perk(
		'perk-cdn-3',
		'+3 CDN Media Slots',
		'Bundle of 3 permanent CDN upload slots at a 500-credit discount.',
		2500,
		'cdn_slots',
		3,
		0,
		'Save 500 Credits',
		true,
		['+3 Permanent CDN Upload Slots', '17% cheaper than buying single slots', 'Stacks with existing storage capacity'],
		11
	),
	perk(
		'perk-cdn-10',
		'+10 CDN Media Slots',
		'Creator pack of 10 permanent CDN upload slots at a 2,500-credit discount.',
		7500,
		'cdn_slots',
		10,
		0,
		'Save 2,500 Credits',
		false,
		['+10 Permanent CDN Upload Slots', '25% bundle discount over individual slots', 'Doubles your base free media quota'],
		12
	),

	// Profile Showcase Slots
	perk(
		'perk-showcase-1',
		'+1 Profile Showcase Slot',
		'Unlock an extra pinned showcase card on your public Xernerx profile.',
		1500,
		'showcase_slots',
		1,
		0,
		'Profile Customization',
		false,
		['+1 Permanent Profile Showcase Slot', 'Feature custom links, projects, or CDN artwork on your profile'],
		20
	),
	perk(
		'perk-showcase-3',
		'+3 Profile Showcase Slots',
		'Unlock 3 additional showcase cards for your public profile at a 1,000-credit discount.',
		3500,
		'showcase_slots',
		3,
		0,
		'Save 1,000 Credits',
		true,
		['+3 Permanent Profile Showcase Slots', '22% bundle discount', 'Curate a full portfolio showcase on app.xernerx.com'],
		21
	),

	// Custom Vanity URLs
	perk(
		'perk-vanity-1',
		'+1 Custom Vanity URL Slot',
		'Unlock a permanent custom vanity URL slug for your User Profile, Bot, Server, or Organization.',
		2000,
		'vanity_url',
		1,
		0,
		'Vanity URL',
		false,
		['+1 Permanent Custom Vanity URL Slot', 'Redeemable on any Profile, Bot, Server, or Organization you own', 'Change your custom slug anytime once unlocked'],
		25
	),
	perk(
		'perk-vanity-3',
		'+3 Custom Vanity URL Slots',
		'Bundle of 3 permanent Custom Vanity URL slots for your profiles, bots, and servers at a 1,000-credit discount.',
		5000,
		'vanity_url',
		3,
		0,
		'Save 1,000 Credits',
		true,
		['+3 Permanent Custom Vanity URL Slots', 'Save 1,000 Credits compared to single slots', 'Use across your User Profile, Bots, Servers & Organizations'],
		26
	),

	// Developer Bot & API Token Slots
	perk(
		'perk-bot-slot-1',
		'+1 Bot & API Token Slot',
		'Permanently expand your Developer API token & bot linking quota by 1 slot on top of your base 1 free bot slot.',
		2500,
		'bot_slots',
		1,
		0,
		'Developer Perk',
		false,
		['+1 Permanent Bot & API Token Slot', 'Stacks infinitely on top of your 1 free bot slot', 'Link an additional Discord bot to the Developer Portal & REST API'],
		27
	),
	perk(
		'perk-bot-slot-3',
		'+3 Bot & API Token Slots',
		'Developer bundle of 3 permanent Bot & API Token slots at a 1,500-credit discount.',
		6000,
		'bot_slots',
		3,
		0,
		'Save 1,500 Credits',
		true,
		['+3 Permanent Bot & API Token Slots', '20% bundle discount over single slots', 'Ideal for multi-bot developers & organizations'],
		28
	),

	// Trial Passes
	perk(
		'perk-trial-virtue-3d',
		'3-Day Virtue Trial Pass',
		'Unlock full Virtue Pass premium features for 72 hours using credits.',
		900,
		'trial_pass',
		'bot-virtue',
		3,
		'72h Trial',
		false,
		['72 hours of full Virtue Pass access', 'No recurring charge — expires automatically'],
		30
	),
	perk(
		'perk-trial-zodiac-3d',
		'3-Day Zodiac Trial Pass',
		'Unlock full Zodiac Pass premium features for 72 hours using credits.',
		900,
		'trial_pass',
		'bot-zodiac',
		3,
		'72h Trial',
		false,
		['72 hours of full Zodiac Pass access', 'No recurring charge — expires automatically'],
		31
	),
	perk(
		'perk-trial-ultra-3d',
		'3-Day Ultra Ecosystem Trial',
		'Experience the complete Ultra Ecosystem bundle and 1,000 CDN slots for 3 days.',
		2000,
		'trial_pass',
		'ultra',
		3,
		'All-Access Trial',
		true,
		['72 hours of Ultra Ecosystem access', 'Includes all consumer bots & 1,000 CDN upload quota during trial'],
		32
	),
	perk(
		'perk-trial-ultra-7d',
		'7-Day Ultra Ecosystem Trial',
		'Unlock a full week of Ultra Ecosystem access with your credits.',
		4000,
		'trial_pass',
		'ultra',
		7,
		'7-Day Pass',
		false,
		['7 full days of Ultra Ecosystem access', 'Extendable anytime with additional credits'],
		33
	),

	// Streak Protection & Gamification Perks
	perk(
		'perk-streak-shield',
		'Daily Streak Shield',
		'Protect your daily credit streak from resetting if you ever miss the 48-hour claim grace window. Stackable up to 3 shields.',
		500,
		'streak_shield',
		1,
		0,
		'Max 3 Active',
		false,
		['Automatically saves your streak if you miss a daily claim window', 'Stackable up to 3 active Streak Shields in your wallet'],
		35
	),
];
