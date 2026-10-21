/** @format */
'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Code, Cpu, Database, Key, Layers, Shield, Terminal, Zap } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { WebsocketConnectingSection } from '@/components/websocket/WebsocketConnectingSection';

interface WebsocketOverviewSectionProps {
	onSelectView?: (view: string) => void;
}

export function WebsocketOverviewSection({ onSelectView }: WebsocketOverviewSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const referenceCards = [
		{
			id: 'authentication',
			icon: Key,
			badge: 'service: "auth"',
			title: t('docs.websocket.nav.authentication'),
			desc: t('docs.websocket.overview.cards.auth.desc'),
		},
		{
			id: 'protocol',
			icon: Code,
			badge: 'GET • POST • PATCH • DELETE',
			title: t('docs.websocket.nav.rpcProtocol'),
			desc: t('docs.websocket.overview.cards.proxy.desc'),
		},
		{
			id: 'services',
			icon: Database,
			badge: 'virtue • xernerx',
			title: t('docs.websocket.nav.servicesAndActions'),
			desc: t('docs.websocket.services.description'),
		},
		{
			id: 'client',
			icon: Terminal,
			badge: '@xernerx/websocket',
			title: t('docs.websocket.nav.clientExample'),
			desc: t('docs.websocket.client.step2Desc'),
		},
	];

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
			{/* 1. Gateway Base URLs & Connecting */}
			<WebsocketConnectingSection />

			{/* 2. Architecture & Allowance Overview */}
			<motion.section
				id="overview"
				initial={{ opacity: 1, y: 0 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28"
				style={{ padding: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-(--border)/10">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<Cpu size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.websocket.overview.title')}
							</h2>
							<p className="text-xs text-(--text-muted)">{t('docs.websocket.overview.subtitle')}</p>
						</div>
					</div>
					<a
						href={getEnvUrl('https://account.xernerx.com/tokens')}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors shrink-0 self-start sm:self-auto"
					>
						<span>{t('docs.api.common.manageTokensLink')}</span>
						<ArrowRight size={13} />
					</a>
				</div>

				<div className="text-sm text-(--text-muted) space-y-2.5 leading-relaxed mb-5">
					<p dangerouslySetInnerHTML={{ __html: t('docs.websocket.overview.description1') }} />
					<p dangerouslySetInnerHTML={{ __html: t('docs.websocket.overview.description2') }} />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
					<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<Zap className="text-(--accent)" size={16} />
							<h3 className="font-bold text-sm text-(--text)">{t('docs.websocket.overview.cards.socket.title')}</h3>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.websocket.overview.cards.socket.desc')}</p>
					</div>

					<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<Shield className="text-(--accent)" size={16} />
							<h3 className="font-bold text-sm text-(--text)">{t('docs.websocket.overview.cards.auth.title')}</h3>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed" dangerouslySetInnerHTML={{ __html: t('docs.websocket.overview.cards.auth.desc') }} />
					</div>

					<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<Database className="text-(--accent)" size={16} />
							<h3 className="font-bold text-sm text-(--text)">{t('docs.websocket.overview.cards.proxy.title')}</h3>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.websocket.overview.cards.proxy.desc')}</p>
					</div>
				</div>

				<div className="p-4 rounded-2xl bg-(--accent-orange)/10 border border-(--accent-orange)/25 flex items-start gap-3">
					<AlertCircle className="text-(--accent-orange) shrink-0 mt-0.5" size={18} />
					<div className="text-xs text-(--text-muted) leading-relaxed">
						<strong className="text-(--text) block mb-0.5">{t('docs.websocket.hero.alertTitle')}</strong>
						<span dangerouslySetInnerHTML={{ __html: t('docs.websocket.hero.alertDescription') }} />
					</div>
				</div>
			</motion.section>

			{/* 3. Gateway Reference Directory */}
			<section className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-3 mb-4 pb-3 border-b border-(--border)/10">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Layers size={20} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('docs.websocket.nav.categoryWebsocket')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('docs.websocket.hero.description')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{referenceCards.map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => onSelectView?.(item.id)}
								className="group text-left p-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 hover:border-(--accent)/40 hover:bg-(--background)/80 transition-all flex flex-col justify-between gap-3 cursor-pointer"
							>
								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent)">
												<Icon size={16} />
											</div>
											<span className="font-bold text-sm text-(--text)">{item.title}</span>
										</div>
										<span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">{item.badge}</span>
									</div>
									<p className="text-xs text-(--text-muted) leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
								</div>
								<div className="flex items-center gap-1 text-xs font-bold text-(--accent) pt-1">
									<span>{t('docs.api.common.browseEndpoints')}</span>
									<ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
								</div>
							</button>
						);
					})}
				</div>
			</section>
		</div>
	);
}
