/** @format */

import { DotLogoVariant, DotParticle } from './dotLogoPaths';

export interface DotMorphBuffer {
	active: Uint8Array;
	fromX: Float32Array;
	fromY: Float32Array;
	toX: Float32Array;
	toY: Float32Array;
	fromCov: Float32Array;
	arc: Float32Array;
	delay: Float32Array;
}

export function createDotMorphBuffer(count: number): DotMorphBuffer {
	return {
		active: new Uint8Array(count),
		fromX: new Float32Array(count),
		fromY: new Float32Array(count),
		toX: new Float32Array(count),
		toY: new Float32Array(count),
		fromCov: new Float32Array(count),
		arc: new Float32Array(count),
		delay: new Float32Array(count),
	};
}

export function beginDotRearrangeMorph(params: {
	buf: DotMorphBuffer;
	dots: DotParticle[];
	nextVariant: DotLogoVariant;
	computeCoverage: (v: DotLogoVariant, hx: number, hy: number, time: number) => number;
	procTime: number;
	reducedMotion: boolean;
}): number {
	const { buf, dots, nextVariant, computeCoverage, procTime, reducedMotion } = params;

	const prevLit: { idx: number; x: number; y: number; cov: number; ang: number }[] = [];
	let prevSumX = 0;
	let prevSumY = 0;
	for (let i = 0; i < dots.length; i++) {
		const d = dots[i];
		if (d.coverage > 0.28) {
			prevLit.push({ idx: i, x: d.x, y: d.y, cov: d.coverage, ang: 0 });
			prevSumX += d.x;
			prevSumY += d.y;
		}
	}

	const nextLit: { idx: number; d: DotParticle; ang: number }[] = [];
	let nextSumX = 0;
	let nextSumY = 0;
	for (let i = 0; i < dots.length; i++) {
		const d = dots[i];
		const nextCov = computeCoverage(nextVariant, d.homeX, d.homeY, procTime);
		d.targetCoverage = nextCov;
		if (nextCov > 0.28) {
			nextLit.push({ idx: i, d, ang: 0 });
			nextSumX += d.homeX;
			nextSumY += d.homeY;
		}
	}

	buf.active.fill(0);
	if (reducedMotion || prevLit.length === 0 || nextLit.length === 0) {
		return 0;
	}

	const prevCx = prevSumX / prevLit.length;
	const prevCy = prevSumY / prevLit.length;
	for (let i = 0; i < prevLit.length; i++) {
		const p = prevLit[i];
		p.ang = Math.atan2(p.y - prevCy, p.x - prevCx);
	}
	prevLit.sort((a, b) => a.ang - b.ang);

	const nextCx = nextSumX / nextLit.length;
	const nextCy = nextSumY / nextLit.length;
	for (let i = 0; i < nextLit.length; i++) {
		const n = nextLit[i];
		n.ang = Math.atan2(n.d.homeY - nextCy, n.d.homeX - nextCx);
	}
	nextLit.sort((a, b) => a.ang - b.ang);

	for (let k = 0; k < nextLit.length; k++) {
		const { idx, d } = nextLit[k];
		const src = prevLit[Math.floor((k / nextLit.length) * prevLit.length)];
		buf.active[idx] = 1;
		buf.fromX[idx] = src.x;
		buf.fromY[idx] = src.y;
		buf.toX[idx] = d.homeX;
		buf.toY[idx] = d.homeY;
		buf.fromCov[idx] = Math.max(src.cov, d.targetCoverage * 0.9);
		buf.arc[idx] = (k % 2 === 0 ? 1 : -1) * (16 + (k % 7) * 4.5);
		buf.delay[idx] = (k / nextLit.length) * 0.28;
		d.coverage = buf.fromCov[idx];
		d.x = src.x;
		d.y = src.y;
		d.vx = 0;
		d.vy = 0;
	}

	let mergeCount = 0;
	const maxMerging = Math.min(prevLit.length, Math.max(nextLit.length, 220));
	const stride = Math.max(1, Math.floor(prevLit.length / maxMerging));
	for (let m = 0; m < prevLit.length; m += stride) {
		const p = prevLit[m];
		if (buf.active[p.idx] !== 0) continue;
		const d = dots[p.idx];
		const dest = nextLit[Math.floor((m / prevLit.length) * nextLit.length)].d;
		buf.active[p.idx] = 2;
		buf.fromX[p.idx] = p.x;
		buf.fromY[p.idx] = p.y;
		buf.toX[p.idx] = dest.homeX;
		buf.toY[p.idx] = dest.homeY;
		buf.fromCov[p.idx] = p.cov;
		buf.arc[p.idx] = (mergeCount % 2 === 0 ? -1 : 1) * (14 + (mergeCount % 6) * 4);
		buf.delay[p.idx] = (mergeCount % 12) * 0.022;
		mergeCount++;
	}

	for (let i = 0; i < dots.length; i++) {
		if (buf.active[i] === 0 && dots[i].targetCoverage <= 0.28) {
			dots[i].coverage = dots[i].targetCoverage;
			dots[i].x = dots[i].homeX;
			dots[i].y = dots[i].homeY;
			dots[i].vx = 0;
			dots[i].vy = 0;
		}
	}

	return performance.now();
}
