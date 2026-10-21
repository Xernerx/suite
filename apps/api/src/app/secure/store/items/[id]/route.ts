/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const itemId = (await params).id;
		const body = await req.json();

		const { models } = await database('xernerx');
		const Item = models.store.Item as any;

		const item = await Item.findOne({ id: itemId });
		if (!item) {
			return NextResponse.json({ error: 'Item not found' }, { status: 404 });
		}

		if (body.name !== undefined) item.name = body.name.trim();
		if (body.description !== undefined) item.description = body.description.trim();
		if (body.categoryId !== undefined) item.categoryId = body.categoryId.trim();
		if (body.skuId !== undefined) item.skuId = body.skuId.trim();
		if (body.itemType !== undefined && ['subscription', 'credit_pack', 'credit_perk'].includes(body.itemType)) {
			item.itemType = body.itemType;
		}
		if (body.creditCost !== undefined) item.creditCost = Math.max(0, Number(body.creditCost) || 0);
		if (body.creditAmount !== undefined) item.creditAmount = Math.max(0, Number(body.creditAmount) || 0);
		if (body.perkType !== undefined && ['none', 'cdn_slots', 'showcase_slots', 'trial_pass', 'vanity_badge'].includes(body.perkType)) {
			item.perkType = body.perkType;
		}
		if (body.perkValue !== undefined) item.perkValue = body.perkValue;
		if (body.durationDays !== undefined) item.durationDays = Math.max(0, Number(body.durationDays) || 0);
		if (body.badge !== undefined) item.badge = body.badge?.trim() || null;
		if (body.discountPercent !== undefined) {
			item.discountPercent = Math.max(0, Math.min(100, Number(body.discountPercent) || 0));
		}
		if (body.isFeatured !== undefined) item.isFeatured = Boolean(body.isFeatured);
		if (body.enabled !== undefined) item.enabled = Boolean(body.enabled);
		if (typeof body.order === 'number') item.order = body.order;
		if (body.features !== undefined) {
			item.features = Array.isArray(body.features)
				? body.features
				: typeof body.features === 'string'
					? body.features
							.split('\n')
							.map((s: string) => s.trim())
							.filter(Boolean)
					: [];
		}

		await item.save();

		return NextResponse.json(item);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const itemId = (await params).id;
		const { models } = await database('xernerx');
		const Item = models.store.Item as any;

		const deleted = await Item.findOneAndDelete({ id: itemId });
		if (!deleted) {
			return NextResponse.json({ error: 'Item not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, id: itemId });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
