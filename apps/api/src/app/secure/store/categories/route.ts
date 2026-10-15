/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';
import { ensureStoreSeed } from '@/lib/storeSeed';

export async function GET() {
	try {
		await ensureStoreSeed();

		const { models } = await database('xernerx');
		const Category = models.store.Category as any;
		const Item = models.store.Item as any;

		const categories = await Category.find().sort({ order: 1 }).lean();
		const itemCounts = await Item.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]);

		const countMap: Record<string, number> = {};
		itemCounts.forEach((c: any) => {
			countMap[c._id] = c.count;
		});

		const result = categories.map((cat: any) => ({
			...cat,
			itemCount: countMap[cat.id] || 0,
		}));

		return NextResponse.json(result);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Category = models.store.Category as any;

		if (!body.name) {
			return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
		}

		const id =
			body.id?.trim() ||
			body.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '') ||
			crypto.randomUUID();

		const existing = await Category.findOne({ id });
		if (existing) {
			return NextResponse.json({ error: 'A category with this ID/slug already exists' }, { status: 409 });
		}

		const category = await Category.create({
			id,
			name: body.name.trim(),
			description: body.description?.trim() || '',
			icon: body.icon?.trim() || 'ShoppingBag',
			order: typeof body.order === 'number' ? body.order : 0,
			enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
		});

		return NextResponse.json(category, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
