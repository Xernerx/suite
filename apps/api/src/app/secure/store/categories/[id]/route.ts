/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const categoryId = (await params).id;
		const body = await req.json();

		const { models } = await database('xernerx');
		const Category = models.store.Category as any;

		const category = await Category.findOne({ id: categoryId });
		if (!category) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 });
		}

		if (body.name !== undefined) category.name = body.name.trim();
		if (body.description !== undefined) category.description = body.description.trim();
		if (body.icon !== undefined) category.icon = body.icon.trim();
		if (typeof body.order === 'number') category.order = body.order;
		if (typeof body.enabled === 'boolean') category.enabled = body.enabled;

		await category.save();

		return NextResponse.json(category);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const categoryId = (await params).id;
		const { models } = await database('xernerx');
		const Category = models.store.Category as any;
		const Item = models.store.Item as any;

		const deleted = await Category.findOneAndDelete({ id: categoryId });
		if (!deleted) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 });
		}

		// Delete items belonging to this category
		await Item.deleteMany({ categoryId });

		return NextResponse.json({ success: true, id: categoryId });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
