/** @format */
'use client';

import { useEffect } from 'react';
import { useSidebar, useDictionary } from '@xernerx/providers';
import { Package, ArrowLeft, Box } from 'lucide-react';

export function PackagesSidebar({ packages = [] }: { packages?: { name: string; versions: string[] }[] }) {
	const { setNavItems, show, clearNavItems } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		show();
		const packageNavItems = packages.map((pkg) => ({
			label: pkg.name,
			href: `/packages/${pkg.name}/${pkg.versions[0]}`,
			icon: Box,
			category: t('docs.packages.sidebar.categoryPackages'),
		}));

		setNavItems([
			{ label: t('docs.packages.sidebar.backToCategories'), href: '/', icon: ArrowLeft, category: t('docs.packages.sidebar.categoryNavigation') },
			{ label: t('docs.packages.sidebar.availablePackages'), href: '#overview', icon: Package, category: t('docs.packages.sidebar.categoryPackages') },
			...packageNavItems,
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, packages, t]);

	return null;
}
