/** @format */
'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@xernerx/providers';
import { parseCssColor } from './dotLogoPaths';

export type CursorFxType = 'default' | 'starlight_trail' | 'plasma_sparks' | 'cyber_reticle' | 'sonic_rings' | 'aurora_ribbon';

export interface CursorFxCanvasProps {
	fx?: CursorFxType;
	preview?: boolean;
	className?: string;
}

interface TrailParticle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	life: number;
	maxLife: number;
	rot: number;
}

interface ShockRing {
	x: number;
	y: number;
	radius: number;
	maxRadius: number;
	life: number;
}

export function CursorFxCanvas({ fx = 'default', preview = false, className = '' }: CursorFxCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { resolvedTheme, uiPreferences } = useTheme();

	useEffect(() => {
		if (fx === 'default') return;
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
			activeW = Math.max(1, rect.width || (preview ? 240 : window.innerWidth));
			activeH = Math.max(1, rect.height || (preview ? 80 : window.innerHeight));
			dpr = Math.min(window.devicePixelRatio || 1, 1.75);
			canvas.width = Math.round(activeW * dpr);
			canvas.height = Math.round(activeH * dpr);
		};
		resize();

		const particles: TrailParticle[] = [];
		const rings: ShockRing[] = [];
		const ribbon: Array<{ x: number; y: number; age: number }> = [];

		const pointer = {
			x: activeW * 0.5,
			y: activeH * 0.5,
			smoothX: activeW * 0.5,
			smoothY: activeH * 0.5,
			active: preview,
			lastSpawn: 0,
		};

		const spawnTrail = (x: number, y: number, count = 2, speedMul = 1) => {
			if (particles.length > 90) particles.splice(0, count);
			for (let i = 0; i < count; i++) {
				const angle = Math.random() * Math.PI * 2;
				const spd = (0.4 + Math.random() * 1.8) * speedMul;
				particles.push({
					x: x + (Math.random() - 0.5) * 6,
					y: y + (Math.random() - 0.5) * 6,
					vx: Math.cos(angle) * spd,
					vy: Math.sin(angle) * spd - (fx === 'plasma_sparks' ? 0.5 : 0),
					size: fx === 'starlight_trail' ? 3.5 + Math.random() * 3.5 : 2 + Math.random() * 2.5,
					life: 1,
					maxLife: 0.45 + Math.random() * 0.4,
					rot: Math.random() * Math.PI,
				});
			}
		};

		const spawnClickBurst = (x: number, y: number) => {
			rings.push({
				x,
				y,
				radius: 4,
				maxRadius: preview ? 34 : 62,
				life: 1,
			});
			if (fx === 'starlight_trail' || fx === 'plasma_sparks') {
				spawnTrail(x, y, preview ? 8 : 14, 2.2);
			}
		};

		const onPointerMove = (e: PointerEvent) => {
			if (preview) return;
			pointer.x = e.clientX;
			pointer.y = e.clientY;
			pointer.active = true;
			const now = performance.now();
			if (now - pointer.lastSpawn > 16) {
				pointer.lastSpawn = now;
				if (fx === 'starlight_trail' || fx === 'plasma_sparks') {
					spawnTrail(pointer.x, pointer.y, 1, 0.85);
				} else if (fx === 'sonic_rings' && Math.random() < 0.45) {
					rings.push({ x: pointer.x, y: pointer.y, radius: 2, maxRadius: 28, life: 0.85 });
				}
				ribbon.push({ x: pointer.x, y: pointer.y, age: 0 });
				if (ribbon.length > 28) ribbon.shift();
			}
		};

		const onPointerDown = (e: PointerEvent) => {
			if (preview) return;
			spawnClickBurst(e.clientX, e.clientY);
		};

		if (!preview && typeof window !== 'undefined') {
			window.addEventListener('pointermove', onPointerMove, { passive: true });
			window.addEventListener('pointerdown', onPointerDown, { passive: true });
			window.addEventListener('resize', resize);
		}

		const startTime = performance.now();
		let lastColorSync = startTime;
		let lastPreviewPulse = startTime;

		const drawFourPointStar = (cx: number, cy: number, r: number, rot: number) => {
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(rot);
			ctx.beginPath();
			for (let i = 0; i < 4; i++) {
				const a = (i * Math.PI) / 2;
				ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
				const mid = a + Math.PI / 4;
				ctx.lineTo(Math.cos(mid) * (r * 0.28), Math.sin(mid) * (r * 0.28));
			}
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		};

		const render = (now: number) => {
			if (typeof document !== 'undefined' && document.hidden) {
				rafId = requestAnimationFrame(render);
				return;
			}
			if (now - lastColorSync > 1500) {
				syncColors();
				lastColorSync = now;
			}

			const t = (now - startTime) * 0.001;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, activeW, activeH);

			const [ar, ag, ab] = accentRgb;
			const [tr, tg, tb] = textRgb;

			if (preview) {
				// Autonomous figure-8 path for store / settings preview cards
				pointer.x = activeW * 0.5 + Math.cos(t * 2.2) * (activeW * 0.32);
				pointer.y = activeH * 0.5 + Math.sin(t * 4.4) * (activeH * 0.25);
				if (now - pointer.lastSpawn > 32) {
					pointer.lastSpawn = now;
					if (fx === 'starlight_trail' || fx === 'plasma_sparks') {
						spawnTrail(pointer.x, pointer.y, 1, 0.65);
					} else if (fx === 'sonic_rings' && Math.random() < 0.35) {
						rings.push({ x: pointer.x, y: pointer.y, radius: 2, maxRadius: 18, life: 0.75 });
					}
					ribbon.push({ x: pointer.x, y: pointer.y, age: 0 });
					if (ribbon.length > 22) ribbon.shift();
				}
				if (now - lastPreviewPulse > 1400) {
					lastPreviewPulse = now;
					spawnClickBurst(pointer.x, pointer.y);
				}
			}

			pointer.smoothX += (pointer.x - pointer.smoothX) * 0.24;
			pointer.smoothY += (pointer.y - pointer.smoothY) * 0.24;

			// 1. Aurora Ribbon Trail
			if (fx === 'aurora_ribbon' && ribbon.length > 2) {
				ctx.save();
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				for (let i = 1; i < ribbon.length; i++) {
					const p0 = ribbon[i - 1];
					const p1 = ribbon[i];
					p0.age += 0.025;
					const alpha = Math.max(0, (i / ribbon.length) * (1 - p0.age));
					if (alpha <= 0.01) continue;
					ctx.beginPath();
					ctx.moveTo(p0.x, p0.y);
					ctx.lineTo(p1.x, p1.y);
					ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(alpha * 0.65).toFixed(3)})`;
					ctx.lineWidth = (i / ribbon.length) * (preview ? 6 : 9);
					ctx.stroke();
				}
				ctx.restore();
			}
			for (let i = ribbon.length - 1; i >= 0; i--) {
				ribbon[i].age += 0.02;
				if (ribbon[i].age >= 1) ribbon.splice(i, 1);
			}

			// 2. Trail Particles (Starlight & Plasma Sparks)
			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				if (fx === 'plasma_sparks') {
					p.vy += 0.06; // subtle gravity arc
				}
				p.life -= 0.028 / p.maxLife;
				if (p.life <= 0) {
					particles.splice(i, 1);
					continue;
				}
				const alpha = Math.max(0, p.life);
				if (fx === 'starlight_trail') {
					ctx.fillStyle = i % 3 === 0 ? `rgba(${tr}, ${tg}, ${tb}, ${(alpha * 0.85).toFixed(3)})` : `rgba(${ar}, ${ag}, ${ab}, ${(alpha * 0.9).toFixed(3)})`;
					drawFourPointStar(p.x, p.y, p.size * alpha, p.rot + t * 2);
				} else {
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
					ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(alpha * 0.95).toFixed(3)})`;
					ctx.lineWidth = p.size * 0.8;
					ctx.lineCap = 'round';
					ctx.stroke();
				}
			}

			// 3. Click Shockwaves & Sonic Rings
			for (let i = rings.length - 1; i >= 0; i--) {
				const r = rings[i];
				r.life -= 0.032;
				r.radius += (r.maxRadius - r.radius) * 0.14;
				if (r.life <= 0) {
					rings.splice(i, 1);
					continue;
				}
				ctx.beginPath();
				ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
				ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(r.life * 0.65).toFixed(3)})`;
				ctx.lineWidth = fx === 'sonic_rings' ? 1.8 : 1.4;
				ctx.stroke();
			}

			// 4. Cyber Reticle HUD Follower
			if (fx === 'cyber_reticle' && pointer.active) {
				const rx = pointer.smoothX;
				const ry = pointer.smoothY;
				const rad = preview ? 11 : 16;
				ctx.save();
				ctx.translate(rx, ry);
				ctx.rotate(t * 1.4);
				ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, 0.72)`;
				ctx.lineWidth = 1.4;
				ctx.setLineDash([5, 4]);
				ctx.beginPath();
				ctx.arc(0, 0, rad, 0, Math.PI * 2);
				ctx.stroke();
				ctx.setLineDash([]);
				for (let k = 0; k < 4; k++) {
					const a = (k * Math.PI) / 2;
					ctx.beginPath();
					ctx.moveTo(Math.cos(a) * (rad - 3), Math.sin(a) * (rad - 3));
					ctx.lineTo(Math.cos(a) * (rad + 4), Math.sin(a) * (rad + 4));
					ctx.stroke();
				}
				ctx.restore();
			}

			if (!reducedMotion) {
				rafId = requestAnimationFrame(render);
			}
		};

		rafId = requestAnimationFrame(render);
		return () => {
			cancelAnimationFrame(rafId);
			if (!preview && typeof window !== 'undefined') {
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerdown', onPointerDown);
				window.removeEventListener('resize', resize);
			}
		};
	}, [fx, preview, resolvedTheme, uiPreferences?.reducedMotion]);

	if (fx === 'default') return null;

	return (
		<canvas ref={canvasRef} className={`pointer-events-none ${preview ? 'absolute inset-0 w-full h-full' : 'fixed inset-0 z-[9998] w-screen h-screen'} block ${className}`} aria-hidden="true" />
	);
}
