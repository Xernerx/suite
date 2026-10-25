/** @format */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@xernerx/providers';
import { beginDotRearrangeMorph, createDotMorphBuffer } from './dotLogoMorph';
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
	const resolvedThemeRef = useRef(resolvedTheme);
	const rippleRef = useRef(ripple);
	const blankRef = useRef(blank);
	const subduedRef = useRef(subdued);
	const hasEnteredRef = useRef(false);
	const constructStartRef = useRef(0);
	const constructPulseRef = useRef(false);
	const wakeLoopRef = useRef<(() => void) | null>(null);
	const colorSyncRef = useRef<(() => void) | null>(null);
	const morphShapeRef = useRef<((nextVariant: DotLogoVariant) => void) | null>(null);

	useEffect(() => {
		resolvedThemeRef.current = resolvedTheme;
		colorSyncRef.current?.();
		wakeLoopRef.current?.();
	}, [resolvedTheme]);

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

	const [measuredSize, setMeasuredSize] = useState<{ w: number; h: number }>(() => (backgroundMode ? { w: 0, h: 0 } : { w: resolvedWidth, h: resolvedHeight }));

	useEffect(() => {
		if (!backgroundMode) {
			setMeasuredSize({ w: resolvedWidth, h: resolvedHeight });
			return;
		}
		const commitSize = (nextW: number, nextH: number) => {
			setMeasuredSize((prev) => {
				if (prev.w > 0 && prev.h > 0 && Math.abs(prev.w - nextW) <= 24 && Math.abs(prev.h - nextH) <= 24) return prev;
				return { w: nextW, h: nextH };
			});
		};
		const updateSize = () => {
			const rect = containerRef.current?.getBoundingClientRect();
			if (rect && rect.width > 0 && rect.height > 0) {
				commitSize(Math.round(rect.width), Math.round(rect.height));
				return;
			}
			if (typeof window !== 'undefined') commitSize(window.innerWidth, window.innerHeight);
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
		if (backgroundMode && (measuredSize.w === 0 || measuredSize.h === 0)) return;
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;

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
				if ((!isLogo && !showAmbientField) || (!isLogo && !backgroundMode && distCenter > 1.06)) continue;
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
		let textRgb: [number, number, number] = resolvedThemeRef.current === 'light' ? [9, 9, 11] : [250, 250, 250];
		let mutedRgb: [number, number, number] = resolvedThemeRef.current === 'light' ? [82, 82, 91] : [161, 161, 170];
		const syncThemeColors = () => {
			if (typeof document === 'undefined') return;
			const isLight = resolvedThemeRef.current === 'light';
			const styles = getComputedStyle(document.documentElement);
			accentRgb = parseCssColor(styles.getPropertyValue('--accent'), [139, 124, 246]);
			dangerRgb = parseCssColor(styles.getPropertyValue('--accent-red'), [255, 51, 51]);
			textRgb = parseCssColor(styles.getPropertyValue('--text'), isLight ? [9, 9, 11] : [250, 250, 250]);
			mutedRgb = parseCssColor(styles.getPropertyValue('--text-muted'), isLight ? [82, 82, 91] : [161, 161, 170]);
		};
		syncThemeColors();
		colorSyncRef.current = syncThemeColors;

		const isBannerVivid = vivid || (backgroundMode && activeH < 360);
		const cellRadiusBase = Math.min(cellStepX, cellStepY) * (isBannerVivid ? 0.38 : backgroundMode ? 0.33 : 0.37);
		const repelRadius = backgroundMode ? Math.max(isBannerVivid ? 64 : 95, Math.min(activeW, activeH) * (isBannerVivid ? 0.42 : 0.16)) : Math.max(36, Math.min(activeW, activeH) * 0.32);

		let rafId = 0;
		let isRunning = false;
		let morphStartAt = 0;
		const morphDuration = 1.95;
		const constructDuration = 3.4;
		let lastColorSync = performance.now();
		let lastFrameTime = performance.now();
		let procTime = 0;
		let rippleBlend = rippleRef.current ? 1 : 0;
		let visibilityBlend = blankRef.current ? 0 : 1;
		let subduedBlend = subduedRef.current ? 1 : 0;
		const morphBuf = createDotMorphBuffer(dots.length);

		morphShapeRef.current = (nextVariant: DotLogoVariant) => {
			morphStartAt = beginDotRearrangeMorph({
				buf: morphBuf,
				dots,
				nextVariant,
				computeCoverage: computeCoverageForVariant,
				procTime,
				reducedMotion,
			});
		};

		const initConstructDots = () => {
			visibilityBlend = 1;
			for (let i = 0; i < dots.length; i++) {
				Object.assign(dots[i], { coverage: 0.22, x: dots[i].homeX, y: dots[i].homeY, vx: 0, vy: 0 });
			}
		};
		if (constructStartRef.current > 0) initConstructDots();

		const renderFrame = (now: number) => {
			isRunning = false;
			if (typeof document !== 'undefined' && document.hidden) return;
			const constructAge = constructStartRef.current > 0 ? (now - constructStartRef.current) * 0.001 : 99;
			const isConstructing = constructStartRef.current > 0 && constructAge < constructDuration;
			const morphAge = morphStartAt > 0 ? (now - morphStartAt) * 0.001 : 99;
			const isMorphing = morphStartAt > 0 && morphAge < morphDuration;
			if (morphStartAt > 0 && !isMorphing) {
				morphStartAt = 0;
				for (let i = 0; i < dots.length; i++) {
					if (morphBuf.active[i] === 2) {
						morphBuf.active[i] = 0;
						dots[i].coverage = dots[i].targetCoverage;
						dots[i].x = dots[i].homeX;
						dots[i].y = dots[i].homeY;
					} else {
						morphBuf.active[i] = 0;
					}
				}
			}
			if (constructStartRef.current > 0 && constructAge >= 2.85 && !constructPulseRef.current) {
				constructPulseRef.current = true;
				shockwaves.push({ x: activeW * 0.5, y: activeH * 0.28, birth: now });
			}
			if (constructStartRef.current > 0 && !isConstructing) {
				constructStartRef.current = 0;
				if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('xernerx:construct-complete'));
			}
			if (backgroundMode && !isConstructing && !isMorphing && !pointer.active && shockwaves.length === 0 && now - lastFrameTime < 30) {
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
			const targetRipple = (rippleRef.current || isMorphing) && !reducedMotion ? 1 : 0;
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
			const constructFloatBlend = isConstructing ? Math.max(0, Math.min(1, (constructAge - 2.6) / 0.8)) : 1;
			let maxMotionEnergy = 0;
			for (let i = shockwaves.length - 1; i >= 0; i--) {
				if (now - shockwaves[i].birth > 1500) shockwaves.splice(i, 1);
			}
			for (let i = 0; i < dots.length; i++) {
				const d = dots[i];
				let gridScale = 1;
				let constructGlint = 0;
				if (isConstructing) {
					const gridDelay = d.distCenter * 0.42 + (d.ny + 1) * 0.5 * 0.16;
					const gridProg = Math.max(0, Math.min(1, (constructAge - gridDelay) / 0.36));
					if (gridProg <= 0.001) continue;
					gridScale = 1 - Math.pow(1 - gridProg, 3);
					if (gridProg < 1) constructGlint = Math.sin(gridProg * Math.PI) * 0.55;
					if (d.targetCoverage > 0.28) {
						const logoDelay = 0.75 + ((d.nx + 0.86) / 1.72) * 1.65 + Math.abs(d.ny + 0.35) * 0.14;
						const logoProg = Math.max(0, Math.min(1, (constructAge - logoDelay) / 0.44));
						const logoEase = 1 - Math.pow(1 - logoProg, 3);
						d.coverage = 0.22 + (d.targetCoverage - 0.22) * logoEase;
						if (logoProg > 0.01 && logoProg < 0.99) {
							const flare = Math.sin(logoProg * Math.PI);
							constructGlint = Math.max(constructGlint, flare * 0.96);
							gridScale *= 1 + flare * 0.32;
						}
					} else {
						d.coverage = d.targetCoverage;
					}
				} else if (isMorphing && morphBuf.active[i] !== 0) {
					const mMode = morphBuf.active[i];
					const p = Math.max(0, Math.min(1, (morphAge - morphBuf.delay[i]) / (morphDuration - 0.3)));
					const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
					if (mMode === 1) {
						if (liveProcedural && p > 0.72) d.targetCoverage = computeCoverageForVariant(activeVar, d.homeX, d.homeY, procTime);
						d.coverage = morphBuf.fromCov[i] + (d.targetCoverage - morphBuf.fromCov[i]) * ease;
						constructGlint = Math.sin(p * Math.PI) * 0.52;
					} else {
						d.coverage = morphBuf.fromCov[i] * (1 - ease * 0.72);
						constructGlint = Math.sin(p * Math.PI) * 0.42;
					}
					maxMotionEnergy = 1;
				} else {
					if (liveProcedural) d.targetCoverage = computeCoverageForVariant(activeVar, d.homeX, d.homeY, procTime);
					const covDiff = Math.abs(d.targetCoverage - d.coverage);
					if (covDiff > maxMotionEnergy) maxMotionEnergy = covDiff;
					d.coverage += (d.targetCoverage - d.coverage) * covLerp;
				}
				d.isLogo = d.coverage > 0.28;
				const logoBlend = Math.max(0, Math.min(1, (d.coverage - 0.22) / 0.52));
				const waveDiag = activeVar === 'helix' ? Math.sin(d.nx * 5.8 - procTime * 4.2 + d.ny * 1.5) : Math.sin(d.nx * 5.2 - d.ny * 3.8 - t * 3.4);
				const waveRadial =
					activeVar === 'vortex' || activeVar === 'orbit' || activeVar === 'chronos'
						? Math.cos(d.distCenter * 7.2 - Math.atan2(d.ny, d.nx) * 2 - procTime * 3.6)
						: Math.cos(d.distCenter * 6.4 - t * 2.8);
				const rawWave = Math.pow((waveDiag * 0.65 + waveRadial * 0.35 + 1) * 0.5, 1.5) * rippleBlend;
				const waveNorm = isConstructing ? rawWave * (0.3 + 0.7 * constructFloatBlend) + (1 - constructFloatBlend) * 0.45 : rawWave;
				const floatScale = (backgroundMode ? 2.8 : activeW <= 96 ? 0.85 : 1.9) * rippleBlend * constructFloatBlend;
				const floatAmpX = 0.85 + logoBlend * 0.95;
				const floatAmpY = 1.25 + logoBlend * 1.65;
				const helixLift = activeVar === 'helix' ? Math.sin(d.nx * 4.4 - procTime * 2.8) * 1.8 * logoBlend * floatScale : 0;
				const floatX = reducedMotion || floatScale < 0.002 ? 0 : Math.cos(d.nx * 4.5 - d.ny * 2.5 - t * 3.1 + d.phase * 0.25) * floatAmpX * floatScale;
				const floatY = reducedMotion || floatScale < 0.002 ? 0 : Math.sin(d.nx * 4.8 - d.ny * 3.0 - t * 3.4 + d.phase * 0.25) * floatAmpY * floatScale + helixLift;
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
				let shockBoost = constructGlint;
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
							const pulse = (1 - delta / ringThickness) * Math.max(0, 1 - age / 1.5);
							d.vx += (dx / dist) * pulse * 2.5;
							d.vy += (dy / dist) * pulse * 2.5;
							shockBoost = Math.max(shockBoost, pulse);
						}
					}
				}
				if (reducedMotion) {
					d.x = d.homeX;
					d.y = d.homeY;
				} else if (isMorphing && morphBuf.active[i] !== 0) {
					const mMode = morphBuf.active[i];
					const p = Math.max(0, Math.min(1, (morphAge - morphBuf.delay[i]) / (morphDuration - 0.3)));
					const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
					const destX = mMode === 1 ? targetX : morphBuf.toX[i] + floatX;
					const destY = mMode === 1 ? targetY : morphBuf.toY[i] + floatY;
					const dx = destX - morphBuf.fromX[i];
					const dy = destY - morphBuf.fromY[i];
					const dist = Math.hypot(dx, dy);
					const arcAmp = Math.sin(p * Math.PI) * Math.min(Math.abs(morphBuf.arc[i]), dist * 0.32) * (morphBuf.arc[i] >= 0 ? 1 : -1);
					const px = dist > 1 ? -dy / dist : 0;
					const py = dist > 1 ? dx / dist : 0;
					d.x = morphBuf.fromX[i] + dx * ease + px * arcAmp;
					d.y = morphBuf.fromY[i] + dy * ease + py * arcAmp;
					d.vx = 0;
					d.vy = 0;
				} else {
					d.vx = (d.vx + (targetX - d.x) * 0.11) * 0.8;
					d.vy = (d.vy + (targetY - d.y) * 0.11) * 0.8;
					d.x += d.vx;
					d.y += d.vy;
					const speed = Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(targetX - d.x) * 0.1 + Math.abs(targetY - d.y) * 0.1;
					if (speed > maxMotionEnergy) maxMotionEnergy = speed;
				}
				const restingScale = 0.62 + (1 - rippleBlend) * 0.32;
				const logoScaleFactor = reducedMotion ? 1 : restingScale + waveNorm * 0.68 + cursorBoost * 0.5 + shockBoost * 0.58;
				const logoRadius = Math.max(0.65, cellRadiusBase * d.coverage * logoScaleFactor);
				const activeEnergy = Math.max(cursorBoost, shockBoost, waveNorm * 0.35);
				const ambientRadius = Math.max(0.5, cellRadiusBase * (0.28 + activeEnergy * 0.38));
				const radius = (ambientRadius + (logoRadius - ambientRadius) * logoBlend) * gridScale;
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
				const logoBaseAlpha = loadingBaseAlpha + (0.38 - loadingBaseAlpha) * subduedBlend;
				const logoRawAlpha = Math.min(1, logoBaseAlpha + waveNorm * 0.48 + cursorBoost * 0.52 + shockBoost * 0.48);
				const ambientRawAlpha = (isBannerVivid ? 0.16 : backgroundMode ? 0.08 : 0.11) + activeEnergy * 0.34;
				if (isMorphing && morphBuf.active[i] !== 0 && showAmbientField) {
					const ambAlpha = (isBannerVivid ? 0.16 : backgroundMode ? 0.08 : 0.11) * visibilityBlend;
					if (ambAlpha > 0.005) {
						ctx.beginPath();
						ctx.arc(targetX, targetY, Math.max(0.5, cellRadiusBase * 0.28), 0, Math.PI * 2);
						ctx.fillStyle = `rgba(${mutedRgb[0]}, ${mutedRgb[1]}, ${mutedRgb[2]}, ${ambAlpha.toFixed(3)})`;
						ctx.fill();
					}
				}
				const morphFade = isMorphing && morphBuf.active[i] === 2 ? Math.max(0, 1 - Math.max(0, (morphAge - morphBuf.delay[i]) / (morphDuration - 0.3) - 0.55) / 0.45) : 1;
				const alpha = (ambientRawAlpha + (logoRawAlpha - ambientRawAlpha) * logoBlend) * visibilityBlend * gridScale * morphFade;
				if (alpha > 0.005 && radius > 0.15) {
					ctx.beginPath();
					ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha.toFixed(3)})`;
					ctx.fill();
				}
			}

			const needsMoreFrames =
				isConstructing ||
				isMorphing ||
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

		const beginMatrixConstruct = () => {
			if (!backgroundMode || reducedMotion) {
				if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('xernerx:construct-complete'));
				return;
			}
			constructStartRef.current = performance.now();
			constructPulseRef.current = false;
			initConstructDots();
			startOrWakeLoop();
		};
		if (backgroundMode && typeof window !== 'undefined' && (window as any).__xernerxConstructPending && !hasEnteredRef.current) {
			hasEnteredRef.current = true;
			(window as any).__xernerxConstructPending = false;
			beginMatrixConstruct();
		}
		const onConstructEvent = () => {
			if (!backgroundMode || hasEnteredRef.current) return;
			hasEnteredRef.current = true;
			beginMatrixConstruct();
		};
		if (backgroundMode && typeof window !== 'undefined') window.addEventListener('xernerx:construct-logo', onConstructEvent);

		const handleVisibilityChange = () => {
			if (typeof document !== 'undefined' && !document.hidden) startOrWakeLoop();
		};
		if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibilityChange);

		wakeLoopRef.current = startOrWakeLoop;
		startOrWakeLoop();

		return () => {
			wakeLoopRef.current = null;
			colorSyncRef.current = null;
			morphShapeRef.current = null;
			cancelAnimationFrame(rafId);
			if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (backgroundMode && typeof window !== 'undefined') window.removeEventListener('xernerx:construct-logo', onConstructEvent);
			eventTarget.removeEventListener('pointermove', handlePointerMove as EventListener);
			eventTarget.removeEventListener('click', handleClick as EventListener);
			if (!backgroundMode) canvas.removeEventListener('pointerleave', handlePointerLeave);
		};
	}, [cols, measuredSize.w, measuredSize.h, reducedMotion, showAmbientField, backgroundMode]);

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
