/** @format */
'use client';

import { Languages, Server, TrendingUp } from 'lucide-react';
import { SidebarNavItem, useDictionary, useSidebar } from '@xernerx/providers';

import Environments from '@/components/faq/Environments';
import Translations from '@/components/faq/Translations';
import Bots from '@/components/faq/Bots';
import { useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

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
			{
				icon: TrendingUp,
				label: t('faq.bots.title'),
				view: 'bots',
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
		<AnimatePresence mode="wait">
			<motion.div key={view} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
				{view === 'translations' && <Translations />}
				{view === 'environments' && <Environments />}
				{view === 'bots' && <Bots />}
			</motion.div>
		</AnimatePresence>
	);
}
