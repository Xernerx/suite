/** @format */
'use client';

import { ArrowLeft, Code, Cpu, Database, Key, Layers, Play, Radio, Terminal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { Loading, NotPermitted } from '@xernerx/feedback';
import { Input } from '@xernerx/ui';
import { WebsocketOverviewSection } from '@/components/websocket/WebsocketOverviewSection';
import { WebsocketConnectingSection } from '@/components/websocket/WebsocketConnectingSection';
import { WebsocketAuthSection } from '@/components/websocket/WebsocketAuthSection';
import { WebsocketProtocolSection } from '@/components/websocket/WebsocketProtocolSection';
import { WebsocketServicesSection } from '@/components/websocket/WebsocketServicesSection';
import { WebsocketClientSection } from '@/components/websocket/WebsocketClientSection';
import { WebsocketPlayground } from '@/components/websocket/WebsocketPlayground';
import { useDocsAccess } from '@/components/useDocsAccess';

const WS_SERVICES = ['ALL', 'virtue', 'xernerx', 'planned'] as const;

const HASH_TO_VIEW: Record<string, string> = {
	overview: 'overview',
	connecting: 'connecting',
	authentication: 'authentication',
	protocol: 'protocol',
	services: 'services',
	client: 'client',
	example: 'client',
	playground: 'playground',
};

export default function WebsocketDocsPage() {
	const { t } = useDictionary();
	const { setNavItems, show, hide, clearNavItems, view, setView } = useSidebar();
	const { hasWebsocket, loading } = useDocsAccess();

	const [searchQuery, setSearchQuery] = useState('');
	const [serviceFilter, setServiceFilter] = useState<string>('ALL');

	// Initialize default view or sync from URL hash
	useEffect(() => {
		if (!hasWebsocket) return;
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
	}, [setView, view, hasWebsocket]);

	useEffect(() => {
		if (loading) return;
		if (!hasWebsocket) {
			clearNavItems();
			hide();
			return;
		}

		show();
		setNavItems([
			{ label: t('docs.websocket.nav.backToCategories'), href: '/', icon: ArrowLeft, category: t('docs.websocket.nav.categoryNavigation') },
			{ label: t('docs.websocket.nav.overview'), view: 'overview', icon: Cpu, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.connecting'), view: 'connecting', icon: Radio, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.authentication'), view: 'authentication', icon: Key, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.rpcProtocol'), view: 'protocol', icon: Code, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.servicesAndActions'), view: 'services', icon: Database, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.playground'), view: 'playground', icon: Play, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.clientExample'), view: 'client', icon: Terminal, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.api.common.nav.allEndpoints'), view: 'all', icon: Layers, category: t('docs.websocket.nav.categoryWebsocket') },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, hide, clearNavItems, t, hasWebsocket, loading]);

	if (loading) {
		return <Loading />;
	}

	if (!hasWebsocket) {
		return <NotPermitted view={t('docs.websocket.hero.title')} />;
	}

	const activeView = view || 'overview';
	const isFiltering = searchQuery.trim().length > 0 || serviceFilter !== 'ALL';
	const showServicesSearchBar = activeView === 'services' || activeView === 'all' || isFiltering;

	return (
		<div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			{/* Clean Top Page Header */}
			<motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 pb-6 mb-6 border-b border-(--border)/10">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('docs.websocket.hero.title')}
					</h1>
					<span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">wss://ws.xernerx.com</span>
				</div>
				<p className="text-sm sm:text-base text-(--text-muted) leading-relaxed max-w-3xl">{t('docs.websocket.hero.description')}</p>
			</motion.div>

			{/* Context-Aware Service & Action Search Bar */}
			{showServicesSearchBar && (
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm mb-8" style={{ padding: 'var(--ui-gap)' }}>
					<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
						<div className="flex-1 min-w-0">
							<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('docs.websocket.services.searchPlaceholder')} />
						</div>

						<div className="flex flex-wrap items-center gap-1.5">
							{WS_SERVICES.map((svc) => {
								const isActive = serviceFilter === svc;
								return (
									<button
										key={svc}
										type="button"
										onClick={() => setServiceFilter(svc)}
										className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
											isActive
												? 'bg-(--accent) text-white border-(--accent) shadow-sm'
												: 'bg-(--background)/60 text-(--text-muted) border-(--border)/15 hover:text-(--text) hover:border-(--accent)/30'
										}`}
									>
										{svc}
									</button>
								);
							})}

							{isFiltering && (
								<button
									type="button"
									onClick={() => {
										setSearchQuery('');
										setServiceFilter('ALL');
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
					<WebsocketServicesSection searchQuery={searchQuery} serviceFilter={serviceFilter} />
				) : activeView === 'overview' ? (
					<div className="space-y-8">
						<WebsocketOverviewSection onSelectView={(nextView) => setView(nextView)} />
						<WebsocketPlayground />
					</div>
				) : activeView === 'connecting' ? (
					<WebsocketConnectingSection />
				) : activeView === 'authentication' ? (
					<WebsocketAuthSection />
				) : activeView === 'protocol' ? (
					<div className="space-y-8">
						<WebsocketProtocolSection />
						<WebsocketPlayground />
					</div>
				) : activeView === 'services' ? (
					<WebsocketServicesSection searchQuery={searchQuery} serviceFilter={serviceFilter} />
				) : activeView === 'playground' ? (
					<WebsocketPlayground />
				) : activeView === 'client' ? (
					<WebsocketClientSection />
				) : (
					<div className="space-y-8">
						<WebsocketOverviewSection onSelectView={(nextView) => setView(nextView)} />
						<WebsocketAuthSection />
						<WebsocketProtocolSection />
						<WebsocketPlayground />
						<WebsocketServicesSection searchQuery={searchQuery} serviceFilter={serviceFilter} />
						<WebsocketClientSection />
					</div>
				)}
			</div>
		</div>
	);
}
