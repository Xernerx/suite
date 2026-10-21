/** @format */
'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Key, Layers, Lock, Shield, Sparkles } from 'lucide-react';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export function ApiOverviewAndAuth({
	version,
	isAdmin,
	onSwitchVersion,
	onOpenEndpoints,
}: {
	version: string;
	isAdmin: boolean;
	onSwitchVersion: (ver: string) => void;
	onOpenEndpoints: (viewId: string) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

	const copyUrl = (key: string, url: string) => {
		navigator.clipboard.writeText(url);
		setCopiedEnv(key);
		setTimeout(() => setCopiedEnv(null), 1800);
	};

	const envCards = [
		{
			key: 'prod',
			title: t('docs.api.common.prodEndpoint'),
			url: 'https://api.xernerx.com',
			badge: t('docs.api.common.badgeRelease'),
			badgeClass: 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30',
		},
		{
			key: 'canary',
			title: t('docs.api.common.canaryEndpoint'),
			url: 'https://api.canary.xernerx.com',
			badge: t('docs.api.common.badgeCanary'),
			badgeClass: 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30',
		},
		{
			key: 'dev',
			title: t('docs.api.common.devEndpoint'),
			url: 'https://api.dev.xernerx.com',
			badge: t('docs.api.common.badgeInternal'),
			badgeClass: 'bg-(--accent)/15 text-(--accent) border-(--accent)/30',
		},
	];

	const namespaces = [
		{
			id: 'v1',
			badge: '/v1/*',
			title: t('docs.api.common.namespaces.v1Title'),
			description: t('docs.api.common.namespaces.v1Desc'),
			defaultView: 'v1-profiles',
		},
		{
			id: 'core',
			badge: '/core/* • /info/*',
			title: t('docs.api.common.namespaces.coreTitle'),
			description: t('docs.api.common.namespaces.coreDesc'),
			defaultView: 'core-embeds',
		},
		...(isAdmin
			? [
					{
						id: 'secure',
						badge: '/secure/*',
						title: t('docs.api.common.namespaces.secureTitle'),
						description: t('docs.api.common.namespaces.secureDesc'),
						defaultView: 'secure-entities',
					},
				]
			: []),
	];

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
			{/* 1. BASE URLS & RATE LIMITS */}
			<section id="overview" className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-2.5 mb-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Globe size={20} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('docs.api.common.baseUrl')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('docs.api.common.rateLimitSummary')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
					{envCards.map((env) => (
						<div key={env.key} className="flex flex-col justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
							<div className="flex items-center justify-between gap-2">
								<h3 className="font-bold text-sm text-(--text)">{env.title}</h3>
								<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${env.badgeClass}`}>{env.badge}</span>
							</div>
							<div className="flex items-center justify-between gap-2 rounded-xl bg-(--foreground)/50 border border-(--border)/10 px-3 py-2">
								<code className="text-xs font-mono text-(--accent) truncate">{env.url}</code>
								<button
									type="button"
									onClick={() => copyUrl(env.key, env.url)}
									className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer shrink-0"
									title={t('docs.api.common.copyUrl')}
								>
									{copiedEnv === env.key ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
								</button>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* 2. AUTHENTICATION & TOKEN LIFECYCLE */}
			<section id="authentication" className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
					<div className="flex items-center gap-2.5">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<Key size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.api.common.auth')}
							</h2>
							<p className="text-xs text-(--text-muted)">
								{t('docs.api.common.authDesc1')}
								{version === 'secure' && ` ${t('docs.api.common.authDesc2')}`}
							</p>
						</div>
					</div>

					<a
						href={getEnvUrl('https://account.xernerx.com/?tab=tokens')}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors self-start"
					>
						<Sparkles size={13} />
						<span>{t('docs.api.common.manageTokensLink')}</span>
						<ExternalLink size={12} />
					</a>
				</div>

				{/* Token Lifecycle Steps */}
				<div className="grid grid-cols-1 md:grid-cols-3 mb-4" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5">
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/30">
								{t('docs.api.common.tokenFlow.badge1')}
							</span>
							<span className="text-xs font-bold text-(--text)">{t('docs.api.common.tokenFlow.step1Title')}</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.api.common.tokenFlow.step1Desc')}</p>
					</div>
					<div className="rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5">
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30">
								{t('docs.api.common.tokenFlow.badge2')}
							</span>
							<span className="text-xs font-bold text-(--text)">{t('docs.api.common.tokenFlow.step2Title')}</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.api.common.tokenFlow.step2Desc')}</p>
					</div>
					<div className="rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5">
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								{t('docs.api.common.tokenFlow.badge3')}
							</span>
							<span className="text-xs font-bold text-(--text)">{t('docs.api.common.tokenFlow.step3Title')}</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.api.common.tokenFlow.step3Desc')}</p>
					</div>
				</div>

				<CodeBlock
					tabs={[
						{
							label: 'TypeScript',
							language: 'typescript',
							code: `const headers: HeadersInit = {\n  'Authorization': 'Bearer xnx_live_abc123def456...',\n  'Content-Type': 'application/json'\n};`,
						},
						{
							label: 'JavaScript',
							language: 'javascript',
							code: `const headers = {\n  'Authorization': 'Bearer xnx_live_abc123def456...',\n  'Content-Type': 'application/json'\n};`,
						},
						{
							label: 'Python',
							language: 'python',
							code: `headers = {\n    "Authorization": "Bearer xnx_live_abc123def456...",\n    "Content-Type": "application/json"\n}`,
						},
						{
							label: 'cURL',
							language: 'bash',
							code: `curl -H "Authorization: Bearer xnx_live_abc123def456..." https://api.xernerx.com/v1/bots/YOUR_BOT_ID/profile`,
						},
					]}
				/>

				{version === 'secure' && (
					<div className="bg-(--accent-orange)/10 border border-(--accent-orange)/25 p-4 rounded-2xl mt-4">
						<h3 className="text-(--accent-orange) font-bold mb-1 flex items-center gap-2 text-sm">
							<Lock size={16} /> {t('docs.api.common.securePassage')}
						</h3>
						<p className="text-xs text-(--text-muted) leading-relaxed">
							<Shield size={12} className="inline mr-1 text-(--accent-orange)" />
							{t('docs.api.common.secureDesc')}
						</p>
					</div>
				)}
			</section>

			{/* 3. NAMESPACE ARCHITECTURE */}
			<section className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-2.5 mb-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Layers size={20} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('docs.api.common.namespaces.heading')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('docs.api.common.namespaces.subheading')}</p>
					</div>
				</div>

				<div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`} style={{ gap: 'var(--ui-gap)' }}>
					{namespaces.map((ns) => {
						const isActive = version === ns.id;
						return (
							<div
								key={ns.id}
								onClick={() => {
									if (isActive) {
										onOpenEndpoints(ns.defaultView);
									} else {
										onSwitchVersion(ns.id);
									}
								}}
								className={`flex flex-col justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
									isActive
										? 'bg-(--accent)/10 border-(--accent)/40 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
										: 'bg-(--background)/50 border-(--border)/10 hover:border-(--accent)/30'
								}`}
							>
								<div className="space-y-2">
									<div className="flex items-center justify-between gap-2">
										<span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30">{ns.badge}</span>
										{isActive && (
											<span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-(--accent) text-white">
												{t('docs.api.common.activeNamespace')}
											</span>
										)}
									</div>
									<h3 className="font-bold text-base text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{ns.title}
									</h3>
									<p className="text-xs text-(--text-muted) leading-relaxed">{ns.description}</p>
								</div>
								<div className="mt-4 pt-3 border-t border-(--border)/10 flex items-center justify-between text-xs font-bold text-(--accent)">
									<span>{isActive ? t('docs.api.common.browseEndpoints') : t('docs.api.common.switchNamespace')}</span>
									<span>→</span>
								</div>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}
