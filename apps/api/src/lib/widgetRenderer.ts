/** @format */

import React from 'react';
import { ImageResponse } from 'next/og';

export interface WidgetStat {
	label: string;
	value: number | string;
}

export interface WidgetRenderOptions {
	type: 'bot' | 'organization' | 'guild' | 'user';
	name: string;
	handle?: string | null;
	description: string;
	avatarUrl: string | null;
	bannerUrl: string | null;
	verified: boolean;
	profileUrl: string;
	stats: WidgetStat[];
}

export function resolveAppBaseUrl(requestUrl: string): string {
	try {
		const url = new URL(requestUrl);
		if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(url.hostname)) {
			return `${url.protocol}//${url.hostname}:4004`;
		}
		if (url.hostname.startsWith('api.')) {
			return `${url.protocol}//${url.hostname.replace(/^api\./, 'app.')}`;
		}
	} catch {}
	return 'https://app.xernerx.com';
}

function escapeXml(unsafe: string): string {
	return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function formatCompactNumber(val: number | string): string {
	const num = typeof val === 'number' ? val : Number(val);
	if (Number.isNaN(num)) return String(val);
	return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}

async function fetchImageAsDataUri(url: string | null): Promise<string | null> {
	if (!url) return null;
	try {
		// Convert animated gifs/webp from Discord CDN to png for SVG/PNG renderer compatibility
		const normalizedUrl = url.replace(/\.(gif|webp)(\?|$)/i, '.png$2');
		const res = await fetch(normalizedUrl, { next: { revalidate: 3600 } });
		if (!res.ok) return null;
		const contentType = res.headers.get('content-type') || 'image/png';
		const buffer = await res.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		return `data:${contentType};base64,${base64}`;
	} catch {
		return null;
	}
}

function getTypeLabel(type: WidgetRenderOptions['type']): string {
	if (type === 'bot') return 'DISCORD BOT';
	if (type === 'organization') return 'ORGANIZATION';
	if (type === 'user') return 'USER PROFILE';
	return 'DISCORD SERVER';
}

export async function renderWidgetPng(opts: WidgetRenderOptions): Promise<ImageResponse> {
	const [avatarDataUri, bannerDataUri] = await Promise.all([fetchImageAsDataUri(opts.avatarUrl), fetchImageAsDataUri(opts.bannerUrl)]);
	const typeLabel = getTypeLabel(opts.type);
	const displayName = opts.name.length > 28 ? `${opts.name.slice(0, 26)}…` : opts.name;
	const rawDesc = (opts.description || 'Explore this profile on the Xernerx ecosystem.').replace(/\s+/g, ' ').trim();
	const displayDesc = rawDesc.length > 90 ? `${rawDesc.slice(0, 87)}…` : rawDesc;
	const initial = (opts.name || 'X').charAt(0).toUpperCase();

	const h = React.createElement;

	return new ImageResponse(
		h(
			'div',
			{
				style: {
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					width: '840px',
					height: '360px',
					padding: '38px 44px',
					borderRadius: '36px',
					background: 'linear-gradient(135deg, #0b0e17 0%, #111625 60%, #161b2e 100%)',
					border: '3px solid rgba(99, 102, 241, 0.45)',
					color: '#f8fafc',
					fontFamily: 'sans-serif',
					position: 'relative',
					overflow: 'hidden',
				},
			},
			bannerDataUri
				? h('img', {
						src: bannerDataUri,
						width: 840,
						height: 360,
						style: {
							position: 'absolute',
							top: 0,
							left: 0,
							width: '840px',
							height: '360px',
							objectFit: 'cover',
							opacity: 0.16,
						},
					})
				: null,
			h(
				'div',
				{
					style: {
						display: 'flex',
						alignItems: 'center',
						gap: '28px',
						width: '100%',
						position: 'relative',
					},
				},
				avatarDataUri
					? h(
							'div',
							{
								style: {
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: '116px',
									height: '116px',
									borderRadius: '30px',
									background: '#1e2436',
									border: '3px solid rgba(129, 140, 248, 0.35)',
									overflow: 'hidden',
									boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
								},
							},
							h('img', {
								src: avatarDataUri,
								width: 116,
								height: 116,
								style: {
									width: '116px',
									height: '116px',
									borderRadius: '28px',
									objectFit: 'cover',
								},
							})
						)
					: h(
							'div',
							{
								style: {
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: '116px',
									height: '116px',
									borderRadius: '30px',
									background: '#1e2436',
									border: '3px solid rgba(129, 140, 248, 0.35)',
									color: '#818cf8',
									fontSize: '46px',
									fontWeight: 800,
								},
							},
							initial
						),
				h(
					'div',
					{
						style: {
							display: 'flex',
							flexDirection: 'column',
							flex: 1,
						},
					},
					h(
						'div',
						{
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								width: '100%',
								marginBottom: '6px',
							},
						},
						h(
							'span',
							{
								style: {
									fontSize: '18px',
									fontWeight: 800,
									color: '#818cf8',
									letterSpacing: '2px',
								},
							},
							typeLabel
						),
						h(
							'span',
							{
								style: {
									fontSize: '18px',
									fontWeight: 800,
									color: '#64748b',
									letterSpacing: '1.5px',
								},
							},
							'XERNERX STUDIOS'
						)
					),
					h(
						'div',
						{
							style: {
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
							},
						},
						h(
							'span',
							{
								style: {
									fontSize: '38px',
									fontWeight: 800,
									color: '#f8fafc',
								},
							},
							displayName
						),
						opts.verified
							? h(
									'span',
									{
										style: {
											fontSize: '22px',
											fontWeight: 800,
											color: '#34d399',
											background: 'rgba(16, 185, 129, 0.15)',
											border: '1px solid rgba(52, 211, 153, 0.4)',
											borderRadius: '999px',
											padding: '2px 12px',
										},
									},
									'VERIFIED'
								)
							: null,
						opts.handle
							? h(
									'span',
									{
										style: {
											fontSize: '20px',
											fontWeight: 600,
											color: '#64748b',
										},
									},
									opts.handle
								)
							: null
					),
					h(
						'div',
						{
							style: {
								fontSize: '22px',
								color: '#94a3b8',
								marginTop: '8px',
								lineHeight: 1.35,
							},
						},
						displayDesc
					)
				)
			),
			h(
				'div',
				{
					style: {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: '18px',
						paddingTop: '24px',
						borderTop: '2px solid rgba(255, 255, 255, 0.08)',
						width: '100%',
						position: 'relative',
					},
				},
				...opts.stats.slice(0, 3).map((stat, idx) =>
					h(
						'div',
						{
							key: String(idx),
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								flex: 1,
								height: '74px',
								padding: '0 24px',
								borderRadius: '20px',
								background: 'rgba(21, 25, 36, 0.9)',
								border: '2px solid rgba(255, 255, 255, 0.08)',
							},
						},
						h(
							'span',
							{
								style: {
									fontSize: '28px',
									fontWeight: 800,
									color: '#f8fafc',
								},
							},
							formatCompactNumber(stat.value)
						),
						h(
							'span',
							{
								style: {
									fontSize: '16px',
									fontWeight: 800,
									color: '#818cf8',
									textTransform: 'uppercase',
									letterSpacing: '1px',
								},
							},
							stat.label.toUpperCase()
						)
					)
				)
			)
		),
		{
			width: 840,
			height: 360,
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		}
	);
}

export async function renderWidgetSvg(opts: WidgetRenderOptions): Promise<string> {
	const avatarDataUri = await fetchImageAsDataUri(opts.avatarUrl);
	const typeLabel = getTypeLabel(opts.type);
	const safeName = escapeXml(opts.name.length > 32 ? `${opts.name.slice(0, 30)}…` : opts.name);
	const rawDesc = (opts.description || 'Explore this profile on the Xernerx ecosystem.').replace(/\s+/g, ' ').trim();
	const safeDesc = escapeXml(rawDesc.length > 78 ? `${rawDesc.slice(0, 75)}…` : rawDesc);
	const initial = escapeXml((opts.name || 'X').charAt(0).toUpperCase());

	const statsMarkup = opts.stats
		.slice(0, 3)
		.map((stat, idx) => {
			const xOffset = 24 + idx * 126;
			const safeVal = escapeXml(formatCompactNumber(stat.value));
			const safeLabel = escapeXml(stat.label.toUpperCase());
			return `
		<g transform="translate(${xOffset}, 118)">
			<rect width="116" height="36" rx="10" fill="#151924" stroke="#ffffff" stroke-opacity="0.08" />
			<text x="12" y="22" fill="#f8fafc" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="800">${safeVal}</text>
			<text x="104" y="22" text-anchor="end" fill="#94a3b8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="9" font-weight="700" letter-spacing="0.5">${safeLabel}</text>
		</g>`;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="172" viewBox="0 0 420 172" fill="none" role="img" aria-label="${safeName}">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="420" y2="172" gradientUnits="userSpaceOnUse">
			<stop offset="0%" stop-color="#0b0e17" />
			<stop offset="100%" stop-color="#111625" />
		</linearGradient>
		<linearGradient id="accentGlow" x1="0" y1="0" x2="420" y2="0" gradientUnits="userSpaceOnUse">
			<stop offset="0%" stop-color="#6366f1" stop-opacity="0.5" />
			<stop offset="100%" stop-color="#a855f7" stop-opacity="0.15" />
		</linearGradient>
		<clipPath id="avatarClip">
			<rect x="24" y="22" width="56" height="56" rx="16" />
		</clipPath>
	</defs>

	<rect width="418" height="170" x="1" y="1" rx="20" fill="url(#bg)" stroke="url(#accentGlow)" stroke-width="1.5" />

	<rect x="24" y="22" width="56" height="56" rx="16" fill="#1e2436" stroke="#ffffff" stroke-opacity="0.08" />
	${
		avatarDataUri
			? `<image href="${avatarDataUri}" x="24" y="22" width="56" height="56" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />`
			: `<text x="52" y="57" text-anchor="middle" fill="#818cf8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="800">${initial}</text>`
	}

	<text x="94" y="36" fill="#818cf8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="1.2">${typeLabel}</text>
	<text x="396" y="36" text-anchor="end" fill="#64748b" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="9" font-weight="700">XERNERX</text>

	<text x="94" y="58" fill="#f8fafc" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="18" font-weight="800">${safeName}${opts.verified ? ' ✓' : ''}</text>

	<text x="94" y="78" fill="#94a3b8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="500">${safeDesc}</text>

	<line x1="24" y1="102" x2="396" y2="102" stroke="#ffffff" stroke-opacity="0.06" />

	${statsMarkup}
</svg>`;
}

export function renderWidgetHtml(opts: WidgetRenderOptions): string {
	const typeLabel = opts.type === 'bot' ? 'Discord Bot' : opts.type === 'organization' ? 'Organization' : opts.type === 'user' ? 'User Profile' : 'Discord Server';
	const safeName = escapeXml(opts.name);
	const rawDesc = (opts.description || 'Explore this profile on the Xernerx ecosystem.').replace(/\s+/g, ' ').trim();
	const safeDesc = escapeXml(rawDesc);
	const initial = escapeXml((opts.name || 'X').charAt(0).toUpperCase());

	const statsHtml = opts.stats
		.slice(0, 3)
		.map(
			(s) => `
			<div class="stat">
				<span class="stat-val">${escapeXml(formatCompactNumber(s.value))}</span>
				<span class="stat-lbl">${escapeXml(s.label)}</span>
			</div>`
		)
		.join('');

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeName} — Xernerx Widget</title>
<style>
	* { box-sizing: border-box; margin: 0; padding: 0; }
	html, body { width: 100%; height: 100%; background: transparent; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; overflow: hidden; }
	.card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 100%;
		height: 100%;
		padding: 18px 20px;
		border-radius: 20px;
		background: linear-gradient(135deg, #0b0e17 0%, #111625 100%);
		border: 1px solid rgba(99, 102, 241, 0.35);
		text-decoration: none;
		color: inherit;
		position: relative;
		overflow: hidden;
		transition: border-color 0.2s ease, transform 0.2s ease;
	}
	.card:hover { border-color: rgba(129, 140, 248, 0.75); }
	.top { display: flex; align-items: center; gap: 14px; }
	.avatar {
		width: 54px;
		height: 54px;
		border-radius: 15px;
		object-fit: cover;
		background: #1e2436;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 20px;
		color: #818cf8;
		flex-shrink: 0;
		border: 1px solid rgba(255,255,255,0.08);
	}
	.meta { flex: 1; min-width: 0; }
	.badges { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
	.type { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #818cf8; }
	.brand { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: #64748b; }
	.name { font-size: 17px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f8fafc; }
	.desc { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
	.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
	.stat {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #151924;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 10px;
		padding: 7px 10px;
	}
	.stat-val { font-size: 13px; font-weight: 800; color: #f8fafc; }
	.stat-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
</style>
</head>
<body>
	<a class="card" href="${escapeXml(opts.profileUrl)}" target="_blank" rel="noopener noreferrer">
		<div class="top">
			${opts.avatarUrl ? `<img class="avatar" src="${escapeXml(opts.avatarUrl)}" alt="${safeName}" />` : `<div class="avatar">${initial}</div>`}
			<div class="meta">
				<div class="badges">
					<span class="type">${escapeXml(typeLabel)}</span>
					<span class="brand">XERNERX</span>
				</div>
				<div class="name">${safeName}${opts.verified ? ' ✓' : ''}</div>
				<div class="desc">${safeDesc}</div>
			</div>
		</div>
		<div class="stats">${statsHtml}</div>
	</a>
</body>
</html>`;
}
