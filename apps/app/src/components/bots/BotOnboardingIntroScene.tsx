/** @format */
'use client';

import { fireIntroConfetti } from '@xernerx/components';
import { useDictionary, useTheme } from '@xernerx/providers';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bot, CheckCircle2, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface BotOnboardingIntroSceneProps {
	botDisplayName: string;
	avatarUrl: string | null;
	verified?: boolean;
	guildName?: string | null;
	compact: boolean;
	onComplete: () => void;
}

export default function BotOnboardingIntroScene({ botDisplayName, avatarUrl, verified, guildName, compact, onComplete }: BotOnboardingIntroSceneProps) {
	const { t } = useDictionary();
	const { preferences } = useTheme();
	const reducedMotion = Boolean(preferences?.reducedMotion);

	const [beat, setBeat] = useState<0 | 1 | 2>(0);
	const [creditCount, setCreditCount] = useState(0);
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;
	const hasCompletedRef = useRef(false);

	const finishIntro = useCallback(() => {
		if (hasCompletedRef.current) return;
		hasCompletedRef.current = true;
		setBeat(2);
		setCreditCount(100);
		onCompleteRef.current();
	}, []);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('xernerx:construct-logo'));
		}

		if (reducedMotion) {
			setBeat(2);
			setCreditCount(100);
			const fastTimer = setTimeout(() => finishIntro(), 1100);
			return () => clearTimeout(fastTimer);
		}

		const t1 = setTimeout(() => {
			setBeat(1);
			fireIntroConfetti(38);
		}, 1050);

		const t2 = setTimeout(() => {
			setBeat(2);
		}, 2150);

		const tDone = setTimeout(() => {
			finishIntro();
		}, 3350);

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			clearTimeout(tDone);
		};
	}, [reducedMotion, finishIntro]);

	useEffect(() => {
		if (beat < 1 || reducedMotion) return;
		let frame = 0;
		const start = performance.now();
		const duration = 800;
		const tick = (now: number) => {
			const prog = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - prog, 3);
			setCreditCount(Math.round(eased * 100));
			if (prog < 1) {
				frame = requestAnimationFrame(tick);
			}
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [beat, reducedMotion]);

	const brandLetters: string[] = String(botDisplayName).split('');

	return (
		<motion.div layout transition={{ type: 'spring', stiffness: 170, damping: 22 }} className="relative flex flex-col items-center justify-center text-center w-full select-none">
			{/* Circular Orbital Core & Energy Rings — Bumps up & scales down gracefully when compact */}
			<motion.div
				layout
				transition={{ type: 'spring', stiffness: 170, damping: 22 }}
				className={`relative flex items-center justify-center ${compact ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-60 h-60 sm:w-72 sm:h-72'}`}
			>
				{/* Expanding Pulse Halo 1 */}
				<motion.div
					initial={{ scale: 0.4, opacity: 0 }}
					animate={{
						scale: beat === 2 && !compact ? [1, 1.85] : [0.82, 1.18, 0.92],
						opacity: beat === 2 && !compact ? [0.55, 0] : [0.15, 0.38, 0.2],
					}}
					transition={{ duration: beat === 2 && !compact ? 1.05 : 2.6, ease: 'easeOut', repeat: beat === 2 && !compact ? 0 : Infinity }}
					className="absolute inset-0 rounded-full border-2 border-(--accent)/40 shadow-[0_0_70px_color-mix(in_srgb,var(--accent)_35%,transparent)] pointer-events-none"
				/>

				{/* Secondary Ambient Halo */}
				<motion.div
					initial={{ scale: 0.6, opacity: 0 }}
					animate={{
						scale: [0.92, 1.1, 0.92],
						opacity: [0.12, 0.28, 0.12],
					}}
					transition={{ duration: 3.1, ease: 'easeInOut', repeat: Infinity }}
					className="absolute inset-4 sm:inset-5 rounded-full border border-(--accent)/30 bg-(--accent)/5 backdrop-blur-[2px] pointer-events-none"
				/>

				{/* Counter-Rotating Outer Orbital SVG Reticle */}
				{!reducedMotion && (
					<motion.svg
						viewBox="0 0 260 260"
						animate={{ rotate: 360 }}
						transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
						className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
					>
						<circle cx="130" cy="130" r="118" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="14 10 4 10" strokeOpacity="0.45" />
						<circle cx="130" cy="130" r="96" fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="40 24" strokeOpacity="0.3" />
					</motion.svg>
				)}

				{/* Counter-Rotating Inner Orbital SVG Reticle */}
				{!reducedMotion && (
					<motion.svg
						viewBox="0 0 260 260"
						animate={{ rotate: -360 }}
						transition={{ duration: 11, ease: 'linear', repeat: Infinity }}
						className="absolute inset-3 sm:inset-4 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)] pointer-events-none opacity-75"
					>
						<circle cx="130" cy="130" r="88" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="24 48" strokeLinecap="round" strokeOpacity="0.6" />
					</motion.svg>
				)}

				{/* Center Bot Avatar Core with Portal Glow */}
				<motion.div
					layout
					initial={{ scale: 0.2, opacity: 0, rotate: -12 }}
					animate={{
						scale: 1,
						opacity: 1,
						rotate: 0,
					}}
					transition={{ type: 'spring', stiffness: 200, damping: 18 }}
					className="relative z-10 flex items-center justify-center"
				>
					<div className="absolute -inset-4 rounded-full bg-(--accent)/25 blur-2xl animate-pulse pointer-events-none" />
					{avatarUrl ? (
						<Image
							src={avatarUrl}
							alt={botDisplayName}
							width={112}
							height={112}
							unoptimized
							className={`${
								compact ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl' : 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl'
							} border-2 border-(--accent) object-cover shadow-[0_0_48px_color-mix(in_srgb,var(--accent)_55%,transparent)] transition-all duration-500`}
						/>
					) : (
						<div
							className={`${
								compact ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl' : 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl'
							} bg-(--accent)/20 border-2 border-(--accent) flex items-center justify-center text-(--accent) font-extrabold shadow-[0_0_48px_color-mix(in_srgb,var(--accent)_55%,transparent)] transition-all duration-500`}
						>
							<Bot size={compact ? 30 : 42} />
						</div>
					)}

					{/* +100 Bot Invite Credits Vault Burst Badge */}
					<AnimatePresence>
						{beat >= 1 && (
							<motion.div
								initial={{ scale: 0, opacity: 0, y: 12 }}
								animate={{ scale: 1, opacity: 1, y: 0 }}
								transition={{ type: 'spring', stiffness: 280, damping: 16 }}
								className={`absolute ${
									compact ? '-bottom-2 -right-3 px-2.5 py-0.5 text-[11px]' : '-bottom-3 -right-4 px-3 py-1 text-xs'
								} flex items-center gap-1 rounded-full bg-(--accent) font-extrabold text-white shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_70%,transparent)] border border-(--border)/20`}
							>
								<Coins size={compact ? 11 : 13} className="shrink-0" />
								<span>+{creditCount.toLocaleString()}</span>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</motion.div>

			{/* Kinetic Status Pill & Title */}
			<motion.div layout className="mt-2 sm:mt-3 flex flex-col items-center max-w-2xl px-4" style={{ gap: 'calc(var(--ui-gap) * 0.45)' }}>
				<motion.div
					layout
					key={`status-pill-${beat}`}
					initial={{ opacity: 0, y: 8, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.25 }}
					className="inline-flex items-center gap-2 rounded-full bg-(--background)/80 backdrop-blur-xl border border-(--accent)/40 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-(--accent) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
				>
					{beat < 2 ? <Sparkles size={12} className="animate-spin shrink-0" /> : <CheckCircle2 size={13} className="text-(--accent-green) shrink-0" />}
					<span>
						{beat === 0
							? t('app.bots.onboarding.intro.statusSyncing')
							: beat === 1
								? t('app.bots.onboarding.intro.statusCredits')
								: guildName
									? t('app.bots.onboarding.intro.fusionHeadingWithGuild', { name: botDisplayName, guild: guildName })
									: t('app.bots.onboarding.intro.statusReady', { name: botDisplayName })}
					</span>
				</motion.div>

				{/* Kinetic Title & Bot Name Letter Stagger */}
				<motion.div layout className="flex flex-col items-center">
					<motion.span
						layout
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.1 }}
						className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-base'} font-bold uppercase tracking-[0.25em] text-(--text-muted) transition-all duration-300`}
					>
						{t('app.bots.onboarding.intro.headlinePrefix')}
					</motion.span>

					<motion.div
						layout
						className={`flex items-center justify-center flex-wrap gap-1.5 ${
							compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl'
						} font-extrabold tracking-tight text-(--text) mt-0.5 transition-all duration-300`}
						style={{ fontFamily: 'var(--font-fredoka)' }}
					>
						<span>
							{brandLetters.map((char, i) => (
								<motion.span
									key={i}
									initial={{ opacity: 0, y: 22, scale: 0.7 }}
									animate={{
										opacity: 1,
										y: 0,
										scale: 1,
									}}
									transition={{
										duration: 0.4,
										delay: 0.18 + i * 0.04,
										type: 'spring',
										stiffness: 220,
										damping: 16,
									}}
									className="inline-block text-(--accent) drop-shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
								>
									{char === ' ' ? '\u00A0' : char}
								</motion.span>
							))}
						</span>
						{verified && <ShieldCheck className={`${compact ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-8 sm:h-8'} text-(--accent-green) shrink-0 inline`} />}
					</motion.div>

					<AnimatePresence mode="wait">
						{!compact && (
							<motion.p
								key="intro-subtitle"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: beat >= 1 ? 1 : 0.65, y: 0 }}
								exit={{ opacity: 0, y: -6, height: 0 }}
								transition={{ duration: 0.25 }}
								className="text-xs sm:text-sm text-(--text-muted) mt-2 max-w-md leading-relaxed"
							>
								{beat >= 1 ? t('app.bots.onboarding.intro.creditsGranted', { name: botDisplayName }) : t('app.bots.onboarding.intro.subtitle')}
							</motion.p>
						)}
					</AnimatePresence>
				</motion.div>

				{/* Progress Bar + Skip Intro Button (Exits once compact) */}
				<AnimatePresence>
					{!compact && (
						<motion.div
							key="intro-progress-controls"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8, scale: 0.95 }}
							transition={{ duration: 0.22 }}
							className="flex flex-col items-center gap-2.5 w-52 sm:w-60 mt-2"
						>
							<div className="w-full h-1.5 rounded-full bg-(--foreground)/60 border border-(--border)/15 overflow-hidden p-0.5">
								<motion.div
									initial={{ width: '0%' }}
									animate={{ width: '100%' }}
									transition={{ duration: reducedMotion ? 1.0 : 3.25, ease: [0.22, 1, 0.36, 1] }}
									className="h-full rounded-full bg-(--accent) shadow-[0_0_12px_var(--accent)]"
								/>
							</div>

							<button
								type="button"
								onClick={finishIntro}
								className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/70 hover:bg-(--foreground)/60 border border-(--border)/15 hover:border-(--accent)/40 px-3.5 py-1 text-[11px] font-bold text-(--text-muted) hover:text-(--text) transition-all cursor-pointer backdrop-blur-md"
							>
								<span>{t('components.firstSignIn.intro.skipIntro')}</span>
								<ArrowRight size={12} />
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	);
}
