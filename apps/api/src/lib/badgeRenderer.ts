/** @format */

import { NextResponse } from 'next/server';

export interface BadgeRenderOptions {
	color?: string;
	theme?: 'dark' | 'light';
	style?: 'rounded' | 'pill' | 'flat';
}

function escapeXml(unsafe: string): string {
	return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function renderBadgeSvg(label: string, value: string, opts?: BadgeRenderOptions): NextResponse {
	const color = opts?.color || '#6366f1';
	const theme = opts?.theme === 'light' ? 'light' : 'dark';
	const style = opts?.style === 'pill' ? 'pill' : opts?.style === 'flat' ? 'flat' : 'rounded';

	const safeLabel = escapeXml(label);
	const safeValue = escapeXml(value);
	const labelWidth = Math.max(76, safeLabel.length * 6.8 + 18);
	const valueWidth = Math.max(44, safeValue.length * 7.2 + 18);
	const totalWidth = Math.round(labelWidth + valueWidth);
	const rx = style === 'pill' ? 12 : style === 'flat' ? 2 : 6;
	const labelBg = theme === 'light' ? '#f1f5f9' : '#18181b';
	const labelText = theme === 'light' ? '#0f172a' : '#e4e4e7';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${safeLabel}: ${safeValue}">
	<title>${safeLabel}: ${safeValue}</title>
	${
		style !== 'flat'
			? `<linearGradient id="s" x2="0" y2="100%">
		<stop offset="0" stop-color="#fff" stop-opacity=".12"/>
		<stop offset="1" stop-opacity=".12"/>
	</linearGradient>`
			: ''
	}
	<clipPath id="r">
		<rect width="${totalWidth}" height="24" rx="${rx}" fill="#fff"/>
	</clipPath>
	<g clip-path="url(#r)">
		<rect width="${labelWidth}" height="24" fill="${labelBg}"/>
		<rect x="${labelWidth}" width="${valueWidth}" height="24" fill="${color}"/>
		${style !== 'flat' ? `<rect width="${totalWidth}" height="24" fill="url(#s)"/>` : ''}
	</g>
	<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11" font-weight="600">
		<text x="${Math.round(labelWidth / 2)}" y="16" fill="${labelText}">${safeLabel}</text>
		<text x="${Math.round(labelWidth + valueWidth / 2)}" y="16" fill="#ffffff">${safeValue}</text>
	</g>
</svg>`;

	return new NextResponse(svg, {
		status: 200,
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=300, s-maxage=300',
		},
	});
}
