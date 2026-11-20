/** @format */
'use client';

import { Button } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Bot, Building2, Compass, Flame, Gauge, Layers, LayoutDashboard, LayoutGrid, Search, Server, Sliders, Sparkles, Terminal } from 'lucide-react';
import React, { useEffect } from 'react';

export type DashboardTourStepId = 'dash-sidebar' | 'dash-header' | 'dash-tabs' | 'dash-config';
export type PortalTourStepId = 'portal-header' | 'portal-kpis' | 'portal-bots' | 'portal-orgs';
export type ExploreTourStepId = 'explore-hero' | 'explore-bar' | 'explore-switcher' | 'explore-grid';
export type PageTourStepId = DashboardTourStepId | PortalTourStepId | ExploreTourStepId;
export type TourNavTargetPhase = 'dashboard' | 'portal' | 'explore';

export const DASHBOARD_TOUR_STEPS: DashboardTourStepId[] = ['dash-sidebar', 'dash-header', 'dash-tabs', 'dash-config'];
export const PORTAL_TOUR_STEPS: PortalTourStepId[] = ['portal-header', 'portal-kpis', 'portal-bots', 'portal-orgs'];
export const EXPLORE_TOUR_STEPS: ExploreTourStepId[] = ['explore-hero', 'explore-bar', 'explore-switcher', 'explore-grid'];

const SPOTLIGHT_CLASSES = ['ring-2', 'ring-(--accent)', 'shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_55%,transparent)]', 'rounded-3xl', 'transition-all', 'duration-500', 'relative', 'z-20'];

export function FirstSignInPageTourScene({
	phase,
	steps,
	stepIndex,
	setStepIndex,
}: {
	phase: 'dashboard' | 'portal' | 'explore';
	steps: PageTourStepId[];
	stepIndex: number;
	setStepIndex: (idx: number) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const appHost = getEnvUrl('https://app.xernerx.com')
		.replace(/^https?:\/\//, '')
		.replace(/\/$/, '');
	const currentStepId: PageTourStepId = steps[stepIndex] || steps[0];

	// Scroll to the active [data-tour] element on the live page (spotlight visual is rendered by OnboardingSpotlightPortal)
	useEffect(() => {
		if (typeof document === 'undefined') return;

		const scrollToTarget = () => {
			if (currentStepId === 'dash-sidebar') {
				const scroller = document.getElementById('main-scroll-container');
				scroller?.scrollTo({ top: 0, behavior: 'smooth' });
				return true;
			}
			const target = document.querySelector(`[data-tour="${currentStepId}"]`) as HTMLElement | null;
			if (!target) return false;

			const scroller = document.getElementById('main-scroll-container');
			if (scroller) {
				const scrollerRect = scroller.getBoundingClientRect();
				const targetRect = target.getBoundingClientRect();
				const relativeTop = targetRect.top - scrollerRect.top + scroller.scrollTop;
				const desiredTop = Math.max(0, relativeTop - 28);
				scroller.scrollTo({ top: desiredTop, behavior: 'smooth' });
			} else {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			return true;
		};

		scrollToTarget();
		const retryTimer1 = setTimeout(scrollToTarget, 250);
		const retryTimer2 = setTimeout(scrollToTarget, 700);

		return () => {
			clearTimeout(retryTimer1);
			clearTimeout(retryTimer2);
		};
	}, [currentStepId, phase]);

	const metaMap: Record<
		PageTourStepId,
		{
			icon: React.ElementType;
			title: string;
			desc: string;
			kbd?: string;
		}
	> = {
		'dash-sidebar': {
			icon: Server,
			title: t('components.firstSignIn.pageTours.dashboard.sidebarTitle'),
			desc: t('components.firstSignIn.pageTours.dashboard.sidebarDesc'),
			kbd: 'Alt + 1..9',
		},
		'dash-header': {
			icon: LayoutDashboard,
			title: t('components.firstSignIn.pageTours.dashboard.headerTitle'),
			desc: t('components.firstSignIn.pageTours.dashboard.headerDesc'),
		},
		'dash-tabs': {
			icon: Layers,
			title: t('components.firstSignIn.pageTours.dashboard.tabsTitle'),
			desc: t('components.firstSignIn.pageTours.dashboard.tabsDesc'),
		},
		'dash-config': {
			icon: Sliders,
			title: t('components.firstSignIn.pageTours.dashboard.configTitle'),
			desc: t('components.firstSignIn.pageTours.dashboard.configDesc'),
			kbd: 'Ctrl + S',
		},
		'portal-header': {
			icon: Terminal,
			title: t('components.firstSignIn.pageTours.portal.headerTitle'),
			desc: t('components.firstSignIn.pageTours.portal.headerDesc'),
		},
		'portal-kpis': {
			icon: BarChart3,
			title: t('components.firstSignIn.pageTours.portal.kpisTitle'),
			desc: t('components.firstSignIn.pageTours.portal.kpisDesc'),
		},
		'portal-bots': {
			icon: Bot,
			title: t('components.firstSignIn.pageTours.portal.botsTitle'),
			desc: t('components.firstSignIn.pageTours.portal.botsDesc'),
		},
		'portal-orgs': {
			icon: Building2,
			title: t('components.firstSignIn.pageTours.portal.orgsTitle'),
			desc: t('components.firstSignIn.pageTours.portal.orgsDesc'),
		},
		'explore-hero': {
			icon: Compass,
			title: t('components.firstSignIn.pageTours.explore.heroTitle'),
			desc: t('components.firstSignIn.pageTours.explore.heroDesc', { host: appHost }),
		},
		'explore-bar': {
			icon: Search,
			title: t('components.firstSignIn.pageTours.explore.barTitle'),
			desc: t('components.firstSignIn.pageTours.explore.barDesc'),
			kbd: 'Ctrl + K',
		},
		'explore-switcher': {
			icon: Layers,
			title: t('components.firstSignIn.pageTours.explore.switcherTitle'),
			desc: t('components.firstSignIn.pageTours.explore.switcherDesc'),
		},
		'explore-grid': {
			icon: Flame,
			title: t('components.firstSignIn.pageTours.explore.gridTitle'),
			desc: t('components.firstSignIn.pageTours.explore.gridDesc'),
		},
	};

	const activeMeta = metaMap[currentStepId] || metaMap['dash-sidebar'];
	const ActiveIcon = activeMeta.icon;

	return (
		<motion.div
			key={`scene-page-tour-${phase}`}
			initial={{ opacity: 0, y: 24, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 18, scale: 0.97 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center max-w-2xl mx-auto w-full pointer-events-auto"
		>
			<AnimatePresence mode="wait">
				<motion.div
					key={`page-tour-card-${currentStepId}`}
					initial={{ opacity: 0, y: 14, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -14, scale: 0.98 }}
					transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
					style={{ backgroundColor: 'color-mix(in srgb, var(--background) 94%, var(--foreground))' }}
					className="w-full rounded-3xl bg-(--background)/94 backdrop-blur-2xl border border-(--accent)/40 p-4 sm:p-5 text-left shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
				>
					<div className="flex flex-col sm:flex-row items-start gap-4">
						<motion.div
							initial={{ scale: 0.78, rotate: -6 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ type: 'spring', stiffness: 360, damping: 18 }}
							className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/35"
						>
							<motion.span
								animate={{ scale: [1, 1.25, 1], opacity: [0.65, 0, 0.65] }}
								transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
								className="absolute inset-0 rounded-2xl border-2 border-(--accent)"
							/>
							<ActiveIcon size={24} />
						</motion.div>

						<div className="flex-1 min-w-0 w-full">
							<div className="flex items-center justify-between gap-3 mb-1">
								<h3 className="text-lg sm:text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{activeMeta.title}
								</h3>
								<div className="flex items-center gap-2 shrink-0">
									{activeMeta.kbd && (
										<motion.kbd
											initial={{ scale: 0.85, y: -4 }}
											animate={{ scale: [1, 1.06, 1], y: 0 }}
											transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
											className="rounded-xl bg-(--foreground) border border-(--accent)/40 px-2.5 py-0.5 font-mono text-xs font-extrabold text-(--accent) whitespace-nowrap shrink-0 shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
										>
											{activeMeta.kbd}
										</motion.kbd>
									)}
									<div className="flex items-center gap-1.5">
										{steps.map((stepId, idx) => (
											<button
												key={stepId}
												type="button"
												onClick={() => setStepIndex(idx)}
												aria-label={`Step ${idx + 1}`}
												className={`h-2 rounded-full transition-all cursor-pointer ${
													stepIndex === idx
														? 'w-5 bg-(--accent)'
														: stepIndex > idx
															? 'w-2 bg-(--accent)/50 hover:bg-(--accent)/80'
															: 'w-2 bg-(--border)/40 hover:bg-(--border)/70'
												}`}
											/>
										))}
									</div>
								</div>
							</div>
							<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">{activeMeta.desc}</p>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		</motion.div>
	);
}

export function FirstSignInNavPromptScene({ targetPhase }: { targetPhase: TourNavTargetPhase }) {
	const { t } = useDictionary();
	const destinationName = t(`components.firstSignIn.navHandoff.destinations.${targetPhase}`);
	const DestIcon = targetPhase === 'dashboard' ? Gauge : targetPhase === 'portal' ? Building2 : Compass;

	return (
		<motion.div
			key={`scene-nav-prompt-${targetPhase}`}
			initial={{ opacity: 0, y: 24, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 18, scale: 0.97 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center max-w-2xl mx-auto w-full pointer-events-auto"
		>
			<div
				style={{ backgroundColor: 'color-mix(in srgb, var(--background) 94%, var(--foreground))' }}
				className="w-full rounded-3xl bg-(--background)/95 backdrop-blur-2xl border border-(--accent)/50 p-4 sm:p-6 text-left shadow-[0_0_44px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
			>
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
					<motion.div
						animate={{ scale: [1, 1.05, 1] }}
						transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/40 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
					>
						<motion.span
							animate={{ scale: [1, 1.32, 1.48], opacity: [0.75, 0.3, 0] }}
							transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
							className="absolute inset-0 rounded-2xl border-2 border-(--accent)"
						/>
						<LayoutGrid size={26} />
						<span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-(--accent) text-white border-2 border-(--background)">
							<DestIcon size={12} />
						</span>
					</motion.div>

					<div className="flex-1 min-w-0 w-full">
						<div className="flex flex-wrap items-center gap-2 mb-1">
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/35 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-(--accent)">
								<Sparkles size={11} />
								{t('components.firstSignIn.navHandoff.promptBadge')}
							</span>
							<motion.kbd
								animate={{ scale: [1, 1.07, 1] }}
								transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
								className="rounded-xl bg-(--foreground) border border-(--accent)/40 px-2.5 py-0.5 font-mono text-xs font-extrabold text-(--accent) whitespace-nowrap shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
							>
								Ctrl + Space
							</motion.kbd>
						</div>
						<h3 className="text-lg sm:text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('components.firstSignIn.navHandoff.promptTitle', { destination: destinationName })}
						</h3>
						<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed mt-1">{t('components.firstSignIn.navHandoff.promptDesc', { destination: destinationName })}</p>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
