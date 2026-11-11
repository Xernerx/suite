/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LayoutDashboard, LayoutGrid, PanelLeft, PanelLeftClose, Terminal, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import type { OnboardingPersona } from './FirstSignInOnboarding';

export type SidebarBuildStepId = 'toggle' | 'views' | 'moved-dock' | 'collapse';

export function FirstSignInSidebarScene({
	sidebarSteps,
	sidebarStepIndex,
	setSidebarStepIndex,
	persona,
	avatarUrl,
	displayName,
}: {
	sidebarSteps: SidebarBuildStepId[];
	sidebarStepIndex: number;
	setSidebarStepIndex: (idx: number) => void;
	persona: OnboardingPersona;
	avatarUrl: string | null;
	displayName: string;
}) {
	const { t } = useDictionary();
	const currentStepId: SidebarBuildStepId = sidebarSteps[sidebarStepIndex] || 'toggle';

	const viewsTitle =
		persona === 'both'
			? t('components.firstSignIn.dashboard.bothWorkspaceTitle')
			: persona === 'developer'
				? t('components.firstSignIn.dashboard.devWorkspaceTitle')
				: t('components.firstSignIn.dashboard.serverHubTitle');

	const viewsDesc =
		persona === 'both'
			? t('components.firstSignIn.dashboard.bothWorkspaceDesc')
			: persona === 'developer'
				? t('components.firstSignIn.dashboard.devWorkspaceDesc')
				: t('components.firstSignIn.dashboard.serverHubDesc');

	const stepMeta: Record<
		SidebarBuildStepId,
		{
			icon: React.ElementType;
			title: string;
			desc: string;
			kbd?: string;
		}
	> = {
		toggle: {
			icon: PanelLeft,
			title: t('components.firstSignIn.dashboard.subToggleTitle'),
			desc: t('components.firstSignIn.dashboard.subToggleDesc'),
			kbd: 'Ctrl + B',
		},
		views: {
			icon: persona === 'developer' ? Terminal : LayoutDashboard,
			title: viewsTitle,
			desc: viewsDesc,
			kbd: 'Alt + 1..9',
		},
		'moved-dock': {
			icon: LayoutGrid,
			title: t('components.firstSignIn.dashboard.dockedNavTitle'),
			desc: t('components.firstSignIn.dashboard.dockedNavDesc'),
		},
		collapse: {
			icon: PanelLeftClose,
			title: t('components.firstSignIn.dashboard.subCollapseTitle'),
			desc: t('components.firstSignIn.dashboard.subCollapseDesc'),
			kbd: 'Ctrl + B',
		},
	};

	const activeMeta = stepMeta[currentStepId] || stepMeta.toggle;
	const ActiveIcon = activeMeta.icon;

	return (
		<motion.div
			key="scene-sidebar"
			initial={{ opacity: 0, y: 24, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -20, scale: 0.97 }}
			transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center max-w-2xl mx-auto w-full"
		>
			<AnimatePresence mode="wait">
				<motion.div
					key={`sidebar-sub-${currentStepId}`}
					initial={{ opacity: 0, y: 14, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -14, scale: 0.98 }}
					transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
					className="w-full rounded-3xl bg-(--background)/85 backdrop-blur-2xl border border-(--accent)/35 p-5 sm:p-7 text-left shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
				>
					<div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
						{currentStepId === 'moved-dock' ? (
							<div className="flex items-center gap-2 shrink-0">
								{avatarUrl ? (
									<Image src={avatarUrl} alt={displayName} width={44} height={44} unoptimized className="w-11 h-11 rounded-2xl border-2 border-(--accent)" />
								) : (
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/40">
										<UserIcon size={20} />
									</div>
								)}
								<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/40">
									<Bell size={18} />
								</div>
								<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent) text-white border border-(--accent) shadow-md">
									<LayoutGrid size={18} />
								</div>
							</div>
						) : (
							<div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/35">
								<ActiveIcon size={26} />
							</div>
						)}

						<div className="flex-1 min-w-0 w-full">
							<div className="flex items-center justify-between gap-3 mb-1.5">
								<h3 className="text-xl sm:text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{activeMeta.title}
								</h3>
								<div className="flex items-center gap-2 shrink-0">
									{activeMeta.kbd && (
										<kbd className="rounded-xl bg-(--foreground) border border-(--accent)/30 px-2.5 py-0.5 font-mono text-xs font-extrabold text-(--accent) whitespace-nowrap">
											{activeMeta.kbd}
										</kbd>
									)}
									<div className="flex items-center gap-1.5">
										{sidebarSteps.map((stepId, idx) => (
											<button
												key={stepId}
												type="button"
												onClick={() => setSidebarStepIndex(idx)}
												aria-label={`Step ${idx + 1}`}
												className={`h-2 rounded-full transition-all cursor-pointer ${
													sidebarStepIndex === idx
														? 'w-5 bg-(--accent)'
														: sidebarStepIndex > idx
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
