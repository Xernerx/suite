/** @format */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Copy, Globe, Key, Lock, LucideIcon, Play } from 'lucide-react';
import React, { useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export interface RouteDefinition {
	method: string;
	path: string;
	color?: string;
	summary?: string;
	auth?: 'public' | 'token' | 'secure';
}

export interface EndpointSectionProps {
	id: string;
	title: string;
	icon: LucideIcon;
	description: string;
	routes: RouteDefinition[];
	extra?: React.ReactNode;
	defaultExpanded?: boolean;
	searchQuery?: string;
	methodFilter?: string;
	baseUrl?: string;
	onTryRoute?: (method: string, path: string) => void;
}

function getMethodBadgeStyle(method: string): string {
	switch (method.toUpperCase()) {
		case 'GET':
			return 'bg-(--accent)/15 text-(--accent) border-(--accent)/30';
		case 'POST':
			return 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30';
		case 'PUT':
		case 'PATCH':
			return 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30';
		case 'DELETE':
			return 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/30';
		default:
			return 'bg-(--foreground) text-(--text-muted) border-(--border)/20';
	}
}

function inferAuthType(path: string, explicit?: 'public' | 'token' | 'secure'): 'public' | 'token' | 'secure' {
	if (explicit) return explicit;
	if (path.startsWith('/secure')) return 'secure';
	if (path.includes('badge.svg') || path.includes('rss.xml') || path.startsWith('/api/') || path.startsWith('/core/faq') || path === '/v1/leaderboard') {
		return 'public';
	}
	if (path.startsWith('/v1/')) return 'token';
	return 'public';
}

function toPlaygroundSamplePath(path: string): string {
	const basePath = path.split('?')[0];
	return basePath
		.replace('[id]', '1059956767103668244')
		.replace('[category]', 'bots')
		.replace('[language]', 'en-GB')
		.replace('[reviewId]', 'sample_review_id')
		.replace('[roleId]', 'sample_role_id')
		.replace('[channelId]', 'sample_channel_id')
		.replace('[userId]', '482513687417061376');
}

function FormattedRoutePath({ path }: { path: string }) {
	const [basePath, queryString] = path.split('?');
	const segments = basePath.split('/').filter(Boolean);

	return (
		<div className="flex flex-wrap items-center gap-y-1 font-mono text-xs sm:text-sm break-all">
			{segments.map((seg, idx) => {
				const isParam = (seg.startsWith('[') && seg.endsWith(']')) || seg.startsWith(':');
				return (
					<React.Fragment key={idx}>
						<span className="text-(--text-muted) select-none">/</span>
						{isParam ? (
							<span className="mx-0.5 px-1.5 py-0.5 rounded-lg bg-(--accent)/15 text-(--accent) border border-(--accent)/30 font-bold text-xs">{seg}</span>
						) : (
							<span className="text-(--text) font-semibold">{seg}</span>
						)}
					</React.Fragment>
				);
			})}
			{queryString && <span className="ml-1.5 px-2 py-0.5 rounded-lg bg-(--foreground)/60 border border-(--border)/10 text-[11px] text-(--text-muted)">?{queryString}</span>}
		</div>
	);
}

export function EndpointSection({
	id,
	title,
	icon: Icon,
	description,
	routes,
	extra,
	defaultExpanded = true,
	searchQuery = '',
	methodFilter = 'ALL',
	baseUrl = 'https://api.xernerx.com',
	onTryRoute,
}: EndpointSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const apiBase = getEnvUrl(baseUrl);
	const q = searchQuery.trim().toLowerCase();
	const activeMethod = methodFilter.toUpperCase();

	const filteredRoutes = routes.filter((r) => {
		if (activeMethod !== 'ALL' && r.method.toUpperCase() !== activeMethod) {
			return false;
		}
		if (!q) return true;
		const sectionMatches = title.toLowerCase().includes(q) || description.toLowerCase().includes(q) || id.toLowerCase().includes(q);
		const routeMatches = r.path.toLowerCase().includes(q) || r.method.toLowerCase().includes(q) || (r.summary && r.summary.toLowerCase().includes(q));
		return sectionMatches || routeMatches;
	});

	if (filteredRoutes.length === 0) return null;

	const handleCopy = (path: string, index: number) => {
		const cleanPath = path.startsWith('/') ? path : `/${path}`;
		navigator.clipboard.writeText(`${apiBase}${cleanPath}`);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 1800);
	};

	return (
		<motion.section
			id={id}
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28 transition-all"
		>
			{/* Card Header */}
			<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-(--border)/10 bg-(--background)/30" style={{ padding: 'var(--ui-gap)' }}>
				<div className="flex items-start gap-3.5 min-w-0">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-sm">
						<Icon size={20} />
					</div>
					<div className="flex flex-col gap-1 min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="text-xl font-bold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{title}
							</h2>
							{filteredRoutes.length > 1 && (
								<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--background)/70 text-(--text-muted) border border-(--border)/10">
									{filteredRoutes.length} {t('docs.api.common.endpointPlural')}
								</span>
							)}
						</div>
						<p className="text-sm text-(--text-muted) leading-relaxed">{description}</p>
					</div>
				</div>

				{extra && (
					<button
						type="button"
						onClick={() => setIsExpanded((prev) => !prev)}
						className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold border border-(--border)/15 bg-(--background)/60 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/30 transition-colors cursor-pointer shrink-0 self-start"
					>
						<span>{isExpanded ? t('docs.api.common.hideDetails') : t('docs.api.common.showDetails')}</span>
						{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
					</button>
				)}
			</div>

			{/* Route Rows */}
			<div className="divide-y divide-(--border)/10">
				{filteredRoutes.map((route, i) => {
					const authType = inferAuthType(route.path, route.auth);
					return (
						<div
							key={`${route.method}-${route.path}-${i}`}
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-(--background)/40 hover:bg-(--background)/70 transition-colors group"
						>
							<div className="flex items-center gap-3 min-w-0 flex-1">
								<span className={`w-20 text-center font-extrabold text-[11px] py-1 px-2 rounded-xl border uppercase tracking-wider shrink-0 ${getMethodBadgeStyle(route.method)}`}>
									{route.method}
								</span>
								<FormattedRoutePath path={route.path} />
							</div>

							<div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-23 sm:pl-0">
								{route.summary && <span className="text-xs text-(--text-muted) hidden xl:inline-block mr-2">{route.summary}</span>}

								{/* Auth Scope Badge */}
								{authType === 'secure' ? (
									<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent-orange)/10 text-(--accent-orange) border border-(--accent-orange)/25">
										<Lock size={10} />
										<span>{t('docs.api.common.authBadgeSecure')}</span>
									</span>
								) : authType === 'token' ? (
									<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/10 text-(--accent) border border-(--accent)/25">
										<Key size={10} />
										<span>{t('docs.api.common.authBadgeToken')}</span>
									</span>
								) : (
									<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/25">
										<Globe size={10} />
										<span>{t('docs.api.common.authBadgePublic')}</span>
									</span>
								)}

								{/* Copy Full URL */}
								<button
									type="button"
									onClick={() => handleCopy(route.path, i)}
									title={t('docs.api.common.copyEndpointUrl')}
									className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-(--foreground)/50 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 transition-colors cursor-pointer"
								>
									{copiedIndex === i ? <Check size={13} className="text-(--accent-green)" /> : <Copy size={13} />}
									<span className="hidden md:inline">{copiedIndex === i ? t('docs.api.common.copied') : t('docs.api.common.copyUrl')}</span>
								</button>

								{/* Try in Playground */}
								{onTryRoute && (
									<button
										type="button"
										onClick={() => onTryRoute(route.method.toUpperCase(), toPlaygroundSamplePath(route.path))}
										title={t('docs.api.common.tryInPlayground')}
										className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 transition-colors cursor-pointer"
									>
										<Play size={12} />
										<span className="hidden md:inline">{t('docs.api.common.testRoute')}</span>
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Collapsible Extra Details (Schema Tables, Code Examples, Live Previews) */}
			<AnimatePresence initial={false}>
				{extra && isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className="overflow-hidden bg-(--background)/20"
					>
						{extra}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.section>
	);
}
