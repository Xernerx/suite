/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronUp, CornerDownLeft, Search, Server, Users } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Input } from '@xernerx/ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface SearchResultItem {
	id: string;
	name: string;
	description?: string;
	avatarUrl?: string | null;
	voteCount?: number;
	memberCount?: number;
	href: string;
}

export function ExploreSearchBar({ context }: { context: 'bots' | 'servers' }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const router = useRouter();

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		const trimmed = query.trim();
		if (!trimmed || !isReady) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const timer = setTimeout(async () => {
			try {
				if (context === 'bots') {
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?search=${encodeURIComponent(trimmed)}&limit=5`));
					if (res.ok) {
						const bots: Array<{ id: string; description?: string; voteCount?: number }> = await res.json();
						const enriched = await Promise.all(
							bots.slice(0, 5).map(async (bot) => {
								try {
									const dRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`));
									const d = dRes.ok ? await dRes.json() : null;
									return {
										id: bot.id,
										name: d?.global_name || d?.username || bot.id,
										description: bot.description,
										avatarUrl: d?.avatarUrl || null,
										voteCount: bot.voteCount || 0,
										href: `/bots/${bot.id}`,
									};
								} catch {
									return {
										id: bot.id,
										name: bot.id,
										description: bot.description,
										avatarUrl: null,
										voteCount: bot.voteCount || 0,
										href: `/bots/${bot.id}`,
									};
								}
							})
						);
						setResults(enriched);
					}
				} else {
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds?search=${encodeURIComponent(trimmed)}&limit=5&privacy=public`));
					if (res.ok) {
						const guilds: Array<{ id: string; name: string; icon?: string; description?: string; voteCount?: number; memberCount?: number }> = await res.json();
						setResults(
							guilds.slice(0, 5).map((g) => ({
								id: g.id,
								name: g.name || g.id,
								description: g.description,
								avatarUrl: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
								voteCount: g.voteCount || 0,
								memberCount: g.memberCount,
								href: `/servers/${g.id}`,
							}))
						);
					}
				}
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [query, context, getEnvUrl, isReady]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [query, context]);

	// Total navigable items: results + 1 ("View all results")
	const totalItems = results.length + 1;

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!query.trim()) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setIsOpen(true);
			setSelectedIndex((prev) => (prev + 1) % totalItems);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setIsOpen(true);
			setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (selectedIndex < results.length && results[selectedIndex]) {
				router.push(results[selectedIndex].href);
				setIsOpen(false);
			} else {
				router.push(`/${context}?search=${encodeURIComponent(query.trim())}`);
				setIsOpen(false);
			}
		} else if (e.key === 'Escape') {
			setIsOpen(false);
		}
	};

	return (
		<div ref={containerRef} className="flex-1 w-full min-w-[200px] relative">
			<Input
				variant="search"
				shortcut="K"
				value={query}
				onFocus={() => setIsOpen(true)}
				onChange={(e) => {
					setQuery(e.target.value);
					setIsOpen(true);
				}}
				onKeyDown={handleKeyDown}
				placeholder={context === 'bots' ? t('app.home.searchBots') : t('app.home.searchServers')}
			/>

			<AnimatePresence>
				{isOpen && query.trim().length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.98 }}
						transition={{ duration: 0.15 }}
						className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-2xl border border-(--border)/15 bg-(--background)/95 backdrop-blur-xl shadow-2xl overflow-hidden text-left"
					>
						<div className="flex flex-col p-2 max-h-[380px] overflow-y-auto divide-y divide-(--border)/5">
							{results.length === 0 && !loading && <div className="px-4 py-4 text-center text-xs text-(--text-muted)">{t('app.home.searchNoResults', { query: query.trim() })}</div>}

							{results.map((item, idx) => {
								const isSelected = idx === selectedIndex;
								return (
									<button
										key={item.id}
										type="button"
										onMouseEnter={() => setSelectedIndex(idx)}
										onClick={() => {
											router.push(item.href);
											setIsOpen(false);
										}}
										className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer ${
											isSelected ? 'bg-(--accent)/12 text-(--text)' : 'hover:bg-(--foreground)/50 text-(--text)'
										}`}
									>
										<div className="flex items-center gap-3 min-w-0">
											<div className="relative h-9 w-9 rounded-xl bg-(--foreground) border border-(--border)/10 overflow-hidden flex items-center justify-center shrink-0">
												{item.avatarUrl ? (
													<Image src={item.avatarUrl} alt={item.name} width={36} height={36} className="h-full w-full object-cover" unoptimized />
												) : (
													<span className="text-xs font-bold text-(--text-muted)">{item.name.charAt(0).toUpperCase()}</span>
												)}
											</div>
											<div className="flex flex-col min-w-0">
												<span className="text-sm font-bold text-(--text) truncate">{item.name}</span>
												<span className="text-xs text-(--text-muted) truncate">{item.description || t('common.noDescription')}</span>
											</div>
										</div>

										<div className="flex items-center gap-2 shrink-0">
											{item.memberCount !== undefined && (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-(--foreground) border border-(--border)/10 text-[11px] font-semibold text-(--text-muted)">
													<Users size={11} className="text-(--accent)" />
													{item.memberCount}
												</span>
											)}
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-(--foreground) border border-(--border)/10 text-[11px] font-semibold text-(--text-muted)">
												<ChevronUp size={11} className="text-(--accent)" />
												{item.voteCount || 0}
											</span>
											{isSelected ? <CornerDownLeft size={14} className="text-(--accent)" /> : <ArrowRight size={14} className="text-(--text-muted)" />}
										</div>
									</button>
								);
							})}

							<button
								type="button"
								onMouseEnter={() => setSelectedIndex(results.length)}
								onClick={() => {
									router.push(`/${context}?search=${encodeURIComponent(query.trim())}`);
									setIsOpen(false);
								}}
								className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-left cursor-pointer ${
									selectedIndex === results.length ? 'bg-(--accent)/15 text-(--accent)' : 'hover:bg-(--foreground)/50 text-(--text-muted)'
								}`}
							>
								<div className="flex items-center gap-2.5 min-w-0">
									<Search size={15} className="text-(--accent) shrink-0" />
									<span className="text-xs font-bold truncate">{t('app.home.searchViewAll', { query: query.trim() })}</span>
								</div>
								<CornerDownLeft size={14} className="text-(--accent) shrink-0" />
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
