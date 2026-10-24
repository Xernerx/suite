/** @format */
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useDictionary } from '@xernerx/providers';
import RoadmapActionBar from './RoadmapActionBar';

interface MobileRoadmapTimelineProps {
	sortedQuarters: string[];
	currentQuarterStr: string;
	itemsWithQ: any[];
	matchesRoadmapFilters: (item: any) => boolean;
	allProducts: string[];
	selectedProduct: string | null;
	setSelectedProduct: (prod: string | null) => void;
	getProductColor: (prod: string) => string;
	resolveBot: (itemOrProd: any) => { name: string; avatarUrl: string | null } | null;
	statusColors: Record<string, string>;
	onUpdateItem: (updated: any) => void;
}

export default function MobileRoadmapTimeline({
	sortedQuarters,
	currentQuarterStr,
	itemsWithQ,
	matchesRoadmapFilters,
	allProducts,
	selectedProduct,
	setSelectedProduct,
	getProductColor,
	resolveBot,
	statusColors,
	onUpdateItem,
}: MobileRoadmapTimelineProps) {
	const { t } = useDictionary();

	return (
		<div className="flex md:hidden flex-col gap-12 w-full pt-4 pb-8 relative">
			<div className="absolute top-8 bottom-0 left-[27px] w-[2px] bg-(--border)/20 z-0"></div>
			{sortedQuarters.map((quarter) => {
				const rawQItems = itemsWithQ.filter((i: any) => i.targetQuarter === quarter);
				const qItems = rawQItems.filter(matchesRoadmapFilters);
				return (
					<div key={quarter} className="flex flex-col w-full relative z-10">
						<div className="flex items-center gap-4 mb-8">
							<div
								className={`w-6 h-6 rounded-full border-4 border-(--background) shadow-[0_0_15px_var(--accent)] z-20 relative ${
									quarter === 'Backlog' ? 'opacity-0' : quarter === currentQuarterStr ? 'bg-(--accent) shadow-[0_0_20px_var(--accent)] animate-pulse' : 'bg-(--accent)/40'
								}`}
							>
								{quarter === currentQuarterStr && (
									<div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
										<span className="whitespace-nowrap text-[10px] font-black uppercase bg-(--accent) text-(--background) px-2 py-1 rounded-xl shadow-lg">
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
								const prodBotInfo = resolveBot(pItems[0] || prod);

								return (
									<div key={prod} className="flex flex-col gap-4 relative border-l-2 pl-6" style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}>
										<div className="absolute top-0 -left-[3px] w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
										<span
											onClick={() => setSelectedProduct(selectedProduct === prod ? null : prod)}
											className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full w-fit cursor-pointer hover:brightness-125 transition-all"
											style={{
												color: color,
												backgroundColor: `color-mix(in srgb, ${color} 15%, var(--background))`,
												border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
											}}
										>
											{prodBotInfo?.avatarUrl && (
												<Image src={prodBotInfo.avatarUrl} alt={prodBotInfo.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />
											)}
											{prodBotInfo ? prodBotInfo.name : prod}
										</span>
										{pItems.map((item: any) => (
											<motion.div
												layout
												key={item.id}
												className="flex flex-col p-5 bg-(--foreground)/30 backdrop-blur-xl rounded-2xl border border-(--border)/10 shadow-lg relative overflow-hidden"
											>
												<div className="pointer-events-none absolute inset-0 rounded-[inherit] border-l-4 opacity-60" style={{ borderLeftColor: color }}></div>
												<div className="flex justify-between items-start mb-2">
													<div className="flex items-center gap-2">
														<span className={`w-2 h-2 rounded-full ${statusColors[item.status || 'idea'] || 'bg-(--text-muted)'}`}></span>
														<span className="text-xs uppercase font-bold text-(--text-muted)">{t(`info.roadmap.timeline.status.${item.status || 'idea'}`)}</span>
													</div>
												</div>
												<h3 className="font-bold text-lg text-(--text)">{item.title}</h3>
												<p className="text-sm text-(--text-muted) mt-2">{item.description}</p>
												<RoadmapActionBar item={item} onUpdate={onUpdateItem} />
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
	);
}
