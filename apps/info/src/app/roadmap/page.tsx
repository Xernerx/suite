/** @format */
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useEnvironment, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Input, MultiSelector } from '@xernerx/ui';
import { motion } from 'framer-motion';
import KnownIssuesSection from '@/components/roadmap/KnownIssuesSection';
import MobileRoadmapTimeline from '@/components/roadmap/MobileRoadmapTimeline';
import RoadmapActionBar from '@/components/roadmap/RoadmapActionBar';

export default function RoadmapPage() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [roadmap, setRoadmap] = useState<any[]>([]);
	const [issues, setIssues] = useState<any[]>([]);
	const [orgBots, setOrgBots] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});
	const [loading, setLoading] = useState(true);
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	const toggleProduct = (prod: string) => {
		setSelectedProducts((prev) => (prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod]));
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const q = params.get('q');
			const prod = params.get('product');
			const status = params.get('status');
			if (q) setSearchQuery(q);
			if (prod) setSelectedProducts(prod.split(',').filter(Boolean));
			if (status) {
				const valid = status.split(',').filter((s) => ['idea', 'planned', 'active', 'released', 'current_quarter'].includes(s));
				if (valid.length > 0) setSelectedStatuses(valid);
			}
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined' || loading) return;
		const params = new URLSearchParams(window.location.search);
		if (selectedProducts.length > 0) params.set('product', selectedProducts.join(','));
		else params.delete('product');
		if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
		else params.delete('status');
		if (searchQuery.trim()) params.set('q', searchQuery.trim());
		else params.delete('q');
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, [selectedProducts, selectedStatuses, searchQuery, loading]);

	useEffect(() => {
		if (!isReady) return;
		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/info/roadmap'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/issues'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'))
				.then((res) => (res.ok ? res.json() : { data: [], bots: [] }))
				.catch(() => ({ data: [], bots: [] })),
		])
			.then(([roadmapData, issuesData, productsData]) => {
				const rItems = roadmapData?.data || [];
				const iItems = issuesData?.data || [];
				const botsList = Array.isArray(productsData?.bots) ? productsData.bots : [];

				setRoadmap(rItems);
				setIssues(iItems);
				setOrgBots(botsList);
				setLoading(false);

				const alreadyResolvedIds = new Set(botsList.filter((b: any) => b?.id && b?.name && b?.avatarUrl).map((b: any) => String(b.id).trim()));
				const botIds = new Set<string>();
				botsList.forEach((b: any) => {
					if (b?.id && /^\d{17,20}$/.test(String(b.id).trim()) && !alreadyResolvedIds.has(String(b.id).trim())) botIds.add(String(b.id).trim());
				});
				[...rItems, ...iItems].forEach((item: any) => {
					const candidate =
						item?.botId && /^\d{17,20}$/.test(String(item.botId).trim())
							? String(item.botId).trim()
							: item?.productId && /^\d{17,20}$/.test(String(item.productId).trim())
								? String(item.productId).trim()
								: null;
					if (candidate && !alreadyResolvedIds.has(candidate)) botIds.add(candidate);
				});

				botIds.forEach((id) => {
					fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`), { credentials: 'include' })
						.then((res) => (res.ok ? res.json() : null))
						.then((d) => {
							if (!d) return;
							setBotProfiles((prev) => ({ ...prev, [id]: { name: d.global_name || d.username || id, avatarUrl: d.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png' } }));
						})
						.catch(() => {});
				});
			})
			.catch((err) => {
				setLoading(false);
				try {
					toast({ type: 'error', title: t('common.toast.error'), description: err.message });
				} catch {}
			});
	}, [isReady, getEnvUrl]);

	const resolveBot = (itemOrProd: any): { name: string; avatarUrl: string | null } | null => {
		const isObj = itemOrProd && typeof itemOrProd === 'object';
		const rawBotId = isObj ? itemOrProd.botId : null;
		const rawProd = isObj ? itemOrProd.productId : itemOrProd;

		const itemWithBot = !rawBotId && rawProd ? roadmap.find((r: any) => r.productId === rawProd && r.botId) : null;
		const matchedOrgBot = orgBots.find((b) => b.id === rawBotId || b.id === rawProd || (rawProd && b.name.toLowerCase() === String(rawProd).toLowerCase()));

		const targetId = rawBotId || itemWithBot?.botId || matchedOrgBot?.id || (rawProd && /^\d{17,20}$/.test(String(rawProd).trim()) ? String(rawProd).trim() : null);

		if (!targetId) return null;
		return botProfiles[targetId] || (matchedOrgBot ? { name: matchedOrgBot.name, avatarUrl: matchedOrgBot.avatarUrl } : null);
	};

	// Process Roadmap into Timeline
	// 0. Get Current Quarter
	const currentD = new Date();
	const currentQuarterStr = `Q${Math.ceil((currentD.getMonth() + 1) / 3)} ${currentD.getFullYear()}`;

	// 1. Extract all unique quarters, replace empty with 'Backlog' and ensure current quarter is present
	const itemsWithQ = roadmap.map((i) => ({ ...i, targetQuarter: i.targetQuarter?.trim() ? i.targetQuarter : 'Backlog' }));
	const rawQuarters = [...new Set([...itemsWithQ.map((i) => i.targetQuarter), currentQuarterStr])];

	// Sort quarters: 'Backlog' goes first (or last), followed by actual quarters like 'Q1 2026'
	const sortedQuarters = rawQuarters.sort((a, b) => {
		if (a === 'Backlog') return 1; // push backlog to end
		if (b === 'Backlog') return -1;
		// e.g. Q4 2026 vs Q1 2027
		const [qA, yA] = a.split(' ');
		const [qB, yB] = b.split(' ');
		if (yA !== yB) return (parseInt(yA) || 0) - (parseInt(yB) || 0);
		return qA.localeCompare(qB);
	});

	const allProducts = Array.from(new Set(roadmap.map((i: any) => i.productId)));
	const productColors = ['#3b82f6', '#ec4899', '#10b981', '#f97316', '#8b5cf6', '#06b6d4', '#ef4444', '#eab308'];
	const getProductColor = (prod: string) => {
		const idx = allProducts.indexOf(prod);
		return productColors[Math.max(0, idx) % productColors.length];
	};

	const statusColors: any = {
		idea: 'bg-(--text-muted)',
		planned: 'bg-(--accent)',
		active: 'bg-(--accent-orange)',
		released: 'bg-(--accent-green)',
	};

	const normalizedQuery = searchQuery.trim().toLowerCase();
	const onlyCurrentQuarter = selectedStatuses.includes('current_quarter');
	const activeStatusFilters = selectedStatuses.filter((s) => s !== 'current_quarter');

	const statusCounts: Record<'all' | 'idea' | 'planned' | 'active' | 'released', number> = {
		all: 0,
		idea: 0,
		planned: 0,
		active: 0,
		released: 0,
	};
	itemsWithQ.forEach((item: any) => {
		if (selectedProducts.length > 0 && !selectedProducts.includes(item.productId)) return;
		if (onlyCurrentQuarter && item.targetQuarter !== currentQuarterStr) return;
		const st = (item.status || 'idea') as 'idea' | 'planned' | 'active' | 'released';
		statusCounts.all += 1;
		if (st in statusCounts) statusCounts[st] += 1;
	});

	const matchesRoadmapFilters = (item: any) => {
		if (selectedProducts.length > 0 && !selectedProducts.includes(item.productId)) return false;
		if (onlyCurrentQuarter && item.targetQuarter !== currentQuarterStr) return false;
		if (activeStatusFilters.length > 0 && !activeStatusFilters.includes(item.status || 'idea')) return false;
		if (normalizedQuery) {
			const botInfo = resolveBot(item);
			const prodLabel = (botInfo?.name || item.productId || '').toLowerCase();
			return (
				String(item.title || '')
					.toLowerCase()
					.includes(normalizedQuery) ||
				String(item.description || '')
					.toLowerCase()
					.includes(normalizedQuery) ||
				prodLabel.includes(normalizedQuery)
			);
		}
		return true;
	};

	const filteredIssues = issues.filter((issue: any) => {
		if (selectedProducts.length > 0 && !selectedProducts.includes(issue.productId)) return false;
		if (normalizedQuery) {
			const botInfo = resolveBot(issue);
			const prodLabel = (botInfo?.name || issue.productId || '').toLowerCase();
			return (
				String(issue.title || '')
					.toLowerCase()
					.includes(normalizedQuery) ||
				String(issue.description || '')
					.toLowerCase()
					.includes(normalizedQuery) ||
				prodLabel.includes(normalizedQuery)
			);
		}
		return true;
	});

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto min-h-screen pt-24 px-4 sm:px-8">
			{/* Header & Filters */}
			<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-4 border-b border-(--border)/10 relative z-30">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('info.roadmap.title')}
					</h1>
					<p className="text-sm sm:text-base text-(--text-muted) max-w-2xl">{t('info.roadmap.description')}</p>
				</div>

				<div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
					<div className="w-full sm:w-72 xl:w-80">
						<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('info.roadmap.searchPlaceholder')} />
					</div>

					<MultiSelector
						className="w-full sm:w-auto shrink-0"
						placeholder={t('info.roadmap.allProducts')}
						value={selectedProducts}
						onChange={setSelectedProducts}
						options={allProducts.map((prod: string) => {
							const botInfo = resolveBot(prod);
							return {
								value: prod,
								label: botInfo ? botInfo.name : prod,
								color: getProductColor(prod),
							};
						})}
					/>

					<MultiSelector
						className="w-full sm:w-auto shrink-0"
						searchable={false}
						placeholder={`${t('info.roadmap.allStatuses')} (${statusCounts.all})`}
						value={selectedStatuses}
						onChange={setSelectedStatuses}
						options={[
							{ value: 'idea', label: `${t('info.roadmap.timeline.status.idea')} (${statusCounts.idea})`, color: 'var(--text-muted)' },
							{ value: 'planned', label: `${t('info.roadmap.timeline.status.planned')} (${statusCounts.planned})`, color: 'var(--accent)' },
							{ value: 'active', label: `${t('info.roadmap.timeline.status.active')} (${statusCounts.active})`, color: 'var(--accent-orange)' },
							{ value: 'released', label: `${t('info.roadmap.timeline.status.released')} (${statusCounts.released})`, color: 'var(--accent-green)' },
							{ value: 'current_quarter', label: t('info.roadmap.currentQuarterFilter', { quarter: currentQuarterStr }), color: 'var(--accent)' },
						]}
					/>
				</div>
			</div>

			{/* Beautiful Horizontal Timeline (Hanging Wire Harness) */}
			{loading ? (
				<div className="flex items-center justify-center py-24 flex-1">
					<Loading variant="small" />
				</div>
			) : (
				<>
					<div className="w-full relative py-12 px-4 md:px-8 overflow-x-auto custom-scrollbar flex-1">
						{/* DESKTOP HANGING PENDANT LAYOUT (md:flex) */}
						{(() => {
							const trunkY = 32;
							const trackSpacing = 20;
							const trackStartY = trunkY + 48;
							const bundleBottom = trackStartY + (allProducts.length > 0 ? (allProducts.length - 1) * trackSpacing : 0);
							const cardsY = bundleBottom + 64;

							return (
								<div className="hidden md:flex flex-row min-w-max gap-16 relative z-10 pb-16">
									{/* GLOBAL BACKGROUND TRACKS */}
									<div className="absolute left-0 right-0 top-0 bottom-0 min-w-max z-0">
										{/* Main Trunk Line */}
										<div className="absolute left-0 right-0 h-[2px] bg-(--border)/20" style={{ top: `${trunkY}px` }}></div>

										{/* Parallel Product Tracks */}
										{allProducts.map((prod: string, i: number) => {
											const trackY = trackStartY + i * trackSpacing;
											const color = getProductColor(prod);
											const isSelected = selectedProducts.includes(prod);
											const isFaded = selectedProducts.length > 0 && !isSelected;
											return (
												<div
													key={prod}
													onClick={() => toggleProduct(prod)}
													className={`absolute left-0 right-0 cursor-pointer transition-all duration-300 hover:h-[4px] hover:opacity-100 z-10 ${isFaded ? 'opacity-10 h-[2px]' : isSelected ? 'opacity-100 h-[3px] shadow-[0_0_10px_currentColor]' : 'opacity-30 h-[2px]'}`}
													style={{ top: `${trackY}px`, backgroundColor: color, color: color }}
												>
													<div className="absolute -top-2 -bottom-2 left-0 right-0 bg-transparent"></div> {/* Larger click area */}
												</div>
											);
										})}
									</div>

									{/* QUARTER COLUMNS */}
									{sortedQuarters.map((quarter, qIdx) => {
										const rawQItems = itemsWithQ.filter((i: any) => i.targetQuarter === quarter);
										const qItems = rawQItems.filter(matchesRoadmapFilters);

										return (
											<div key={quarter} className="flex flex-col relative shrink-0">
												{/* Quarter Node on the Trunk */}
												<div className="absolute left-0 flex items-center gap-3 z-20" style={{ top: '16px' }}>
													<div
														className={`w-6 h-6 rounded-full border-4 border-(--background) z-20 relative ${quarter === 'Backlog' ? 'opacity-0' : quarter === currentQuarterStr ? 'bg-(--accent) shadow-[0_0_20px_var(--accent)] animate-pulse' : 'bg-(--accent)/40 shadow-[0_0_15px_var(--accent)]'}`}
													>
														{quarter === currentQuarterStr && (
															<div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
																<span className="whitespace-nowrap text-[10px] font-black uppercase bg-(--accent) text-white px-2.5 py-1 rounded-full shadow-lg">
																	{t('info.roadmap.timeline.today')}
																</span>
																<div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-(--accent) mt-0.5"></div>
															</div>
														)}
													</div>
													{quarter !== 'Backlog' && (
														<h2
															className={`text-xl font-black uppercase tracking-widest px-3.5 py-0.5 rounded-full bg-(--foreground)/40 border border-(--border)/10 shadow-xs ${
																quarter === currentQuarterStr ? 'text-(--accent) border-(--accent)/30' : 'text-(--text)'
															}`}
														>
															{quarter}
														</h2>
													)}
												</div>

												{/* Horizontal Cards Container for this Quarter */}
												<div className="flex flex-row gap-6 items-start z-10 pl-16" style={{ marginTop: `${cardsY}px` }}>
													{qItems.length === 0 && (
														<div className="w-[300px] h-1 opacity-0"></div> // Spacer for empty quarters
													)}

													{qItems.map((item: any) => {
														const pIdx = allProducts.indexOf(item.productId);
														const trackY = trackStartY + pIdx * trackSpacing;
														const color = getProductColor(item.productId);
														const distToTrack = cardsY - trackY;
														const botInfo = resolveBot(item);

														return (
															<motion.div
																layout
																initial={{ opacity: 0, y: 15 }}
																animate={{ opacity: 1, y: 0 }}
																transition={{ duration: 0.3, ease: 'easeOut' }}
																key={item.id}
																className="relative flex flex-col w-[340px] shrink-0 p-6 bg-(--foreground)/30 backdrop-blur-xl rounded-2xl border border-(--border)/10 shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-(--foreground)/50 transition-all duration-300 group/card"
															>
																{/* Vertical Wire connecting card up to its horizontal track */}
																<div
																	className="absolute w-[2px] opacity-40 group-hover/card:opacity-100 transition-all duration-300 z-10"
																	style={{ left: '32px', top: `-${distToTrack}px`, height: `${distToTrack}px`, backgroundColor: color }}
																></div>

																{/* The Node dot exactly on the horizontal track */}
																<div
																	className="absolute w-3 h-3 rounded-full border-2 border-(--background) z-20 transition-transform duration-300 group-hover/card:scale-[1.7]"
																	style={{ left: '27px', top: `-${distToTrack + 5}px`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
																></div>

																{/* Card Hover Accent */}
																<div
																	className="pointer-events-none absolute inset-0 rounded-[inherit] border-l-4 opacity-50 group-hover/card:opacity-100 transition-opacity duration-300"
																	style={{ borderLeftColor: color }}
																></div>

																<div className="flex justify-between items-start mb-4 z-10">
																	<span
																		onClick={() => toggleProduct(item.productId)}
																		className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider border cursor-pointer hover:brightness-125 transition-all"
																		style={{
																			color: color,
																			backgroundColor: `color-mix(in srgb, ${color} 15%, var(--background))`,
																			borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
																		}}
																	>
																		{botInfo?.avatarUrl && (
																			<Image
																				src={botInfo.avatarUrl}
																				alt={botInfo.name}
																				width={16}
																				height={16}
																				unoptimized
																				className="w-4 h-4 rounded-full object-cover"
																			/>
																		)}
																		{botInfo ? botInfo.name : item.productId}
																	</span>
																	<div className="flex items-center gap-2">
																		<span className={`w-2 h-2 rounded-full ${statusColors[item.status || 'idea'] || 'bg-(--text-muted)'}`}></span>
																		<span className="text-[10px] uppercase font-bold text-(--text-muted)">
																			{t(`info.roadmap.timeline.status.${item.status || 'idea'}`)}
																		</span>
																	</div>
																</div>

																<h3 className="font-bold text-lg leading-tight text-(--text) group-hover/card:text-(--accent) transition-colors z-10">{item.title}</h3>
																<p className="text-sm text-(--text-muted) mt-3 line-clamp-3 leading-relaxed z-10">{item.description}</p>

																{item.status === 'released' && item.changelogUrl && (
																	<a
																		href={item.changelogUrl}
																		className="mt-4 text-xs font-bold hover:underline flex items-center gap-1 w-fit z-10"
																		style={{ color: color }}
																	>
																		{t('info.roadmap.timeline.readChangelog')} →
																	</a>
																)}

																<RoadmapActionBar item={item} onUpdate={(updated: any) => setRoadmap((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))} />
															</motion.div>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							);
						})()}

						{/* MOBILE VERTICAL STACK (md:hidden) */}
						<MobileRoadmapTimeline
							sortedQuarters={sortedQuarters}
							currentQuarterStr={currentQuarterStr}
							itemsWithQ={itemsWithQ}
							matchesRoadmapFilters={matchesRoadmapFilters}
							allProducts={allProducts}
							selectedProducts={selectedProducts}
							onToggleProduct={toggleProduct}
							getProductColor={getProductColor}
							resolveBot={resolveBot}
							statusColors={statusColors}
							onUpdateItem={(updated: any) => setRoadmap((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))}
						/>
					</div>

					{/* Known Issues Section */}
					<KnownIssuesSection issues={filteredIssues} resolveBot={resolveBot} />
				</>
			)}
		</div>
	);
}
