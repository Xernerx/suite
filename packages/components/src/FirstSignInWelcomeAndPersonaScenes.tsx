/** @format */
'use client';

import { Button, Check } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSupport } from '@xernerx/providers';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Clock, Code2, Coins, Compass, LayoutDashboard, LifeBuoy, ShieldCheck, Sparkles, Terminal, UserPlus, Webhook } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import type { OnboardingPersona, OnboardingStagePhase } from './FirstSignInOnboarding';

export function FirstSignInWelcomeScene({
	displayName,
	avatarUrl,
	termsChecked,
	isInitialTermsNull,
	onTermsCheckedChange,
}: {
	displayName: string;
	avatarUrl: string | null;
	termsChecked: boolean;
	isInitialTermsNull: boolean;
	onTermsCheckedChange: (val: boolean) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<motion.div
			key="scene-welcome"
			initial={{ opacity: 0, y: 28, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -24, scale: 0.96 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center"
			style={{ gap: 'var(--ui-gap)' }}
		>
			<div className="relative">
				{avatarUrl ? (
					<Image
						src={avatarUrl}
						alt={displayName}
						width={96}
						height={96}
						unoptimized
						className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-(--accent) shadow-[0_0_36px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
					/>
				) : (
					<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-(--accent)/20 border-2 border-(--accent) flex items-center justify-center text-(--accent) text-3xl sm:text-4xl font-extrabold shadow-[0_0_36px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
						{displayName.charAt(0).toUpperCase()}
					</div>
				)}
				<div className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-(--accent) px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg">
					<Coins size={12} />
					<span>+1,000</span>
				</div>
			</div>

			<div className="flex flex-col items-center max-w-2xl">
				<h1 className="text-2xl sm:text-5xl font-extrabold text-(--text) tracking-tight leading-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('components.firstSignIn.welcome.heading', { name: displayName })}
				</h1>
				<p className="text-xs sm:text-base text-(--text-muted) mt-2 leading-relaxed">{t('components.firstSignIn.welcome.subtitle')}</p>
			</div>

			<div className="w-full max-w-2xl rounded-3xl bg-(--background)/75 backdrop-blur-2xl border border-(--accent)/30 p-4 sm:p-6 text-left shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_15%,transparent)]">
				<span className="block text-xs font-extrabold uppercase tracking-wider text-(--accent) mb-1.5">{t('components.firstSignIn.welcome.legalHeader')}</span>
				<p className="text-xs text-(--text-muted) mb-3.5 leading-relaxed">{t('components.firstSignIn.welcome.legalDescription')}</p>
				<div className="grid grid-cols-2 gap-2.5 mb-2.5">
					<Link href={getEnvUrl('https://www.xernerx.com/terms')} target="_blank" rel="noopener noreferrer" className="w-full">
						<Button variant="secondary" className="w-full justify-between px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-(--border)/15">
							<span className="truncate">{t('components.termsPrompt.termsLink')}</span>
							<span className="text-(--accent) shrink-0">↗</span>
						</Button>
					</Link>
					<Link href={getEnvUrl('https://www.xernerx.com/privacy')} target="_blank" rel="noopener noreferrer" className="w-full">
						<Button variant="secondary" className="w-full justify-between px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-(--border)/15">
							<span className="truncate">{t('components.termsPrompt.privacyLink')}</span>
							<span className="text-(--accent) shrink-0">↗</span>
						</Button>
					</Link>
				</div>
				<div className="flex items-center gap-3 rounded-2xl bg-(--foreground)/50 hover:bg-(--foreground)/70 border border-(--border)/15 p-3 sm:p-3.5 transition-colors">
					<Check
						checked={termsChecked || !isInitialTermsNull}
						onCheckedChange={(val) => onTermsCheckedChange(val)}
						label={<span className="text-xs sm:text-sm font-bold text-(--text) select-none leading-snug">{t('components.firstSignIn.welcome.agreeCheckbox')}</span>}
					/>
				</div>
			</div>
		</motion.div>
	);
}

export function FirstSignInWhoWeAreScene({
	isBotUser,
	isDeveloper,
	persona,
	onToggleBotUser,
	onToggleDeveloper,
}: {
	isBotUser: boolean;
	isDeveloper: boolean;
	persona: OnboardingPersona;
	onToggleBotUser: (val: boolean) => void;
	onToggleDeveloper: (val: boolean) => void;
}) {
	const { t } = useDictionary();

	return (
		<motion.div
			key="scene-who-we-are"
			initial={{ opacity: 0, y: 28, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -24, scale: 0.96 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center"
			style={{ gap: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col items-center max-w-2xl">
				<h2 className="text-3xl sm:text-5xl font-extrabold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('components.firstSignIn.whoWeAre.heading')}
				</h2>
				<p className="text-sm sm:text-base text-(--text-muted) mt-1.5 leading-relaxed">{t('components.firstSignIn.whoWeAre.personaPrompt')}</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl text-left">
				<div
					onClick={() => onToggleBotUser(!isBotUser)}
					className={`flex items-start gap-4 rounded-3xl p-5 border backdrop-blur-2xl transition-all cursor-pointer text-left select-none ${
						isBotUser
							? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
							: 'bg-(--background)/70 border-(--border)/15 hover:border-(--accent)/40'
					}`}
				>
					<div
						className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
							isBotUser ? 'bg-(--accent) text-white border-(--accent)' : 'bg-(--accent)/15 text-(--accent) border-(--accent)/30'
						}`}
					>
						<Bot size={24} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
							<h3 onClick={() => onToggleBotUser(!isBotUser)} className="text-base font-extrabold text-(--text) cursor-pointer" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('components.firstSignIn.whoWeAre.roleUserTitle')}
							</h3>
							<Check checked={isBotUser} onCheckedChange={(val) => onToggleBotUser(val)} />
						</div>
						<p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{t('components.firstSignIn.whoWeAre.roleUserDesc')}</p>
					</div>
				</div>

				<div
					onClick={() => onToggleDeveloper(!isDeveloper)}
					className={`flex items-start gap-4 rounded-3xl p-5 border backdrop-blur-2xl transition-all cursor-pointer text-left select-none ${
						isDeveloper
							? 'bg-(--accent)/15 border-(--accent) shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
							: 'bg-(--background)/70 border-(--border)/15 hover:border-(--accent)/40'
					}`}
				>
					<div
						className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
							isDeveloper ? 'bg-(--accent) text-white border-(--accent)' : 'bg-(--accent)/15 text-(--accent) border-(--accent)/30'
						}`}
					>
						<Code2 size={24} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
							<h3 onClick={() => onToggleDeveloper(!isDeveloper)} className="text-base font-extrabold text-(--text) cursor-pointer" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('components.firstSignIn.whoWeAre.roleDevTitle')}
							</h3>
							<Check checked={isDeveloper} onCheckedChange={(val) => onToggleDeveloper(val)} />
						</div>
						<p className="text-xs text-(--text-muted) mt-1 leading-relaxed">{t('components.firstSignIn.whoWeAre.roleDevDesc')}</p>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl text-left">
				<div className="flex flex-col gap-2.5 rounded-3xl bg-(--background)/75 backdrop-blur-2xl border border-(--border)/15 p-5 shadow-xl">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						{persona === 'developer' ? <Terminal size={20} /> : <Bot size={20} />}
					</div>
					<h4 className="text-sm font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{persona === 'developer' ? t('components.firstSignIn.whoWeAre.openSourceTitle') : t('components.firstSignIn.whoWeAre.botsTitle')}
					</h4>
					<p className="text-xs text-(--text-muted) leading-relaxed">
						{persona === 'developer' ? t('components.firstSignIn.whoWeAre.openSourceDesc') : t('components.firstSignIn.whoWeAre.botsDesc')}
					</p>
				</div>

				<div className="flex flex-col gap-2.5 rounded-3xl bg-(--background)/75 backdrop-blur-2xl border border-(--border)/15 p-5 shadow-xl">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						{persona === 'both' ? <Code2 size={20} /> : persona === 'developer' ? <Webhook size={20} /> : <LayoutDashboard size={20} />}
					</div>
					<h4 className="text-sm font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{persona === 'both'
							? t('components.firstSignIn.whoWeAre.bothDevAndPortalTitle')
							: persona === 'developer'
								? t('components.firstSignIn.whoWeAre.devPortalTitle')
								: t('components.firstSignIn.whoWeAre.suiteTitle')}
					</h4>
					<p className="text-xs text-(--text-muted) leading-relaxed">
						{persona === 'both'
							? t('components.firstSignIn.whoWeAre.bothDevAndPortalDesc')
							: persona === 'developer'
								? t('components.firstSignIn.whoWeAre.devPortalDesc')
								: t('components.firstSignIn.whoWeAre.suiteDesc')}
					</p>
				</div>

				<div className="flex flex-col gap-2.5 rounded-3xl bg-(--background)/75 backdrop-blur-2xl border border-(--border)/15 p-5 shadow-xl">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<ShieldCheck size={20} />
					</div>
					<h4 className="text-sm font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('components.firstSignIn.whoWeAre.unifiedTitle')}
					</h4>
					<p className="text-xs text-(--text-muted) leading-relaxed">{t('components.firstSignIn.whoWeAre.unifiedDesc')}</p>
				</div>
			</div>
		</motion.div>
	);
}

export function FirstSignInTourChoiceScene({
	submitting,
	postponing,
	onTakeTour,
	onOpenSkipConfirm,
}: {
	submitting: boolean;
	postponing: boolean;
	onTakeTour: () => void;
	onOpenSkipConfirm: () => void;
}) {
	const { t } = useDictionary();

	return (
		<motion.div
			key="scene-tour-choice"
			initial={{ opacity: 0, y: 28, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -24, scale: 0.96 }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			className="flex flex-col items-center text-center w-full"
			style={{ gap: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col items-center max-w-2xl">
				<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-(--accent)/15 text-(--accent) border border-(--accent)/35 shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_30%,transparent)] mb-3">
					<Sparkles size={30} />
				</div>
				<h2 className="text-2xl sm:text-5xl font-extrabold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('components.firstSignIn.tourChoice.heading')}
				</h2>
				<p className="text-xs sm:text-base text-(--text-muted) mt-2 leading-relaxed">{t('components.firstSignIn.tourChoice.subtitle')}</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl text-left">
				<button
					type="button"
					onClick={onTakeTour}
					disabled={submitting || postponing}
					className="group flex flex-col justify-between gap-4 rounded-3xl p-5 sm:p-6 bg-(--accent)/15 hover:bg-(--accent)/22 border-2 border-(--accent) backdrop-blur-2xl transition-all cursor-pointer text-left shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
				>
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent) text-white shadow-md">
							<Compass size={24} />
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between gap-2">
								<h3 className="text-base sm:text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('components.firstSignIn.tourChoice.takeTitle')}
								</h3>
								<span className="rounded-full bg-(--accent) px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shrink-0">
									{t('components.firstSignIn.tourChoice.recommendedBadge')}
								</span>
							</div>
							<p className="text-xs sm:text-sm text-(--text-muted) mt-1.5 leading-relaxed">{t('components.firstSignIn.tourChoice.takeDesc')}</p>
						</div>
					</div>
					<div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm font-extrabold text-(--accent) group-hover:translate-x-0.5 transition-transform">
						<span>{t('components.firstSignIn.buttons.takeTour')}</span>
						<ArrowRight size={15} />
					</div>
				</button>

				<button
					type="button"
					onClick={onOpenSkipConfirm}
					disabled={submitting || postponing}
					className="group flex flex-col justify-between gap-4 rounded-3xl p-5 sm:p-6 bg-(--background)/80 hover:bg-(--foreground)/50 border border-(--border)/15 hover:border-(--accent)/40 backdrop-blur-2xl transition-all cursor-pointer text-left shadow-xl"
				>
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--foreground)/60 text-(--accent) border border-(--border)/15">
							<Clock size={24} />
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="text-base sm:text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('components.firstSignIn.tourChoice.skipTitle')}
							</h3>
							<p className="text-xs sm:text-sm text-(--text-muted) mt-1.5 leading-relaxed">{t('components.firstSignIn.tourChoice.skipDesc')}</p>
						</div>
					</div>
					<div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm font-bold text-(--text-muted) group-hover:text-(--accent) transition-colors">
						<Clock size={14} />
						<span>{t('components.firstSignIn.buttons.skipTour')}</span>
					</div>
				</button>
			</div>
		</motion.div>
	);
}

export function FirstSignInReadyScene() {
	const { t } = useDictionary();
	const supportCtx = useSupport();

	return (
		<motion.div
			key="scene-ready"
			initial={{ opacity: 0, y: 24, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 18, scale: 0.97 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className="w-full max-w-2xl mx-auto rounded-3xl bg-(--background)/92 backdrop-blur-2xl border border-(--accent)/40 p-4 sm:p-5 text-left shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_22%,transparent)] pointer-events-auto"
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-start gap-3.5 min-w-0">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/35">
						<LifeBuoy size={24} />
					</div>
					<div className="min-w-0">
						<h3 className="text-lg sm:text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('components.firstSignIn.support.heading')}
						</h3>
						<p className="text-xs sm:text-sm text-(--text-muted) mt-0.5 leading-relaxed">{t('components.firstSignIn.support.subtitle')}</p>
					</div>
				</div>

				<div className="shrink-0">
					{supportCtx?.isMember ? (
						<div className="inline-flex items-center gap-2 rounded-2xl bg-(--accent-green)/15 border border-(--accent-green)/30 px-3.5 py-2 text-xs font-bold text-(--accent-green) whitespace-nowrap">
							<CheckCircle2 size={15} className="shrink-0" />
							<span>{t('components.firstSignIn.support.alreadyJoined')}</span>
						</div>
					) : (
						<Button
							variant="secondary"
							onClick={() => supportCtx?.joinServer()}
							isLoading={Boolean(supportCtx?.isJoining)}
							className="w-full sm:w-auto justify-center gap-2 border border-(--accent)/40 text-(--accent) whitespace-nowrap shrink-0"
						>
							<UserPlus size={15} className="shrink-0" />
							<span>{t('components.firstSignIn.support.oneClickJoinBtn')}</span>
						</Button>
					)}
				</div>
			</div>
		</motion.div>
	);
}

export function FirstSignInStageDock({
	currentPhase,
	step,
	phaseSequence,
	phaseLabels,
	isInitialTermsNull,
	termsChecked,
	hasAnyPersonaSelected,
	submitting,
	postponing,
	onDecline,
	onBackStep,
	onNavigateToPhase,
	onOpenSkipConfirm,
	onNextStep,
}: {
	currentPhase: OnboardingStagePhase;
	step: number;
	phaseSequence: OnboardingStagePhase[];
	phaseLabels: Record<OnboardingStagePhase, string>;
	isInitialTermsNull: boolean;
	termsChecked: boolean;
	hasAnyPersonaSelected: boolean;
	submitting: boolean;
	postponing: boolean;
	onDecline: () => void;
	onBackStep: () => void;
	onNavigateToPhase: (phase: OnboardingStagePhase) => void;
	onOpenSkipConfirm: () => void;
	onNextStep: () => void;
}) {
	const { t } = useDictionary();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className="w-full max-w-2xl shrink-0 mt-2 sm:mt-3 flex items-center justify-between gap-3 rounded-3xl bg-(--background)/90 backdrop-blur-2xl border border-(--border)/15 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xl pointer-events-auto"
		>
			<div className="flex items-center shrink-0">
				{currentPhase === 'welcome' && isInitialTermsNull ? (
					<Button variant="secondary" onClick={onDecline} disabled={submitting} className="text-xs sm:text-sm whitespace-nowrap shrink-0">
						{t('components.termsPrompt.decline')}
					</Button>
				) : step > 1 ? (
					<Button variant="secondary" onClick={onBackStep} disabled={submitting} className="gap-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0">
						<ArrowLeft size={15} className="shrink-0" />
						<span>{t('components.firstSignIn.buttons.back')}</span>
					</Button>
				) : (
					<div className="w-16 sm:w-20" />
				)}
			</div>

			<div className="flex items-center justify-center gap-1.5 max-w-full overflow-x-auto">
				{phaseSequence.map((phaseId, idx) => {
					const num = idx + 1;
					const active = currentPhase === phaseId;
					const done = step > num;
					const label = phaseLabels[phaseId] || phaseId;
					return (
						<button
							key={phaseId}
							type="button"
							disabled={isInitialTermsNull && !termsChecked && num > 1}
							onClick={() => {
								if (!isInitialTermsNull || termsChecked || num === 1) {
									onNavigateToPhase(phaseId);
								}
							}}
							aria-label={`${num}. ${label}`}
							className={`transition-all whitespace-nowrap shrink-0 ${
								active
									? 'flex items-center gap-1.5 rounded-full bg-(--accent) px-3 py-1 text-xs font-bold text-white shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_40%,transparent)]'
									: done
										? 'h-2.5 w-2.5 rounded-full bg-(--accent-green) cursor-pointer hover:scale-125'
										: 'h-2.5 w-2.5 rounded-full bg-(--border)/40 opacity-60'
							}`}
						>
							{active ? (
								<>
									<span>{num}.</span>
									<span>{label}</span>
								</>
							) : null}
						</button>
					);
				})}
			</div>

			<div className="flex items-center gap-2 shrink-0">
				{(currentPhase === 'tour-choice' ||
					currentPhase === 'header' ||
					currentPhase === 'sidebar' ||
					currentPhase === 'dashboard' ||
					currentPhase === 'portal' ||
					currentPhase === 'explore') && (
					<Button
						variant="secondary"
						onClick={onOpenSkipConfirm}
						isLoading={postponing}
						disabled={submitting || postponing}
						className="gap-1.5 px-3 sm:px-3.5 text-xs sm:text-sm whitespace-nowrap shrink-0"
					>
						<Clock size={14} className="shrink-0" />
						<span>{currentPhase === 'tour-choice' ? t('components.firstSignIn.buttons.skipTour') : t('components.firstSignIn.buttons.postponeTour')}</span>
					</Button>
				)}
				<Button
					variant="primary"
					onClick={onNextStep}
					isLoading={submitting}
					disabled={postponing || (currentPhase === 'welcome' && isInitialTermsNull && !termsChecked) || (currentPhase === 'who-we-are' && !hasAnyPersonaSelected)}
					className="gap-1.5 sm:gap-2 px-4 sm:px-5 text-xs sm:text-sm whitespace-nowrap shrink-0 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
				>
					<span>
						{currentPhase === 'welcome' && isInitialTermsNull
							? t('components.firstSignIn.buttons.agreeAndContinue')
							: currentPhase === 'tour-choice'
								? t('components.firstSignIn.buttons.takeTour')
								: currentPhase === 'ready'
									? t('components.firstSignIn.buttons.finish')
									: t('components.firstSignIn.buttons.next')}
					</span>
					{currentPhase !== 'ready' ? <ArrowRight size={15} className="shrink-0" /> : <Sparkles size={15} className="shrink-0" />}
				</Button>
			</div>
		</motion.div>
	);
}
