/** @format */

import { NextResponse } from 'next/server';
import { buildDocsCatalog, filterDocsItems } from '@/lib/docsCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const localeParam = url.searchParams.get('locale') || url.searchParams.get('lang');
		const categoryParam = url.searchParams.get('category')?.trim().toLowerCase();
		const queryParam = url.searchParams.get('q') || url.searchParams.get('search') || '';
		const isFlat = url.searchParams.get('flat') === 'true' || url.searchParams.get('flat') === '1';

		const catalog = await buildDocsCatalog(localeParam, req.url);

		let filteredCategories = catalog.categories;
		if (categoryParam) {
			filteredCategories = filteredCategories.filter((c) => c.id.toLowerCase() === categoryParam);
		}

		if (queryParam.trim()) {
			const matchedCategories = filteredCategories
				.map((cat) => {
					const matchedItems = filterDocsItems(cat.items, queryParam);
					return {
						...cat,
						itemCount: matchedItems.length,
						items: matchedItems,
					};
				})
				.filter((cat) => cat.items.length > 0);

			const matchedFlatItems = matchedCategories.flatMap((c) => c.items);

			return NextResponse.json(
				{
					locale: catalog.locale,
					supportedLocales: catalog.supportedLocales,
					query: queryParam.trim(),
					totalCategories: matchedCategories.length,
					totalItems: matchedFlatItems.length,
					...(isFlat ? { items: matchedFlatItems } : { categories: matchedCategories, items: matchedFlatItems }),
				},
				{ status: 200 }
			);
		}

		const flatItems = filteredCategories.flatMap((c) => c.items);

		if (isFlat) {
			return NextResponse.json(
				{
					locale: catalog.locale,
					supportedLocales: catalog.supportedLocales,
					totalCategories: filteredCategories.length,
					totalItems: flatItems.length,
					items: flatItems,
				},
				{ status: 200 }
			);
		}

		return NextResponse.json(
			{
				locale: catalog.locale,
				supportedLocales: catalog.supportedLocales,
				totalCategories: filteredCategories.length,
				totalItems: flatItems.length,
				categories: filteredCategories,
				items: flatItems,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to build docs catalog:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
