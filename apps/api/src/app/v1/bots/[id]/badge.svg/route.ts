/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const type = (req.nextUrl.searchParams.get('type') || 'votes').toLowerCase();

	let label = 'Xernerx Votes';
	let value = '0';
	let color = '#6366f1';

	try {
		const { models } = await database('xernerx');
		const [bot, latestStats] = await Promise.all([
			models.bots.Bot.findOne({ id }).lean() as Promise<any>,
			models.bots.Stat.find({ botId: id }).sort({ createdAt: -1 }).limit(1).lean() as Promise<any[]>,
		]);

		const stat = latestStats?.[0] || bot?.stats || {};

		if (type === 'servers' || type === 'guilds') {
			label = 'Xernerx Servers';
			value = formatCompact(stat.guildCount || 0);
			color = '#8b5cf6';
		} else if (type === 'users') {
			label = 'Xernerx Users';
			value = formatCompact(stat.userCount || 0);
			color = '#3b82f6';
		} else if (type === 'status' || type === 'verified') {
			label = 'Xernerx';
			value = bot?.verified ? 'Verified Bot' : 'Listed Bot';
			color = bot?.verified ? '#10b981' : '#6366f1';
		} else {
			label = 'Xernerx Votes';
			value = formatCompact(bot?.voteCount || 0);
			color = '#6366f1';
		}
	} catch {
		value = 'N/A';
	}

	const safeLabel = escapeXml(label);
	const safeValue = escapeXml(value);
	const labelWidth = Math.max(76, safeLabel.length * 6.8 + 18);
	const valueWidth = Math.max(44, safeValue.length * 7.2 + 18);
	const totalWidth = Math.round(labelWidth + valueWidth);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${safeLabel}: ${safeValue}">
	<title>${safeLabel}: ${safeValue}</title>
	<linearGradient id="s" x2="0" y2="100%">
		<stop offset="0" stop-color="#fff" stop-opacity=".12"/>
		<stop offset="1" stop-opacity=".12"/>
	</linearGradient>
	<clipPath id="r">
		<rect width="${totalWidth}" height="24" rx="6" fill="#fff"/>
	</clipPath>
	<g clip-path="url(#r)">
		<rect width="${labelWidth}" height="24" fill="#18181b"/>
		<rect x="${labelWidth}" width="${valueWidth}" height="24" fill="${color}"/>
		<rect width="${totalWidth}" height="24" fill="url(#s)"/>
	</g>
	<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11" font-weight="600">
		<text x="${Math.round(labelWidth / 2)}" y="16" fill="#e4e4e7">${safeLabel}</text>
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
