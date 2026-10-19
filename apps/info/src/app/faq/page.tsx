/** @format */
'use client';

import { Languages, Server, TrendingUp } from 'lucide-react';
import { SidebarNavItem, useDictionary, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

import Environments from '@/components/faq/Environments';
import Translations from '@/components/faq/Translations';
import Bots from '@/components/faq/Bots';
import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

export default function Page() {
	const { show, setNavItems, setView, view } = useSidebar();
	const { t } = useDictionary();
	const [searchQuery, setSearchQuery] = useState('');

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

	const activeView = view || 'translations';
	const isSearching = searchQuery.trim().length > 0;

	return (
		<div className="flex flex-col w-full">
			<div className="max-w-3xl mx-auto w-full pt-6 px-4">
				<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('faq.searchPlaceholder')} />
			</div>

			{isSearching ? (
				<div className="flex flex-col w-full">
					<Translations searchQuery={searchQuery} />
					<Environments searchQuery={searchQuery} />
					<Bots searchQuery={searchQuery} />
				</div>
			) : (
				<AnimatePresence mode="wait">
					<motion.div key={activeView} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
						{activeView === 'translations' && <Translations />}
						{activeView === 'environments' && <Environments />}
						{activeView === 'bots' && <Bots />}
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	);
}
