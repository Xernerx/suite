/** @format */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowLeft, Award, BarChart2, Bot, Code, Compass, Globe, HelpCircle, Key, Layers, Lock, Map, Settings2, Shield, ShoppingBag, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SidebarNavItem, useSidebar, useDictionary } from '@xernerx/providers';
import { Loading, NotPermitted } from '@xernerx/feedback';
import { Input, Selector } from '@xernerx/ui';

import { useParams, useRouter } from 'next/navigation';
import { V1Endpoints } from '@/components/api/V1Endpoints';
import { CoreEndpoints } from '@/components/api/CoreEndpoints';
import { SecureEndpoints } from '@/components/api/SecureEndpoints';
import { ApiPlayground } from '@/components/api/ApiPlayground';
import { ApiOverviewAndAuth } from '@/components/api/ApiOverviewAndAuth';
import { useDocsAccess } from '@/components/useDocsAccess';

const HASH_TO_VIEW: Record<string, string> = {
	overview: 'overview',
	authentication: 'overview',
	playground: 'playground',
	'fetch-bot-profile': 'v1-profiles',
	'update-bot-profile': 'v1-profiles',
	'delete-bot-profile': 'v1-profiles',
	'fetch-bot-badges': 'v1-badges',
	'fetch-bot-stats': 'v1-stats',
	'post-bot-stats': 'v1-stats',
	'update-bot-stats': 'v1-stats',
	'delete-bot-stats': 'v1-stats',
	'fetch-bot-commands': 'v1-commands',
	'sync-bot-commands': 'v1-commands',
	'delete-bot-commands': 'v1-commands',
	'post-bot-releases': 'v1-platform',
	'fetch-leaderboard': 'v1-platform',
	'fetch-changelog-rss': 'v1-platform',
	'fetch-version-changelog': 'v1-platform',
	'fetch-bot-embed': 'core-embeds',
	'fetch-organization-embed': 'core-embeds',
	'fetch-guild-embed': 'core-embeds',
	'fetch-user-embed': 'core-embeds',
	'core-faq': 'core-faq',
	'core-docs': 'core-faq',
	'info-status': 'core-info',
	'info-roadmap': 'core-info',
	'info-suggestions': 'core-info',
	'info-issues': 'core-info',
	'fetch-discord-profile': 'core-discord',
	'fetch-discord-guilds': 'core-discord',
	'fetch-discord-guild': 'core-discord',
	'fetch-discord-roles': 'core-discord',
};

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export default function APIDocs() {
	const { version } = useParams() as { version: string };
	const router = useRouter();
	const { setNavItems, show, hide, clearNavItems, view, setView } = useSidebar();
	const { t } = useDictionary();
	const { isAdmin, loading } = useDocsAccess();

	const [searchQuery, setSearchQuery] = useState('');
	const [methodFilter, setMethodFilter] = useState<string>('ALL');
	const [playgroundTarget, setPlaygroundTarget] = useState<{ method: string; path: string } | null>(null);

	useEffect(() => {
		if (version === 'secure' && !loading && !isAdmin) {
			clearNavItems();
			hide();
			return;
		}

		show();

		const navItems: SidebarNavItem[] = [
			{ label: t('docs.api.common.nav.back'), href: '/', icon: ArrowLeft, category: t('docs.api.common.nav.categoryNavigation') },
			{ label: t('docs.api.common.nav.overviewAndAuth'), view: 'overview', icon: Compass, category: t('docs.api.common.nav.categoryRestApi') },
			{ label: t('docs.api.playground.title'), view: 'playground', icon: Terminal, category: t('docs.api.common.nav.categoryRestApi') },
			{ label: t('docs.api.common.nav.allEndpoints'), view: 'all', icon: Layers, category: t('docs.api.common.nav.endpoints') },
		];

		if (version === 'v1') {
			navItems.push(
				{ label: t('docs.api.common.groups.v1Profiles'), view: 'v1-profiles', icon: Bot, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.v1Stats'), view: 'v1-stats', icon: BarChart2, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.v1Commands'), view: 'v1-commands', icon: Code, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.v1Badges'), view: 'v1-badges', icon: Award, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.v1Platform'), view: 'v1-platform', icon: Activity, category: t('docs.api.common.nav.endpoints') }
			);
		} else if (version === 'core') {
			navItems.push(
				{ label: t('docs.api.common.groups.coreEmbeds'), view: 'core-embeds', icon: Globe, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.coreFaq'), view: 'core-faq', icon: HelpCircle, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.coreInfo'), view: 'core-info', icon: Map, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.coreDiscord'), view: 'core-discord', icon: Shield, category: t('docs.api.common.nav.endpoints') }
			);
		} else if (version === 'secure' && isAdmin) {
			navItems.push(
				{ label: t('docs.api.common.groups.secureEntities'), view: 'secure-entities', icon: Bot, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.secureCommerce'), view: 'secure-commerce', icon: ShoppingBag, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.secureModeration'), view: 'secure-moderation', icon: Shield, category: t('docs.api.common.nav.endpoints') },
				{ label: t('docs.api.common.groups.secureSystem'), view: 'secure-system', icon: Settings2, category: t('docs.api.common.nav.endpoints') }
			);
		}

		setNavItems(navItems);

		const validViews = new Set(navItems.map((i) => i.view).filter(Boolean));
		if (typeof window !== 'undefined' && window.location.hash) {
			const rawHash = window.location.hash.replace('#', '');
			const mappedView = HASH_TO_VIEW[rawHash];
			if (mappedView && validViews.has(mappedView)) {
				setView(mappedView);
				return () => clearNavItems();
			}
		}

		if (!view || !validViews.has(view)) {
			setView('overview');
		}

		return () => clearNavItems();
	}, [setNavItems, show, hide, clearNavItems, version, isAdmin, loading, t, view, setView]);

	if (version === 'secure') {
		if (loading) return <Loading />;
		if (!isAdmin) return <NotPermitted view="/secure API" />;
	}

	const activeView = view || 'overview';
	const isEndpointView = activeView !== 'overview' && activeView !== 'playground';
	const isFiltering = isEndpointView && (searchQuery.trim().length > 0 || methodFilter !== 'ALL');

	const handleTryRoute = (method: string, path: string) => {
		setPlaygroundTarget({ method, path });
		setSearchQuery('');
		setMethodFilter('ALL');
		setView('playground');
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	return (
		<div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
			{/* Clean Page Header & Namespace Switcher */}
			<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-(--border)/10 pb-6">
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							Xernerx {t('docs.api.common.title')}
						</h1>
						<span className="px-3 py-1 rounded-full text-sm font-extrabold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/30">/{version}</span>
					</div>
					<p className="text-base text-(--text-muted) leading-relaxed max-w-2xl">{t('docs.api.common.description', { version: version.toUpperCase() })}</p>
				</div>

				{/* Namespace Switcher Pills + Mobile Selector */}
				<div className="flex items-center gap-2 shrink-0">
					<div className="hidden sm:flex items-center p-1 rounded-2xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 gap-1">
						{(['v1', 'core', ...(isAdmin ? ['secure'] : [])] as const).map((ver) => (
							<button
								key={ver}
								type="button"
								onClick={() => router.push(`/api/${ver}`)}
								className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
									version === ver ? 'bg-(--accent) text-white shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)]' : 'text-(--text-muted) hover:text-(--text)'
								}`}
							>
								{ver === 'secure' ? <Lock size={12} /> : ver === 'v1' ? <Key size={12} /> : <Globe size={12} />}
								<span className="uppercase">{ver}</span>
							</button>
						))}
					</div>

					<div className="w-full sm:hidden">
						<Selector
							value={version}
							onChange={(val: string) => router.push(`/api/${val}`)}
							options={[{ label: 'v1', value: 'v1' }, { label: 'core', value: 'core' }, ...(isAdmin ? [{ label: 'secure', value: 'secure' }] : [])]}
							placeholder={t('docs.api.common.selectVersion')}
						/>
					</div>
				</div>
			</div>

			{/* Endpoint Search Bar & HTTP Method Filter Pills (Only on Endpoint Views) */}
			{isEndpointView && (
				<div
					className="flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex-1">
						<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('docs.api.common.searchEndpointsPlaceholder')} />
					</div>

					<div className="flex flex-wrap items-center gap-1.5 shrink-0">
						{HTTP_METHODS.map((m) => {
							const isSelected = methodFilter === m;
							return (
								<button
									key={m}
									type="button"
									onClick={() => setMethodFilter(m)}
									className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
										isSelected
											? 'bg-(--accent) text-white border-(--accent) shadow-sm'
											: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
									}`}
								>
									{m}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Active View Content */}
			{isFiltering ? (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center justify-between px-2">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">
							{t('docs.api.common.filteringEndpoints')} ({version.toUpperCase()})
						</span>
						<button
							type="button"
							onClick={() => {
								setSearchQuery('');
								setMethodFilter('ALL');
							}}
							className="text-xs font-bold text-(--accent) hover:underline cursor-pointer"
						>
							{t('docs.api.common.clearFilters')}
						</button>
					</div>
					{version === 'v1' && <V1Endpoints activeGroup="all" searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={false} onTryRoute={handleTryRoute} />}
					{version === 'core' && <CoreEndpoints activeGroup="all" searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={false} onTryRoute={handleTryRoute} />}
					{version === 'secure' && isAdmin && <SecureEndpoints activeGroup="all" searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={false} onTryRoute={handleTryRoute} />}
				</div>
			) : (
				<AnimatePresence mode="wait">
					<motion.div
						key={`${version}-${activeView}`}
						initial={{ opacity: 1, y: 0 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className="flex flex-col"
						style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}
					>
						{activeView === 'overview' && (
							<ApiOverviewAndAuth version={version} isAdmin={isAdmin} onSwitchVersion={(ver) => router.push(`/api/${ver}`)} onOpenEndpoints={(targetView) => setView(targetView)} />
						)}

						{activeView === 'playground' && <ApiPlayground version={version} initialMethod={playgroundTarget?.method} initialPath={playgroundTarget?.path} />}

						{isEndpointView && (
							<>
								{version === 'v1' && (
									<V1Endpoints activeGroup={activeView} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={activeView !== 'all'} onTryRoute={handleTryRoute} />
								)}
								{version === 'core' && (
									<CoreEndpoints activeGroup={activeView} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={activeView !== 'all'} onTryRoute={handleTryRoute} />
								)}
								{version === 'secure' && isAdmin && (
									<SecureEndpoints
										activeGroup={activeView}
										searchQuery={searchQuery}
										methodFilter={methodFilter}
										defaultExpanded={activeView !== 'all'}
										onTryRoute={handleTryRoute}
									/>
								)}
							</>
						)}
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	);
}
