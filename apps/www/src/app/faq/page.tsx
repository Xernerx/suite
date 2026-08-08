/** @format */
'use client';

import { Languages, Server } from 'lucide-react';
import { SidebarNavItem, useDictionary, useSidebar } from '@xernerx/providers';

import Environments from '@/components/faq/Environments';
import Translations from '@/components/faq/Translations';
import { useEffect } from 'react';

export default function Page() {
	const { show, setNavItems, setView, view } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		const items: Array<SidebarNavItem> = [
			{
				icon: Languages,
				label: t('common.nav.items.translations'),
				view: 'translations',
				category: t('common.nav.categories.xernerxSuite'),
			},
			{
				icon: Server,
				label: t('common.nav.items.environments'),
				view: 'environments',
				category: t('common.nav.categories.xernerxSuite'),
			},
		];

		setNavItems(items);

		// Only set the default view if one isn't already active
		if (!view) {
			setView(items.at(0)?.view || null);
		}

		show();
	}, [setView, show, view, t, setNavItems]);

	return (
		<>
			{view === 'translations' && <Translations />}
			{view === 'environments' && <Environments />}
		</>
	);
}
