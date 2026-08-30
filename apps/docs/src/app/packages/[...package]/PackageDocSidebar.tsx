/** @format */
'use client';

import { useEffect } from 'react';
import { useSidebar } from '@xernerx/providers';
import { Box, ArrowLeft } from 'lucide-react';

export function PackageDocSidebar({ items }: { items: any[] }) {
	const { setNavItems, show, clearNavItems } = useSidebar();

	useEffect(() => {
		show();
		// Fallback icon
		const mappedItems = items.map((i) => ({ ...i, icon: Box }));
		setNavItems([{ label: 'Back to Packages', href: '/packages', icon: ArrowLeft, category: 'Navigation' }, ...mappedItems]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, items]);

	return null;
}
