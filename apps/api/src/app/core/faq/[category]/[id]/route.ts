/** @format */

import { NextResponse } from 'next/server';
import { buildFaqCatalog } from '@/lib/faqCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ category: string; id: string }> }) {
	try {
		const { category, id } = await params;
		const url = new URL(req.url);
		const localeParam = url.searchParams.get('locale') || url.searchParams.get('lang');

		const catalog = await buildFaqCatalog(localeParam, req.url);
		const catNormalized = category.trim().toLowerCase();
		const idNormalized = id.trim().toLowerCase();

		const foundCategory = catalog.categories.find((c) => c.id.toLowerCase() === catNormalized);
		if (!foundCategory) {
			return NextResponse.json(
				{
					error: 'FAQ category not found',
					availableCategories: catalog.categories.map((c) => c.id),
				},
				{ status: 404 }
			);
		}

		const foundCard = foundCategory.items.find(
			(item) => item.id.toLowerCase() === idNormalized || item.slug.toLowerCase() === idNormalized || item.fullId.toLowerCase() === `${catNormalized}.${idNormalized}`
		);

		if (!foundCard) {
			return NextResponse.json(
				{
					error: 'FAQ item not found in category',
					category: foundCategory.id,
					availableItems: foundCategory.items.map((i) => ({ id: i.id, slug: i.slug, question: i.question })),
				},
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				locale: catalog.locale,
				...foundCard,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to fetch FAQ item:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
