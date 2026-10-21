/** @format */
'use client';

import { useEffect } from 'react';
import { useSidebar, useDictionary } from '@xernerx/providers';
import { ArrowLeft, Box, Code, FileCode2, Layers } from 'lucide-react';

interface PackageDocSidebarProps {
	items: { label: string; href: string; category: string }[];
	hasClasses?: boolean;
	hasInterfaces?: boolean;
	hasFunctions?: boolean;
}

export function PackageDocSidebar({ items, hasClasses = false, hasInterfaces = false, hasFunctions = false }: PackageDocSidebarProps) {
	const { setNavItems, show, clearNavItems, view, setView } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		if (!view) {
			setView('all');
		}
	}, [view, setView]);

	useEffect(() => {
		show();
		const viewFilters = [
			{ label: t('docs.api.common.nav.allEndpoints'), view: 'all', icon: Layers, category: t('docs.packages.details.navigation') },
			...(hasClasses ? [{ label: t('docs.packages.details.classes'), view: 'classes', icon: Box, category: t('docs.packages.details.navigation') }] : []),
			...(hasInterfaces ? [{ label: t('docs.packages.details.interfaces'), view: 'interfaces', icon: FileCode2, category: t('docs.packages.details.navigation') }] : []),
			...(hasFunctions ? [{ label: t('docs.packages.details.functions'), view: 'functions', icon: Code, category: t('docs.packages.details.navigation') }] : []),
		];

		const mappedItems = items.map((i) => ({ ...i, icon: FileCode2 }));
		setNavItems([{ label: t('docs.packages.details.backToPackages'), href: '/packages', icon: ArrowLeft, category: t('docs.packages.details.navigation') }, ...viewFilters, ...mappedItems]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, items, hasClasses, hasInterfaces, hasFunctions, t]);

	return null;
}
