/** @format */

export interface UserSubscription {
	stripeSubscriptionId: string;
	priceId: string;
	status: string;
	currentPeriodEnd: string;
}

export interface CatalogPrice {
	id: string;
	unitAmount: number;
	discountedAmount?: number;
	currency: string;
	interval: 'month' | 'year' | 'week' | 'day';
	intervalCount: number;
}

export interface CatalogCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	order: number;
	enabled?: boolean;
}

export interface CatalogItem {
	id: string;
	name: string;
	description: string;
	categoryId: string;
	skuId: string;
	itemType?: 'subscription' | 'credit_pack' | 'credit_perk';
	creditCost?: number;
	creditAmount?: number;
	perkType?: 'none' | 'cdn_slots' | 'showcase_slots' | 'bot_slots' | 'vanity_url' | 'trial_pass' | 'vanity_badge' | 'streak_shield' | 'boost_bot' | 'boost_server';
	perkValue?: any;
	durationDays?: number;
	features: string[];
	badge?: string | null;
	discountPercent: number;
	isFeatured: boolean;
	enabled: boolean;
	order: number;
	stripeName?: string;
	stripeDescription?: string | null;
	prices: CatalogPrice[];
}

export type StripePrice = CatalogPrice;

export interface ProductData {
	name: string;
	description: string | null;
	prices: CatalogPrice[];
}
