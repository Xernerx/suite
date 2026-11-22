/** @format */
'use client';

import { useDictionary, useSidebar } from '@xernerx/providers';
import { OnboardingSpotlightPortal } from '@xernerx/components';
import { Button } from '@xernerx/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Layers, LayoutDashboard, Server, Sliders } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface DashboardBotTourProps {
	botName: string;
	onFinish: () => void;
}

type DashTourStepKey = 'dash-sidebar' | 'dash-header' | 'dash-tabs' | 'dash-config';

const SPOTLIGHT_CLASSES = ['ring-2', 'ring-(--accent)', 'shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_55%,transparent)]', 'rounded-3xl', 'transition-all', 'duration-500', 'relative', 'z-20'];

export default function DashboardBotTour({ botName, onFinish }: DashboardBotTourProps) {
	const { t } = useDictionary();
	const { setMobileOpen } = useSidebar();
	const [stepIndex, setStepIndex] = useState(0);

	const steps = useMemo<{ key: DashTourStepKey; label: string; title: string; desc: string; icon: any; kbd?: string }[]>(
		() => [
			{
				key: 'dash-sidebar',
				label: t('app.bots.onboarding.dashboardTour.sidebarLabel'),
				title: t('app.bots.onboarding.dashboardTour.sidebarTitle'),
				desc: t('app.bots.onboarding.dashboardTour.sidebarDesc'),
				icon: Server,
				kbd: 'Alt + 1..9',
			},
			{
				key: 'dash-header',
				label: t('app.bots.onboarding.dashboardTour.headerLabel'),
				title: t('app.bots.onboarding.dashboardTour.headerTitle'),
				desc: t('app.bots.onboarding.dashboardTour.headerDesc'),
				icon: LayoutDashboard,
			},
			{
				key: 'dash-tabs',
				label: t('app.bots.onboarding.dashboardTour.tabsLabel'),
				title: t('app.bots.onboarding.dashboardTour.tabsTitle', { name: botName }),
				desc: t('app.bots.onboarding.dashboardTour.tabsDesc'),
				icon: Layers,
			},
			{
				key: 'dash-config',
				label: t('app.bots.onboarding.dashboardTour.configLabel'),
				title: t('app.bots.onboarding.dashboardTour.configTitle', { name: botName }),
				desc: t('app.bots.onboarding.dashboardTour.configDesc', { name: botName }),
				icon: Sliders,
				kbd: 'Ctrl + S',
			},
		],
		[t, botName]
	);

	const activeStep = steps[stepIndex] || steps[0];
	const StepIcon = activeStep.icon;
	const isLastStep = stepIndex >= steps.length - 1;

	useEffect(() => {
		if (typeof document === 'undefined') return;

		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			setMobileOpen(activeStep.key === 'dash-sidebar');
		}

		const scrollToTarget = () => {
			if (activeStep.key === 'dash-sidebar') {
				const scroller = document.getElementById('main-scroll-container');
				scroller?.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}

			const target = document.querySelector(`[data-tour="${activeStep.key}"]`) as HTMLElement | null;
			if (!target) return;

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
		};

		scrollToTarget();
		const t1 = setTimeout(scrollToTarget, 250);
		const t2 = setTimeout(scrollToTarget, 650);

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, [activeStep.key, setMobileOpen]);

	const spotlightSelectors = activeStep.key === 'dash-sidebar' ? ['[data-onboarding-target="sidebar-views"]', 'aside'] : [`[data-tour="${activeStep.key}"]`];

	return (
		<div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none flex flex-col items-center px-3 pb-3 sm:px-6 sm:pb-5 gap-2.5">
			<OnboardingSpotlightPortal active={true} selectors={spotlightSelectors} label={activeStep.label} kbd={activeStep.kbd} />

			{/* Active Step Prompt Card */}
			<AnimatePresence mode="wait">
				<motion.div
					key={`bot-dash-step-${activeStep.key}`}
					initial={{ opacity: 0, y: 14, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -14, scale: 0.98 }}
					transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
					className="pointer-events-auto w-full max-w-2xl rounded-3xl bg-(--background)/92 border border-(--accent)/40 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] flex items-start justify-between gap-3"
				>
					<div className="flex items-start gap-3.5 min-w-0">
						<motion.div
							initial={{ scale: 0.78, rotate: -6 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ type: 'spring', stiffness: 360, damping: 18 }}
							className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30"
						>
							<motion.span
								animate={{ scale: [1, 1.25, 1], opacity: [0.65, 0, 0.65] }}
								transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
								className="absolute inset-0 rounded-2xl border-2 border-(--accent)"
							/>
							<StepIcon size={20} />
						</motion.div>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-lg sm:text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{activeStep.title}
								</h3>
								{activeStep.kbd && (
									<motion.kbd
										animate={{ scale: [1, 1.06, 1] }}
										transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
										className="rounded-xl bg-(--foreground) border border-(--accent)/40 px-2.5 py-0.5 font-mono text-xs font-extrabold text-(--accent) shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
									>
										{activeStep.kbd}
									</motion.kbd>
								)}
							</div>
							<p className="text-xs sm:text-sm text-(--text-muted) mt-0.5 leading-relaxed">{activeStep.desc}</p>
						</div>
					</div>

					{!isLastStep && (
						<Button variant="secondary" onClick={onFinish} className="shrink-0 text-xs px-3 py-1.5">
							{t('app.bots.onboarding.dashboardTour.skipBtn')}
						</Button>
					)}
				</motion.div>
			</AnimatePresence>

			{/* Step Navigation Bar */}
			<div className="pointer-events-auto w-full max-w-2xl flex items-center justify-between gap-2 rounded-3xl bg-(--background)/92 border border-(--border)/15 backdrop-blur-2xl px-3.5 py-2.5 shadow-2xl">
				<Button variant="secondary" disabled={stepIndex <= 0} onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))} className="gap-1.5 text-xs shrink-0">
					<ArrowLeft size={14} />
					<span>{t('components.firstSignIn.buttons.back')}</span>
				</Button>

				<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1">
					{steps.map((step, idx) => {
						const isCurrent = idx === stepIndex;
						const isCompleted = idx < stepIndex;
						return (
							<button
								key={step.key}
								type="button"
								onClick={() => setStepIndex(idx)}
								className={`transition-all cursor-pointer flex items-center gap-1.5 rounded-full font-bold text-xs ${
									isCurrent
										? 'bg-(--accent) text-white px-3 py-1 shadow-sm whitespace-nowrap'
										: isCompleted
											? 'h-2.5 w-2.5 bg-(--accent-green) hover:scale-125 shrink-0'
											: 'h-2.5 w-2.5 bg-(--foreground) border border-(--border)/25 hover:border-(--accent)/50 shrink-0'
								}`}
								title={step.label}
							>
								{isCurrent && (
									<span>
										{idx + 1}. {step.label}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{!isLastStep ? (
					<Button variant="primary" onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))} className="gap-1.5 text-xs shrink-0">
						<span>{t('components.firstSignIn.buttons.next')}</span>
						<ArrowRight size={14} />
					</Button>
				) : (
					<Button variant="primary" onClick={onFinish} className="gap-1.5 text-xs shrink-0">
						<CheckCircle2 size={14} />
						<span>{t('app.bots.onboarding.dashboardTour.finishBtn')}</span>
					</Button>
				)}
			</div>
		</div>
	);
}
