/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Compass, LayoutGrid, Search, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDictionary, useEnvironment, useUser } from '@xernerx/providers';
import { useSession } from 'next-auth/react';

export interface TourNavigationStage {
	active: boolean;
	navPromptTarget?: 'dashboard' | 'portal' | 'explore' | null;
	navMenuExplained?: boolean;
}

export function NavigationModal({ isOpen, onClose, navigation = [], onboardingStage }: { isOpen: boolean; onClose: () => void; navigation?: any[]; onboardingStage?: TourNavigationStage }) {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const [roles, setRoles] = useState<any[]>([]);
	const [filterQuery, setFilterQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const filterInputRef = useRef<HTMLInputElement>(null);

	const tourTargetPhase = onboardingStage?.active ? onboardingStage.navPromptTarget || null : null;
	const shouldShowFirstExplain = Boolean(tourTargetPhase && !onboardingStage?.navMenuExplained);

	const isTourTargetItem = (item: any): boolean => {
		if (!tourTargetPhase || !item) return false;
		if (tourTargetPhase === 'dashboard') {
			return item.label === 'lib.navigation.items.dashboard' || String(item.href || '').endsWith('/dashboard');
		}
		if (tourTargetPhase === 'portal') {
			return item.label === 'lib.navigation.items.portal' || String(item.href || '').includes('portal.xernerx.com');
		}
		if (tourTargetPhase === 'explore') {
			return item.label === 'lib.navigation.items.explore';
		}
		return false;
	};

	useEffect(() => {
		if (!isOpen) {
			setFilterQuery('');
			setSelectedIndex(0);
			return;
		}
		setTimeout(() => filterInputRef.current?.focus(), 20);
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
			credentials: 'include',
		})
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(Array.isArray(data) ? data : []))
			.catch(() => {});
	}, [getEnvUrl, isOpen]);

	const activeUser = discordUser || session?.user;
	const userRoleIds = Array.isArray((activeUser as any)?.roles) ? (activeUser as any).roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));
	const visibleNavigation = navigation
		.filter((item) => !item.adminOnly || activeRoles.some((r) => r.permissions?.[item.requiredPermission || 'access'] === true))
		.filter((item) => {
			if (!filterQuery.trim()) return true;
			const q = filterQuery.toLowerCase();
			return t(item.label).toLowerCase().includes(q) || (item.category && t(item.category).toLowerCase().includes(q));
		});

	useEffect(() => {
		if (!isOpen) return;
		if (tourTargetPhase) {
			const targetIdx = visibleNavigation.findIndex((item) => isTourTargetItem(item));
			if (targetIdx >= 0) {
				setSelectedIndex(targetIdx);
				return;
			}
		}
		setSelectedIndex(0);
	}, [filterQuery, isOpen, tourTargetPhase, visibleNavigation.length]);

	const triggerTourDestinationSelect = () => {
		if (!tourTargetPhase || typeof window === 'undefined') return;
		window.dispatchEvent(new CustomEvent('xernerx:tour-navigate-select', { detail: { targetPhase: tourTargetPhase } }));
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (visibleNavigation.length === 0) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev + 1) % visibleNavigation.length);
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev - 1 + visibleNavigation.length) % visibleNavigation.length);
		} else if (e.key === 'Enter') {
			if (e.nativeEvent.isComposing || e.keyCode === 229) return;
			e.preventDefault();
			if (tourTargetPhase) {
				triggerTourDestinationSelect();
				return;
			}
			const selected = visibleNavigation[selectedIndex];
			if (selected) {
				window.location.href = getEnvUrl(selected.href);
				onClose();
			}
		}
	};

	const hasCategories = visibleNavigation.some((item) => item.category);
	const groupedNavigation = Object.groupBy(visibleNavigation, (item: any) => item.category || 'common.shortcuts.modal.navigation.other');

	const destinationName = tourTargetPhase ? t(`components.firstSignIn.navHandoff.destinations.${tourTargetPhase}`) : '';

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-(--background)/60 backdrop-blur-sm" />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="relative w-full max-w-3xl rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 max-h-[88dvh] flex flex-col overflow-hidden"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex items-center justify-between pb-3 border-b border-(--border)/10 shrink-0 gap-4">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
									style={{
										background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
										color: 'var(--accent)',
									}}
								>
									<LayoutGrid size={20} />
								</div>
								<div>
									<h2 className="text-lg font-semibold text-(--text)">{t('common.shortcuts.modal.navigation.title')}</h2>
									<p className="text-xs text-(--text-muted)">{t('common.shortcuts.modal.navigation.description')}</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<div className="relative hidden sm:flex items-center">
									<Search size={14} className="absolute left-3 text-(--text-muted)" />
									<input
										ref={filterInputRef}
										type="text"
										value={filterQuery}
										onChange={(e) => setFilterQuery(e.target.value)}
										placeholder={t('common.shortcuts.modal.navigation.searchPlaceholder')}
										className="pl-8 pr-3 py-1.5 rounded-xl bg-(--background) border border-(--border)/10 text-xs text-(--text) placeholder:text-(--text-muted) outline-none focus:border-(--accent) w-48 transition"
									/>
								</div>
								<button
									type="button"
									onClick={onClose}
									aria-label={t('common.close')}
									className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition cursor-pointer"
								>
									<X size={18} />
								</button>
							</div>
						</div>

						{shouldShowFirstExplain && (
							<motion.div
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								className="rounded-2xl bg-(--accent)/12 border border-(--accent)/35 p-3.5 sm:p-4 flex items-start gap-3 shrink-0 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
							>
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent)/20 text-(--accent) border border-(--accent)/35">
									<Sparkles size={18} />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2 mb-0.5">
										<span className="text-[10px] font-extrabold uppercase tracking-wider text-(--accent) bg-(--accent)/15 border border-(--accent)/30 rounded-full px-2 py-0.5">
											{t('components.firstSignIn.navHandoff.menuExplainBadge')}
										</span>
										<h3 className="text-sm font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{t('components.firstSignIn.navHandoff.menuExplainTitle')}
										</h3>
									</div>
									<p className="text-xs text-(--text-muted) leading-relaxed">{t('components.firstSignIn.navHandoff.menuExplainDesc', { destination: destinationName })}</p>
								</div>
							</motion.div>
						)}

						<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-3 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
							{visibleNavigation.length > 0 ? (
								hasCategories ? (
									Object.entries(groupedNavigation).map(([category, items = []]) => (
										<div key={category} className="flex flex-col shrink-0" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<h3 className="text-xs font-bold uppercase tracking-wider text-(--text-muted) px-1">{t(category)}</h3>
											<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 pt-1 pb-1">
												{items.map((item: any, idx: number) => {
													const globalIdx = visibleNavigation.indexOf(item);
													const isSelected = globalIdx === selectedIndex;
													const isTourTarget = isTourTargetItem(item);
													const isDimmedByTour = Boolean(tourTargetPhase && !isTourTarget);
													const resolvedHref = getEnvUrl(item.href);
													const AppIcon = item.icon || Compass;
													return (
														<a
															key={idx}
															href={resolvedHref}
															onClick={(e) => {
																if (tourTargetPhase) {
																	e.preventDefault();
																	if (isTourTarget) triggerTourDestinationSelect();
																	return;
																}
																const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
																if (bridge?.openCompanionWindow && (e.ctrlKey || e.metaKey || e.shiftKey)) {
																	e.preventDefault();
																	bridge.openCompanionWindow(resolvedHref);
																	onClose();
																	return;
																}
																onClose();
															}}
															onAuxClick={(e) => {
																if (tourTargetPhase) {
																	e.preventDefault();
																	return;
																}
																const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
																if (bridge?.openCompanionWindow && e.button === 1) {
																	e.preventDefault();
																	bridge.openCompanionWindow(resolvedHref);
																	onClose();
																}
															}}
															onMouseEnter={() => {
																if (!isDimmedByTour) setSelectedIndex(globalIdx);
															}}
															className={`relative group flex flex-col items-center gap-2 cursor-pointer transition-opacity ${
																isDimmedByTour ? 'opacity-35 pointer-events-none select-none' : ''
															}`}
														>
															{isTourTarget && (
																<span className="absolute -top-2.5 z-20 rounded-full bg-(--accent) px-2.5 py-0.5 text-[9px] font-extrabold text-white whitespace-nowrap shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_65%,transparent)]">
																	{t('components.firstSignIn.navHandoff.nextStopBadge')}
																</span>
															)}
															<div
																className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-(--background) border shadow-sm transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-md ${
																	isTourTarget
																		? 'scale-105 border-(--accent) bg-(--accent)/15 ring-2 ring-(--accent) shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_65%,transparent)] animate-pulse'
																		: isSelected
																			? 'scale-105 border-(--accent) ring-2 ring-(--accent)/30 shadow-md'
																			: 'border-(--border)/10 group-hover:border-(--accent)/50'
																}`}
															>
																<AppIcon
																	size={20}
																	className={`${
																		isTourTarget || isSelected ? 'text-(--accent)' : 'text-(--text-muted) group-hover:text-(--accent)'
																	} transition-colors`}
																/>
															</div>
															<span
																className={`text-xs sm:text-sm leading-snug font-medium text-center truncate w-full px-1 ${
																	isTourTarget ? 'font-extrabold text-(--accent)' : isSelected ? 'text-(--accent)' : 'text-(--text)'
																}`}
															>
																{t(item.label)}
															</span>
														</a>
													);
												})}
											</div>
										</div>
									))
								) : (
									<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 py-2">
										{visibleNavigation.map((item: any, idx: number) => {
											const isSelected = idx === selectedIndex;
											const isTourTarget = isTourTargetItem(item);
											const isDimmedByTour = Boolean(tourTargetPhase && !isTourTarget);
											const resolvedHref = getEnvUrl(item.href);
											const AppIcon = item.icon || Compass;
											return (
												<a
													key={idx}
													href={resolvedHref}
													onClick={(e) => {
														if (tourTargetPhase) {
															e.preventDefault();
															if (isTourTarget) triggerTourDestinationSelect();
															return;
														}
														onClose();
													}}
													onMouseEnter={() => {
														if (!isDimmedByTour) setSelectedIndex(idx);
													}}
													className={`relative group flex flex-col items-center gap-2 cursor-pointer transition-opacity ${
														isDimmedByTour ? 'opacity-35 pointer-events-none select-none' : ''
													}`}
												>
													{isTourTarget && (
														<span className="absolute -top-2.5 z-20 rounded-full bg-(--accent) px-2.5 py-0.5 text-[9px] font-extrabold text-white whitespace-nowrap shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_65%,transparent)]">
															{t('components.firstSignIn.navHandoff.nextStopBadge')}
														</span>
													)}
													<div
														className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-(--background) border shadow-sm transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-md ${
															isTourTarget
																? 'scale-105 border-(--accent) bg-(--accent)/15 ring-2 ring-(--accent) shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_65%,transparent)] animate-pulse'
																: isSelected
																	? 'scale-105 border-(--accent) ring-2 ring-(--accent)/30 shadow-md'
																	: 'border-(--border)/10 group-hover:border-(--accent)/50'
														}`}
													>
														<AppIcon
															size={22}
															className={`${isTourTarget || isSelected ? 'text-(--accent)' : 'text-(--text-muted) group-hover:text-(--accent)'} transition-colors`}
														/>
													</div>
													<span
														className={`text-xs sm:text-sm leading-snug font-medium text-center truncate w-full px-1 ${
															isTourTarget ? 'font-extrabold text-(--accent)' : isSelected ? 'text-(--accent)' : 'text-(--text)'
														}`}
													>
														{t(item.label)}
													</span>
												</a>
											);
										})}
									</div>
								)
							) : (
								<p className="text-sm text-(--text-muted) text-center py-10">{t('common.shortcuts.modal.navigation.empty')}</p>
							)}
						</div>

						<div className="pt-2 border-t border-(--border)/10 flex items-center justify-between text-[11px] text-(--text-muted) shrink-0 px-1">
							<span>{t('common.shortcuts.modal.navigation.navigateHint')}</span>
							<span>
								{t('common.shortcutsprovider.description4')} <kbd className="font-mono text-(--text)">{t('common.shortcutsprovider.text')}</kbd>{' '}
								{t('common.shortcutsprovider.description5')}
							</span>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
