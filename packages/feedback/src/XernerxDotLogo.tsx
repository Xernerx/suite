/** @format */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@xernerx/providers';
import { beginDotRearrangeMorph, createDotMorphBuffer } from './dotLogoMorph';
import {
	computeDotCoverage,
	DotLogoVariant,
	DotMatrixRenderStyle,
	DotParticle,
	FULL_LOGO_BOUNDS,
	FULL_LOGO_PATHS,
	ICON_LOGO_PATHS,
	isAnimatedProceduralVariant,
	parseCssColor,
	Shockwave,
} from './dotLogoPaths';
import { drawRenderStyleBackdrop, drawStyledParticle } from './dotLogoRenderStyles';

export interface XernerxDotLogoProps {
	variant?: DotLogoVariant;
	renderStyle?: DotMatrixRenderStyle;
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
	renderStyle = 'dots',
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
	const renderStyleRef = useRef<DotMatrixRenderStyle>(renderStyle);
	const resolvedThemeRef = useRef(resolvedTheme);
	const rippleRef = useRef(ripple);
	const blankRef = useRef(blank);
	const subduedRef = useRef(subdued);
	const vividRef = useRef(vivid);
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
		vividRef.current = vivid;
		renderStyleRef.current = renderStyle;
		wakeLoopRef.current?.();
	}, [ripple, blank, subdued, vivid, renderStyle]);

	useEffect(() => {
		if (!backgroundMode || typeof window === 'undefined') return;
		const onEarlyConstruct = () => {
			hasEnteredRef.current = true;
			constructStartRef.current = performance.now();
			constructPulseRef.current = false;
		};
		window.addEventListener('xernerx:construct-logo', onEarlyConstruct);
		return () => window.removeEventListener('xernerx:construct-logo', onEarlyConstruct);
	}, [backgroundMode]);

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

		const isBannerVivid = vividRef.current || (backgroundMode && activeH < 360);
		const cellRadiusBase = Math.min(cellStepX, cellStepY) * (isBannerVivid ? 0.38 : backgroundMode ? 0.33 : 0.37);
		const repelRadius = backgroundMode ? Math.max(isBannerVivid ? 64 : 95, Math.min(activeW, activeH) * (isBannerVivid ? 0.42 : 0.16)) : Math.max(36, Math.min(activeW, activeH) * 0.32);

		let rafId = 0;
		let isRunning = false;
		let morphStartAt = 0;
		const morphDuration = 2.15;
		const constructDuration = 2.85;
		let lastColorSync = performance.now();
		let lastFrameTime = performance.now();
		let procTime = 0;
		let rippleBlend = rippleRef.current ? 1 : 0;
		let visibilityBlend = blankRef.current ? 0 : 1;
		let subduedBlend = subduedRef.current ? 1 : 0;
		let vividBlend = vividRef.current || (backgroundMode && activeH < 360) ? 1 : 0;
		let styleBlend = renderStyleRef.current === 'dots' ? 0 : 1;
		let nonDotDissolve = renderStyleRef.current !== 'dots' && initialVar !== 'full' ? 1 : 0;
		let activeStyle: DotMatrixRenderStyle = renderStyleRef.current;
		const morphBuf = createDotMorphBuffer(dots.length);

		morphShapeRef.current = (nextVariant: DotLogoVariant) => {
			if (constructStartRef.current > 0) {
				if (performance.now() - constructStartRef.current < 1000) {
					for (let i = 0; i < dots.length; i++) {
						dots[i].targetCoverage = computeCoverageForVariant(nextVariant, dots[i].homeX, dots[i].homeY, procTime);
					}
					return;
				}
				constructStartRef.current = 0;
				for (let i = 0; i < dots.length; i++) {
					dots[i].coverage = dots[i].targetCoverage;
					dots[i].x = dots[i].homeX;
					dots[i].y = dots[i].homeY;
				}
			}
			if (morphStartAt > 0) {
				for (let i = 0; i < dots.length; i++) {
					if (morphBuf.active[i] === 2) {
						morphBuf.active[i] = 0;
						dots[i].coverage = dots[i].targetCoverage;
						dots[i].x = dots[i].homeX;
						dots[i].y = dots[i].homeY;
					} else if (morphBuf.active[i] === 1) {
						morphBuf.active[i] = 0;
						dots[i].coverage = Math.max(dots[i].coverage, dots[i].targetCoverage);
					}
				}
			}
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
			morphStartAt = 0;
			morphBuf.active.fill(0);
			const cx = activeW * 0.5;
			const cy = activeH * 0.46;
			const halfW = activeW * 0.5;
			const halfH = activeH * 0.5;
			const curVar = variantRef.current;
			for (let i = 0; i < dots.length; i++) {
				const d = dots[i];
				const nextCov = computeCoverageForVariant(curVar, d.homeX, d.homeY, procTime);
				const nx = (d.homeX - cx) / halfW;
				const ny = (d.homeY - cy) / halfH;
				const hAng = Math.atan2(ny, nx);
				const startAng = hAng - 4.6;
				Object.assign(d, {
					coverage: 0.22,
					targetCoverage: nextCov,
					x: cx + Math.cos(startAng) * 1.08 * halfW,
					y: cy + Math.sin(startAng) * 1.08 * halfH,
					vx: 0,
					vy: 0,
				});
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
			const targetVivid = vividRef.current || (backgroundMode && activeH < 360) ? 1 : 0;
			if (renderStyleRef.current !== 'dots') activeStyle = renderStyleRef.current;
			const targetStyleBlend = renderStyleRef.current === 'dots' ? 0 : 1;
			const activeVar = variantRef.current;
			const targetNonDotDissolve = renderStyleRef.current === 'dots' || isConstructing || activeVar === 'full' ? 0 : 1;
			rippleBlend += (targetRipple - rippleBlend) * 0.06;
			visibilityBlend += (targetVisibility - visibilityBlend) * 0.09;
			subduedBlend += (targetSubdued - subduedBlend) * 0.07;
			vividBlend += (targetVivid - vividBlend) * 0.09;
			styleBlend += (targetStyleBlend - styleBlend) * 0.08;
			nonDotDissolve += (targetNonDotDissolve - nonDotDissolve) * 0.055;
			if (renderStyleRef.current === 'dots' && styleBlend < 0.02) activeStyle = 'dots';
			procTime += dt * (rippleBlend > 0.01 ? rippleBlend : activeStyle !== 'dots' ? 0.65 : 0);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, activeW, activeH);
			if (blankRef.current && visibilityBlend < 0.005) {
				visibilityBlend = 0;
				return;
			}
			const t = now * 0.001;
			const isDangerVar = activeVar === 'error' || activeVar === 'lock' || activeVar === '404';
			const activeHighlightRgb = isDangerVar ? dangerRgb : accentRgb;
			drawRenderStyleBackdrop({
				ctx,
				renderStyle: activeStyle,
				styleBlend,
				nonDotDissolve,
				visibilityBlend,
				dots,
				gridCols,
				cellStepX,
				cellStepY,
				activeW,
				activeH,
				accentRgb: activeHighlightRgb,
				textRgb,
				procTime,
				variant: activeVar,
				pointer,
				shockwaves,
				now,
			});
			const liveProcedural = isAnimatedProceduralVariant(activeVar) && rippleBlend > 0.005 && !reducedMotion;
			const covLerp = liveProcedural ? 0.24 : 0.075;
			const constructFloatBlend = isConstructing ? Math.max(0, Math.min(1, (constructAge - 1.85) / 0.6)) : 1;
			const constructCenterX = activeW * 0.5;
			const constructCenterY = activeH * 0.46;
			const halfW = activeW * 0.5;
			const halfH = activeH * 0.5;
			let maxMotionEnergy = 0;
			for (let i = shockwaves.length - 1; i >= 0; i--) {
				if (now - shockwaves[i].birth > 1500) shockwaves.splice(i, 1);
			}
			for (let i = 0; i < dots.length; i++) {
				const d = dots[i];
				let gridScale = 1;
				let constructGlint = 0;
				let constructX = d.homeX;
				let constructY = d.homeY;
				if (isConstructing) {
					const nx = (d.homeX - constructCenterX) / halfW;
					const ny = (d.homeY - constructCenterY) / halfH;
					const hNormR = Math.hypot(nx, ny);
					const hAng = Math.atan2(ny, nx);
					const armNorm = (((hAng + Math.PI) / (Math.PI * 2)) * 3) % 1;
					const spiralDelay = d.distCenter * 0.24 + armNorm * 0.24;
					const spiralProg = Math.max(0, Math.min(1, (constructAge - spiralDelay) / 1.15));
					if (spiralProg <= 0.001) continue;
					const spiralIn = Math.pow(1 - spiralProg, 1.85);
					const vortexPinch = Math.sin(spiralProg * Math.PI);
					const baseNormR = hNormR + (1.08 - hNormR) * spiralIn;
					const curNormR = (0.12 + hNormR * 0.22) * vortexPinch + baseNormR * (1 - vortexPinch * 0.72);
					const curAng = hAng - spiralIn * (4.6 + (i % 5) * 0.12);
					constructX = constructCenterX + Math.cos(curAng) * curNormR * halfW;
					constructY = constructCenterY + Math.sin(curAng) * curNormR * halfH;
					gridScale = 0.55 + (1 - Math.pow(1 - spiralProg, 3)) * 0.45 + vortexPinch * 0.42;
					if (spiralProg < 1) {
						constructGlint = vortexPinch * 0.88;
					}
					if (d.targetCoverage > 0.28) {
						const iconNorm = (hAng + Math.PI) / (Math.PI * 2);
						const logoDelay = 1.2 + d.distCenter * 0.34 + iconNorm * 0.24;
						const logoProg = Math.max(0, Math.min(1, (constructAge - logoDelay) / 0.52));
						const logoEase = 1 - Math.pow(1 - logoProg, 3);
						d.coverage = 0.22 + (d.targetCoverage - 0.22) * logoEase;
						if (logoProg > 0.01 && logoProg < 0.99) {
							const flare = Math.sin(logoProg * Math.PI);
							constructGlint = Math.max(constructGlint, flare * 0.96);
							gridScale *= 1 + flare * 0.38;
							const pinchAng = hAng - (1 - logoEase) * 0.85;
							const pinchR = hNormR * (1 + flare * 0.12);
							constructX = constructCenterX + Math.cos(pinchAng) * pinchR * halfW;
							constructY = constructCenterY + Math.sin(pinchAng) * pinchR * halfH;
						}
					} else {
						d.coverage = d.targetCoverage;
					}
					maxMotionEnergy = 1;
				} else if (isMorphing && morphBuf.active[i] !== 0) {
					const mMode = morphBuf.active[i];
					const p = Math.max(0, Math.min(1, (morphAge - morphBuf.delay[i]) / (morphDuration - 0.3)));
					const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
					const flightFlare = Math.sin(p * Math.PI);
					if (mMode === 1) {
						if (liveProcedural && p > 0.72) d.targetCoverage = computeCoverageForVariant(activeVar, d.homeX, d.homeY, procTime);
						d.coverage = morphBuf.fromCov[i] + (d.targetCoverage - morphBuf.fromCov[i]) * ease;
						constructGlint = flightFlare * (0.68 + vividBlend * 0.24);
						gridScale *= 1 + flightFlare * (0.2 + vividBlend * 0.16);
					} else {
						d.coverage = morphBuf.fromCov[i] * (1 - ease * 0.72);
						constructGlint = flightFlare * (0.54 + vividBlend * 0.2);
						gridScale *= 1 + flightFlare * 0.16;
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
				} else if (isConstructing) {
					d.x = constructX + floatX;
					d.y = constructY + floatY;
					d.vx = 0;
					d.vy = 0;
				} else if (isMorphing && morphBuf.active[i] !== 0) {
					const mMode = morphBuf.active[i];
					const p = Math.max(0, Math.min(1, (morphAge - morphBuf.delay[i]) / (morphDuration - 0.3)));
					const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
					const destX = mMode === 1 ? targetX : morphBuf.toX[i] + floatX;
					const destY = mMode === 1 ? targetY : morphBuf.toY[i] + floatY;
					const dx = destX - morphBuf.fromX[i];
					const dy = destY - morphBuf.fromY[i];
					const dist = Math.hypot(dx, dy);
					const arcAmp = Math.sin(p * Math.PI) * Math.min(Math.abs(morphBuf.arc[i]), dist * 0.38) * (morphBuf.arc[i] >= 0 ? 1 : -1);
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
				const restingScale = 0.62 + (1 - rippleBlend) * 0.32 + vividBlend * 0.16;
				const logoScaleFactor = reducedMotion ? 1 : restingScale + waveNorm * 0.68 + cursorBoost * 0.5 + shockBoost * 0.62;
				const logoRadius = Math.max(0.65, cellRadiusBase * d.coverage * logoScaleFactor);
				const activeEnergy = Math.max(cursorBoost, shockBoost, waveNorm * 0.35);
				const ambientRadius = Math.max(0.5, cellRadiusBase * (0.28 + activeEnergy * (isConstructing ? 0.58 : 0.38)));
				const radius = (ambientRadius + (logoRadius - ambientRadius) * logoBlend) * gridScale;
				const staticAccentTint = (1 - rippleBlend) * 0.28 + vividBlend * 0.18;
				const logoAccentMix = Math.min(1, (reducedMotion ? 0.45 : staticAccentTint + waveNorm * 0.92) + cursorBoost * 0.95 + shockBoost * 0.98);
				const ambientAccentMix = Math.min(1, cursorBoost * 0.92 + shockBoost * 0.95 + waveNorm * 0.48);
				const baseR = mutedRgb[0] + (textRgb[0] - mutedRgb[0]) * logoBlend;
				const baseG = mutedRgb[1] + (textRgb[1] - mutedRgb[1]) * logoBlend;
				const baseB = mutedRgb[2] + (textRgb[2] - mutedRgb[2]) * logoBlend;
				const accentMix = ambientAccentMix + (logoAccentMix - ambientAccentMix) * logoBlend;
				const rCol = Math.round(baseR + (activeHighlightRgb[0] - baseR) * accentMix);
				const gCol = Math.round(baseG + (activeHighlightRgb[1] - baseG) * accentMix);
				const bCol = Math.round(baseB + (activeHighlightRgb[2] - baseB) * accentMix);
				const loadingBaseAlpha = 0.52 + vividBlend * 0.36;
				const logoBaseAlpha = loadingBaseAlpha + (0.38 - loadingBaseAlpha) * subduedBlend;
				const logoRawAlpha = Math.min(1, logoBaseAlpha + waveNorm * 0.48 + cursorBoost * 0.52 + shockBoost * 0.48);
				const ambientRawAlpha = (backgroundMode ? 0.08 : 0.11) + vividBlend * 0.08 + activeEnergy * (isConstructing ? 0.72 : 0.34);
				if (isMorphing && morphBuf.active[i] !== 0 && showAmbientField && activeStyle === 'dots') {
					const ambAlpha = ((backgroundMode ? 0.08 : 0.11) + vividBlend * 0.08) * visibilityBlend;
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
					drawStyledParticle({
						ctx,
						renderStyle: activeStyle,
						styleBlend,
						nonDotDissolve,
						index: i,
						x: d.x,
						y: d.y,
						radius,
						logoBlend,
						rCol,
						gCol,
						bCol,
						alpha,
					});
				}
			}

			const needsMoreFrames =
				isConstructing ||
				isMorphing ||
				(!reducedMotion && (targetRipple > 0 || rippleBlend > 0.004 || activeStyle !== 'dots' || pointer.active || shockwaves.length > 0 || maxMotionEnergy > 0.04)) ||
				Math.abs(targetVisibility - visibilityBlend) > 0.01 ||
				Math.abs(targetSubdued - subduedBlend) > 0.01 ||
				Math.abs(targetVivid - vividBlend) > 0.01 ||
				Math.abs(targetStyleBlend - styleBlend) > 0.01 ||
				Math.abs(targetNonDotDissolve - nonDotDissolve) > 0.01;

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
			if (!backgroundMode) return;
			hasEnteredRef.current = true;
			beginMatrixConstruct();
		};
		const onShockwaveEvent = (e: Event) => {
			if (!backgroundMode || reducedMotion) return;
			const detail = (e as CustomEvent<{ xRatio?: number; yRatio?: number }>)?.detail;
			const sx = activeW * (typeof detail?.xRatio === 'number' ? detail.xRatio : 0.5);
			const sy = activeH * (typeof detail?.yRatio === 'number' ? detail.yRatio : 0.46);
			shockwaves.push({ x: sx, y: sy, birth: performance.now() });
			if (shockwaves.length > 4) shockwaves.shift();
			startOrWakeLoop();
		};
		if (backgroundMode && typeof window !== 'undefined') {
			window.addEventListener('xernerx:construct-logo', onConstructEvent);
			window.addEventListener('xernerx:dot-shockwave', onShockwaveEvent);
		}

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
			if (backgroundMode && typeof window !== 'undefined') {
				window.removeEventListener('xernerx:construct-logo', onConstructEvent);
				window.removeEventListener('xernerx:dot-shockwave', onShockwaveEvent);
			}
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
