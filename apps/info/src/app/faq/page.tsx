/** @format */
'use client';

import { Building2, Code, Compass, CreditCard, Languages, Monitor, Server, Shield, TrendingUp } from 'lucide-react';
import { SidebarNavItem, useDictionary, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

import EcosystemAndNavigation from '@/components/faq/EcosystemAndNavigation';
import Environments from '@/components/faq/Environments';
import DesktopAndOverlay from '@/components/faq/DesktopAndOverlay';
import Bots from '@/components/faq/Bots';
import ServersAndOrganizations from '@/components/faq/ServersAndOrganizations';
import AccountAndSecurity from '@/components/faq/AccountAndSecurity';
import BillingAndStore from '@/components/faq/BillingAndStore';
import ApiAndDevelopers from '@/components/faq/ApiAndDevelopers';
import Translations from '@/components/faq/Translations';
import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

export default function Page() {
	const { show, setNavItems, setView, view } = useSidebar();
	const { t } = useDictionary();
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		const items: Array<SidebarNavItem> = [
			{
				icon: Compass,
				label: t('faq.overview.navTitle'),
				view: 'overview',
				category: t('faq.category.platform'),
			},
			{
				icon: Server,
				label: t('common.nav.items.environments'),
				view: 'environments',
				category: t('faq.category.platform'),
			},
			{
				icon: Monitor,
				label: t('faq.desktop.navTitle'),
				view: 'desktop',
				category: t('faq.category.platform'),
			},
			{
				icon: TrendingUp,
				label: t('faq.bots.navTitle'),
				view: 'bots',
				category: t('faq.category.community'),
			},
			{
				icon: Building2,
				label: t('faq.servers.navTitle'),
				view: 'servers',
				category: t('faq.category.community'),
			},
			{
				icon: Shield,
				label: t('faq.account.navTitle'),
				view: 'account',
				category: t('faq.category.accountAndDevs'),
			},
			{
				icon: CreditCard,
				label: t('faq.billing.navTitle'),
				view: 'billing',
				category: t('faq.category.accountAndDevs'),
			},
			{
				icon: Code,
				label: t('faq.developers.navTitle'),
				view: 'developers',
				category: t('faq.category.accountAndDevs'),
			},
			{
				icon: Languages,
				label: t('common.nav.items.translations'),
				view: 'translations',
				category: t('faq.category.accountAndDevs'),
			},
		];

		setNavItems(items);

		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const requestedCat = params.get('category')?.toLowerCase();
			const requestedQuery = params.get('q') || params.get('search');
			if (requestedQuery) {
				setSearchQuery((prev) => prev || requestedQuery);
			}
			if (requestedCat && items.some((i) => i.view === requestedCat) && !view) {
				setView(requestedCat);
				show();
				return;
			}
		}

		// Only set the default view if one isn't already active
		if (!view) {
			setView(items.at(0)?.view || null);
		}

		show();
	}, [setView, show, view, t, setNavItems]);

	const activeView = view || 'overview';
	const isSearching = searchQuery.trim().length > 0;

	return (
		<div className="flex flex-col w-full">
			<div className="max-w-3xl mx-auto w-full pt-6 px-4">
				<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('faq.searchPlaceholder')} />
			</div>

			{isSearching ? (
				<div className="flex flex-col w-full">
					<h1 className="sr-only">{t('faq.overview.title')}</h1>
					<EcosystemAndNavigation searchQuery={searchQuery} />
					<Environments searchQuery={searchQuery} />
					<DesktopAndOverlay searchQuery={searchQuery} />
					<Bots searchQuery={searchQuery} />
					<ServersAndOrganizations searchQuery={searchQuery} />
					<AccountAndSecurity searchQuery={searchQuery} />
					<BillingAndStore searchQuery={searchQuery} />
					<ApiAndDevelopers searchQuery={searchQuery} />
					<Translations searchQuery={searchQuery} />
				</div>
			) : (
				<AnimatePresence mode="wait">
					<motion.div key={activeView} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
						{activeView === 'overview' && <EcosystemAndNavigation />}
						{activeView === 'environments' && <Environments />}
						{activeView === 'desktop' && <DesktopAndOverlay />}
						{activeView === 'bots' && <Bots />}
						{activeView === 'servers' && <ServersAndOrganizations />}
						{activeView === 'account' && <AccountAndSecurity />}
						{activeView === 'billing' && <BillingAndStore />}
						{activeView === 'developers' && <ApiAndDevelopers />}
						{activeView === 'translations' && <Translations />}
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	);
}
