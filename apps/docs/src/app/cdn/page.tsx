/** @format */
'use client';

import { ArrowLeft, Eye, FileText, Globe, Layers, Trash2, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { Loading, NotPermitted } from '@xernerx/feedback';
import { Input } from '@xernerx/ui';
import { CdnOverviewAndAuth } from '@/components/cdn/CdnOverviewAndAuth';
import { CdnEndpoints } from '@/components/cdn/CdnEndpoints';
import { useDocsAccess } from '@/components/useDocsAccess';

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PATCH', 'DELETE'] as const;

const HASH_TO_VIEW: Record<string, string> = {
	overview: 'overview',
	authentication: 'overview',
	upload: 'upload',
	list: 'list',
	manage: 'manage',
	proxy: 'proxy',
};

export default function CdnDocsPage() {
	const { t } = useDictionary();
	const { setNavItems, show, hide, clearNavItems, view, setView } = useSidebar();
	const { isAdmin, loading } = useDocsAccess();

	const [searchQuery, setSearchQuery] = useState('');
	const [methodFilter, setMethodFilter] = useState<string>('ALL');

	// Initialize default view or sync from URL hash
	useEffect(() => {
		if (!isAdmin) return;
		const applyHash = () => {
			if (typeof window === 'undefined') return;
			const rawHash = window.location.hash.replace('#', '');
			if (rawHash && HASH_TO_VIEW[rawHash]) {
				setView(HASH_TO_VIEW[rawHash]);
				setTimeout(() => {
					const el = document.getElementById(rawHash);
					if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 80);
				return;
			}
			if (!view) {
				setView('overview');
			}
		};

		applyHash();
		window.addEventListener('hashchange', applyHash);
		return () => window.removeEventListener('hashchange', applyHash);
	}, [setView, view, isAdmin]);

	useEffect(() => {
		if (!loading && !isAdmin) {
			clearNavItems();
			hide();
			return;
		}
		show();
		setNavItems([
			{ label: t('docs.cdn.nav.backToCategories'), href: '/', icon: ArrowLeft, category: t('docs.cdn.nav.category.navigation') },
			{ label: t('docs.api.common.nav.overviewAndAuth'), view: 'overview', icon: Globe, category: t('docs.cdn.nav.category.cdnApi') },
			{ label: t('docs.api.common.nav.allEndpoints'), view: 'all', icon: Layers, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.uploadMedia'), view: 'upload', icon: Upload, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.listMedia'), view: 'list', icon: FileText, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.manageMedia'), view: 'manage', icon: Trash2, category: t('docs.cdn.nav.category.endpoints') },
			{ label: t('docs.cdn.nav.secureProxy'), view: 'proxy', icon: Eye, category: t('docs.cdn.nav.category.endpoints') },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, hide, clearNavItems, t, isAdmin, loading]);

	if (loading) return <Loading />;
	if (!isAdmin) return <NotPermitted />;

	const activeView = view || 'overview';
	const isFiltering = searchQuery.trim().length > 0 || methodFilter !== 'ALL';
	const showEndpointSearchBar = activeView !== 'overview' || isFiltering;

	return (
		<div className="max-w-(--page-width) mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			{/* Clean Top Page Header */}
			<motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 pb-6 mb-6 border-b border-(--border)/10">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.cdn.title')}
					</h1>
					<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">cdn.xernerx.com</span>
				</div>
				<p className="text-sm sm:text-base text-(--text-muted) leading-relaxed max-w-3xl">{t('docs.cdn.description')}</p>
			</motion.div>

			{/* Context-Aware Endpoint Search & Method Filter Bar */}
			{showEndpointSearchBar && (
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm mb-8" style={{ padding: 'var(--ui-gap)' }}>
					<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
						<div className="flex-1 min-w-0">
							<Input
								variant="search"
								shortcut={true}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t('docs.api.common.searchEndpointsPlaceholder')}
							/>
						</div>

						<div className="flex flex-wrap items-center gap-1.5">
							{HTTP_METHODS.map((method) => {
								const isActive = methodFilter === method;
								return (
									<button
										key={method}
										type="button"
										onClick={() => setMethodFilter(method)}
										className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
											isActive
												? 'bg-(--accent) text-white border-(--accent) shadow-sm'
												: 'bg-(--background)/60 text-(--text-muted) border-(--border)/15 hover:text-(--text) hover:border-(--accent)/30'
										}`}
									>
										{method}
									</button>
								);
							})}

							{isFiltering && (
								<button
									type="button"
									onClick={() => {
										setSearchQuery('');
										setMethodFilter('ALL');
									}}
									className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30 hover:bg-(--accent-red)/25 transition-colors cursor-pointer"
								>
									<X size={13} />
									<span>{t('docs.api.common.clearFilters')}</span>
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Active View Content */}
			<div className="space-y-8">
				{isFiltering ? (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('docs.api.common.filteringEndpoints')}</span>
						</div>
						<CdnEndpoints searchQuery={searchQuery} methodFilter={methodFilter} activeGroup="all" />
					</div>
				) : activeView === 'overview' ? (
					<CdnOverviewAndAuth onSelectView={(nextView) => setView(nextView)} />
				) : (
					<CdnEndpoints searchQuery={searchQuery} methodFilter={methodFilter} activeGroup={activeView} />
				)}
			</div>
		</div>
	);
}
