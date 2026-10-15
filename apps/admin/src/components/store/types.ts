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
