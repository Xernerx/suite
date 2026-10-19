/** @format */
'use client';

import { ArrowRight, CornerDownLeft, Globe, Package, Rocket, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';

const categories = [
	{
		titleKey: 'docs.home.categories.api.title',
		descKey: 'docs.home.categories.api.description',
		icon: Globe,
		href: '/api',
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
	},
	{
		titleKey: 'docs.home.categories.cdn.title',
		descKey: 'docs.home.categories.cdn.description',
		icon: Rocket,
		href: '/cdn',
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
	},
	{
		titleKey: 'docs.home.categories.npm.title',
		descKey: 'docs.home.categories.npm.description',
		icon: Package,
		href: '/packages',
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
	},
	{
		titleKey: 'docs.home.categories.websocket.title',
		descKey: 'docs.home.categories.websocket.description',
		icon: Zap,
		href: '/websocket',
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
	},
];

const searchTopics = [
	// REST API v1
	{
		titleKey: 'docs.api.common.nav.overview',
		descKey: 'docs.home.categories.api.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#overview',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'rest api base url endpoint v1 overview',
	},
	{
		titleKey: 'docs.api.common.auth',
		descKey: 'docs.api.common.authDesc1',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#authentication',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'authentication bearer token authorization header secure passage',
	},
	{
		titleKey: 'docs.api.v1.endpoints.fetchBotProfile.title',
		descKey: 'docs.api.v1.endpoints.fetchBotProfile.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#fetch-bot-profile',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'get /v1/bots/:id bot profile metadata',
	},
	{
		titleKey: 'docs.api.v1.endpoints.updateBotProfile.title',
		descKey: 'docs.api.v1.endpoints.updateBotProfile.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#update-bot-profile',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'patch /v1/bots/:id update bot profile description tags links privacy',
	},
	{
		titleKey: 'docs.api.v1.endpoints.deleteBotProfile.title',
		descKey: 'docs.api.v1.endpoints.deleteBotProfile.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#delete-bot-profile',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'delete /v1/bots/:id remove bot profile',
	},
	{
		titleKey: 'docs.api.v1.endpoints.fetchBotStats.title',
		descKey: 'docs.api.v1.endpoints.fetchBotStats.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#fetch-bot-stats',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'get /v1/bots/:id/stats statistics history',
	},
	{
		titleKey: 'docs.api.v1.endpoints.postBotStats.title',
		descKey: 'docs.api.v1.endpoints.postBotStats.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#post-bot-stats',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'post /v1/bots/:id/stats @xernerx/stats guildCount serverCount shardCount userCount',
	},
	{
		titleKey: 'docs.api.v1.endpoints.updateBotStats.title',
		descKey: 'docs.api.v1.endpoints.updateBotStats.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#update-bot-stats',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'patch /v1/bots/:id/stats update statistics snapshot',
	},
	{
		titleKey: 'docs.api.v1.endpoints.deleteBotStats.title',
		descKey: 'docs.api.v1.endpoints.deleteBotStats.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#delete-bot-stats',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'delete /v1/bots/:id/stats wipe statistics',
	},
	{
		titleKey: 'docs.api.v1.endpoints.fetchBotCommands.title',
		descKey: 'docs.api.v1.endpoints.fetchBotCommands.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#fetch-bot-commands',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'get /v1/bots/:id/commands slash commands',
	},
	{
		titleKey: 'docs.api.v1.endpoints.syncBotCommands.title',
		descKey: 'docs.api.v1.endpoints.syncBotCommands.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#sync-bot-commands',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'put /v1/bots/:id/commands sync bulk slash commands',
	},
	{
		titleKey: 'docs.api.v1.endpoints.deleteBotCommands.title',
		descKey: 'docs.api.v1.endpoints.deleteBotCommands.description',
		categoryKey: 'docs.home.categories.api.title',
		href: '/api/v1#delete-bot-commands',
		icon: Globe,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		keywords: 'delete /v1/bots/:id/commands wipe commands',
	},
	// CDN
	{
		titleKey: 'docs.cdn.overview.title',
		descKey: 'docs.cdn.description',
		categoryKey: 'docs.home.categories.cdn.title',
		href: '/cdn#overview',
		icon: Rocket,
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
		keywords: 'cdn base url authentication media storage blob',
	},
	{
		titleKey: 'docs.cdn.upload.title',
		descKey: 'docs.cdn.upload.description',
		categoryKey: 'docs.home.categories.cdn.title',
		href: '/cdn#upload',
		icon: Rocket,
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
		keywords: 'post /api/media upload file multipart form-data blob',
	},
	{
		titleKey: 'docs.cdn.list.title',
		descKey: 'docs.cdn.list.description',
		categoryKey: 'docs.home.categories.cdn.title',
		href: '/cdn#list',
		icon: Rocket,
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
		keywords: 'get /api/media list media records files',
	},
	{
		titleKey: 'docs.cdn.manage.title',
		descKey: 'docs.cdn.manage.description',
		categoryKey: 'docs.home.categories.cdn.title',
		href: '/cdn#manage',
		icon: Rocket,
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
		keywords: 'patch delete /api/media/:id manage privacy shared delete media',
	},
	{
		titleKey: 'docs.cdn.proxy.title',
		descKey: 'docs.cdn.proxy.description',
		categoryKey: 'docs.home.categories.cdn.title',
		href: '/cdn#proxy',
		icon: Rocket,
		color: 'text-purple-500',
		bg: 'bg-purple-500/10',
		keywords: 'get /raw/:id secure media proxy stream file',
	},
	// WebSocket
	{
		titleKey: 'docs.websocket.overview.title',
		descKey: 'docs.websocket.hero.description',
		categoryKey: 'docs.home.categories.websocket.title',
		href: '/websocket#overview',
		icon: Zap,
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
		keywords: 'websocket gateway rpc architecture overview socket',
	},
	{
		titleKey: 'docs.websocket.nav.connecting',
		descKey: 'docs.websocket.overview.cards.socket.desc',
		categoryKey: 'docs.home.categories.websocket.title',
		href: '/websocket#connecting',
		icon: Zap,
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
		keywords: 'websocket connecting wss ws port 5000 connection',
	},
	{
		titleKey: 'docs.websocket.nav.authentication',
		descKey: 'docs.websocket.overview.cards.auth.desc',
		categoryKey: 'docs.home.categories.websocket.title',
		href: '/websocket#authentication',
		icon: Zap,
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
		keywords: 'websocket authentication token jwt handshake allowance',
	},
	{
		titleKey: 'docs.websocket.nav.rpcProtocol',
		descKey: 'docs.websocket.overview.cards.proxy.desc',
		categoryKey: 'docs.home.categories.websocket.title',
		href: '/websocket#protocol',
		icon: Zap,
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
		keywords: 'websocket rpc protocol request response payload id service action',
	},
	{
		titleKey: 'docs.websocket.nav.servicesAndActions',
		descKey: 'docs.websocket.hero.description',
		categoryKey: 'docs.home.categories.websocket.title',
		href: '/websocket#services',
		icon: Zap,
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
		keywords: 'websocket services actions database guilds users members',
	},
	{
		titleKey: 'docs.websocket.nav.clientExample',
		descKey: 'docs.websocket.hero.description',
		categoryKey: 'docs.home.categories.websocket.title',
		href: '/websocket#client',
		icon: Zap,
		color: 'text-orange-500',
		bg: 'bg-orange-500/10',
		keywords: 'websocket client example @xernerx/websocket typescript node',
	},
	// NPM Packages
	{
		titleKey: 'docs.packages.page.title',
		descKey: 'docs.packages.page.description',
		categoryKey: 'docs.home.categories.npm.title',
		href: '/packages',
		icon: Package,
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
		keywords: 'npm packages @xernerx/framework @xernerx/stats @xernerx/websocket classes interfaces functions',
	},
];

export default function DocsHome() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		hide();
	}, [hide]);

	const filteredTopics = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return searchTopics
			.filter((item) => {
				const title = t(item.titleKey).toLowerCase();
				const desc = t(item.descKey).toLowerCase();
				const category = t(item.categoryKey).toLowerCase();
				return title.includes(q) || desc.includes(q) || category.includes(q) || item.keywords.includes(q) || item.href.toLowerCase().includes(q);
			})
			.slice(0, 8);
	}, [searchQuery, t]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [searchQuery]);

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!searchQuery.trim() || filteredTopics.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev + 1) % filteredTopics.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev - 1 + filteredTopics.length) % filteredTopics.length);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const target = filteredTopics[selectedIndex];
			if (target) {
				router.push(target.href);
			}
		} else if (e.key === 'Escape') {
			setSearchQuery('');
		}
	};

	return (
		<div
			className="flex flex-col min-h-[85vh] w-full relative overflow-hidden"
			style={{
				padding: 'calc(var(--ui-gap) * 2)',
				gap: 'calc(var(--ui-gap) * 3)',
			}}
		>
			{/* Hero Section */}
			<motion.div
				initial={{
					opacity: 1,
					y: 0,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				transition={{
					duration: 0.5,
					ease: 'easeOut',
				}}
				className="flex flex-col items-center text-center max-w-3xl mx-auto mt-16 z-20 w-full"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<h1
					className="text-5xl md:text-6xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
					style={{
						fontFamily: 'var(--font-fredoka)',
					}}
				>
					Xernerx <span className="text-transparent bg-clip-text bg-gradient-to-r from-(--accent) to-purple-500">{t('docs.home.title')}</span>
				</h1>
				<p className="text-base text-(--text-muted) max-w-xl leading-relaxed mt-2">{t('docs.home.description')}</p>

				{/* Search Bar & Deep Search Dropdown */}
				<div className="w-full max-w-2xl mt-8 relative group">
					<div className="absolute inset-0 bg-gradient-to-r from-(--accent) to-purple-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none" />
					<Input
						variant="search"
						shortcut={true}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleSearchKeyDown}
						placeholder={t('docs.home.searchPlaceholder')}
					/>

					<AnimatePresence>
						{searchQuery.trim().length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 8, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 8, scale: 0.98 }}
								transition={{ duration: 0.15 }}
								className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-2xl border border-(--border)/15 bg-(--background)/95 backdrop-blur-xl shadow-2xl overflow-hidden text-left"
							>
								{filteredTopics.length === 0 ? (
									<div className="p-6 text-center text-sm text-(--text-muted)">{t('docs.home.searchEmpty', { query: searchQuery.trim() })}</div>
								) : (
									<div className="flex flex-col p-2 max-h-[380px] overflow-y-auto divide-y divide-(--border)/5">
										{filteredTopics.map((item, idx) => {
											const Icon = item.icon;
											const isSelected = idx === selectedIndex;
											return (
												<a
													key={item.href}
													href={item.href}
													onMouseEnter={() => setSelectedIndex(idx)}
													className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
														isSelected ? 'bg-(--accent)/12 text-(--text)' : 'hover:bg-(--foreground)/50 text-(--text)'
													}`}
												>
													<div className="flex items-center gap-3 min-w-0">
														<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
															<Icon size={18} />
														</div>
														<div className="flex flex-col min-w-0">
															<div className="flex items-center gap-2">
																<span className="text-sm font-bold text-(--text) truncate">{t(item.titleKey)}</span>
																<span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-(--foreground) text-(--text-muted) border border-(--border)/10 shrink-0">
																	{t(item.categoryKey)}
																</span>
															</div>
															<span className="text-xs text-(--text-muted) truncate">{t(item.descKey).replace(/<[^>]*>/g, '')}</span>
														</div>
													</div>
													<div className="flex items-center gap-1.5 shrink-0 text-(--text-muted)">
														{isSelected ? <CornerDownLeft size={14} className="text-(--accent)" /> : <ArrowRight size={14} />}
													</div>
												</a>
											);
										})}
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>

			{/* Categories Grid */}
			<div
				className="max-w-5xl mx-auto w-full z-10 flex flex-col mt-8"
				style={{
					gap: 'calc(var(--ui-gap) * 1.5)',
				}}
			>
				<motion.div
					initial="visible"
					animate="visible"
					variants={{
						hidden: {
							opacity: 1,
						},
						visible: {
							opacity: 1,
							transition: {
								staggerChildren: 0.1,
								delayChildren: 0.3,
							},
						},
					}}
					className="grid grid-cols-1 md:grid-cols-2 w-full"
					style={{
						gap: 'calc(var(--ui-gap) * 1.5)',
					}}
				>
					{categories.map((category, idx) => (
						<motion.a
							href={category.href}
							key={idx}
							variants={{
								hidden: {
									opacity: 1,
									y: 0,
								},
								visible: {
									opacity: 1,
									y: 0,
								},
							}}
							className="group flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden relative"
							style={{
								padding: 'calc(var(--ui-gap) * 2)',
								gap: 'var(--ui-gap)',
							}}
						>
							{/* Subtle background gradient on hover */}
							<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

							<div className="flex flex-col gap-4 relative z-10">
								<div
									className={`flex h-16 w-16 items-center justify-center rounded-2xl ${category.bg} ${category.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}
								>
									<category.icon size={32} />
								</div>
								<h3
									className="text-2xl font-bold text-(--text) group-hover:text-(--accent) transition-colors mt-2"
									style={{
										fontFamily: 'var(--font-fredoka)',
									}}
								>
									{t(category.titleKey)}
								</h3>
							</div>
							<p className="text-base text-(--text-muted) leading-relaxed relative z-10">{t(category.descKey)}</p>
						</motion.a>
					))}
				</motion.div>
			</div>
		</div>
	);
}
