/** @format */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, Server, ExternalLink, Copy, Check, Trophy, Rocket } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import SafeAvatar from '@/components/SafeAvatar';
import { getButtonLinkClasses } from '@/components/buttonLinkClasses';

export const VALID_DASHBOARD_TABS = ['info', 'stats', 'links', 'virtue', 'applications', 'settings'];

export type Guild = {
	id: string;
	name: string;
	icon: string | null;
	iconUrl: string | null;
	banner: string | null;
	bannerUrl: string | null;
	permissions: string;
	features: string[];
};

export const TOUR_DEMO_GUILD: Guild = {
	id: '100000000000000000',
	name: 'Xernerx Community Hub',
	icon: null,
	iconUrl: null,
	banner: null,
	bannerUrl: null,
	permissions: '8',
	features: [],
};

export const TOUR_DEMO_GUILD_CONFIG = {
	id: '100000000000000000',
	name: 'Xernerx Community Hub',
	description: 'Your Discord server directory profile, live analytics, and Virtue XP & voice leveling modules.',
	info: 'Welcome to your Server Dashboard! Configure your server profile, links, privacy tier, and Virtue modules right from here.',
	privacy: 'public',
	widgets: true,
	locale: 'en-GB',
	tags: ['Community', 'Gaming', 'Leveling'],
	links: {},
};

export function buildDashboardNavItems(t: (path: string, variables?: Record<string, string | number>) => string, managedGuilds: Guild[], onSelectGuild?: (guild: Guild) => void) {
	const staticItems = [
		{ label: t('app.dashboard.nav.explore'), href: '/', icon: Compass as any, category: t('app.dashboard.categories.navigation') },
		{ label: t('app.leaderboard.title'), href: '/leaderboard', icon: Trophy as any, category: t('app.dashboard.categories.navigation') },
	];

	if (!onSelectGuild || managedGuilds.length === 0) return staticItems;

	return [
		...staticItems,
		...managedGuilds.map((g) => ({
			label: g.name,
			onClick: () => onSelectGuild(g),
			category: t('app.dashboard.categories.servers'),
			icon: () => (
				<SafeAvatar
					src={g.iconUrl}
					alt={g.name}
					width={20}
					height={20}
					className="w-5 h-5 rounded-full object-cover"
					fallback={<div className="w-5 h-5 rounded-full bg-(--foreground) flex items-center justify-center text-[10px]">{g.name.charAt(0)}</div>}
				/>
			),
			view: `server-${g.id}`,
		})),
	];
}

export function DashboardGuildHeader({ effectiveGuild, copyableGuildId, vanitySlug, onOpenBoost }: { effectiveGuild: Guild; copyableGuildId?: string; vanitySlug?: string; onOpenBoost: () => void }) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copiedId, setCopiedId] = useState(false);

	const handleCopyGuildId = () => {
		if (!copyableGuildId) return;
		navigator.clipboard.writeText(copyableGuildId);
		setCopiedId(true);
		toast({ title: t('app.servers.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

	return (
		<div
			data-tour="dash-header"
			className="relative flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300"
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
			{effectiveGuild.bannerUrl && (
				<div
					className="absolute inset-0 z-0 opacity-20"
					style={{
						backgroundImage: `url(${effectiveGuild.bannerUrl})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
					}}
				/>
			)}
			<div className="relative z-10 flex items-center" style={{ gap: 'var(--ui-gap)' }}>
				<SafeAvatar
					src={effectiveGuild.iconUrl}
					alt={effectiveGuild.name}
					width={80}
					height={80}
					className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
					fallback={
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
							<Server className="w-8 h-8 text-(--text-muted)" />
						</div>
					}
				/>
				<div className="flex flex-col gap-1.5">
					<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{effectiveGuild.name}
					</span>
					<button
						type="button"
						onClick={handleCopyGuildId}
						className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-1 rounded-lg border border-(--border)/10 transition-colors cursor-pointer"
					>
						<span>
							{t('app.dashboard.text1')}
							{effectiveGuild.id}
						</span>
						{copiedId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
					</button>
				</div>
			</div>
			<div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
				<Button variant="primary" onClick={onOpenBoost} className="gap-2">
					<Rocket className="w-4 h-4" />
					{t('app.boost.boostServerBtn')}
				</Button>
				<Link href={`/servers/${vanitySlug || effectiveGuild.id}`} className={getButtonLinkClasses('secondary', 'md', 'gap-2')}>
					<ExternalLink className="w-4 h-4" />
					{t('app.portal.workspace.viewPublicProfile')}
				</Link>
			</div>
		</div>
	);
}

export function DashboardLoadingSkeleton() {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			<h1 className="sr-only">{t('app.seo.dashboard.h1')}</h1>
			<p className="sr-only">{t('app.seo.dashboard.guideIntro')}</p>
			<div
				data-tour="dash-header"
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm animate-pulse"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center" style={{ gap: 'var(--ui-gap)' }}>
					<div className="h-20 w-20 rounded-full bg-(--background)/60 border border-(--border)/10 shrink-0" />
					<div className="flex flex-col gap-2.5">
						<div className="h-7 w-48 rounded-2xl bg-(--background)/60" />
						<div className="h-5 w-36 rounded-xl bg-(--background)/50" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-10 w-32 rounded-2xl bg-(--background)/50" />
					<div className="h-10 w-36 rounded-2xl bg-(--background)/50" />
				</div>
			</div>
			<div data-tour="dash-tabs" className="h-12 w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md animate-pulse" />
			<div
				data-tour="dash-config"
				className="flex flex-col items-center justify-center text-center py-16 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm gap-3"
			>
				<Loading message={t('app.dashboard.loadingServers')} />
			</div>
		</div>
	);
}

export function DashboardEmptyState({ rateLimited }: { rateLimited: boolean }) {
	const { t } = useDictionary();

	if (rateLimited) {
		return (
			<div className="flex flex-col items-center justify-center text-center">
				<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
					<Server className="w-10 h-10 text-(--accent)" />
				</div>
				<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
					{t('app.dashboard.text21')}
				</h1>
				<p className="text-sm text-(--text-muted) max-w-md">{t('app.dashboard.text22')}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center text-center">
			<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
				<Server className="w-10 h-10 text-(--accent)" />
			</div>
			<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
				{t('app.dashboard.text23')}
			</h1>
			<p className="text-sm text-(--text-muted) max-w-md">{t('app.dashboard.text24')}</p>
			<a
				href="https://discord.com/new"
				target="_blank"
				rel="noopener noreferrer"
				className="mt-6 px-6 py-3 rounded-xl bg-(--accent) hover:bg-(--hover-accent) text-white font-medium transition-colors shadow-sm"
			>
				{t('app.dashboard.text25')}
			</a>
		</div>
	);
}
