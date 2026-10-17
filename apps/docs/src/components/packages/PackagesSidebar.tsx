/** @format */
'use client';

import { useEffect } from 'react';
import { useSidebar, useDictionary } from '@xernerx/providers';
import { Package, ArrowLeft } from 'lucide-react';

export function PackagesSidebar() {
	const { setNavItems, show, clearNavItems } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		show();
		setNavItems([
			{ label: t('docs.packages.sidebar.backToCategories'), href: '/', icon: ArrowLeft, category: t('docs.packages.sidebar.categoryNavigation') },
			{ label: t('docs.packages.sidebar.availablePackages'), href: '#overview', icon: Package, category: t('docs.packages.sidebar.categoryPackages') },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, t]);

	return null;
}
