/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	let statusText = 'Operational';
	let color = '#10b981';

	try {
		const { models } = await database('xernerx');
		const activeIssues = await (models.core.Issue as any)
			.countDocuments({
				acknowledged: true,
				status: { $nin: ['resolved', 'closed'] },
			})
			.catch(() => 0);

		if (activeIssues > 0) {
			statusText = `${activeIssues} Active Incident${activeIssues > 1 ? 's' : ''}`;
			color = '#f59e0b';
		}
	} catch {}

	const label = 'Xernerx Status';
	const labelWidth = 104;
	const valueWidth = Math.max(82, statusText.length * 6.8 + 18);
	const totalWidth = Math.round(labelWidth + valueWidth);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${label}: ${statusText}">
	<title>${label}: ${statusText}</title>
	<clipPath id="r">
		<rect width="${totalWidth}" height="24" rx="6" fill="#fff"/>
	</clipPath>
	<g clip-path="url(#r)">
		<rect width="${labelWidth}" height="24" fill="#18181b"/>
		<rect x="${labelWidth}" width="${valueWidth}" height="24" fill="${color}"/>
	</g>
	<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" font-weight="600">
		<text x="${Math.round(labelWidth / 2)}" y="16" fill="#e4e4e7">${label}</text>
		<text x="${Math.round(labelWidth + valueWidth / 2)}" y="16" fill="#ffffff">${statusText}</text>
	</g>
</svg>`;

	return new NextResponse(svg, {
		status: 200,
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=120, s-maxage=120',
		},
	});
}
