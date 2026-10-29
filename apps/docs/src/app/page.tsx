/** @format */
'use client';

import { ArrowRight, CornerDownLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import { categories, searchTopics } from '@/components/docsHomeData';
import { useDocsAccess } from '@/components/useDocsAccess';

export default function DocsHome() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const router = useRouter();
	const { isAdmin, hasWebsocket } = useDocsAccess();
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		hide();
	}, [hide]);

	const visibleCategories = useMemo(
		() =>
			categories.filter((c) => {
				if (c.href === '/websocket') return hasWebsocket;
				if (c.href === '/cdn') return isAdmin;
				return true;
			}),
		[hasWebsocket, isAdmin]
	);

	const filteredTopics = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return searchTopics
			.filter((item) => {
				if (item.href.startsWith('/websocket') && !hasWebsocket) return false;
				if (item.href.startsWith('/cdn') && !isAdmin) return false;
				const title = t(item.titleKey).toLowerCase();
				const desc = t(item.descKey).toLowerCase();
				const category = t(item.categoryKey).toLowerCase();
				return title.includes(q) || desc.includes(q) || category.includes(q) || item.keywords.includes(q) || item.href.toLowerCase().includes(q);
			})
			.slice(0, 8);
	}, [searchQuery, t, hasWebsocket]);

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
			className="flex flex-col min-h-[85dvh] w-full relative overflow-hidden"
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
					Xernerx <span className="text-transparent bg-clip-text bg-gradient-to-r from-(--accent) to-(--accent)">{t('docs.home.title')}</span>
				</h1>
				<p className="text-base text-(--text-muted) max-w-xl leading-relaxed mt-2">{t('docs.home.description')}</p>

				{/* Search Bar & Deep Search Dropdown */}
				<div className="w-full max-w-2xl mt-8 relative group">
					<div className="absolute inset-0 bg-gradient-to-r from-(--accent) to-(--accent) rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none" />
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
				className="max-w-(--page-width) mx-auto w-full z-10 flex flex-col mt-8"
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
					className={`grid grid-cols-1 ${visibleCategories.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} w-full`}
					style={{
						gap: 'calc(var(--ui-gap) * 1.5)',
					}}
				>
					{visibleCategories.map((category, idx) => (
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
								<h2
									className="text-2xl font-bold text-(--text) group-hover:text-(--accent) transition-colors mt-2"
									style={{
										fontFamily: 'var(--font-fredoka)',
									}}
								>
									{t(category.titleKey)}
								</h2>
							</div>
							<p className="text-base text-(--text-muted) leading-relaxed relative z-10">{t(category.descKey)}</p>
						</motion.a>
					))}
				</motion.div>
			</div>
		</div>
	);
}
