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
	0: { variant: 'full', renderStyle: 'dots' },
	1: { variant: 'infinity', renderStyle: 'dots' },
	2: { variant: 'plus1000', renderStyle: 'dots' },
	3: { variant: 'icon', renderStyle: 'dots' },
};

const ECOSYSTEM_PILLARS = [
	{ Icon: Bot, key: 'pillarBots', posClass: 'top-[15%] left-[6%] sm:left-[10%]' },
	{ Icon: LayoutDashboard, key: 'pillarDashboard', posClass: 'top-[15%] right-[6%] sm:right-[10%]' },
	{ Icon: Code2, key: 'pillarPortal', posClass: 'top-[47%] left-[3%] sm:left-[6%]' },
	{ Icon: Compass, key: 'pillarExplore', posClass: 'top-[47%] right-[3%] sm:right-[6%]' },
	{ Icon: Cloud, key: 'pillarCloud', posClass: 'bottom-[19%] left-[7%] sm:left-[12%]' },
	{ Icon: Coins, key: 'pillarEconomy', posClass: 'bottom-[19%] right-[7%] sm:right-[12%]' },
] as const;

export function fireIntroConfetti(particleCount = 38) {
	try {
		confetti({
			particleCount,
			angle: 60,
			spread: 58,
			startVelocity: 42,
			origin: { x: 0.08, y: 0.72 },
		});
		confetti({
			particleCount,
			angle: 120,
			spread: 58,
			startVelocity: 42,
			origin: { x: 0.92, y: 0.72 },
		});
	} catch {}
}

function emitDotShockwave(xRatio = 0.5, yRatio = 0.46) {
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

	// Drive full-screen background XernerxDotLogo variant across each act
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const cfg = INTRO_STAGE_CONFIG[act];
		window.dispatchEvent(
			new CustomEvent('xernerx:intro-stage', {
				detail: { active: true, variant: cfg.variant, renderStyle: cfg.renderStyle },
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

	// Trigger the true cold-boot initial load sequence (radial dot grid sweep + left-to-right full wordmark ignition + 2.85s shockwave)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const id = window.setTimeout(() => {
			window.dispatchEvent(new CustomEvent('xernerx:construct-logo', { detail: { mode: 'default', force: true } }));
		}, 40);
		return () => window.clearTimeout(id);
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
			}, 3950);
			return () => clearTimeout(tNext);
		}

		if (act === 1) {
			const tFuse = setTimeout(() => {
				setFused(true);
				emitDotShockwave(0.5, 0.46);
			}, 1150);
			const tNext = setTimeout(() => {
				setAct(2);
			}, 3900);
			return () => {
				clearTimeout(tFuse);
				clearTimeout(tNext);
			};
		}

		if (act === 2) {
			emitDotShockwave(0.5, 0.48);
			fireIntroConfetti(38);
			const tNext = setTimeout(() => {
				setAct(3);
			}, 3900);
			return () => clearTimeout(tNext);
		}

		if (act === 3) {
			emitDotShockwave(0.5, 0.46);
			const tDone = setTimeout(() => {
				finishIntro();
			}, 4000);
			return () => clearTimeout(tDone);
		}
	}, [act, reducedMotion, finishIntro]);

	// Credit Vault Counter Roll-Up on Act 2
	useEffect(() => {
		if (act < 2 || reducedMotion) return;
		let frame = 0;
		const start = performance.now();
		const duration = 1500;
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
			onClick={handleStageClick}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
			transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
			className="relative flex flex-col items-center justify-between text-center w-full h-full overflow-hidden select-none cursor-pointer"
		>
			{/* Full-Viewport Background Atmospheric Choreography (Scanline + Radial Pulse Rings + Simulated Shell Blueprint) */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				{/* Cold-Boot Laser Scanline (Act 0) */}
				<AnimatePresence>
					{act === 0 && !reducedMotion && (
						<motion.div
							key="boot-scanline"
							initial={{ top: '-8%', opacity: 0 }}
							animate={{ top: ['0%', '105%'], opacity: [0, 0.85, 0] }}
							exit={{ opacity: 0 }}
							transition={{ duration: 2.9, ease: 'easeInOut' }}
							className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-(--accent) to-transparent shadow-[0_0_28px_4px_var(--accent)]"
						/>
					)}
				</AnimatePresence>

				{/* Identity Fusion Shockwave Ring (Act 1) */}
				<AnimatePresence>
					{act === 1 && fused && !reducedMotion && (
						<motion.div
							key="fusion-wave"
							initial={{ scale: 0.2, opacity: 0.85 }}
							animate={{ scale: 3.4, opacity: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
							className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full border-2 border-(--accent) shadow-[0_0_60px_var(--accent)]"
						/>
					)}
				</AnimatePresence>

				{/* Constellation Radial Conduits (Act 2) */}
				<AnimatePresence>
					{act === 2 && (
						<motion.svg
							key="constellation-beams"
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.35 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.6 }}
							viewBox="0 0 1000 600"
							preserveAspectRatio="none"
							className="absolute inset-0 w-full h-full text-(--accent)"
						>
							{[
								[140, 110],
								[860, 110],
								[90, 300],
								[910, 300],
								[160, 490],
								[840, 490],
							].map(([x, y], i) => (
								<motion.line
									key={i}
									x1="500"
									y1="300"
									x2={x}
									y2={y}
									stroke="currentColor"
									strokeWidth="1.5"
									strokeDasharray="6 8"
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 0.7 }}
									transition={{ duration: 0.7, delay: i * 0.08 }}
								/>
							))}
						</motion.svg>
					)}
				</AnimatePresence>

				{/* Simulated Suite Workspace Shell Wireframe Materializing Around Viewport Edges (Act 3) */}
				<AnimatePresence>
					{act === 3 && (
						<motion.div key="shell-wireframe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.65 }} className="absolute inset-0">
							{/* Ghost Header Bar */}
							<motion.div
								initial={{ y: -48, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
								className="absolute inset-x-4 top-3 h-11 rounded-full border border-(--accent)/25 bg-(--foreground)/15 backdrop-blur-[2px] flex items-center justify-between px-5"
							>
								<div className="flex items-center gap-2">
									<span className="h-2.5 w-2.5 rounded-full bg-(--accent)/60 animate-pulse" />
									<span className="h-2 w-20 rounded-full bg-(--accent)/25" />
								</div>
								<div className="hidden sm:flex items-center gap-2">
									<span className="h-5 w-16 rounded-full bg-(--accent)/15 border border-(--accent)/25" />
									<span className="h-6 w-6 rounded-full bg-(--accent)/20" />
									<span className="h-6 w-6 rounded-full bg-(--accent)/20" />
									<span className="h-7 w-7 rounded-full bg-(--accent)/35 border border-(--accent)/50" />
								</div>
							</motion.div>

							{/* Ghost Sidebar Rail */}
							<motion.div
								initial={{ x: -56, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
								className="hidden md:flex absolute left-4 top-18 bottom-16 w-14 rounded-3xl border border-(--accent)/20 bg-(--foreground)/12 flex-col items-center py-4 gap-3"
							>
								{[0, 1, 2, 3].map((n) => (
									<span key={n} className={`h-8 w-8 rounded-2xl ${n === 0 ? 'bg-(--accent)/30 border border-(--accent)/45' : 'bg-(--border)/15'}`} />
								))}
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Corner Viewport Registration Ticks */}
				<div className="absolute top-5 left-5 h-5 w-5 border-t-2 border-l-2 border-(--accent)/35 rounded-tl-lg" />
				<div className="absolute top-5 right-5 h-5 w-5 border-t-2 border-r-2 border-(--accent)/35 rounded-tr-lg" />
				<div className="absolute bottom-5 left-5 h-5 w-5 border-b-2 border-l-2 border-(--accent)/35 rounded-bl-lg" />
				<div className="absolute bottom-5 right-5 h-5 w-5 border-b-2 border-r-2 border-(--accent)/35 rounded-br-lg" />
			</div>

			{/* Top Floating Telemetry Bar + Skip Intro (Frameless) */}
			<div onClick={(e) => e.stopPropagation()} className="relative z-20 w-full flex items-center justify-between px-5 sm:px-10 pt-5 sm:pt-7">
				<motion.div
					key={`telemetry-${act}`}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="inline-flex items-center gap-2.5 rounded-full bg-(--foreground)/35 backdrop-blur-md border border-(--accent)/35 px-4 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-(--accent) shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
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
				</motion.div>

				<button
					type="button"
					onClick={finishIntro}
					className="inline-flex items-center gap-1.5 rounded-full bg-(--foreground)/40 hover:bg-(--accent)/20 border border-(--border)/15 hover:border-(--accent)/45 px-4 py-1.5 text-xs font-bold text-(--text-muted) hover:text-(--text) transition-all cursor-pointer backdrop-blur-md shadow-sm"
				>
					<span>{t('components.firstSignIn.intro.skipIntro')}</span>
					<ArrowRight size={13} />
				</button>
			</div>

			{/* Full-Screen Center Stage Choreography — Directly Integrated With the Background Dot-Matrix */}
			<div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-6 pointer-events-none">
				<AnimatePresence mode="wait">
					{/* ACT 0: INITIAL COLD-BOOT SEQUENCE (Background constructs giant full XERNERX wordmark left-to-right + shockwave) */}
					{act === 0 && (
						<motion.div
							key="stage-act-0"
							initial={{ opacity: 0, y: 18 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 1.05, filter: 'blur(6px)' }}
							transition={{ duration: 0.45 }}
							className="flex flex-col items-center justify-end h-full pb-12 sm:pb-16 gap-3"
						>
							<div className="flex items-end justify-center gap-1.5 h-8">
								{[0.35, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.95, 0.6, 0.85, 0.4].map((h, idx) => (
									<motion.span
										key={idx}
										animate={{ height: [`${Math.round(h * 30)}%`, `${Math.round(h * 100)}%`, `${Math.round(h * 35)}%`] }}
										transition={{ duration: 0.55 + (idx % 4) * 0.12, repeat: Infinity, ease: 'easeInOut' }}
										className="w-1.5 rounded-full bg-(--accent) shadow-[0_0_12px_var(--accent)]"
									/>
								))}
							</div>
							<h1
								className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-(--text) tracking-tight drop-shadow-[0_4px_28px_var(--background)]"
								style={{ fontFamily: 'var(--font-fredoka)' }}
							>
								{t('components.firstSignIn.intro.signalHeading')}
							</h1>
							<p className="text-sm sm:text-lg text-(--text-muted) max-w-xl drop-shadow-[0_2px_16px_var(--background)]">{t('components.firstSignIn.intro.signalSubtitle')}</p>
						</motion.div>
					)}

					{/* ACT 1: FULL-SCREEN DISCORD × XERNERX TWIN-CORE IDENTITY FUSION (Aligned with background Infinity loops) */}
					{act === 1 && (
						<motion.div
							key="stage-act-1"
							initial={{ opacity: 0, scale: 0.94 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
							transition={{ duration: 0.45 }}
							className="flex flex-col items-center justify-center w-full h-full gap-8 sm:gap-10"
						>
							<div className="relative flex items-center justify-center w-full max-w-4xl h-36 sm:h-44">
								{/* Connecting Energy Conduit */}
								<motion.div
									initial={{ scaleX: 0, opacity: 0 }}
									animate={{ scaleX: fused ? 0.15 : 1, opacity: fused ? 0 : 0.75 }}
									transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
									className="absolute w-[52%] max-w-md h-[3px] rounded-full bg-gradient-to-r from-(--accent) via-(--text) to-(--accent) shadow-[0_0_24px_var(--accent)]"
								/>

								{/* Left Infinity Core: Discord Avatar */}
								<motion.div
									initial={{ x: '-22vw', scale: 0.82, opacity: 0 }}
									animate={{ x: fused ? -18 : '-16vw', scale: fused ? 1.08 : 1, opacity: 1 }}
									transition={{ type: 'spring', stiffness: 150, damping: 18 }}
									className="relative z-10 h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-2 border-(--accent) bg-(--background) overflow-hidden shadow-[0_0_44px_color-mix(in_srgb,var(--accent)_55%,transparent)] flex items-center justify-center"
								>
									{avatarUrl ? (
										<Image src={avatarUrl} alt={displayName} width={112} height={112} unoptimized className="w-full h-full object-cover" />
									) : (
										<span className="text-3xl sm:text-4xl font-extrabold text-(--accent)">{displayName.charAt(0).toUpperCase()}</span>
									)}
								</motion.div>

								{/* Right Infinity Core: Xernerx Shield Emblem */}
								<motion.div
									initial={{ x: '22vw', scale: 0.82, opacity: 0 }}
									animate={{ x: fused ? 18 : '16vw', scale: fused ? 1.08 : 1, opacity: 1 }}
									transition={{ type: 'spring', stiffness: 150, damping: 18 }}
									className="relative z-20 h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-2 border-(--accent) bg-(--foreground)/60 backdrop-blur-xl text-(--accent) flex items-center justify-center shadow-[0_0_44px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
								>
									{fused ? <ShieldCheck size={44} /> : <Sparkles size={44} />}
								</motion.div>
							</div>

							<div className="flex flex-col items-center gap-2 max-w-2xl">
								<h2
									className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-(--text) tracking-tight drop-shadow-[0_4px_28px_var(--background)]"
									style={{ fontFamily: 'var(--font-fredoka)' }}
								>
									{t('components.firstSignIn.intro.fusionHeading', { name: displayName })}
								</h2>
								<p className="text-sm sm:text-lg text-(--text-muted) drop-shadow-[0_2px_16px_var(--background)]">{t('components.firstSignIn.intro.fusionSubtitle')}</p>
							</div>
						</motion.div>
					)}

					{/* ACT 2: FULL-SCREEN +1000 DOT-MATRIX MINT & ECOSYSTEM CONSTELLATION */}
					{act === 2 && (
						<motion.div
							key="stage-act-2"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
							transition={{ duration: 0.45 }}
							className="relative flex flex-col items-center justify-between w-full h-full py-6 sm:py-10"
						>
							{/* Top Floating Vault Headline */}
							<motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center gap-1">
								<span className="inline-flex items-center gap-2 rounded-full bg-(--accent)/15 border border-(--accent)/35 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-(--accent) backdrop-blur-md">
									<Coins size={14} />
									{t('components.firstSignIn.intro.vaultBadge')} • +{creditCount.toLocaleString()}
								</span>
								<h2
									className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-(--text) tracking-tight mt-1 drop-shadow-[0_4px_28px_var(--background)]"
									style={{ fontFamily: 'var(--font-fredoka)' }}
								>
									{t('components.firstSignIn.intro.creditsGranted')}
								</h2>
							</motion.div>

							{/* 6 Full-Viewport Orbital Ecosystem Nodes */}
							{ECOSYSTEM_PILLARS.map(({ Icon, key, posClass }, idx) => (
								<motion.div
									key={key}
									initial={{ opacity: 0, scale: 0.75 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.35, delay: 0.15 + idx * 0.09, type: 'spring', stiffness: 200 }}
									className={`hidden sm:inline-flex absolute ${posClass} items-center gap-2.5 rounded-full bg-(--foreground)/40 backdrop-blur-md border border-(--accent)/30 px-4 py-2 text-xs font-bold text-(--text) shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]`}
								>
									<span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--accent)/20 text-(--accent)">
										<Icon size={15} />
									</span>
									<span>{t(`components.firstSignIn.intro.${key}`)}</span>
								</motion.div>
							))}

							{/* Compact Mobile Row for Ecosystem Nodes (Leaving Center +1000 Dot Matrix Unobstructed) */}
							<div className="flex sm:hidden flex-wrap items-center justify-center gap-1.5 mt-auto pb-2">
								{ECOSYSTEM_PILLARS.map(({ Icon, key }) => (
									<span
										key={key}
										className="inline-flex items-center gap-1.5 rounded-full bg-(--foreground)/45 backdrop-blur-md border border-(--accent)/25 px-3 py-1 text-[11px] font-bold text-(--text)"
									>
										<Icon size={12} className="text-(--accent)" />
										<span>{t(`components.firstSignIn.intro.${key}`)}</span>
									</span>
								))}
							</div>
						</motion.div>
					)}

					{/* ACT 3: GRAND STUDIO HERO REVEAL */}
					{act === 3 && (
						<motion.div
							key="stage-act-3"
							initial={{ opacity: 0, scale: 0.94 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 1.05 }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							className="flex flex-col items-center justify-center gap-5 sm:gap-6 max-w-4xl"
						>
							<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 16 }} className="relative">
								{avatarUrl ? (
									<Image
										src={avatarUrl}
										alt={displayName}
										width={96}
										height={96}
										unoptimized
										className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-(--accent) object-cover shadow-[0_0_44px_color-mix(in_srgb,var(--accent)_55%,transparent)]"
									/>
								) : (
									<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-(--accent)/20 border-2 border-(--accent) flex items-center justify-center text-(--accent) text-3xl font-extrabold shadow-[0_0_44px_color-mix(in_srgb,var(--accent)_55%,transparent)]">
										{displayName.charAt(0).toUpperCase()}
									</div>
								)}
								<div className="absolute -bottom-2 -right-3 flex items-center gap-1 rounded-full bg-(--accent) px-2.5 py-0.5 text-[11px] font-extrabold text-(--accent-contrast) shadow-lg">
									<Coins size={11} />
									<span>+1,000</span>
								</div>
							</motion.div>

							<div className="flex flex-col items-center">
								<span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] text-(--text-muted) drop-shadow-[0_2px_12px_var(--background)]">
									{t('components.firstSignIn.intro.headlinePrefix')}
								</span>
								<div
									className="flex items-center justify-center flex-wrap text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-(--accent) leading-none mt-1 drop-shadow-[0_0_36px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
									style={{ fontFamily: 'var(--font-fredoka)' }}
								>
									{brandLetters.map((char: string, i: number) => (
										<motion.span
											key={i}
											initial={{ opacity: 0, y: 22, scale: 0.85 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											transition={{ duration: 0.32, delay: i * 0.04 }}
											className="inline-block"
										>
											{char === ' ' ? '\u00A0' : char}
										</motion.span>
									))}
								</div>
								<p className="text-sm sm:text-xl text-(--text) font-semibold mt-3 max-w-2xl drop-shadow-[0_2px_18px_var(--background)]">{t('components.firstSignIn.intro.subtitle')}</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Frameless Bottom Stage Progress Rail (No Card Box) */}
			<div onClick={(e) => e.stopPropagation()} className="relative z-20 w-full max-w-xl px-6 pb-5 sm:pb-7">
				<div className="grid grid-cols-4 gap-2.5 w-full">
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
										window.dispatchEvent(new CustomEvent('xernerx:construct-logo', { detail: { mode: 'default', force: true } }));
									}
									if (idx >= 1) setFused(true);
									if (idx >= 2) setCreditCount(1000);
								}}
								className="group flex flex-col gap-1.5 text-center cursor-pointer"
							>
								<div className="w-full h-1.5 rounded-full bg-(--foreground)/50 backdrop-blur-md border border-(--border)/15 overflow-hidden">
									{isPast ? (
										<div className="h-full w-full bg-(--accent)" />
									) : isCurrent ? (
										<motion.div
											key={`bar-${idx}`}
											initial={{ width: '0%' }}
											animate={{ width: '100%' }}
											transition={{ duration: idx === 0 ? 3.95 : idx === 3 ? 4.0 : 3.9, ease: 'linear' }}
											className="h-full bg-(--accent) shadow-[0_0_12px_var(--accent)]"
										/>
									) : null}
								</div>
								<span
									className={`text-[10px] sm:text-[11px] font-bold truncate transition-colors drop-shadow-[0_1px_8px_var(--background)] ${
										isCurrent ? 'text-(--accent)' : isPast ? 'text-(--text)' : 'text-(--text-muted)/65'
									}`}
								>
									{idx + 1}. {actLabels[idx]}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
}
