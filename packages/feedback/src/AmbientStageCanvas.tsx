/** @format */
'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@xernerx/providers';
import { parseCssColor } from './dotLogoPaths';

export type AmbientSceneType = 'default' | 'mesh_lava' | 'cyber_grid' | 'topography' | 'nebula_cosmos' | 'prism_caustics';

export interface AmbientStageCanvasProps {
	scene?: AmbientSceneType;
	className?: string;
	interactive?: boolean;
	preview?: boolean;
}

export function AmbientStageCanvas({ scene = 'default', className = '', interactive = true, preview = false }: AmbientStageCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { resolvedTheme, uiPreferences } = useTheme();
	const sceneRef = useRef<AmbientSceneType>(scene);

	useEffect(() => {
		sceneRef.current = scene;
	}, [scene]);

	useEffect(() => {
		if (scene === 'default') return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return;

		let rafId = 0;
		let activeW = 1;
		let activeH = 1;
		let dpr = 1;
		const reducedMotion = Boolean(uiPreferences?.reducedMotion);

		let accentRgb: [number, number, number] = [139, 124, 246];
		let textRgb: [number, number, number] = resolvedTheme === 'light' ? [9, 9, 11] : [250, 250, 250];
		const syncColors = () => {
			if (typeof document === 'undefined') return;
			const styles = getComputedStyle(document.documentElement);
			accentRgb = parseCssColor(styles.getPropertyValue('--accent'), [139, 124, 246]);
			textRgb = parseCssColor(styles.getPropertyValue('--text'), resolvedTheme === 'light' ? [9, 9, 11] : [250, 250, 250]);
		};
		syncColors();

		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			activeW = Math.max(1, rect.width || window.innerWidth);
			activeH = Math.max(1, rect.height || window.innerHeight);
			dpr = Math.min(window.devicePixelRatio || 1, 1.75);
			canvas.width = Math.round(activeW * dpr);
			canvas.height = Math.round(activeH * dpr);
		};
		resize();

		const pointer = { x: activeW * 0.5, y: activeH * 0.4, active: false };
		const onMove = (e: PointerEvent) => {
			if (!interactive) return;
			const rect = canvas.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			pointer.x = ((e.clientX - rect.left) / rect.width) * activeW;
			pointer.y = ((e.clientY - rect.top) / rect.height) * activeH;
			pointer.active = true;
		};
		if (interactive && typeof window !== 'undefined') {
			window.addEventListener('pointermove', onMove, { passive: true });
			window.addEventListener('resize', resize);
		}

		let startTime = performance.now();
		let lastColorSync = startTime;

		const render = (now: number) => {
			if (typeof document !== 'undefined' && document.hidden) {
				rafId = requestAnimationFrame(render);
				return;
			}
			if (now - lastColorSync > 1500) {
				syncColors();
				lastColorSync = now;
			}
			const t = reducedMotion ? 1.5 : (now - startTime) * 0.001;
			const [ar, ag, ab] = accentRgb;
			const [tr, tg, tb] = textRgb;
			const minDim = Math.min(activeW, activeH);
			const activeScene = sceneRef.current;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, activeW, activeH);

			if (activeScene === 'mesh_lava') {
				// Drifting organic liquid mesh blobs + silk waves
				const blobs = [
					{ x: 0.25 + Math.cos(t * 0.35) * 0.18, y: 0.3 + Math.sin(t * 0.28) * 0.16, r: 0.48, a: 0.24 },
					{ x: 0.72 + Math.sin(t * 0.31 + 1.4) * 0.18, y: 0.65 + Math.cos(t * 0.25 + 0.8) * 0.18, r: 0.52, a: 0.2 },
					{ x: 0.5 + Math.cos(t * 0.42 + 2.6) * 0.22, y: 0.45 + Math.sin(t * 0.38 + 2.1) * 0.2, r: 0.42, a: 0.16 },
				];
				for (const b of blobs) {
					const bx = b.x * activeW + (pointer.active ? (pointer.x - activeW * 0.5) * 0.08 : 0);
					const by = b.y * activeH + (pointer.active ? (pointer.y - activeH * 0.5) * 0.08 : 0);
					const rad = minDim * b.r;
					const grad = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
					grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${b.a})`);
					grad.addColorStop(0.55, `rgba(${ar}, ${ag}, ${ab}, ${(b.a * 0.35).toFixed(3)})`);
					grad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, activeW, activeH);
				}
			} else if (activeScene === 'cyber_grid') {
				// 3D Synthwave perspective horizon + scrolling grid + sun bloom
				const horizonY = activeH * 0.44;
				const sunR = minDim * 0.18;
				const sunGrad = ctx.createRadialGradient(activeW * 0.5, horizonY - sunR * 0.2, 0, activeW * 0.5, horizonY - sunR * 0.2, sunR * 1.4);
				sunGrad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.32)`);
				sunGrad.addColorStop(0.5, `rgba(${ar}, ${ag}, ${ab}, 0.12)`);
				sunGrad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
				ctx.fillStyle = sunGrad;
				ctx.fillRect(0, 0, activeW, activeH);

				// Perspective rays from horizon center
				const rayCount = 16;
				ctx.lineWidth = 1.1;
				for (let i = -rayCount; i <= rayCount; i++) {
					const u = i / rayCount;
					const topX = activeW * 0.5 + u * activeW * 0.12;
					const botX = activeW * 0.5 + u * activeW * 1.35;
					ctx.beginPath();
					ctx.moveTo(topX, horizonY);
					ctx.lineTo(botX, activeH);
					ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(0.22 * (1 - Math.abs(u) * 0.5)).toFixed(3)})`;
					ctx.stroke();
				}

				// Scrolling horizontal depth lines
				const scroll = (t * 0.38) % 1;
				const hLines = 12;
				for (let j = 0; j < hLines; j++) {
					const prog = (j + scroll) / hLines;
					const y = horizonY + Math.pow(prog, 1.85) * (activeH - horizonY);
					ctx.beginPath();
					ctx.moveTo(0, y);
					ctx.lineTo(activeW, y);
					ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(0.06 + prog * 0.24).toFixed(3)})`;
					ctx.stroke();
				}
			} else if (activeScene === 'topography') {
				// Continuous flowing topographic contour elevation lines
				const lineCount = 11;
				const stepX = Math.max(14, Math.round(activeW / 44));
				for (let l = 0; l < lineCount; l++) {
					const ratio = (l + 0.5) / lineCount;
					const baseY = activeH * (0.08 + ratio * 0.84);
					ctx.beginPath();
					for (let x = 0; x <= activeW + stepX; x += stepX) {
						const cx = Math.min(activeW, x);
						const nx = cx / activeW;
						let y = baseY + Math.sin(nx * 5.2 + t * 0.45 + l * 0.65) * (activeH * 0.045) + Math.cos(nx * 9.4 - t * 0.32 + l * 1.1) * (activeH * 0.022);
						if (pointer.active) {
							const dist = Math.hypot(cx - pointer.x, y - pointer.y);
							const rad = minDim * 0.25;
							if (dist < rad) {
								y += Math.sin((1 - dist / rad) * Math.PI * 0.5) * (y > pointer.y ? 18 : -18);
							}
						}
						if (x === 0) ctx.moveTo(cx, y);
						else ctx.lineTo(cx, y);
					}
					ctx.lineWidth = l % 3 === 0 ? 1.6 : 1;
					ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${l % 3 === 0 ? '0.26' : '0.13'})`;
					ctx.stroke();
				}
			} else if (activeScene === 'nebula_cosmos') {
				// Volumetric deep-space nebula clouds + continuous starlight + meteors
				for (let c = 0; c < 3; c++) {
					const nx = activeW * (0.3 + c * 0.2 + Math.sin(t * 0.2 + c) * 0.08);
					const ny = activeH * (0.35 + (c % 2) * 0.25 + Math.cos(t * 0.18 + c) * 0.08);
					const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, minDim * 0.45);
					g.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.16)`);
					g.addColorStop(0.6, `rgba(${tr}, ${tg}, ${tb}, 0.03)`);
					g.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
					ctx.fillStyle = g;
					ctx.fillRect(0, 0, activeW, activeH);
				}
				// Twinkling 4-point star flares
				for (let s = 0; s < 24; s++) {
					const sx = (((s * 173 + 41) % 100) / 100) * activeW;
					const sy = (((s * 257 + 19) % 100) / 100) * activeH;
					const twinkle = 0.35 + 0.65 * Math.pow(Math.sin(t * 1.4 + s * 2.1) * 0.5 + 0.5, 2);
					const len = (3.5 + (s % 3) * 2.2) * twinkle;
					ctx.beginPath();
					ctx.moveTo(sx - len, sy);
					ctx.lineTo(sx + len, sy);
					ctx.moveTo(sx, sy - len);
					ctx.lineTo(sx, sy + len);
					ctx.lineWidth = 1.1;
					ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(0.42 * twinkle).toFixed(3)})`;
					ctx.stroke();
				}
			} else if (activeScene === 'prism_caustics') {
				// Diagonal volumetric god-rays & refracted crystal light waves
				const rayCount = 6;
				for (let r = 0; r < rayCount; r++) {
					const shift = Math.sin(t * 0.35 + r * 1.2) * (activeW * 0.08);
					const startX = activeW * (0.1 + r * 0.16) + shift;
					const width = activeW * (0.09 + (r % 2) * 0.05);
					const skew = activeW * 0.28;
					const grad = ctx.createLinearGradient(startX, 0, startX + skew, activeH);
					grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.16)`);
					grad.addColorStop(0.6, `rgba(${ar}, ${ag}, ${ab}, 0.06)`);
					grad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
					ctx.beginPath();
					ctx.moveTo(startX, 0);
					ctx.lineTo(startX + width, 0);
					ctx.lineTo(startX + width + skew, activeH);
					ctx.lineTo(startX + skew, activeH);
					ctx.closePath();
					ctx.fillStyle = grad;
					ctx.fill();
				}
			}

			if (!reducedMotion) {
				rafId = requestAnimationFrame(render);
			}
		};

		rafId = requestAnimationFrame(render);
		return () => {
			cancelAnimationFrame(rafId);
			if (interactive && typeof window !== 'undefined') {
				window.removeEventListener('pointermove', onMove);
				window.removeEventListener('resize', resize);
			}
		};
	}, [scene, resolvedTheme, uiPreferences?.reducedMotion, interactive]);

	if (scene === 'default') return null;

	return <canvas ref={canvasRef} className={`pointer-events-none ${preview ? 'absolute inset-0' : ''} w-full h-full block ${className}`} aria-hidden="true" />;
}
