/** @format */
'use client';

import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ScrollText } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export interface UrgentItem {
	id: string;
	view: string;
	title: string;
	subtitle: string;
	count: number;
	severity: 'critical' | 'warning' | 'info';
	icon: any;
	highlights: { label: string; query?: string }[];
}

export interface ModuleCard {
	id: string;
	view: string;
	title: string;
	meta: string;
	icon: any;
	badge?: { text: string; tone: 'urgent' | 'ok' | 'normal' };
}

interface HomeOverviewSectionsProps {
	urgentItems: UrgentItem[];
	moduleCards: ModuleCard[];
	auditLogs: any[];
	onNavigate: (view: string, query?: string) => void;
}

export function HomeOverviewSections({ urgentItems, moduleCards, auditLogs, onNavigate }: HomeOverviewSectionsProps) {
	const { t } = useDictionary();

	return (
		<>
			{/* Urgent Action Queue */}
			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<AlertTriangle size={20} className="text-(--accent-orange)" />
						<span>{t('admin.dashboard.home.urgentTitle')}</span>
					</h2>
					<p className="text-xs text-(--text-muted) mt-0.5">{t('admin.dashboard.home.urgentSubtitle')}</p>
				</div>

				{urgentItems.length === 0 ? (
					<div className="flex items-center gap-4 p-6 rounded-3xl border border-(--accent-green)/25 bg-(--accent-green)/5 backdrop-blur-md shadow-sm">
						<div className="p-3 rounded-2xl bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25 shrink-0">
							<CheckCircle2 size={24} />
						</div>
						<div>
							<h3 className="text-base font-bold text-(--text)">{t('admin.dashboard.home.allClearTitle')}</h3>
							<p className="text-xs text-(--text-muted) mt-0.5">{t('admin.dashboard.home.allClearDesc')}</p>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{urgentItems.map((item) => {
							const IconComp = item.icon;
							const toneClasses =
								item.severity === 'critical'
									? 'border-(--accent-red)/30 bg-(--accent-red)/5 backdrop-blur-md shadow-sm hover:border-(--accent-red)/50'
									: item.severity === 'warning'
										? 'border-(--accent-orange)/30 bg-(--accent-orange)/5 backdrop-blur-md shadow-sm hover:border-(--accent-orange)/50'
										: 'border-(--accent)/30 bg-(--accent)/5 backdrop-blur-md shadow-sm hover:border-(--accent)/50';

							const badgeClasses =
								item.severity === 'critical'
									? 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/30'
									: item.severity === 'warning'
										? 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30'
										: 'bg-(--accent)/15 text-(--accent) border-(--accent)/30';

							return (
								<div
									key={item.id}
									onClick={() => onNavigate(item.view)}
									className={`flex flex-col justify-between gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${toneClasses}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3">
											<div className={`p-2.5 rounded-2xl border ${badgeClasses}`}>
												<IconComp size={18} />
											</div>
											<div>
												<h3 className="text-base font-bold text-(--text)">{item.title}</h3>
												<p className="text-xs text-(--text-muted)">{item.subtitle}</p>
											</div>
										</div>
										<span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${badgeClasses}`}>
											{item.count} {t('admin.dashboard.home.needsAttention')}
										</span>
									</div>

									{item.highlights.length > 0 && (
										<div className="flex flex-col gap-1.5 pt-2 border-t border-(--border)/10">
											{item.highlights.map((hl, idx) => (
												<button
													key={idx}
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														onNavigate(item.view, hl.query);
													}}
													className="flex items-center justify-between text-xs text-(--text-muted) hover:text-(--text) truncate text-left py-0.5 rounded-xl transition-colors cursor-pointer"
												>
													<span className="truncate">• {hl.label}</span>
													<ArrowRight size={12} className="shrink-0 opacity-60" />
												</button>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Permission-Gated Module Cards */}
			{moduleCards.length > 0 && (
				<div className="flex flex-col gap-4">
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('admin.dashboard.home.modulesTitle')}
						</h2>
						<p className="text-xs text-(--text-muted) mt-0.5">{t('admin.dashboard.home.modulesSubtitle')}</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{moduleCards.map((card) => {
							const IconComp = card.icon;
							return (
								<div
									key={card.id}
									onClick={() => onNavigate(card.view)}
									className="group flex flex-col justify-between gap-4 p-5 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm hover:bg-(--foreground)/50 hover:border-(--accent)/40 transition-all cursor-pointer"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3 min-w-0">
											<div className="p-2.5 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-(--accent) shrink-0">
												<IconComp size={18} />
											</div>
											<div className="min-w-0">
												<h3 className="text-sm font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">{card.title}</h3>
												<p className="text-xs text-(--text-muted) mt-0.5 truncate">{card.meta}</p>
											</div>
										</div>
										{card.badge && (
											<span
												className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
													card.badge.tone === 'urgent'
														? 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/30'
														: card.badge.tone === 'ok'
															? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30'
															: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10'
												}`}
											>
												{card.badge.text}
											</span>
										)}
									</div>

									<div className="flex items-center justify-end text-xs font-semibold text-(--accent) opacity-80 group-hover:opacity-100">
										<span className="inline-flex items-center gap-1">
											{t('admin.dashboard.home.openModule')}
											<ArrowRight size={13} />
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Recent Audit Trail */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<ScrollText size={20} className="text-(--accent)" />
						<span>{t('admin.dashboard.home.recentAuditTitle')}</span>
					</h2>
					<button type="button" onClick={() => onNavigate('audit')} className="inline-flex items-center gap-1 text-xs font-bold text-(--accent) hover:underline cursor-pointer">
						<span>{t('admin.dashboard.home.viewAllAudit')}</span>
						<ArrowRight size={13} />
					</button>
				</div>

				{auditLogs.length === 0 ? (
					<div className="p-6 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs text-center text-xs text-(--text-muted)">
						{t('admin.dashboard.home.noAudit')}
					</div>
				) : (
					<div className="flex flex-col gap-2.5">
						{auditLogs.map((log: any) => (
							<div
								key={log.id}
								onClick={() => onNavigate('audit', log.targetId || log.summary || log.actorId || log.action)}
								className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs hover:bg-(--foreground)/50 hover:border-(--border)/25 transition-all cursor-pointer"
							>
								<div className="flex flex-wrap items-center gap-2 min-w-0">
									<span className="font-bold text-xs text-(--text)">{log.actorName || log.actorId}</span>
									<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
										{log.action}
									</span>
									<span className="text-xs text-(--text-muted) truncate">{log.summary || log.targetLabel || log.targetId}</span>
								</div>
								<span className="inline-flex items-center gap-1 text-[11px] font-mono text-(--text-muted) shrink-0">
									<Clock size={12} className="opacity-60" />
									{new Date(log.createdAt).toLocaleString()}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
}
