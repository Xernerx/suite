/** @format */

import { DotLogoVariant, DotMatrixRenderStyle, DotParticle } from './dotLogoPaths';

export function drawRenderStyleBackdrop(params: {
	ctx: CanvasRenderingContext2D;
	renderStyle: DotMatrixRenderStyle;
	styleBlend: number;
	nonDotDissolve: number;
	visibilityBlend: number;
	dots: DotParticle[];
	gridCols: number;
	cellStepX: number;
	cellStepY: number;
	activeW: number;
	activeH: number;
	accentRgb: [number, number, number];
	textRgb: [number, number, number];
	procTime: number;
	variant: DotLogoVariant;
	pointer?: { x: number; y: number; active: boolean };
	shockwaves?: Array<{ x: number; y: number; birth: number }>;
	now?: number;
}) {
	const {
		ctx,
		renderStyle,
		styleBlend,
		nonDotDissolve,
		visibilityBlend,
		dots,
		gridCols,
		cellStepX,
		cellStepY,
		activeW,
		activeH,
		accentRgb,
		textRgb,
		procTime,
		pointer,
		shockwaves = [],
		now = 0,
	} = params;
	if (renderStyle === 'dots' || styleBlend <= 0.02 || visibilityBlend <= 0.02) return;

	const [ar, ag, ab] = accentRgb;
	const [tr, tg, tb] = textRgb;
	const cx = activeW * 0.5;
	const cy = activeH * 0.5;
	const minDim = Math.min(activeW, activeH);
	const wordmarkBlend = Math.max(0, 1 - nonDotDissolve * 0.92);
	const sceneBlend = Math.min(1, 0.25 + nonDotDissolve * 0.75) * styleBlend * visibilityBlend;

	// Helper: cursor + shockwave displacement at any canvas (x, y)
	const sampleField = (x: number, y: number): { dx: number; dy: number; energy: number } => {
		let dx = 0;
		let dy = 0;
		let energy = 0;
		if (pointer?.active) {
			const px = x - pointer.x;
			const py = y - pointer.y;
			const dist = Math.hypot(px, py);
			const rad = Math.max(110, minDim * 0.28);
			if (dist < rad && dist > 0.1) {
				const inf = Math.pow(1 - dist / rad, 2);
				dx += (px / dist) * inf * 22;
				dy += (py / dist) * inf * 22;
				energy = Math.max(energy, inf);
			}
		}
		for (let s = 0; s < shockwaves.length; s++) {
			const sw = shockwaves[s];
			const age = (now - sw.birth) * 0.001;
			if (age < 0 || age > 1.5) continue;
			const ringR = age * Math.max(activeW, activeH) * 0.8;
			const dist = Math.hypot(x - sw.x, y - sw.y);
			const delta = Math.abs(dist - ringR);
			if (delta < 48 && dist > 0.1) {
				const pulse = (1 - delta / 48) * (1 - age / 1.5);
				dx += ((x - sw.x) / dist) * pulse * 18;
				dy += ((y - sw.y) / dist) * pulse * 18;
				energy = Math.max(energy, pulse);
			}
		}
		return { dx, dy, energy };
	};

	// 1. Wordmark medium filaments during loading / morphing (links active logo nodes in the selected medium)
	if (wordmarkBlend > 0.04) {
		const maxDist = Math.max(cellStepX, cellStepY) * (renderStyle === 'aurora' ? 2.6 : 2.15);
		const maxDistSq = maxDist * maxDist;
		const searchSpan = Math.min(dots.length, gridCols + 3);
		ctx.lineWidth = renderStyle === 'aurora' ? Math.max(2.5, cellStepX * 0.55) : renderStyle === 'hexgrid' ? 1.35 : 1.1;
		for (let i = 0; i < dots.length; i++) {
			const a = dots[i];
			if (!a.isLogo || a.coverage < 0.36) continue;
			const limit = Math.min(dots.length, i + searchSpan);
			for (let j = i + 1; j < limit; j++) {
				const b = dots[j];
				if (!b.isLogo || b.coverage < 0.36) continue;
				const lx = b.x - a.x;
				const ly = b.y - a.y;
				const dSq = lx * lx + ly * ly;
				if (dSq > maxDistSq || dSq < 2) continue;
				const ratio = 1 - Math.sqrt(dSq) / maxDist;
				const alpha = ratio * (renderStyle === 'aurora' ? 0.22 : 0.34) * wordmarkBlend * styleBlend * visibilityBlend;
				if (alpha <= 0.01) continue;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				if (renderStyle === 'glyphs') {
					ctx.lineTo(b.x, a.y);
					ctx.lineTo(b.x, b.y);
				} else {
					ctx.lineTo(b.x, b.y);
				}
				ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha.toFixed(3)})`;
				ctx.stroke();
			}
		}
	}

	// 2. Continuous Non-Dot Full-Canvas Environments (dissolves all dots into continuous medium)
	if (renderStyle === 'aurora') {
		// Volumetric ambient nebula glow pools
		for (let o = 0; o < 3; o++) {
			const ox = cx + Math.cos(procTime * 0.45 + o * 2.1) * (activeW * 0.24);
			const oy = cy + Math.sin(procTime * 0.38 + o * 1.7) * (activeH * 0.18);
			const orad = minDim * (0.34 + o * 0.08);
			const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orad);
			grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${(0.14 * sceneBlend).toFixed(3)})`);
			grad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, activeW, activeH);
		}
		// 5 Continuous flowing Northern Lights silk curtains (zero dots)
		const curtainCount = 5;
		for (let c = 0; c < curtainCount; c++) {
			const baseY = activeH * (0.22 + c * 0.14);
			const amp = activeH * (0.065 + (c % 3) * 0.028);
			const freq = (Math.PI * (1.5 + c * 0.35)) / Math.max(1, activeW);
			const phase = procTime * (0.75 + c * 0.18) + c * 1.3;
			const ribbonThickness = minDim * (0.11 - c * 0.012);

			ctx.beginPath();
			const step = Math.max(16, Math.round(activeW / 36));
			for (let x = 0; x <= activeW + step; x += step) {
				const clampedX = Math.min(activeW, x);
				const waveY = baseY + Math.sin(clampedX * freq - phase) * amp + Math.cos(clampedX * freq * 0.55 + phase * 0.8) * (amp * 0.45);
				const f = sampleField(clampedX, waveY);
				const py = waveY + f.dy * 0.7;
				if (x === 0) ctx.moveTo(clampedX, py);
				else ctx.lineTo(clampedX, py);
			}
			// Stroke crisp luminous crest of the aurora curtain
			ctx.lineWidth = 2.2;
			ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${((0.34 - c * 0.04) * sceneBlend).toFixed(3)})`;
			ctx.stroke();

			// Fill soft silk curtain drape beneath the crest
			ctx.lineTo(activeW, baseY + ribbonThickness * 1.8);
			ctx.lineTo(0, baseY + ribbonThickness * 1.8);
			ctx.closePath();
			const silkGrad = ctx.createLinearGradient(0, baseY - amp, 0, baseY + ribbonThickness * 1.8);
			silkGrad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${((0.18 - c * 0.022) * sceneBlend).toFixed(3)})`);
			silkGrad.addColorStop(0.55, `rgba(${tr}, ${tg}, ${tb}, ${((0.05 - c * 0.006) * sceneBlend).toFixed(3)})`);
			silkGrad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
			ctx.fillStyle = silkGrad;
			ctx.fill();
		}
		return;
	}

	if (renderStyle === 'hexgrid') {
		// Continuous 3D Perspective Topographic Wireframe & Connected Honeycomb Lattice
		const rows = 11;
		const cols = 18;
		const horizonY = activeH * 0.18;
		const spanH = activeH * 0.78;
		const verts: Array<Array<{ x: number; y: number; e: number }>> = [];

		for (let r = 0; r <= rows; r++) {
			const rowArr: Array<{ x: number; y: number; e: number }> = [];
			const v = r / rows;
			const persp = 0.42 + v * 0.82;
			const baseY = horizonY + Math.pow(v, 1.25) * spanH;
			for (let c = 0; c <= cols; c++) {
				const u = (c / cols - 0.5) * 2;
				const rawX = cx + u * (activeW * 0.56) * persp + (r % 2 === 1 ? (activeW / cols) * 0.25 * persp : 0);
				const elev = Math.sin(u * 3.6 + procTime * 1.4 + v * 4.2) * Math.cos(v * 3.8 - procTime * 1.1) * (14 * persp);
				const f = sampleField(rawX, baseY + elev);
				rowArr.push({
					x: rawX + f.dx * 0.5,
					y: baseY + elev + f.dy * 0.65 - f.energy * 14,
					e: f.energy,
				});
			}
			verts.push(rowArr);
		}

		// Draw continuous horizontal contour splines
		for (let r = 0; r <= rows; r++) {
			const v = r / rows;
			ctx.beginPath();
			for (let c = 0; c <= cols; c++) {
				const pt = verts[r][c];
				if (c === 0) ctx.moveTo(pt.x, pt.y);
				else ctx.lineTo(pt.x, pt.y);
			}
			const alpha = (0.08 + v * 0.22) * sceneBlend;
			ctx.lineWidth = 1 + v * 0.8;
			ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha.toFixed(3)})`;
			ctx.stroke();
		}

		// Draw continuous diagonal / hexagonal lattice struts
		for (let r = 0; r < rows; r++) {
			const v = r / rows;
			for (let c = 0; c <= cols; c++) {
				const a = verts[r][c];
				const b = verts[r + 1][c];
				const boost = Math.max(a.e, b.e);
				const alpha = (0.07 + v * 0.16 + boost * 0.35) * sceneBlend;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				if (c < cols && (r + c) % 2 === 0) {
					const diag = verts[r + 1][c + 1];
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(diag.x, diag.y);
				}
				ctx.lineWidth = 0.9 + boost * 1.2;
				ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha.toFixed(3)})`;
				ctx.stroke();
			}
		}
		return;
	}

	if (renderStyle === 'constellation') {
		// Continuous Deep-Space Nebula, Astrolabe Rings, Constellation Linework & Shooting Stars
		const nebGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.55);
		nebGrad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${(0.12 * sceneBlend).toFixed(3)})`);
		nebGrad.addColorStop(0.6, `rgba(${tr}, ${tg}, ${tb}, ${(0.03 * sceneBlend).toFixed(3)})`);
		nebGrad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
		ctx.fillStyle = nebGrad;
		ctx.fillRect(0, 0, activeW, activeH);

		// Celestial orbital ellipses
		for (let ring = 0; ring < 3; ring++) {
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(procTime * (ring % 2 === 0 ? 0.12 : -0.09) + ring * 0.7);
			ctx.beginPath();
			ctx.ellipse(0, 0, minDim * (0.24 + ring * 0.13), minDim * (0.11 + ring * 0.06), 0, 0, Math.PI * 2);
			ctx.lineWidth = 1.1;
			ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${((0.18 - ring * 0.04) * sceneBlend).toFixed(3)})`;
			ctx.stroke();
			ctx.restore();
		}

		// 18 Astral constellation vertices linked by continuous starlight lines
		const nodeCount = 18;
		const nodes: Array<{ x: number; y: number; e: number }> = [];
		for (let n = 0; n < nodeCount; n++) {
			const angle = (n / nodeCount) * Math.PI * 2 + procTime * 0.14 * (n % 2 === 0 ? 1 : -0.7);
			const radX = activeW * (0.14 + ((n * 37) % 100) / 310);
			const radY = activeH * (0.14 + ((n * 53) % 100) / 310);
			const rawX = cx + Math.cos(angle + n) * radX;
			const rawY = cy + Math.sin(angle * 1.3 + n) * radY;
			const f = sampleField(rawX, rawY);
			nodes.push({ x: rawX + f.dx, y: rawY + f.dy, e: f.energy });
		}

		for (let i = 0; i < nodeCount; i++) {
			for (let j = i + 1; j < nodeCount; j++) {
				const dist = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
				const maxLink = minDim * 0.36;
				if (dist > maxLink) continue;
				const ratio = 1 - dist / maxLink;
				const alpha = (ratio * 0.32 + Math.max(nodes[i].e, nodes[j].e) * 0.25) * sceneBlend;
				ctx.beginPath();
				ctx.moveTo(nodes[i].x, nodes[i].y);
				ctx.lineTo(nodes[j].x, nodes[j].y);
				ctx.lineWidth = 1 + ratio * 0.8;
				ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha.toFixed(3)})`;
				ctx.stroke();
			}
		}

		// Crisp 4-point star flares at constellation vertices
		for (let i = 0; i < nodeCount; i++) {
			const pt = nodes[i];
			const spike = 5 + (i % 3) * 2.5 + pt.e * 6;
			const waist = 1.3;
			ctx.beginPath();
			ctx.moveTo(pt.x, pt.y - spike);
			ctx.lineTo(pt.x + waist, pt.y - waist);
			ctx.lineTo(pt.x + spike, pt.y);
			ctx.lineTo(pt.x + waist, pt.y + waist);
			ctx.lineTo(pt.x, pt.y + spike);
			ctx.lineTo(pt.x - waist, pt.y + waist);
			ctx.lineTo(pt.x - spike, pt.y);
			ctx.lineTo(pt.x - waist, pt.y - waist);
			ctx.closePath();
			ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${(0.72 * sceneBlend).toFixed(3)})`;
			ctx.fill();
		}

		// Periodic shooting star streak
		const meteorPhase = (procTime * 0.45) % 1;
		if (meteorPhase < 0.45) {
			const prog = meteorPhase / 0.45;
			const mx = activeW * (0.15 + prog * 0.7);
			const my = activeH * (0.12 + prog * 0.55);
			const tailLen = minDim * 0.18;
			const mGrad = ctx.createLinearGradient(mx, my, mx - tailLen, my - tailLen * 0.78);
			mGrad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${(Math.sin(prog * Math.PI) * 0.75 * sceneBlend).toFixed(3)})`);
			mGrad.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
			ctx.beginPath();
			ctx.moveTo(mx, my);
			ctx.lineTo(mx - tailLen, my - tailLen * 0.78);
			ctx.lineWidth = 2;
			ctx.strokeStyle = mGrad;
			ctx.stroke();
		}
		return;
	}

	if (renderStyle === 'glyphs') {
		// Continuous Sacred Geometry, Astrolabe Dials & Live PCB Circuit Traces
		const fCenter = sampleField(cx, cy);
		const gx = cx + fCenter.dx * 0.35;
		const gy = cy + fCenter.dy * 0.35;

		// Concentric architectural rings + sacred polygons
		const radii = [minDim * 0.16, minDim * 0.27, minDim * 0.39];
		for (let rIdx = 0; rIdx < radii.length; rIdx++) {
			const rad = radii[rIdx];
			const rot = procTime * (rIdx % 2 === 0 ? 0.22 : -0.16);
			ctx.save();
			ctx.translate(gx, gy);
			ctx.rotate(rot);

			ctx.beginPath();
			ctx.arc(0, 0, rad, 0, Math.PI * 2);
			ctx.lineWidth = 1.15;
			ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${((0.24 - rIdx * 0.04) * sceneBlend).toFixed(3)})`;
			ctx.stroke();

			// Inscribed rotating geometric polygon (hexagon / octagram)
			const sides = rIdx === 0 ? 6 : rIdx === 1 ? 8 : 12;
			ctx.beginPath();
			for (let s = 0; s <= sides; s++) {
				const a = (s / sides) * Math.PI * 2;
				const vx = Math.cos(a) * rad;
				const vy = Math.sin(a) * rad;
				if (s === 0) ctx.moveTo(vx, vy);
				else ctx.lineTo(vx, vy);
			}
			ctx.lineWidth = 1;
			ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${((0.18 - rIdx * 0.03) * sceneBlend).toFixed(3)})`;
			ctx.stroke();
			ctx.restore();
		}

		// 8 Orthogonal 90-degree PCB circuit traces radiating outward with traveling light pulses
		for (let tIdx = 0; tIdx < 8; tIdx++) {
			const baseAngle = (tIdx / 8) * Math.PI * 2;
			const r1 = minDim * 0.16;
			const r2 = minDim * 0.32;
			const r3 = minDim * 0.48;
			const p1x = gx + Math.cos(baseAngle) * r1;
			const p1y = gy + Math.sin(baseAngle) * r1;
			const p2x = gx + Math.cos(baseAngle) * r2;
			const p2y = gy + Math.sin(baseAngle) * r2;
			const bendAngle = baseAngle + (tIdx % 2 === 0 ? 0.42 : -0.42);
			const p3x = gx + Math.cos(bendAngle) * r3;
			const p3y = gy + Math.sin(bendAngle) * r3;

			ctx.beginPath();
			ctx.moveTo(p1x, p1y);
			ctx.lineTo(p2x, p2y);
			ctx.lineTo(p3x, p3y);
			ctx.lineWidth = 1.25;
			ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${(0.22 * sceneBlend).toFixed(3)})`;
			ctx.stroke();

			// Traveling data pulse along the circuit trace
			const pulseT = (procTime * 0.65 + tIdx * 0.17) % 1;
			const px = pulseT < 0.5 ? p1x + (p2x - p1x) * (pulseT * 2) : p2x + (p3x - p2x) * ((pulseT - 0.5) * 2);
			const py = pulseT < 0.5 ? p1y + (p2y - p1y) * (pulseT * 2) : p2y + (p3y - p2y) * ((pulseT - 0.5) * 2);
			ctx.beginPath();
			ctx.arc(px, py, 2.6, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${(0.78 * sceneBlend).toFixed(3)})`;
			ctx.fill();
		}
	}
}

export function drawStyledParticle(params: {
	ctx: CanvasRenderingContext2D;
	renderStyle: DotMatrixRenderStyle;
	styleBlend: number;
	nonDotDissolve: number;
	index: number;
	x: number;
	y: number;
	radius: number;
	logoBlend: number;
	rCol: number;
	gCol: number;
	bCol: number;
	alpha: number;
}) {
	const { ctx, renderStyle, styleBlend, nonDotDissolve, index, x, y, radius, logoBlend, rCol, gCol, bCol, alpha } = params;

	// For non-dot styles, particles dissolve completely (zero dots remaining!) as nonDotDissolve -> 1
	const effectiveAlpha = renderStyle === 'dots' ? alpha : alpha * Math.max(0, 1 - nonDotDissolve * 1.05);
	if (effectiveAlpha <= 0.005) return;

	const rgba = `rgba(${rCol}, ${gCol}, ${bCol}, ${effectiveAlpha.toFixed(3)})`;

	if (renderStyle === 'dots' || styleBlend <= 0.03) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fillStyle = rgba;
		ctx.fill();
		return;
	}

	if (renderStyle === 'constellation') {
		if (logoBlend > 0.35 && index % 2 === 0) {
			const spike = radius * (1.2 + 1.4 * styleBlend * logoBlend);
			const waist = Math.max(0.35, radius * 0.38);
			ctx.beginPath();
			ctx.moveTo(x, y - spike);
			ctx.lineTo(x + waist, y - waist);
			ctx.lineTo(x + spike, y);
			ctx.lineTo(x + waist, y + waist);
			ctx.lineTo(x, y + spike);
			ctx.lineTo(x - waist, y + waist);
			ctx.lineTo(x - spike, y);
			ctx.lineTo(x - waist, y - waist);
			ctx.closePath();
			ctx.fillStyle = rgba;
			ctx.fill();
		}
		return;
	}

	if (renderStyle === 'hexgrid') {
		const hexR = radius * (1.15 + 0.45 * styleBlend);
		ctx.beginPath();
		for (let s = 0; s < 6; s++) {
			const ang = (Math.PI / 3) * s - Math.PI / 6;
			const vx = x + Math.cos(ang) * hexR;
			const vy = y + Math.sin(ang) * hexR;
			if (s === 0) ctx.moveTo(vx, vy);
			else ctx.lineTo(vx, vy);
		}
		ctx.closePath();
		ctx.lineWidth = Math.max(0.9, radius * 0.32);
		ctx.strokeStyle = rgba;
		ctx.stroke();
		return;
	}

	if (renderStyle === 'aurora') {
		const haloR = radius * (1.5 + logoBlend * 1.6 * styleBlend);
		ctx.beginPath();
		ctx.arc(x, y, haloR, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${(effectiveAlpha * 0.42).toFixed(3)})`;
		ctx.fill();
		return;
	}

	if (renderStyle === 'glyphs') {
		const gSize = radius * (0.95 + 0.5 * styleBlend);
		ctx.strokeStyle = rgba;
		ctx.lineWidth = Math.max(1, radius * 0.38);
		ctx.beginPath();
		ctx.moveTo(x - gSize, y);
		ctx.lineTo(x + gSize, y);
		ctx.moveTo(x, y - gSize);
		ctx.lineTo(x, y + gSize);
		ctx.stroke();
	}
}
