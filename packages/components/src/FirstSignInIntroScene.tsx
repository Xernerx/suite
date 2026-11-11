/** @format */
'use client';

import { useDictionary, useTheme } from '@xernerx/providers';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bot, CheckCircle2, Cloud, Code2, Coins, Compass, LayoutDashboard, Radio, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface FirstSignInIntroSceneProps {
	displayName: string;
	username?: string;
	avatarUrl: string | null;
	onComplete: () => void;
}

type IntroAct = 0 | 1 | 2 | 3;

const INTRO_STAGE_CONFIG: Record<IntroAct, { variant: string; renderStyle: string }> = {
	0: { variant: 'icon', renderStyle: 'dots' },
	1: { variant: 'infinity', renderStyle: 'dots' },
	2: { variant: 'orbit', renderStyle: 'dots' },
	3: { variant: 'full', renderStyle: 'dots' },
};

const ECOSYSTEM_PILLARS = [
	{ Icon: Bot, key: 'pillarBots' },
	{ Icon: LayoutDashboard, key: 'pillarDashboard' },
	{ Icon: Code2, key: 'pillarPortal' },
	{ Icon: Compass, key: 'pillarExplore' },
	{ Icon: Cloud, key: 'pillarCloud' },
	{ Icon: Coins, key: 'pillarEconomy' },
] as const;

export function fireIntroConfetti(particleCount = 34) {
	try {
		confetti({
			particleCount,
			angle: 60,
			spread: 55,
			startVelocity: 38,
			origin: { x: 0.1, y: 0.72 },
		});
		confetti({
			particleCount,
			angle: 120,
			spread: 55,
			startVelocity: 38,
			origin: { x: 0.9, y: 0.72 },
		});
	} catch {}
}

function emitDotShockwave(xRatio = 0.5, yRatio = 0.45) {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(
		new CustomEvent('xernerx:dot-shockwave', {
			detail: { xRatio, yRatio },
		})
	);
}

export function FirstSignInIntroScene({ displayName, username, avatarUrl, onComplete }: FirstSignInIntroSceneProps) {
	const { t } = useDictionary();
	const { preferences } = useTheme();
	const reducedMotion = Boolean(preferences?.reducedMotion);

	const [act, setAct] = useState<IntroAct>(0);
	const [fused, setFused] = useState(false);
	const [creditCount, setCreditCount] = useState(0);
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;
	const hasCompletedRef = useRef(false);

	const finishIntro = useCallback(() => {
		if (hasCompletedRef.current) return;
		hasCompletedRef.current = true;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('xernerx:intro-stage', { detail: { active: false } }));
		}
		onCompleteRef.current();
	}, []);

	// Sync background XernerxDotLogo variant (always pure 'dots' renderStyle so every transition morphs dot-to-dot)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const cfg = INTRO_STAGE_CONFIG[act];
		window.dispatchEvent(
			new CustomEvent('xernerx:intro-stage', {
				detail: { active: true, variant: cfg.variant, renderStyle: 'dots' },
			})
		);
	}, [act]);

	// Clean up intro-stage on unmount
	useEffect(() => {
		return () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('xernerx:intro-stage', { detail: { active: false } }));
			}
		};
	}, []);

	// Trigger initial dot-matrix construction once on mount
	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('xernerx:construct-logo'));
		}
	}, []);

	// Step-by-step Act Progression
	useEffect(() => {
		if (reducedMotion) {
			setAct(3);
			setFused(true);
			setCreditCount(1000);
			const fastTimer = setTimeout(() => finishIntro(), 1600);
			return () => clearTimeout(fastTimer);
		}

		if (act === 0) {
			const tNext = setTimeout(() => {
				setFused(false);
				setAct(1);
			}, 4200);
			return () => clearTimeout(tNext);
		}

		if (act === 1) {
			const tFuse = setTimeout(() => {
				setFused(true);
			}, 850);
			const tNext = setTimeout(() => {
				setAct(2);
			}, 3600);
			return () => {
				clearTimeout(tFuse);
				clearTimeout(tNext);
			};
		}

		if (act === 2) {
			try {
				confetti({
					particleCount: 34,
					angle: 60,
					spread: 55,
					startVelocity: 38,
					origin: { x: 0.1, y: 0.72 },
				});
				confetti({
					particleCount: 34,
					angle: 120,
					spread: 55,
					startVelocity: 38,
					origin: { x: 0.9, y: 0.72 },
				});
			} catch {}
			const tNext = setTimeout(() => {
				setAct(3);
			}, 3600);
			return () => clearTimeout(tNext);
		}

		if (act === 3) {
			const tDone = setTimeout(() => {
				finishIntro();
			}, 3800);
			return () => clearTimeout(tDone);
		}
	}, [act, reducedMotion, finishIntro]);

	// Credit Vault Counter Roll-Up on Act 2
	useEffect(() => {
		if (act < 2 || reducedMotion) return;
		let frame = 0;
		const start = performance.now();
		const duration = 1550;
		const tick = (now: number) => {
			const prog = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - prog, 3);
			setCreditCount(Math.round(eased * 1000));
			if (prog < 1) {
				frame = requestAnimationFrame(tick);
			}
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [act, reducedMotion]);

	const brandLetters: string[] = String(t('components.firstSignIn.intro.headlineBrand')).split('');
	const actLabels: Record<IntroAct, string> = {
		0: t('components.firstSignIn.intro.actSignal'),
		1: t('components.firstSignIn.intro.actFusion'),
		2: t('components.firstSignIn.intro.actVault'),
		3: t('components.firstSignIn.intro.actReady'),
	};

	const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		const xRatio = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
		const yRatio = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
		emitDotShockwave(xRatio, yRatio);
	};

	return (
		<motion.div
			key="scene-cinematic-intro"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
			transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			className="relative flex flex-col items-center justify-between text-center w-full h-full min-h-[460px] sm:min-h-[560px] select-none py-1 sm:py-2"
		>
			{/* Top Telemetry Pill — Pinned at top so the center dot-matrix canvas is 100% unobstructed */}
			<motion.div
				key={`telemetry-${act}`}
				initial={{ opacity: 0, y: -12, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.3 }}
				className="z-10 inline-flex items-center gap-2.5 rounded-full bg-(--background)/80 backdrop-blur-xl border border-(--accent)/40 px-4 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-(--accent) shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
			>
				{act === 0 && <Radio size={14} className="animate-pulse shrink-0" />}
				{act === 1 && <Zap size={14} className="animate-bounce shrink-0" />}
				{act === 2 && <Coins size={14} className="animate-spin shrink-0" />}
				{act === 3 && <CheckCircle2 size={14} className="text-(--accent-green) shrink-0" />}
				<span>
					{act === 0
						? t('components.firstSignIn.intro.statusSignal')
						: act === 1
							? t('components.firstSignIn.intro.statusSyncing')
							: act === 2
								? t('components.firstSignIn.intro.statusCredits')
								: username
									? `${t('components.firstSignIn.intro.verifiedBadge')} • @${username}`
									: t('components.firstSignIn.intro.statusReady')}
				</span>
				<div className="hidden sm:flex items-end gap-0.5 h-3 pl-1 border-l border-(--border)/20">
					{[0.45, 0.9, 0.6, 1, 0.7].map((h, idx) => (
						<motion.span
							key={idx}
							animate={{ height: [`${Math.round(h * 35)}%`, `${Math.round(h * 100)}%`, `${Math.round(h * 40)}%`] }}
							transition={{ duration: 0.5 + idx * 0.1, repeat: Infinity, ease: 'easeInOut' }}
							className="w-0.5 rounded-full bg-(--accent)"
						/>
					))}
				</div>
			</motion.div>

			{/* Open Center Stage — Gives the morphing XernerxDotLogo dot-matrix full, unobstructed visibility */}
			<div onClick={handleStageClick} className="relative flex-1 w-full min-h-[200px] sm:min-h-[280px] cursor-pointer" aria-hidden="true" />

			{/* Bottom Glassmorphic Choreography HUD + 4-Act Timeline */}
			<div className="z-10 flex flex-col items-center gap-2.5 w-full max-w-2xl px-2">
				<div className="w-full rounded-3xl bg-(--background)/75 backdrop-blur-2xl border border-(--accent)/35 px-4 py-3.5 sm:px-6 sm:py-4 shadow-[0_12px_44px_color-mix(in_srgb,var(--accent)_18%,transparent)]">
					<AnimatePresence mode="wait">
						{/* ACT I HUD: SIGNAL DETECTION & EMBLEM IGNITION */}
						{act === 0 && (
							<motion.div
								key="hud-act-0"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.28 }}
								className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
							>
								<div className="flex items-center gap-3.5">
									<div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/45 text-(--accent) shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
										<Radio size={22} className="animate-pulse" />
									</div>
									<div>
										<h2 className="text-lg sm:text-2xl font-extrabold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{t('components.firstSignIn.intro.signalHeading')}
										</h2>
										<p className="text-xs sm:text-sm text-(--text-muted) leading-snug">{t('components.firstSignIn.intro.signalSubtitle')}</p>
									</div>
								</div>
								<div className="flex items-end justify-center gap-1 h-6 shrink-0 px-2">
									{[0.4, 0.85, 0.55, 1, 0.65, 0.9, 0.5, 0.95, 0.6].map((h, idx) => (
										<motion.span
											key={idx}
											animate={{ height: [`${Math.round(h * 35)}%`, `${Math.round(h * 100)}%`, `${Math.round(h * 40)}%`] }}
											transition={{ duration: 0.5 + (idx % 3) * 0.14, repeat: Infinity, ease: 'easeInOut' }}
											className="w-1 rounded-full bg-(--accent) shadow-[0_0_8px_var(--accent)]"
										/>
									))}
								</div>
							</motion.div>
						)}

						{/* ACT II HUD: DISCORD × XERNERX IDENTITY FUSION (INFINITY DOT MORPH) */}
						{act === 1 && (
							<motion.div
								key="hud-act-1"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.28 }}
								className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
							>
								<div className="flex items-center gap-3.5">
									<div className="relative flex items-center justify-center h-12 w-24 shrink-0">
										<motion.div
											initial={{ x: -18, scale: 0.9 }}
											animate={{ x: fused ? -6 : -16, scale: 1 }}
											transition={{ type: 'spring', stiffness: 220, damping: 18 }}
											className="relative z-10 h-11 w-11 rounded-2xl border-2 border-(--accent) bg-(--background) overflow-hidden shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_45%,transparent)] flex items-center justify-center"
										>
											{avatarUrl ? (
												<Image src={avatarUrl} alt={displayName} width={44} height={44} unoptimized className="w-full h-full object-cover" />
											) : (
												<span className="text-sm font-extrabold text-(--accent)">{displayName.charAt(0).toUpperCase()}</span>
											)}
										</motion.div>
										<motion.div
											initial={{ x: 18, scale: 0.9 }}
											animate={{ x: fused ? 6 : 16, scale: 1 }}
											transition={{ type: 'spring', stiffness: 220, damping: 18 }}
											className="relative h-11 w-11 rounded-2xl border-2 border-(--accent)/60 bg-(--accent)/15 text-(--accent) flex items-center justify-center shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
										>
											{fused ? <ShieldCheck size={20} /> : <Sparkles size={20} />}
										</motion.div>
									</div>
									<div>
										<h2 className="text-lg sm:text-2xl font-extrabold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{t('components.firstSignIn.intro.fusionHeading', { name: displayName })}
										</h2>
										<p className="text-xs sm:text-sm text-(--text-muted) leading-snug">{t('components.firstSignIn.intro.fusionSubtitle')}</p>
									</div>
								</div>
							</motion.div>
						)}

						{/* ACT III HUD: +1,000 WELCOME CREDITS VAULT & ECOSYSTEM (ORBIT DOT MORPH) */}
						{act === 2 && (
							<motion.div
								key="hud-act-2"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.28 }}
								className="flex flex-col gap-2.5"
							>
								<div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
									<div className="flex items-center gap-3">
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 border border-(--accent)/45 text-(--accent)">
											<Coins size={20} />
										</div>
										<div>
											<div className="text-[11px] font-extrabold uppercase tracking-wider text-(--accent)">{t('components.firstSignIn.intro.vaultBadge')}</div>
											<div className="text-xs sm:text-sm font-bold text-(--text-muted)">{t('components.firstSignIn.intro.creditsGranted')}</div>
										</div>
									</div>
									<div
										className="text-2xl sm:text-4xl font-extrabold text-(--accent) tracking-tight tabular-nums drop-shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
										style={{ fontFamily: 'var(--font-fredoka)' }}
									>
										+{creditCount.toLocaleString()}
									</div>
								</div>
								<div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1 border-t border-(--border)/10">
									{ECOSYSTEM_PILLARS.map(({ Icon, key }, idx) => (
										<motion.div
											key={key}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ duration: 0.22, delay: idx * 0.05 }}
											className="flex items-center justify-center sm:justify-start gap-1.5 rounded-xl bg-(--foreground)/45 border border-(--border)/15 px-2 py-1 text-[10px] font-bold text-(--text) truncate"
										>
											<Icon size={12} className="text-(--accent) shrink-0" />
											<span className="truncate">{t(`components.firstSignIn.intro.${key}`)}</span>
										</motion.div>
									))}
								</div>
							</motion.div>
						)}

						{/* ACT IV HUD: GRAND STUDIO LOGO REVEAL (FULL LOGO DOT MORPH) */}
						{act === 3 && (
							<motion.div
								key="hud-act-3"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.3 }}
								className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
							>
								<div className="flex items-center gap-3.5">
									<div className="relative shrink-0">
										{avatarUrl ? (
											<Image
												src={avatarUrl}
												alt={displayName}
												width={52}
												height={52}
												unoptimized
												className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-(--accent) object-cover shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
											/>
										) : (
											<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-(--accent)/20 border-2 border-(--accent) flex items-center justify-center text-(--accent) text-xl font-extrabold">
												{displayName.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="absolute -bottom-1.5 -right-2 flex items-center gap-0.5 rounded-full bg-(--accent) px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow">
											<Coins size={9} />
											<span>+1,000</span>
										</div>
									</div>
									<div>
										<div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-(--text-muted)">{t('components.firstSignIn.intro.headlinePrefix')}</div>
										<div
											className="flex items-center justify-center sm:justify-start flex-wrap text-xl sm:text-3xl font-extrabold tracking-tight text-(--accent) leading-tight"
											style={{ fontFamily: 'var(--font-fredoka)' }}
										>
											{brandLetters.map((char: string, i: number) => (
												<motion.span
													key={i}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.25, delay: i * 0.03 }}
													className="inline-block"
												>
													{char === ' ' ? '\u00A0' : char}
												</motion.span>
											))}
										</div>
										<p className="text-xs text-(--text-muted) mt-0.5 line-clamp-1">{t('components.firstSignIn.intro.subtitle')}</p>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* 4-Act Interactive Timeline + Skip Intro */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full px-1">
					<div className="grid grid-cols-4 gap-2 w-full sm:flex-1">
						{([0, 1, 2, 3] as IntroAct[]).map((idx) => {
							const isCurrent = act === idx;
							const isPast = act > idx;
							return (
								<button
									key={idx}
									type="button"
									onClick={() => {
										setAct(idx);
										if (idx === 0 && typeof window !== 'undefined') {
											window.dispatchEvent(new CustomEvent('xernerx:construct-logo'));
										}
										if (idx >= 1) setFused(true);
										if (idx >= 2) setCreditCount(1000);
									}}
									className="group flex flex-col gap-1 text-left cursor-pointer"
								>
									<div className="w-full h-1.5 rounded-full bg-(--foreground)/60 border border-(--border)/15 overflow-hidden">
										{isPast ? (
											<div className="h-full w-full bg-(--accent)" />
										) : isCurrent ? (
											<motion.div
												key={`bar-${idx}`}
												initial={{ width: '0%' }}
												animate={{ width: '100%' }}
												transition={{ duration: idx === 0 ? 4.2 : idx === 3 ? 3.8 : 3.6, ease: 'linear' }}
												className="h-full bg-(--accent) shadow-[0_0_10px_var(--accent)]"
											/>
										) : null}
									</div>
									<span className={`text-[10px] font-bold truncate transition-colors ${isCurrent ? 'text-(--accent)' : isPast ? 'text-(--text)' : 'text-(--text-muted)/60'}`}>
										{idx + 1}. {actLabels[idx]}
									</span>
								</button>
							);
						})}
					</div>

					<button
						type="button"
						onClick={finishIntro}
						className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/80 hover:bg-(--foreground)/65 border border-(--border)/15 hover:border-(--accent)/45 px-4 py-1.5 text-xs font-bold text-(--text-muted) hover:text-(--text) transition-all cursor-pointer backdrop-blur-md shadow-sm shrink-0"
					>
						<span>{t('components.firstSignIn.intro.skipIntro')}</span>
						<ArrowRight size={13} />
					</button>
				</div>
			</div>
		</motion.div>
	);
}
