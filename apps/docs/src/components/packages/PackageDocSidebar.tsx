/** @format */
// Force recompile
'use client';

import { useEffect } from 'react';
import { useSidebar, useDictionary } from '@xernerx/providers';
import { Box, ArrowLeft } from 'lucide-react';

export function PackageDocSidebar({ items }: { items: any[] }) {
	const { setNavItems, show, clearNavItems } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		show();
		// Fallback icon
		const mappedItems = items.map((i) => ({ ...i, icon: Box }));
		setNavItems([{ label: t('docs.packages.details.backToPackages'), href: '/packages', icon: ArrowLeft, category: t('docs.packages.details.navigation') }, ...mappedItems]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, items, t]);

	return null;
}
