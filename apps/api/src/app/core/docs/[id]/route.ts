/** @format */

import { NextResponse } from 'next/server';
import { buildDocsCatalog } from '@/lib/docsCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const url = new URL(req.url);
		const localeParam = url.searchParams.get('locale') || url.searchParams.get('lang');

		const catalog = await buildDocsCatalog(localeParam, req.url);
		const idNormalized = id.trim().toLowerCase();

		const foundItem = catalog.items.find((item) => item.id.toLowerCase() === idNormalized || item.slug.toLowerCase() === idNormalized || (item.path && item.path.toLowerCase() === idNormalized));

		if (!foundItem) {
			return NextResponse.json(
				{
					error: 'Documentation topic not found',
					availableItems: catalog.items.map((i) => ({ id: i.id, slug: i.slug, title: i.title })),
				},
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				locale: catalog.locale,
				...foundItem,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to fetch doc item:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
