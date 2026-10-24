/** @format */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@xernerx/providers';
import { computeDotCoverage, DotLogoVariant, DotParticle, FULL_LOGO_BOUNDS, FULL_LOGO_PATHS, ICON_LOGO_PATHS, isAnimatedProceduralVariant, parseCssColor, Shockwave } from './dotLogoPaths';

export interface XernerxDotLogoProps {
	variant?: DotLogoVariant;
	width?: number;
	height?: number;
	cols?: number;
	className?: string;
	showAmbientField?: boolean;
	backgroundMode?: boolean;
	ripple?: boolean;
	blank?: boolean;
	subdued?: boolean;
	vivid?: boolean;
}

export function XernerxDotLogo({
	variant = 'icon',
	width,
	height,
	cols,
	className = '',
	showAmbientField = true,
	backgroundMode = false,
	ripple = true,
	blank = false,
	subdued = false,
	vivid = false,
}: XernerxDotLogoProps) {
	const resolvedWidth = width ?? (backgroundMode ? 1200 : variant === 'full' ? 460 : 240);
	const resolvedHeight = height ?? (backgroundMode ? 800 : variant === 'full' ? 150 : 176);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { resolvedTheme, preferences } = useTheme();
	const reducedMotion = Boolean(preferences?.reducedMotion);

	const variantRef = useRef<DotLogoVariant>(variant);
	const rippleRef = useRef(ripple);
	const blankRef = useRef(blank);
	const subduedRef = useRef(subdued);
	const wakeLoopRef = useRef<(() => void) | null>(null);
	const morphShapeRef = useRef<((nextVariant: DotLogoVariant) => void) | null>(null);

	useEffect(() => {
		rippleRef.current = ripple;
		blankRef.current = blank;
		subduedRef.current = subdued;
		wakeLoopRef.current?.();
	}, [ripple, blank, subdued]);

	useEffect(() => {
		if (variantRef.current !== variant) {
			variantRef.current = variant;
			morphShapeRef.current?.(variant);
			wakeLoopRef.current?.();
		}
	}, [variant]);

	const [measuredSize, setMeasuredSize] = useState<{ w: number; h: number }>({ w: resolvedWidth, h: resolvedHeight });

	useEffect(() => {
		if (!backgroundMode) {
			setMeasuredSize({ w: resolvedWidth, h: resolvedHeight });
			return;
		}
		const updateSize = () => {
			const el = containerRef.current;
			if (el) {
				const rect = el.getBoundingClientRect();
				if (rect.width > 0 && rect.height > 0) {
					setMeasuredSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
					return;
				}
			}
			if (typeof window !== 'undefined') setMeasuredSize({ w: window.innerWidth, h: window.innerHeight });
		};
		updateSize();
		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
		if (ro && containerRef.current) ro.observe(containerRef.current);
		window.addEventListener('resize', updateSize);
		return () => {
			ro?.disconnect();
			window.removeEventListener('resize', updateSize);
		};
	}, [backgroundMode, resolvedWidth, resolvedHeight]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const activeW = Math.max(32, backgroundMode ? measuredSize.w : resolvedWidth);
		const activeH = Math.max(32, backgroundMode ? measuredSize.h : resolvedHeight);
		const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
		const dpr = backgroundMode ? Math.min(rawDpr, 1.35) : Math.max(Math.min(rawDpr, 2.5), activeW < 240 ? 2.25 : 2);
		canvas.width = Math.round(activeW * dpr);
		canvas.height = Math.round(activeH * dpr);

		const compiledFull = FULL_LOGO_PATHS.map((item) => ({ tx: item.tx, ty: item.ty, path: new Path2D(item.d) }));
		const compiledIcon = ICON_LOGO_PATHS.map((item) => ({ tx: item.tx, ty: item.ty, path: new Path2D(item.d) }));

		const initialVar = variantRef.current;
		const defaultAspect = initialVar === 'full' ? (FULL_LOGO_BOUNDS.maxX - FULL_LOGO_BOUNDS.minX) / (FULL_LOGO_BOUNDS.maxY - FULL_LOGO_BOUNDS.minY) : 1.38;
		const isCompactBanner = backgroundMode && activeH < 360;
		const gridCols =
			cols ??
			(backgroundMode
				? isCompactBanner
					? Math.max(32, Math.min(72, Math.round(activeW / 13)))
					: Math.max(48, Math.min(88, Math.round(activeW / 18)))
				: initialVar === 'full'
					? 96
					: activeW <= 96
						? 28
						: 50);
		const gridRows = backgroundMode ? Math.max(isCompactBanner ? 11 : 28, Math.round(gridCols * (activeH / activeW))) : Math.max(12, Math.round(gridCols / defaultAspect));
		const padX = backgroundMode ? 0 : activeW * 0.04;
		const padY = backgroundMode ? 0 : activeH * 0.04;
		const drawW = activeW - padX * 2;
		const drawH = activeH - padY * 2;
		const cellStepX = drawW / gridCols;
		const cellStepY = drawH / gridRows;

		const computeCoverageForVariant = (targetVar: DotLogoVariant, homeX: number, homeY: number, time = 0): number =>
			computeDotCoverage({ ctx, targetVar, homeX, homeY, activeW, activeH, drawW, drawH, padX, padY, cellStepX, cellStepY, backgroundMode, compiledFull, compiledIcon, time });

		const dots: DotParticle[] = [];
		for (let r = 0; r < gridRows; r++) {
			for (let c = 0; c < gridCols; c++) {
				const u = (c + 0.5) / gridCols;
				const v = (r + 0.5) / gridRows;
				const homeX = padX + u * drawW;
				const homeY = padY + v * drawH;
				const nx = (u - 0.5) * 2;
				const ny = (v - 0.5) * 2;
				const distCenter = Math.hypot(nx, ny);
				const cov = computeCoverageForVariant(initialVar, homeX, homeY);
				const isLogo = cov > 0.26;
				if (!isLogo && !showAmbientField) continue;
				if (!isLogo && !backgroundMode && distCenter > 1.06) continue;
				const angle = Math.atan2(ny, nx);
				const scatter = reducedMotion ? 0 : (backgroundMode ? 24 : 14) + distCenter * (backgroundMode ? 32 : 20);
				dots.push({
					homeX,
					homeY,
					x: homeX + Math.cos(angle) * scatter,
					y: homeY + Math.sin(angle) * scatter + (reducedMotion ? 0 : 10),
					vx: 0,
					vy: 0,
					nx,
					ny,
					distCenter,
					coverage: cov,
					targetCoverage: cov,
					isLogo,
					phase: (c * 0.19 + r * 0.23) % (Math.PI * 2),
				});
			}
		}

		morphShapeRef.current = (nextVariant: DotLogoVariant) => {
			for (let i = 0; i < dots.length; i++) {
				const d = dots[i];
				const nextCov = computeCoverageForVariant(nextVariant, d.homeX, d.homeY);
				const covDelta = nextCov - d.targetCoverage;
				if (Math.abs(covDelta) > 0.05 && !reducedMotion) {
					if (covDelta > 0) {
						d.x += (activeW * 0.5 - d.homeX) * 0.22;
						d.y += (activeH * 0.5 - d.homeY) * 0.22;
						d.vx += -d.ny * 2.6 + d.nx * 1.4;
						d.vy += d.nx * 2.6 + d.ny * 1.4;
					} else {
						d.vx += d.nx * 2.4 - d.ny * 1.2;
						d.vy += d.ny * 2.4 + d.nx * 1.2;
					}
				}
				d.targetCoverage = nextCov;
			}
		};

		const pointer = { x: -9999, y: -9999, active: false };
		const shockwaves: Shockwave[] = [];

		const updatePointerFromClient = (clientX: number, clientY: number) => {
			if (blankRef.current) {
				pointer.active = false;
				return;
			}
			const rect = canvas.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			const localX = ((clientX - rect.left) / rect.width) * activeW;
			const localY = ((clientY - rect.top) / rect.height) * activeH;
			if (localX >= -40 && localX <= activeW + 40 && localY >= -40 && localY <= activeH + 40) {
				pointer.x = localX;
				pointer.y = localY;
				pointer.active = true;
				startOrWakeLoop();
			} else {
				pointer.active = false;
			}
		};

		const handlePointerMove = (e: PointerEvent) => updatePointerFromClient(e.clientX, e.clientY);
		const handlePointerLeave = () => {
			pointer.active = false;
		};
		const handleClick = (e: MouseEvent) => {
			if (blankRef.current) return;
			const rect = canvas.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			const cx = ((e.clientX - rect.left) / rect.width) * activeW;
			const cy = ((e.clientY - rect.top) / rect.height) * activeH;
			if (cx < 0 || cx > activeW || cy < 0 || cy > activeH) return;
			shockwaves.push({ x: cx, y: cy, birth: performance.now() });
			if (shockwaves.length > 4) shockwaves.shift();
			startOrWakeLoop();
		};

		const eventTarget: Window | HTMLCanvasElement = backgroundMode && typeof window !== 'undefined' ? window : canvas;
		eventTarget.addEventListener('pointermove', handlePointerMove as EventListener);
		eventTarget.addEventListener('click', handleClick as EventListener);
		if (!backgroundMode) canvas.addEventListener('pointerleave', handlePointerLeave);

		let accentRgb: [number, number, number] = [139, 124, 246];
		let dangerRgb: [number, number, number] = [255, 51, 51];
		let textRgb: [number, number, number] = resolvedTheme === 'light' ? [9, 9, 11] : [250, 250, 250];
		let mutedRgb: [number, number, number] = resolvedTheme === 'light' ? [82, 82, 91] : [161, 161, 170];

		const syncThemeColors = () => {
			if (typeof document === 'undefined') return;
			const styles = getComputedStyle(document.documentElement);
			accentRgb = parseCssColor(styles.getPropertyValue('--accent'), [139, 124, 246]);
			dangerRgb = parseCssColor(styles.getPropertyValue('--accent-red'), [255, 51, 51]);
			textRgb = parseCssColor(styles.getPropertyValue('--text'), resolvedTheme === 'light' ? [9, 9, 11] : [250, 250, 250]);
			mutedRgb = parseCssColor(styles.getPropertyValue('--text-muted'), resolvedTheme === 'light' ? [82, 82, 91] : [161, 161, 170]);
		};
		syncThemeColors();

		const isBannerVivid = vivid || (backgroundMode && activeH < 360);
		const cellRadiusBase = Math.min(cellStepX, cellStepY) * (isBannerVivid ? 0.38 : backgroundMode ? 0.33 : 0.37);
		const repelRadius = backgroundMode ? Math.max(isBannerVivid ? 64 : 95, Math.min(activeW, activeH) * (isBannerVivid ? 0.42 : 0.16)) : Math.max(36, Math.min(activeW, activeH) * 0.32);

		let rafId = 0;
		let isRunning = false;
		let lastColorSync = performance.now();
		let lastFrameTime = performance.now();
		let procTime = 0;
		let rippleBlend = rippleRef.current ? 1 : 0;
		let visibilityBlend = blankRef.current ? 0 : 1;
		let subduedBlend = subduedRef.current ? 1 : 0;

		const renderFrame = (now: number) => {
			isRunning = false;
			if (typeof document !== 'undefined' && document.hidden) {
				return;
			}
			if (backgroundMode && !pointer.active && shockwaves.length === 0 && now - lastFrameTime < 30) {
				isRunning = true;
				rafId = requestAnimationFrame(renderFrame);
				return;
			}
			const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) * 0.001));
			lastFrameTime = now;
			if (now - lastColorSync > 2000) {
				syncThemeColors();
				lastColorSync = now;
			}

			const targetRipple = rippleRef.current && !reducedMotion ? 1 : 0;
			const targetVisibility = blankRef.current ? 0 : 1;
			const targetSubdued = subduedRef.current ? 1 : 0;

			rippleBlend += (targetRipple - rippleBlend) * 0.06;
			visibilityBlend += (targetVisibility - visibilityBlend) * 0.09;
			subduedBlend += (targetSubdued - subduedBlend) * 0.07;
			procTime += dt * rippleBlend;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, activeW, activeH);

			if (blankRef.current && visibilityBlend < 0.005) {
				visibilityBlend = 0;
				return;
			}

			const t = now * 0.001;
			const activeVar = variantRef.current;
			const isDangerVar = activeVar === 'error' || activeVar === 'lock' || activeVar === '404';
			const activeHighlightRgb = isDangerVar ? dangerRgb : accentRgb;
			const liveProcedural = isAnimatedProceduralVariant(activeVar) && rippleBlend > 0.005 && !reducedMotion;
			const covLerp = liveProcedural ? 0.24 : 0.075;
			let maxMotionEnergy = 0;

			for (let i = shockwaves.length - 1; i >= 0; i--) {
				if (now - shockwaves[i].birth > 1500) {
					shockwaves.splice(i, 1);
				}
			}

			for (let i = 0; i < dots.length; i++) {
				const d = dots[i];
				if (liveProcedural) {
					d.targetCoverage = computeCoverageForVariant(activeVar, d.homeX, d.homeY, procTime);
				}
				const covDiff = Math.abs(d.targetCoverage - d.coverage);
				if (covDiff > maxMotionEnergy) maxMotionEnergy = covDiff;
				d.coverage += (d.targetCoverage - d.coverage) * covLerp;
				d.isLogo = d.coverage > 0.28;
				const logoBlend = Math.max(0, Math.min(1, (d.coverage - 0.22) / 0.52));

				const waveDiag = activeVar === 'helix' ? Math.sin(d.nx * 5.8 - procTime * 4.2 + d.ny * 1.5) : Math.sin(d.nx * 5.2 - d.ny * 3.8 - t * 3.4);
				const waveRadial =
					activeVar === 'vortex' || activeVar === 'orbit' ? Math.cos(d.distCenter * 7.2 - Math.atan2(d.ny, d.nx) * 2 - procTime * 3.6) : Math.cos(d.distCenter * 6.4 - t * 2.8);
				const waveCombined = waveDiag * 0.65 + waveRadial * 0.35;
				const rawWaveNorm = Math.pow((waveCombined + 1) * 0.5, 1.5);
				const waveNorm = rawWaveNorm * rippleBlend;

				const floatScale = (backgroundMode ? 2.8 : activeW <= 96 ? 0.85 : 1.9) * rippleBlend;
				const floatAmpX = 0.85 + logoBlend * 0.95;
				const floatAmpY = 1.25 + logoBlend * 1.65;
				const helixLift = activeVar === 'helix' ? Math.sin(d.nx * 4.4 - procTime * 2.8) * 1.8 * logoBlend * floatScale : 0;
				const floatX = reducedMotion || rippleBlend < 0.002 ? 0 : Math.cos(d.nx * 4.5 - d.ny * 2.5 - t * 3.1 + d.phase * 0.25) * floatAmpX * floatScale;
				const floatY = reducedMotion || rippleBlend < 0.002 ? 0 : Math.sin(d.nx * 4.8 - d.ny * 3.0 - t * 3.4 + d.phase * 0.25) * floatAmpY * floatScale + helixLift;

				const disperseOffset = (1 - visibilityBlend) * (18 + d.distCenter * 24);
				const targetX = d.homeX + floatX + d.nx * disperseOffset;
				const targetY = d.homeY + floatY + d.ny * disperseOffset;

				let cursorBoost = 0;
				if (pointer.active && !reducedMotion && visibilityBlend > 0.1) {
					const dx = d.x - pointer.x;
					const dy = d.y - pointer.y;
					const dist = Math.hypot(dx, dy);
					if (dist < repelRadius && dist > 0.001) {
						const influence = Math.pow(1 - dist / repelRadius, 2);
						const push = influence * (backgroundMode ? 3.1 : 2.2);
						d.vx += (dx / dist) * push + (-dy / dist) * influence * 0.48;
						d.vy += (dy / dist) * push + (dx / dist) * influence * 0.48;
						cursorBoost = influence;
					}
				}

				let shockBoost = 0;
				if (!reducedMotion && shockwaves.length > 0 && visibilityBlend > 0.1) {
					for (let s = 0; s < shockwaves.length; s++) {
						const sw = shockwaves[s];
						const age = (now - sw.birth) * 0.001;
						const ringRadius = age * Math.max(activeW, activeH) * 0.85;
						const ringThickness = backgroundMode ? 42 : 26;
						const dx = d.homeX - sw.x;
						const dy = d.homeY - sw.y;
						const dist = Math.hypot(dx, dy);
						const delta = Math.abs(dist - ringRadius);
						if (delta < ringThickness && dist > 0.001) {
							const fade = Math.max(0, 1 - age / 1.5);
							const pulse = (1 - delta / ringThickness) * fade;
							d.vx += (dx / dist) * pulse * 2.5;
							d.vy += (dy / dist) * pulse * 2.5;
							shockBoost = Math.max(shockBoost, pulse);
						}
					}
				}

				if (reducedMotion) {
					d.x = d.homeX;
					d.y = d.homeY;
				} else {
					d.vx += (targetX - d.x) * 0.11;
					d.vy += (targetY - d.y) * 0.11;
					d.vx *= 0.8;
					d.vy *= 0.8;
					d.x += d.vx;
					d.y += d.vy;
					const speed = Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(targetX - d.x) * 0.1 + Math.abs(targetY - d.y) * 0.1;
					if (speed > maxMotionEnergy) maxMotionEnergy = speed;
				}

				// Continuous interpolation between ambient lattice dot and active matrix dot
				const restingScale = 0.62 + (1 - rippleBlend) * 0.32;
				const logoScaleFactor = reducedMotion ? 1 : restingScale + waveNorm * 0.68 + cursorBoost * 0.5 + shockBoost * 0.58;
				const logoRadius = Math.max(0.65, cellRadiusBase * d.coverage * logoScaleFactor);

				const activeEnergy = Math.max(cursorBoost, shockBoost, waveNorm * 0.35);
				const ambientRadius = Math.max(0.5, cellRadiusBase * (0.28 + activeEnergy * 0.38));
				const radius = ambientRadius + (logoRadius - ambientRadius) * logoBlend;

				const staticAccentTint = (1 - rippleBlend) * 0.28;
				const logoAccentMix = Math.min(1, (reducedMotion ? 0.45 : staticAccentTint + waveNorm * 0.92) + cursorBoost * 0.95 + shockBoost * 0.98);
				const ambientAccentMix = Math.min(1, cursorBoost * 0.92 + shockBoost * 0.92 + waveNorm * 0.48);

				const baseR = mutedRgb[0] + (textRgb[0] - mutedRgb[0]) * logoBlend;
				const baseG = mutedRgb[1] + (textRgb[1] - mutedRgb[1]) * logoBlend;
				const baseB = mutedRgb[2] + (textRgb[2] - mutedRgb[2]) * logoBlend;
				const accentMix = ambientAccentMix + (logoAccentMix - ambientAccentMix) * logoBlend;

				const rCol = Math.round(baseR + (activeHighlightRgb[0] - baseR) * accentMix);
				const gCol = Math.round(baseG + (activeHighlightRgb[1] - baseG) * accentMix);
				const bCol = Math.round(baseB + (activeHighlightRgb[2] - baseB) * accentMix);

				const loadingBaseAlpha = isBannerVivid ? 0.76 : 0.52;
				const subduedBaseAlpha = 0.38;
				const logoBaseAlpha = loadingBaseAlpha + (subduedBaseAlpha - loadingBaseAlpha) * subduedBlend;
				const logoRawAlpha = Math.min(1, logoBaseAlpha + waveNorm * 0.48 + cursorBoost * 0.52 + shockBoost * 0.48);
				const ambientRawAlpha = (isBannerVivid ? 0.16 : backgroundMode ? 0.08 : 0.11) + activeEnergy * 0.34;

				const rawAlpha = ambientRawAlpha + (logoRawAlpha - ambientRawAlpha) * logoBlend;
				const alpha = rawAlpha * visibilityBlend;

				if (alpha > 0.005) {
					ctx.beginPath();
					ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha.toFixed(3)})`;
					ctx.fill();
				}
			}

			const needsMoreFrames =
				(!reducedMotion && (targetRipple > 0 || rippleBlend > 0.004 || pointer.active || shockwaves.length > 0 || maxMotionEnergy > 0.04)) ||
				Math.abs(targetVisibility - visibilityBlend) > 0.01 ||
				Math.abs(targetSubdued - subduedBlend) > 0.01;

			if (needsMoreFrames) {
				isRunning = true;
				rafId = requestAnimationFrame(renderFrame);
			}
		};

		const startOrWakeLoop = () => {
			if (!isRunning && (typeof document === 'undefined' || !document.hidden)) {
				lastFrameTime = performance.now();
				isRunning = true;
				rafId = requestAnimationFrame(renderFrame);
			}
		};

		const handleVisibilityChange = () => {
			if (typeof document !== 'undefined' && !document.hidden) {
				startOrWakeLoop();
			}
		};
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}

		wakeLoopRef.current = startOrWakeLoop;
		startOrWakeLoop();

		return () => {
			wakeLoopRef.current = null;
			morphShapeRef.current = null;
			cancelAnimationFrame(rafId);
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
			}
			eventTarget.removeEventListener('pointermove', handlePointerMove as EventListener);
			eventTarget.removeEventListener('click', handleClick as EventListener);
			if (!backgroundMode) {
				canvas.removeEventListener('pointerleave', handlePointerLeave);
			}
		};
	}, [cols, measuredSize.w, measuredSize.h, resolvedTheme, reducedMotion, showAmbientField, backgroundMode]);

	return (
		<div ref={containerRef} className={`relative flex items-center justify-center select-none ${backgroundMode ? 'w-full h-full' : ''} ${className}`}>
			<canvas
				ref={canvasRef}
				style={backgroundMode ? { width: '100%', height: '100%' } : { aspectRatio: `${resolvedWidth} / ${resolvedHeight}` }}
				className={`block ${backgroundMode ? 'w-full h-full pointer-events-none' : 'w-full h-auto cursor-pointer touch-none'}`}
				aria-hidden="true"
			/>
		</div>
	);
}
