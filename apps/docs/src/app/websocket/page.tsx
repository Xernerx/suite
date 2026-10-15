/** @format */
'use client';

import { ArrowLeft, Code, Database, Globe, Key, Terminal, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { WebsocketHero } from '@/components/websocket/WebsocketHero';
import { WebsocketOverviewSection } from '@/components/websocket/WebsocketOverviewSection';
import { WebsocketConnectingSection } from '@/components/websocket/WebsocketConnectingSection';
import { WebsocketAuthSection } from '@/components/websocket/WebsocketAuthSection';
import { WebsocketProtocolSection } from '@/components/websocket/WebsocketProtocolSection';
import { WebsocketServicesSection } from '@/components/websocket/WebsocketServicesSection';
import { WebsocketClientSection } from '@/components/websocket/WebsocketClientSection';

export default function WebsocketDocs() {
	const { setNavItems, show, clearNavItems } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		show();
		setNavItems([
			{ label: t('docs.websocket.nav.backToCategories'), href: '/', icon: ArrowLeft, category: t('docs.websocket.nav.categoryNavigation') },
			{ label: t('docs.websocket.nav.overview'), href: '#overview', icon: Globe, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.connecting'), href: '#connecting', icon: Zap, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.authentication'), href: '#authentication', icon: Key, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.rpcProtocol'), href: '#protocol', icon: Code, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.servicesAndActions'), href: '#services', icon: Database, category: t('docs.websocket.nav.categoryWebsocket') },
			{ label: t('docs.websocket.nav.clientExample'), href: '#client', icon: Terminal, category: t('docs.websocket.nav.categoryWebsocket') },
		]);

		return () => clearNavItems();
	}, [setNavItems, show, clearNavItems, t]);

	return (
		<div className="max-w-7xl mx-auto py-12 px-6 lg:px-8 w-full selection:bg-(--accent) selection:text-white">
			<WebsocketHero />
			<div className="space-y-16">
				<WebsocketOverviewSection />
				<WebsocketConnectingSection />
				<WebsocketAuthSection />
				<WebsocketProtocolSection />
				<WebsocketServicesSection />
				<WebsocketClientSection />
			</div>
		</div>
	);
}
