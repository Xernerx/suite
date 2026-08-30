/** @format */
'use client';

import { useEffect } from 'react';
import { useSidebar } from '@xernerx/providers';
import { Package, ArrowLeft } from 'lucide-react';

export function PackagesSidebar() {
	const { setNavItems, show, clearNavItems } = useSidebar();

	useEffect(() => {
		show();
		setNavItems([
			{ label: 'Back to Categories', href: '/', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Available Packages', href: '#overview', icon: Package, category: 'Packages' },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems]);

	return null;
}
