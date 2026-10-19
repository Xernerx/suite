/** @format */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const APPS = [
	{ id: 'app', name: 'App' },
	{ id: 'account', name: 'Account' },
	{ id: 'admin', name: 'Admin' },
	{ id: 'api', name: 'API' },
	{ id: 'cdn', name: 'CDN' },
	{ id: 'docs', name: 'Docs' },
	{ id: 'info', name: 'Info' },
	{ id: 'store', name: 'Store' },
	{ id: 'www', name: 'Website' },
] as const;

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function findRepoRoot(): string {
	let dir = process.cwd();
	for (let i = 0; i < 5; i++) {
		if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return process.cwd();
}

export async function GET() {
	const root = findRepoRoot();
	const items: Array<{ title: string; link: string; guid: string; description: string }> = [];

	for (const app of APPS) {
		try {
			const changelogPath = path.join(root, 'apps', app.id, 'CHANGELOG.md');
			if (!fs.existsSync(changelogPath)) continue;
			const content = fs.readFileSync(changelogPath, 'utf8');
			const sections = content.split(/^##\s+/m).slice(1, 5);
			for (const sec of sections) {
				const lines = sec.trim().split(/\r?\n/);
				const version = lines[0]?.trim().replace(/[^a-zA-Z0-9.-]/g, '') || 'latest';
				const body = lines.slice(1).join('\n').trim();
				items.push({
					title: `${app.name} v${version}`,
					link: `https://info.xernerx.com/changelog?item=${app.name.toLowerCase()}#${version}`,
					guid: `xernerx-${app.id}-${version}`,
					description: body || `Release notes for ${app.name} v${version}`,
				});
			}
		} catch {}
	}

	const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>Xernerx Suite — Release Changelog</title>
		<link>https://info.xernerx.com/changelog</link>
		<description>Official release notes and version history across all Xernerx Studios applications and APIs.</description>
		<language>en-gb</language>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		<atom:link href="https://api.xernerx.com/v1/changelog/rss.xml" rel="self" type="application/rss+xml" />
		${items
			.slice(0, 30)
			.map(
				(item) => `<item>
			<title>${escapeXml(item.title)}</title>
			<link>${escapeXml(item.link)}</link>
			<guid isPermaLink="false">${escapeXml(item.guid)}</guid>
			<description>${escapeXml(item.description)}</description>
		</item>`
			)
			.join('\n\t\t')}
	</channel>
</rss>`;

	return new NextResponse(rssXml, {
		status: 200,
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
}
