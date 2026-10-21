/** @format */
'use client';

import { AlertCircle, ArrowRight, Check, Copy, Eye, FileText, Globe, Key, Layers, Lock, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';

interface CdnOverviewAndAuthProps {
	onSelectView?: (view: string) => void;
}

export function CdnOverviewAndAuth({ onSelectView }: CdnOverviewAndAuthProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

	const baseUrls = [
		{
			id: 'prod',
			label: t('docs.cdn.overview.productionEndpoint'),
			url: 'https://cdn.xernerx.com',
			badge: t('docs.api.common.badgeRelease'),
			badgeClass: 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30',
		},
		{
			id: 'canary',
			label: t('docs.cdn.overview.canaryEndpoint'),
			url: 'https://cdn.canary.xernerx.com',
			badge: t('docs.api.common.badgeCanary'),
			badgeClass: 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30',
		},
		{
			id: 'dev',
			label: t('docs.cdn.overview.developmentEndpoint'),
			url: 'https://cdn.dev.xernerx.com',
			badge: t('docs.api.common.badgeInternal'),
			badgeClass: 'bg-(--accent)/15 text-(--accent) border-(--accent)/30',
		},
	];

	const routeCards = [
		{
			id: 'upload',
			icon: Upload,
			method: 'POST',
			path: '/upload',
			title: t('docs.cdn.upload.title'),
			desc: t('docs.cdn.upload.description'),
		},
		{
			id: 'list',
			icon: FileText,
			method: 'GET',
			path: '/media',
			title: t('docs.cdn.list.title'),
			desc: t('docs.cdn.list.description'),
		},
		{
			id: 'manage',
			icon: Trash2,
			method: 'PATCH / DELETE',
			path: '/media/[id]',
			title: t('docs.cdn.manage.title'),
			desc: t('docs.cdn.manage.description'),
		},
		{
			id: 'proxy',
			icon: Eye,
			method: 'GET',
			path: '/raw/[id] & /view/[id]',
			title: t('docs.cdn.proxy.title'),
			desc: t('docs.cdn.proxy.description'),
		},
	];

	const handleCopy = (url: string) => {
		navigator.clipboard.writeText(url);
		setCopiedUrl(url);
		setTimeout(() => setCopiedUrl(null), 1800);
	};

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
			{/* 1. Base URLs */}
			<section id="overview" className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-3 mb-4 pb-3 border-b border-(--border)/10">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Globe size={20} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('docs.cdn.overview.title')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('docs.api.common.rateLimitSummary')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					{baseUrls.map((env) => {
						const isCopied = copiedUrl === env.url;
						return (
							<div
								key={env.id}
								className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-(--background)/60 border border-(--border)/10 hover:border-(--accent)/30 transition-colors"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{env.label}</span>
									<span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${env.badgeClass}`}>{env.badge}</span>
								</div>
								<div className="flex items-center justify-between gap-2 pt-1">
									<code className="text-xs sm:text-sm font-mono font-bold text-(--text) truncate">{env.url}</code>
									<button
										type="button"
										onClick={() => handleCopy(env.url)}
										className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-(--foreground)/60 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 transition-colors cursor-pointer shrink-0"
									>
										{isCopied ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
										<span>{isCopied ? t('docs.api.common.copied') : t('docs.api.common.copyUrl')}</span>
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* 2. Authentication, Permissions & Privacy Model */}
			<section id="authentication" className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm scroll-mt-28" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-(--border)/10">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<Key size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.api.common.auth')}
							</h2>
							<p className="text-xs text-(--text-muted)">
								{t('docs.cdn.overview.authDesc1')}
								<code className="px-1.5 py-0.5 rounded-lg bg-(--background)/80 text-(--accent) font-mono font-semibold">uploadMedia</code>
								{t('docs.cdn.overview.authDesc2')}
								<code className="px-1.5 py-0.5 rounded-lg bg-(--background)/80 text-(--accent) font-mono font-semibold">manageMedia</code>
								{t('docs.cdn.overview.authDesc3')}
							</p>
						</div>
					</div>
					<a
						href={getEnvUrl('https://account.xernerx.com/media')}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors shrink-0 self-start sm:self-auto"
					>
						<span>{t('cdn.home.manage')}</span>
						<ArrowRight size={13} />
					</a>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
					<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent)/20 text-(--accent) text-xs font-extrabold">1</span>
							<span className="text-sm font-bold text-(--text)">uploadMedia</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.cdn.upload.description')}</p>
					</div>
					<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent)/20 text-(--accent) text-xs font-extrabold">2</span>
							<span className="text-sm font-bold text-(--text)">manageMedia</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">
							{t('docs.cdn.list.params.adminDesc1')}
							<code className="text-(--accent) font-mono">true</code>
							{t('docs.cdn.list.params.adminDesc2')}
							<code className="text-(--accent) font-mono">manageMedia</code>
							{t('docs.cdn.list.params.adminDesc3')}
						</p>
					</div>
					<div className="p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<Lock size={15} className="text-(--accent)" />
							<span className="text-sm font-bold text-(--text)">public • limited • private</span>
						</div>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.cdn.proxy.description')}</p>
					</div>
				</div>

				<div className="p-4 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 flex items-start gap-3">
					<AlertCircle className="text-(--accent) shrink-0 mt-0.5" size={18} />
					<div className="text-xs text-(--text-muted) leading-relaxed">
						<strong className="text-(--text) block mb-0.5">{t('docs.cdn.notice.title')}</strong>
						{t('docs.cdn.notice.description')}
					</div>
				</div>
			</section>

			{/* 3. CDN Endpoint Directory */}
			<section className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-3 mb-4 pb-3 border-b border-(--border)/10">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Layers size={20} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('docs.cdn.nav.category.endpoints')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('docs.cdn.description')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{routeCards.map((item) => {
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
										<span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">{item.path}</span>
									</div>
									<p className="text-xs text-(--text-muted) leading-relaxed">{item.desc}</p>
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
