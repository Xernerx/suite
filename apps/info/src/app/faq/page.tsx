/** @format */
'use client';

import {
	Bot,
	Building2,
	Code,
	Coins,
	Compass,
	CreditCard,
	Eye,
	HardDrive,
	Languages,
	Layers,
	MessageSquare,
	Monitor,
	Package,
	SearchX,
	Server,
	Shield,
	SlidersHorizontal,
	Sparkles,
	Trophy,
	User,
	Webhook,
} from 'lucide-react';
import { FAQ_BLUEPRINTS } from '@xernerx/lib';
import { SidebarNavItem, useDictionary, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import FaqCategorySection, { countMatchingFaqCards } from '@/components/faq/FaqCategorySection';

const LEGACY_CARD_VIEW_MAP: Record<string, string> = {
	'overview.card5': 'feedback',
	'environments.card4': 'feedback',
	'environments.card6': 'feedback',
	'billing.card5': 'feedback',
	'bots.card8': 'leaderboards',
	'bots.card5': 'leaderboards',
	'bots.card1': 'leaderboards',
	'bots.card4': 'webhooks',
	'servers.card3': 'virtue',
	'servers.card7': 'virtue',
	'servers.card8': 'virtue',
	'servers.card9': 'virtue',
	'servers.card4': 'organizations',
	'servers.card5': 'organizations',
	'servers.card6': 'profiles',
	'account.card11': 'profiles',
	'account.card7': 'preferences',
	'account.card8': 'preferences',
	'account.card9': 'preferences',
	'account.card3': 'privacy',
	'account.card12': 'privacy',
	'billing.card3': 'credits',
	'billing.card6': 'credits',
	'billing.card7': 'credits',
	'billing.card8': 'credits',
	'billing.card4': 'cdn',
	'developers.card4': 'webhooks',
	'developers.card3': 'packages',
	'developers.card8': 'packages',
	'developers.card9': 'packages',
};

const CATEGORY_ICONS = {
	overview: Compass,
	environments: Layers,
	feedback: MessageSquare,
	desktop: Monitor,
	bots: Bot,
	servers: Server,
	virtue: Sparkles,
	leaderboards: Trophy,
	organizations: Building2,
	account: Shield,
	profiles: User,
	preferences: SlidersHorizontal,
	privacy: Eye,
	billing: CreditCard,
	credits: Coins,
	cdn: HardDrive,
	developers: Code,
	webhooks: Webhook,
	packages: Package,
	translations: Languages,
} as const;

export default function Page() {
	const { show, setNavItems, setView, view } = useSidebar();
	const { t } = useDictionary();
	const [searchQuery, setSearchQuery] = useState('');
	const hasInitializedUrl = useRef(false);

	useEffect(() => {
		const items: Array<SidebarNavItem> = FAQ_BLUEPRINTS.map((cat) => ({
			icon: CATEGORY_ICONS[cat.id as keyof typeof CATEGORY_ICONS] || Compass,
			label: t(cat.navTitleKey),
			view: cat.id,
			category: t(cat.sectionTitleKey),
		}));

		setNavItems(items);

		if (!hasInitializedUrl.current && typeof window !== 'undefined') {
			hasInitializedUrl.current = true;
			const params = new URLSearchParams(window.location.search);
			const cardParam = (params.get('card') || window.location.hash.replace(/^#/, '') || '').toLowerCase();
			const rawCat = (params.get('category') || params.get('view') || '').toLowerCase();
			const scopedCardKey = cardParam.includes('.') ? cardParam : rawCat && cardParam ? `${rawCat}.${cardParam}` : '';
			const mappedLegacyView = scopedCardKey ? LEGACY_CARD_VIEW_MAP[scopedCardKey] : undefined;
			const cardCatPrefix = cardParam.includes('.') ? cardParam.split('.')[0]?.toLowerCase() : undefined;
			const slugCatMatch = !rawCat && cardParam && !cardParam.includes('.') ? FAQ_BLUEPRINTS.find((cat) => cat.cards.some((c) => c.slug.toLowerCase() === cardParam))?.id : undefined;
			const requestedCat = mappedLegacyView || rawCat || cardCatPrefix || slugCatMatch;
			const requestedQuery = params.get('q') || params.get('search');
			if (requestedQuery) {
				setSearchQuery((prev) => prev || requestedQuery);
			}
			if (requestedCat && items.some((i) => i.view === requestedCat)) {
				setView(requestedCat);
				show();
				return;
			}
		}

		if (!view) {
			setView(items.at(0)?.view || null);
		}

		show();
	}, [setView, show, view, t, setNavItems]);

	const activeView = view || 'overview';
	const isSearching = searchQuery.trim().length > 0;
	const matchCount = isSearching ? countMatchingFaqCards(searchQuery, t) : 1;

	return (
		<div className="flex flex-col w-full">
			<div className="max-w-(--page-width) mx-auto w-full pt-6" style={{ paddingInline: 'var(--ui-gap)' }}>
				<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('faq.searchPlaceholder')} />
			</div>

			{isSearching ? (
				<div className="flex flex-col w-full">
					<h1 className="sr-only">{t('faq.overview.title')}</h1>
					{matchCount === 0 ? (
						<div className="max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)' }}>
							<div
								className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-center shadow-sm"
								style={{ padding: 'calc(var(--ui-gap) * 2)', gap: 'calc(var(--ui-gap) * 0.5)' }}
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent)/10 border border-(--accent)/30 text-(--accent)">
									<SearchX size={22} />
								</div>
								<p className="text-sm font-medium text-(--text-muted)">{t('faq.noResults', { query: searchQuery.trim() })}</p>
							</div>
						</div>
					) : (
						FAQ_BLUEPRINTS.map((cat) => <FaqCategorySection key={cat.id} categoryId={cat.id} searchQuery={searchQuery} />)
					)}
				</div>
			) : (
				<AnimatePresence mode="wait">
					<motion.div key={activeView} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
						<FaqCategorySection categoryId={activeView} />
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	);
}
