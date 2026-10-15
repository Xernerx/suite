/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { ensureStoreSeed } from '@/lib/storeSeed';

export async function GET() {
	try {
		await ensureStoreSeed();

		const { models } = await database('xernerx');
		const Item = models.store.Item as any;
		const Category = models.store.Category as any;

		const [items, categories] = await Promise.all([Item.find().sort({ categoryId: 1, order: 1 }).lean(), Category.find().lean()]);

		const categoryMap: Record<string, string> = {};
		categories.forEach((cat: any) => {
			categoryMap[cat.id] = cat.name;
		});

		const enriched = items.map((item: any) => ({
			...item,
			categoryName: categoryMap[item.categoryId] || item.categoryId,
		}));

		return NextResponse.json(enriched);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Item = models.store.Item as any;

		if (!body.name?.trim() || !body.skuId?.trim() || !body.categoryId?.trim()) {
			return NextResponse.json({ error: 'Name, SKU ID (Stripe Product ID), and Category are required' }, { status: 400 });
		}

		const id =
			body.id?.trim() ||
			body.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '') +
				'-' +
				crypto.randomBytes(3).toString('hex');

		const existing = await Item.findOne({ id });
		if (existing) {
			return NextResponse.json({ error: 'An item with this ID already exists' }, { status: 409 });
		}

		const features = Array.isArray(body.features)
			? body.features
			: typeof body.features === 'string'
				? body.features
						.split('\n')
						.map((s: string) => s.trim())
						.filter(Boolean)
				: [];

		const item = await Item.create({
			id,
			name: body.name.trim(),
			description: body.description?.trim() || '',
			categoryId: body.categoryId.trim(),
			skuId: body.skuId.trim(),
			features,
			badge: body.badge?.trim() || null,
			discountPercent: Math.max(0, Math.min(100, Number(body.discountPercent) || 0)),
			isFeatured: Boolean(body.isFeatured),
			enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
			order: typeof body.order === 'number' ? body.order : 0,
		});

		return NextResponse.json(item, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
