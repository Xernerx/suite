/** @format */

import { NextResponse } from 'next/server';
import { buildFaqCatalog, filterFaqItems } from '@/lib/faqCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ category: string }> }) {
	try {
		const { category } = await params;
		const url = new URL(req.url);
		const localeParam = url.searchParams.get('locale') || url.searchParams.get('lang');
		const queryParam = url.searchParams.get('q') || url.searchParams.get('search') || '';

		const catalog = await buildFaqCatalog(localeParam, req.url);
		const normalized = category.trim().toLowerCase();

		if (normalized === 'categories' || normalized === 'sections') {
			return NextResponse.json(
				{
					locale: catalog.locale,
					supportedLocales: catalog.supportedLocales,
					totalSections: catalog.totalSections,
					totalCategories: catalog.totalCategories,
					totalItems: catalog.totalItems,
					sections: catalog.sections,
					categories: catalog.categories.map((c) => ({
						id: c.id,
						title: c.title,
						navTitle: c.navTitle,
						sectionId: c.sectionId,
						sectionTitle: c.sectionTitle,
						url: c.url,
						itemCount: c.itemCount,
					})),
				},
				{ status: 200 }
			);
		}

		if (normalized === 'search') {
			const matches = filterFaqItems(catalog.items, queryParam);
			return NextResponse.json(
				{
					locale: catalog.locale,
					query: queryParam.trim(),
					count: matches.length,
					items: matches,
				},
				{ status: 200 }
			);
		}

		const foundCategory = catalog.categories.find((c) => c.id.toLowerCase() === normalized);
		if (foundCategory) {
			const items = queryParam.trim() ? filterFaqItems(foundCategory.items, queryParam) : foundCategory.items;
			return NextResponse.json(
				{
					locale: catalog.locale,
					...foundCategory,
					itemCount: items.length,
					items,
				},
				{ status: 200 }
			);
		}

		const foundCard = catalog.items.find((item) => item.slug.toLowerCase() === normalized || item.fullId.toLowerCase() === normalized || item.id.toLowerCase() === normalized);
		if (foundCard) {
			return NextResponse.json(
				{
					locale: catalog.locale,
					...foundCard,
				},
				{ status: 200 }
			);
		}

		return NextResponse.json(
			{
				error: 'FAQ category or item not found',
				availableCategories: catalog.categories.map((c) => c.id),
			},
			{ status: 404 }
		);
	} catch (error) {
		console.error('Failed to fetch FAQ category:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
