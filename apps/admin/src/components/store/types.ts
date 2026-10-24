/** @format */

export interface StoreCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	order: number;
	enabled: boolean;
	itemCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface StoreItem {
	id: string;
	name: string;
	description: string;
	categoryId: string;
	categoryName?: string;
	skuId: string;
	itemType?: 'subscription' | 'credit_pack' | 'credit_perk';
	creditCost?: number;
	creditAmount?: number;
	perkType?: 'none' | 'cdn_slots' | 'showcase_slots' | 'vanity_url' | 'trial_pass' | 'vanity_badge' | 'streak_shield' | 'boost_bot' | 'boost_server';
	perkValue?: any;
	durationDays?: number;
	features: string[];
	badge?: string | null;
	discountPercent: number;
	isFeatured: boolean;
	enabled: boolean;
	order: number;
	metadata?: Record<string, any>;
	createdAt?: string;
	updatedAt?: string;
}
