/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Bot, Boxes, LayoutDashboard, Server, Sparkles, Users } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export interface BotProfileData {
	id: string;
	name?: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
	status?: 'online' | 'idle' | 'dnd' | 'offline';
	activity?: string | null;
	guildCount?: number;
	userCount?: number;
}

export interface ConsumerServiceCardItem {
	id: string;
	botId: string;
	title: string;
	desc: string;
	link: string;
	tag: string;
	isPlatform?: boolean;
	preferLocalAssets?: boolean;
	defaultAvatarUrl: string;
	defaultBannerUrl: string;
}

export interface DeveloperSoftwareCardItem {
	icon: React.ReactNode;
	title: string;
	desc: string;
	link: string;
	tag: string;
	bannerUrl?: string;
	iconUrl?: string;
}

const KNOWN_PACKAGE_SLUGS = new Set(['xernerx', 'framework', 'commands', 'extension-builder', 'hooks', 'stats', 'terminal', 'websocket']);

export function resolvePackageAssetUrls(pkgName?: string): { bannerUrl?: string; iconUrl?: string } {
	if (!pkgName) return {};
	const slug = pkgName
		.trim()
		.toLowerCase()
		.replace(/^@xernerx\//, '');
	if (!KNOWN_PACKAGE_SLUGS.has(slug)) return {};
	return {
		bannerUrl: `/packages/banners/${slug}.svg`,
		iconUrl: `/packages/icons/${slug}.svg`,
	};
}

export function buildConsumerServiceItems(t: (path: string, variables?: Record<string, string | number>) => string, getEnvUrl: (url: string) => string): ConsumerServiceCardItem[] {
	return [
		{
			id: 'dashboard',
			botId: '1319029435655000234',
			title: t('www.services.dashboard.title'),
			desc: t('www.services.dashboard.desc'),
			link: getEnvUrl('https://app.xernerx.com'),
			tag: t('www.tags.platform'),
			isPlatform: true,
			defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/1319029435655000234/650686f35610dfe1f54fb219d561a8fe.png?size=512',
			defaultBannerUrl: 'https://cdn.discordapp.com/banners/1319029435655000234/9dcc3f9fce03d267b9962477d96aef10.png?size=1024',
		},
		{
			id: 'todo',
			botId: '782105629572464652',
			title: t('www.applications.todo.title'),
			desc: t('www.applications.todo.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/todo'),
			tag: t('www.tags.discordBot'),
			preferLocalAssets: true,
			defaultAvatarUrl: '/bots/todo/icon.png',
			defaultBannerUrl: '/bots/todo/banner.png',
		},
		{
			id: 'virtue',
			botId: '1484880634844287138',
			title: t('www.applications.virtue.title'),
			desc: t('www.applications.virtue.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/virtue'),
			tag: t('www.tags.discordBot'),
			preferLocalAssets: true,
			defaultAvatarUrl: '/bots/virtue/icon.png',
			defaultBannerUrl: '/bots/virtue/banner.png',
		},
		{
			id: 'yourapps',
			botId: '619328560141697036',
			title: t('www.applications.yourapps.title'),
			desc: t('www.applications.yourapps.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/yourapps'),
			tag: t('www.tags.discordBot'),
			preferLocalAssets: true,
			defaultAvatarUrl: '/bots/yourapps/icon.png',
			defaultBannerUrl: '/bots/yourapps/banner.png',
		},
		{
			id: 'metamorphosis',
			botId: '881678826906730547',
			title: t('www.applications.metamorphosis.title'),
			desc: t('www.applications.metamorphosis.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/metamorphosis'),
			tag: t('www.tags.discordBot'),
			preferLocalAssets: true,
			defaultAvatarUrl: '/bots/metamorphosis/icon.png',
			defaultBannerUrl: '/bots/metamorphosis/banner.png',
		},
		{
			id: 'zodiac',
			botId: '950251264095162418',
			title: t('www.applications.zodiac.title'),
			desc: t('www.applications.zodiac.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/zodiac'),
			tag: t('www.tags.discordBot'),
			preferLocalAssets: true,
			defaultAvatarUrl: '/bots/zodiac/icon.png',
			defaultBannerUrl: '/bots/zodiac/banner.png',
		},
	];
}

export function ServiceProfileCard({ item, profile }: { item: ConsumerServiceCardItem; profile?: BotProfileData }) {
	const { t } = useDictionary();

	const avatarCandidates = useMemo(
		() =>
			Array.from(
				new Set(
					(item.preferLocalAssets ? [item.defaultAvatarUrl, profile?.avatarUrl, '/icon.png'] : [profile?.avatarUrl, item.defaultAvatarUrl, '/icon.png']).filter((v): v is string =>
						Boolean(v && v.trim())
					)
				)
			),
		[item.preferLocalAssets, profile?.avatarUrl, item.defaultAvatarUrl]
	);
	const bannerCandidates = useMemo(
		() =>
			Array.from(
				new Set((item.preferLocalAssets ? [item.defaultBannerUrl, profile?.bannerUrl] : [profile?.bannerUrl, item.defaultBannerUrl]).filter((v): v is string => Boolean(v && v.trim())))
			),
		[item.preferLocalAssets, profile?.bannerUrl, item.defaultBannerUrl]
	);

	const [avatarIdx, setAvatarIdx] = useState(0);
	const [bannerIdx, setBannerIdx] = useState(0);

	useEffect(() => {
		setAvatarIdx(0);
	}, [profile?.avatarUrl, item.defaultAvatarUrl]);

	useEffect(() => {
		setBannerIdx(0);
	}, [profile?.bannerUrl, item.defaultBannerUrl]);

	const activeAvatarUrl = avatarIdx < avatarCandidates.length ? avatarCandidates[avatarIdx] : null;
	const activeBannerUrl = bannerIdx < bannerCandidates.length ? bannerCandidates[bannerIdx] : null;

	const status = profile?.status || 'online';
	const guildCount = profile?.guildCount ?? 0;
	const userCount = profile?.userCount ?? 0;
	const activity = profile?.activity;

	const isOnline = status === 'online';
	const isWarning = status === 'idle' || status === 'dnd';
	const statusDotClass = isOnline ? 'bg-(--accent-green)' : isWarning ? 'bg-(--accent-orange)' : 'bg-(--accent)';
	const statusText =
		status === 'online'
			? t('info.status.botStates.online')
			: status === 'idle'
				? t('info.status.botStates.idle')
				: status === 'dnd'
					? t('info.status.botStates.dnd')
					: t('info.status.botStates.online');

	return (
		<motion.div
			whileHover={{ y: -8, scale: 1.015 }}
			transition={{ type: 'spring', stiffness: 320, damping: 24 }}
			className="group shrink-0 w-[85vw] md:w-[430px] flex flex-col rounded-3xl overflow-hidden bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/50 shadow-xl hover:shadow-[0_16px_50px_-12px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors relative"
		>
			{/* Dot-Matrix Ambient Halftone Glow */}
			<div
				className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 pointer-events-none"
				style={{
					backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
					backgroundSize: '20px 20px',
				}}
			/>

			{/* Discord Profile Banner Header */}
			<div className="relative h-32 w-full overflow-hidden bg-(--background)/60 shrink-0">
				{activeBannerUrl && (
					<img
						src={activeBannerUrl}
						alt={item.title}
						onError={() => setBannerIdx((prev) => prev + 1)}
						className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
					/>
				)}
				<div
					className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
					style={{
						backgroundImage: 'radial-gradient(circle at 50% 50%, var(--text) 1.25px, transparent 1.25px)',
						backgroundSize: '14px 14px',
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-(--foreground)/95 via-(--foreground)/25 to-transparent" />

				{/* Top Badges on Banner */}
				<div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
					<span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-(--text) bg-(--background)/70 backdrop-blur-md border border-(--border)/15 px-3 py-1 rounded-full shadow-sm">
						{item.isPlatform ? <LayoutDashboard size={12} className="text-(--accent)" /> : <Bot size={12} className="text-(--accent)" />}
						{item.tag}
					</span>

					<span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-(--text) bg-(--background)/70 backdrop-blur-md border border-(--border)/15 px-2.5 py-1 rounded-full shadow-sm">
						<span className="relative flex h-2 w-2">
							<span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotClass}`} />
							<span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotClass}`} />
						</span>
						{statusText}
					</span>
				</div>
			</div>

			{/* Profile Body */}
			<div className="flex flex-col flex-1 px-7 pb-7 -mt-9 relative z-10">
				{/* Avatar + External Link Icon */}
				<div className="flex items-end justify-between gap-4 mb-3">
					<div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-(--background) border-2 border-(--border)/20 shadow-lg ring-4 ring-(--foreground)/60 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 shrink-0">
						{activeAvatarUrl ? (
							<img src={activeAvatarUrl} alt={item.title} onError={() => setAvatarIdx((prev) => prev + 1)} className="h-full w-full object-cover" />
						) : (
							<div className="h-full w-full flex items-center justify-center bg-(--accent)/15 text-(--accent)">
								<Boxes size={28} />
							</div>
						)}
					</div>

					<div className="h-10 w-10 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex items-center justify-center text-(--text-muted) group-hover:text-white group-hover:bg-(--accent) group-hover:border-(--accent) transition-all duration-300 shadow-sm">
						<ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
					</div>
				</div>

				{/* Bot Name & Activity */}
				<div className="mb-2">
					<h3 className="font-extrabold text-xl text-(--text) group-hover:text-(--accent) transition-colors leading-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Link href={item.link} className="after:absolute after:inset-0">
							{item.title}
						</Link>
					</h3>
					{activity && (
						<p className="text-xs text-(--accent) font-medium truncate mt-0.5 flex items-center gap-1.5">
							<Activity size={11} className="shrink-0" />
							<span className="truncate">{activity}</span>
						</p>
					)}
				</div>

				<p className="text-xs text-(--text-muted) leading-relaxed line-clamp-3 mb-4">{item.desc}</p>

				{/* Live Bot Telemetry Pills */}
				<div className="mt-auto pt-3 border-t border-(--border)/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-(--text-muted)">
					{guildCount > 0 ? (
						<>
							<span className="inline-flex items-center gap-1.5 bg-(--background)/50 border border-(--border)/10 px-2.5 py-1 rounded-full">
								<Server size={12} className="text-(--accent)" />
								<strong className="text-(--text)">{guildCount.toLocaleString()}</strong> {t('info.status.botServers')}
							</span>
							{userCount > 0 && (
								<span className="inline-flex items-center gap-1.5 bg-(--background)/50 border border-(--border)/10 px-2.5 py-1 rounded-full">
									<Users size={12} className="text-(--accent)" />
									<strong className="text-(--text)">{userCount.toLocaleString()}</strong>
								</span>
							)}
						</>
					) : (
						<span className="inline-flex items-center gap-1.5 bg-(--accent)/10 text-(--accent) border border-(--accent)/20 px-3 py-1 rounded-full font-sans font-semibold">
							<Sparkles size={12} />
							{item.isPlatform ? t('www.about.pillars.identity.title') : t('info.status.officialBot')}
						</span>
					)}
				</div>
			</div>
		</motion.div>
	);
}

export function DeveloperSoftwareCard({ item, href }: { item: DeveloperSoftwareCardItem; href: string }) {
	const resolvedAssets = useMemo(() => resolvePackageAssetUrls(item.title), [item.title]);
	const bannerUrl = item.bannerUrl || resolvedAssets.bannerUrl;
	const iconUrl = item.iconUrl || resolvedAssets.iconUrl;

	return (
		<motion.div
			whileHover={{ y: -8, scale: 1.015 }}
			transition={{ type: 'spring', stiffness: 320, damping: 24 }}
			className="group shrink-0 w-[85vw] md:w-[430px] flex flex-col rounded-3xl overflow-hidden bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/50 shadow-xl hover:shadow-[0_16px_50px_-12px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors relative"
		>
			{bannerUrl ? (
				<div className="relative w-full aspect-[40/11] overflow-hidden bg-[#0b0d14] border-b border-(--border)/10 shrink-0">
					<img src={bannerUrl} alt={`${item.title} banner`} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
				</div>
			) : (
				<div className="relative h-20 w-full overflow-hidden bg-gradient-to-r from-(--accent)/20 via-(--background)/60 to-(--accent)/10 border-b border-(--border)/10 px-7 flex items-center justify-between">
					<div
						className="absolute inset-0 opacity-30 group-hover:opacity-55 transition-opacity duration-500 pointer-events-none"
						style={{
							backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
							backgroundSize: '14px 14px',
						}}
					/>
					<span className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-(--accent) bg-(--background)/80 border border-(--accent)/30 px-3 py-1 rounded-full backdrop-blur-md">
						{item.tag}
					</span>
					<div className="relative z-10 h-9 w-9 rounded-2xl bg-(--background)/70 border border-(--border)/10 flex items-center justify-center text-(--text-muted) group-hover:text-white group-hover:bg-(--accent) group-hover:border-(--accent) transition-all duration-300">
						<ArrowUpRight size={17} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
					</div>
				</div>
			)}

			<div className="flex flex-col flex-1 p-7 relative z-10">
				{!bannerUrl && (
					<div className="w-13 h-13 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent) mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
						{item.icon}
					</div>
				)}
				<div className="flex items-center justify-between gap-3 mb-3">
					<div className="flex items-center gap-2.5 min-w-0">
						{iconUrl && <img src={iconUrl} alt={`${item.title} icon`} className="w-8 h-8 rounded-full shrink-0 shadow-sm" />}
						<h3 className="font-bold text-xl text-(--text) group-hover:text-(--accent) transition-colors font-mono truncate">
							<Link href={href} className="after:absolute after:inset-0">
								{item.title}
							</Link>
						</h3>
					</div>
					{bannerUrl && (
						<div className="flex items-center gap-2 shrink-0">
							<span className="text-[10px] font-bold uppercase tracking-widest text-(--accent) bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-1 rounded-full">{item.tag}</span>
							<div className="h-8 w-8 rounded-xl bg-(--background)/60 border border-(--border)/10 flex items-center justify-center text-(--text-muted) group-hover:text-white group-hover:bg-(--accent) group-hover:border-(--accent) transition-all duration-300">
								<ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
							</div>
						</div>
					)}
				</div>
				<p className="text-sm text-(--text-muted) leading-relaxed line-clamp-4">{item.desc}</p>
			</div>
		</motion.div>
	);
}
