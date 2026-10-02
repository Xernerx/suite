'use client';
import { useState, useEffect } from 'react';
import { useEnvironment, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Tooltip } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoadmapPage() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [roadmap, setRoadmap] = useState<any[]>([]);
	const [issues, setIssues] = useState([]);
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

	useEffect(() => {
		if (!isReady) return;
		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/info/roadmap'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
			fetch(getEnvUrl('https://api.xernerx.com/info/issues/metrics'))
				.then((res) => (res.ok ? res.json() : { data: null }))
				.catch(() => ({ data: null })),
			fetch(getEnvUrl('https://api.xernerx.com/info/issues'))
				.then((res) => (res.ok ? res.json() : { data: [] }))
				.catch(() => ({ data: [] })),
		])
			.then(([roadmapData, metricsData, issuesData]) => {
				setRoadmap(roadmapData?.data || []);
				setMetrics(metricsData?.data || null);
				setIssues(issuesData?.data || []);
				setLoading(false);
			})
			.catch((err) => {
				setLoading(false);
				try {
					toast({ type: 'error', title: 'Error', description: err.message });
				} catch {}
			});
	}, [isReady, getEnvUrl]);

	if (loading) return <Loading />;

	const formatTime = (ms: number) => {
		if (!ms) return t('info.roadmap.metrics.na');
		const hours = (ms / (1000 * 60 * 60)).toFixed(1);
		return t('info.roadmap.metrics.hours', { count: hours });
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
		idea: 'bg-gray-500',
		planned: 'bg-blue-500',
		active: 'bg-yellow-500',
		released: 'bg-green-500',
	};

	return (
		<div className="flex flex-col w-full min-h-screen overflow-hidden">
			{/* Header & Metrics */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="flex flex-col items-center justify-center p-12 bg-transparent border-b border-(--border)/10 backdrop-blur-sm relative z-10"
			>
				<h1 className="text-5xl font-bold mb-4 text-(--text)">{t('info.roadmap.title')}</h1>
				<p className="text-(--text-muted) mb-8 max-w-2xl text-center">{t('info.roadmap.description')}</p>

				<div className="flex gap-8 mt-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.4, delay: 0.15 }}
						whileHover={{ scale: 1.03 }}
						className="flex flex-col items-center p-6 bg-(--accent)/5 backdrop-blur-md rounded-xl border border-(--accent)/20 shadow-sm"
					>
						<span className="text-3xl font-bold text-(--accent)">{formatTime(metrics?.avgTimeMs)}</span>
						<span className="text-sm text-(--text-muted) uppercase tracking-widest mt-1">{t('info.roadmap.metrics.avgResolutionTime')}</span>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.4, delay: 0.25 }}
						whileHover={{ scale: 1.03 }}
						className="flex flex-col items-center p-6 bg-(--accent)/5 rounded-xl border border-(--accent)/20"
					>
						<span className="text-3xl font-bold text-(--accent)">{metrics?.recentResolutions?.length || 0}</span>
						<span className="text-sm text-(--text-muted) uppercase tracking-widest mt-1">{t('info.roadmap.metrics.recentResolutions')}</span>
					</motion.div>
				</div>
			</motion.div>

			{/* Beautiful Horizontal Timeline (Hanging Wire Harness) */}
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
									const isSelected = selectedProduct === prod;
									const isFaded = selectedProduct && !isSelected;
									return (
										<div
											key={prod}
											onClick={() => setSelectedProduct(isSelected ? null : prod)}
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
								const qItems = selectedProduct ? rawQItems.filter((i: any) => i.productId === selectedProduct) : rawQItems;

								return (
									<div key={quarter} className="flex flex-col relative shrink-0">
										{/* Quarter Node on the Trunk */}
										<div className="absolute left-0 flex items-center gap-4" style={{ top: '20px' }}>
											<div
												className={`w-6 h-6 rounded-full border-4 border-(--background) z-20 relative ${quarter === 'Backlog' ? 'opacity-0' : quarter === currentQuarterStr ? 'bg-(--accent) shadow-[0_0_20px_var(--accent)] animate-pulse' : 'bg-(--accent)/40 shadow-[0_0_15px_var(--accent)]'}`}
											>
												{quarter === currentQuarterStr && (
													<div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
														<span className="whitespace-nowrap text-[10px] font-black uppercase bg-(--accent) text-(--background) px-2 py-1 rounded shadow-lg">
															{t('info.roadmap.timeline.today')}
														</span>
														<div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-(--accent) mt-0.5"></div>
													</div>
												)}
											</div>
											<h2 className={`text-2xl font-black uppercase tracking-widest ${quarter === currentQuarterStr ? 'text-(--accent)' : 'text-(--text)'}`}>
												{quarter === 'Backlog' ? '' : quarter}
											</h2>
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
															className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover/card:opacity-100 transition-opacity rounded-l-2xl"
															style={{ backgroundColor: color }}
														></div>

														<div className="flex justify-between items-start mb-4 z-10">
															<span
																onClick={() => setSelectedProduct(selectedProduct === item.productId ? null : item.productId)}
																className="text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider border cursor-pointer hover:brightness-150 transition-all"
																style={{ color: color, backgroundColor: `${color}1A`, borderColor: `${color}33` }}
															>
																{item.productId}
															</span>
															<div className="flex items-center gap-2">
																<span className={`w-2 h-2 rounded-full ${statusColors[item.status || 'idea'] || 'bg-gray-500'}`}></span>
																<span className="text-[10px] uppercase font-bold text-(--text-muted)">
																	{t(`info.roadmap.timeline.status.${item.status || 'idea'}`)}
																</span>
															</div>
														</div>

														<h3 className="font-bold text-lg leading-tight text-(--text) group-hover/card:text-(--accent) transition-colors z-10">{item.title}</h3>
														<p className="text-sm text-(--text-muted) mt-3 line-clamp-3 leading-relaxed z-10">{item.description}</p>

														{item.status === 'released' && item.changelogUrl && (
															<a href={item.changelogUrl} className="mt-4 text-xs font-bold hover:underline flex items-center gap-1 w-fit z-10" style={{ color: color }}>
																{t('info.roadmap.timeline.readChangelog')} →
															</a>
														)}
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
				<div className="flex md:hidden flex-col gap-12 w-full pt-4 pb-8 relative">
					<div className="absolute top-8 bottom-0 left-[27px] w-[2px] bg-(--border)/20 z-0"></div>
					{sortedQuarters.map((quarter, idx) => {
						const rawQItems = itemsWithQ.filter((i: any) => i.targetQuarter === quarter);
						const qItems = selectedProduct ? rawQItems.filter((i: any) => i.productId === selectedProduct) : rawQItems;
						return (
							<div key={quarter} className="flex flex-col w-full relative z-10">
								<div className="flex items-center gap-4 mb-8">
									<div
										className={`w-6 h-6 rounded-full border-4 border-(--background) shadow-[0_0_15px_var(--accent)] z-20 relative ${quarter === 'Backlog' ? 'opacity-0' : quarter === currentQuarterStr ? 'bg-(--accent) shadow-[0_0_20px_var(--accent)] animate-pulse' : 'bg-(--accent)/40'}`}
									>
										{quarter === currentQuarterStr && (
											<div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
												<span className="whitespace-nowrap text-[10px] font-black uppercase bg-(--accent) text-(--background) px-2 py-1 rounded shadow-lg">
													{t('info.roadmap.timeline.today')}
												</span>
												<div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-(--accent) mt-0.5"></div>
											</div>
										)}
									</div>
									<h2 className={`text-2xl font-black tracking-wider uppercase ${quarter === currentQuarterStr ? 'text-(--accent)' : 'text-(--text)'}`}>
										{quarter === 'Backlog' ? '' : quarter}
									</h2>
								</div>
								<div className="flex flex-col gap-8 pl-[18px]">
									{allProducts.map((prod) => {
										const pItems = qItems.filter((i: any) => i.productId === prod);
										if (pItems.length === 0 || (selectedProduct && prod !== selectedProduct)) return null;
										const color = getProductColor(prod);

										return (
											<div key={prod} className="flex flex-col gap-4 relative border-l-2 pl-6" style={{ borderColor: `${color}66` }}>
												<div className="absolute top-0 -left-[3px] w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
												<span
													onClick={() => setSelectedProduct(selectedProduct === prod ? null : prod)}
													className="text-[10px] font-black uppercase px-2 py-1 rounded-md w-fit cursor-pointer hover:brightness-150 transition-all"
													style={{ color: color, backgroundColor: `${color}1A`, border: `1px solid ${color}33` }}
												>
													{prod}
												</span>
												{pItems.map((item: any) => (
													<motion.div
														layout
														key={item.id}
														className="flex flex-col p-5 bg-(--foreground)/30 backdrop-blur-xl rounded-2xl border border-(--border)/10 shadow-lg relative overflow-hidden"
													>
														<div className="absolute top-0 left-0 w-1 h-full opacity-60" style={{ backgroundColor: color }}></div>
														<div className="flex justify-between items-start mb-2">
															<div className="flex items-center gap-2">
																<span className={`w-2 h-2 rounded-full ${statusColors[item.status || 'idea'] || 'bg-gray-500'}`}></span>
																<span className="text-xs uppercase font-bold text-(--text-muted)">
																	{t(`info.roadmap.timeline.status.${item.status || 'idea'}`)}
																</span>
															</div>
														</div>
														<h3 className="font-bold text-lg text-(--text)">{item.title}</h3>
														<p className="text-sm text-(--text-muted) mt-2">{item.description}</p>
													</motion.div>
												))}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Known Issues Section */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: '-50px' }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="flex flex-col max-w-7xl mx-auto w-full p-8 md:p-12 mt-12 mb-24 rounded-[2.5rem] border border-(--border)/10 gap-8 bg-(--foreground)/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group"
			>
				<div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-(--accent)/5 via-transparent to-transparent pointer-events-none z-0"></div>
				<div className="absolute -top-32 -right-32 w-96 h-96 bg-(--accent)/10 rounded-full blur-[100px] pointer-events-none z-0 group-hover:bg-(--accent)/20 transition-all duration-700"></div>

				<div className="flex flex-col gap-2 text-center md:text-left relative z-10">
					<h2 className="text-3xl font-bold text-(--text)">{t('info.roadmap.knownIssues.title')}</h2>
					<p className="text-(--text-muted)">{t('info.roadmap.knownIssues.description')}</p>
				</div>

				<div className="flex flex-col gap-10 relative z-10">
					<div className="flex flex-col gap-4">
						<h3 className="font-bold flex items-center gap-2 text-lg text-(--text)">
							<span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"></span> {t('info.roadmap.knownIssues.openIssues')}
						</h3>
						<div className="flex flex-col gap-4">
							{issues.filter((i: any) => i.status === 'open' && i.acknowledged).length === 0 ? (
								<div className="p-6 text-center text-(--text-muted) font-medium text-sm border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-xl rounded-2xl shadow-inner">
									{t('info.roadmap.knownIssues.noOpenIssues')}
								</div>
							) : (
								<AnimatePresence mode="popLayout">
									{issues
										.filter((i: any) => i.status === 'open' && i.acknowledged)
										.map((issue: any) => (
											<motion.div
												layout
												initial={{ opacity: 0, y: 15 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.25, ease: 'easeOut' }}
												key={issue.id}
												className="flex flex-col p-6 bg-(--foreground)/40 backdrop-blur-xl rounded-2xl border border-(--border)/10 shadow-xl transition-all duration-300 hover:border-red-500/60 hover:bg-(--foreground)/60 hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)] hover:-translate-y-1 hover:z-20 gap-3 relative group/card"
											>
												<div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/40 group-hover/card:bg-red-500 transition-colors duration-300 rounded-l-2xl"></div>
												<div className="flex justify-between items-start mb-2">
													<div className="flex items-center gap-2">
														<span className="text-xs font-black uppercase text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg tracking-widest border border-red-500/20">
															{issue.productId}
														</span>
														<Tooltip
															position="bottom"
															content={
																issue.acknowledged
																	? t('info.bugs.tooltips.verified')
																	: t('info.bugs.tooltips.submitted')
															}
														>
															<div className="flex items-center gap-1.5 bg-(--background)/50 px-2 py-1 rounded-md border border-(--border)/10 cursor-help transition-colors hover:border-(--border)/30">
																<span className={`w-2 h-2 rounded-full ${issue.acknowledged ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
																<span className="text-[10px] uppercase font-bold text-(--text-muted)">
																	{issue.acknowledged ? t('info.bugs.status.verified') : t('info.bugs.status.submitted')}
																</span>
															</div>
														</Tooltip>
													</div>
													<span className="text-xs font-medium text-(--text-muted) bg-(--foreground)/50 px-2 py-1 rounded-md">
														{new Date(issue.createdAt).toLocaleDateString()}
													</span>
												</div>
												<div className="flex flex-col">
													<div className="font-bold text-xl text-(--text) group-hover/card:text-(--accent) transition-colors">{issue.title}</div>
													<div className="text-sm text-(--text-muted) mt-3 leading-relaxed">{issue.description}</div>
												</div>
											</motion.div>
										))}
								</AnimatePresence>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<h3 className="font-bold flex items-center gap-2 text-lg text-(--text)">
							<span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></span> {t('info.roadmap.knownIssues.recentlyResolved')}
						</h3>
						<div className="flex flex-col gap-4">
							{issues.filter((i: any) => i.status === 'resolved').length === 0 ? (
								<div className="p-6 text-center text-(--text-muted) font-medium text-sm border border-(--border)/10 bg-(--foreground)/20 backdrop-blur-xl rounded-2xl shadow-inner">
									{t('info.roadmap.knownIssues.noResolvedIssues')}
								</div>
							) : (
								<AnimatePresence mode="popLayout">
									{issues
										.filter((i: any) => i.status === 'resolved')
										.map((issue: any) => (
											<motion.div
												layout
												initial={{ opacity: 0, y: 15 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.25, ease: 'easeOut' }}
												key={issue.id}
												className="flex flex-col p-6 bg-(--foreground)/20 backdrop-blur-xl rounded-2xl border border-(--border)/5 shadow-lg transition-all duration-300 hover:border-green-500/40 hover:bg-(--foreground)/40 gap-3 relative overflow-hidden opacity-75 hover:opacity-100 group/card"
											>
												<div className="absolute top-0 left-0 w-1.5 h-full bg-green-500/30 group-hover/card:bg-green-500 transition-colors duration-300 rounded-l-2xl"></div>
												<div className="flex justify-between items-start mb-2">
													<span className="text-xs font-black uppercase text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg tracking-widest border border-green-500/20">
														{issue.productId}
													</span>
													<span className="text-xs font-medium text-(--text-muted) bg-(--foreground)/40 px-2 py-1 rounded-md">
														{t('info.roadmap.knownIssues.fixedOn', {
															date: new Date(issue.resolvedAt || issue.updatedAt).toLocaleDateString(),
														})}
													</span>
												</div>
												<div className="flex flex-col">
													<div className="font-bold text-lg line-through text-(--text-muted) group-hover/card:text-(--text) transition-colors">{issue.title}</div>
												</div>
											</motion.div>
										))}
								</AnimatePresence>
							)}
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
