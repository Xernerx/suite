/** @format */
'use client';

import React from 'react';
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
	defaultAvatarUrl: string;
	defaultBannerUrl: string;
}

export interface DeveloperSoftwareCardItem {
	icon: React.ReactNode;
	title: string;
	desc: string;
	link: string;
	tag: string;
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
			defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/1319029435655000234/b06769267090492ce293b0a2572fcb19.png?size=512',
			defaultBannerUrl: 'https://cdn.discordapp.com/banners/1319029435655000234/e7e51d29fbe0e3e1982eb916f43c45ca.png?size=1024',
		},
		{
			id: 'virtue',
			botId: '1484880634844287138',
			title: t('www.applications.virtue.title'),
			desc: t('www.applications.virtue.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/1484880634844287138'),
			tag: t('www.tags.discordBot'),
			defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/1484880634844287138/bb9495686b0bab5efa38119c8e2f0bb3.png?size=512',
			defaultBannerUrl: 'https://cdn.discordapp.com/banners/1484880634844287138/34673c3bb1900169de38a5e40a56f34d.png?size=1024',
		},
		{
			id: 'metamorphosis',
			botId: '881678826906730547',
			title: t('www.applications.metamorphosis.title'),
			desc: t('www.applications.metamorphosis.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/881678826906730547'),
			tag: t('www.tags.discordBot'),
			defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/881678826906730547/25511e2ef0b8c1b29b487116a9461739.png?size=512',
			defaultBannerUrl: 'https://cdn.discordapp.com/banners/881678826906730547/abe2e33be8e75cc467f556dfb5c2235b.png?size=1024',
		},
		{
			id: 'zodiac',
			botId: '950251264095162418',
			title: t('www.applications.zodiac.title'),
			desc: t('www.applications.zodiac.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/950251264095162418'),
			tag: t('www.tags.discordBot'),
			defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/950251264095162418/07a9e067135a204bb0fdc796b44bda63.png?size=512',
			defaultBannerUrl: 'https://cdn.discordapp.com/banners/950251264095162418/1d84ea69bbfb26fd4cdc2e1bc50073ff.png?size=1024',
		},
		{
			id: 'todo',
			botId: '782105629572464652',
			title: t('www.applications.todo.title'),
			desc: t('www.applications.todo.desc'),
			link: getEnvUrl('https://app.xernerx.com/bots/782105629572464652'),
			tag: t('www.tags.discordBot'),
			defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/782105629572464652/d6d658830d9dc233d1a5fda2260d63bd.png?size=512',
			defaultBannerUrl: 'https://cdn.discordapp.com/banners/782105629572464652/2559346d255761acba683faa54bdeae4.png?size=1024',
		},
	];
}

export function ServiceProfileCard({ item, profile }: { item: ConsumerServiceCardItem; profile?: BotProfileData }) {
	const { t } = useDictionary();

	const avatarUrl = profile?.avatarUrl || item.defaultAvatarUrl;
	const bannerUrl = profile?.bannerUrl || item.defaultBannerUrl;
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
				{bannerUrl && <img src={bannerUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" />}
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
						{avatarUrl ? (
							<img src={avatarUrl} alt={item.title} className="h-full w-full object-cover" />
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
						<a href={item.link} className="after:absolute after:inset-0">
							{item.title}
						</a>
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
	return (
		<motion.div
			whileHover={{ y: -8, scale: 1.015 }}
			transition={{ type: 'spring', stiffness: 320, damping: 24 }}
			onClick={() => {
				window.location.href = href;
			}}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					window.location.href = href;
				}
			}}
			role="link"
			tabIndex={0}
			className="group shrink-0 w-[85vw] md:w-[430px] flex flex-col rounded-3xl overflow-hidden bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/50 shadow-xl hover:shadow-[0_16px_50px_-12px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors relative cursor-pointer"
		>
			{/* Interactive Dot-Matrix Header Ribbon */}
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

			<div className="flex flex-col flex-1 p-7 relative z-10">
				<div className="w-13 h-13 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent) mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
					{item.icon}
				</div>
				<div className="font-bold text-xl text-(--text) group-hover:text-(--accent) transition-colors font-mono mb-2.5">{item.title}</div>
				<p className="text-sm text-(--text-muted) leading-relaxed">{item.desc}</p>
			</div>
		</motion.div>
	);
}
