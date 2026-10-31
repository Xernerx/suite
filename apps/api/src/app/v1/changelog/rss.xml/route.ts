/** @format */

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const APPS = [
	{ id: 'app', name: 'App', devPort: 4004 },
	{ id: 'portal', name: 'Portal', devPort: 4009 },
	{ id: 'account', name: 'Account', devPort: 4003 },
	{ id: 'admin', name: 'Admin', devPort: 4006 },
	{ id: 'hosting', name: 'Hosting', devPort: 4010 },
	{ id: 'haste', name: 'Haste', devPort: 4011 },
	{ id: 'api', name: 'API', devPort: 4001 },
	{ id: 'cdn', name: 'CDN', devPort: 4002 },
	{ id: 'docs', name: 'Docs', devPort: 4005 },
	{ id: 'info', name: 'Info', devPort: 4007 },
	{ id: 'store', name: 'Store', devPort: 4008 },
	{ id: 'www', name: 'Website', devPort: 4000 },
] as const;

const FETCH_HEADERS: Record<string, string> = {
	Accept: 'application/json',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 XernerxSuite/1.0',
};

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function readLocalAppChangelog(appId: string): string | null {
	const cwd = process.cwd();
	const candidates = [
		path.resolve(cwd, '..', appId, 'CHANGELOG.md'),
		path.resolve(cwd, 'apps', appId, 'CHANGELOG.md'),
		path.resolve(cwd, '../../apps', appId, 'CHANGELOG.md'),
		...(appId === 'api' ? [path.resolve(cwd, 'CHANGELOG.md')] : []),
	];
	for (const filePath of candidates) {
		try {
			if (fs.existsSync(filePath)) {
				const raw = fs.readFileSync(filePath, 'utf8').trim();
				if (raw) return raw;
			}
		} catch {}
	}
	return null;
}

async function fetchChangelogFromUrl(url: string, timeoutMs = 4000): Promise<string | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(url, {
			headers: FETCH_HEADERS,
			signal: controller.signal,
			cache: 'no-store',
		});
		clearTimeout(timeout);
		if (!res.ok) return null;
		const data = await res.json();
		const content = data?.fullContent || data?.content;
		return typeof content === 'string' && content.trim().length > 0 ? content : null;
	} catch {
		return null;
	}
}

async function fetchPackageChangelogItems(): Promise<Array<{ title: string; link: string; guid: string; description: string }>> {
	const pkgItems: Array<{ title: string; link: string; guid: string; description: string }> = [];
	try {
		const ghToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
		const res = await fetch('https://api.github.com/repos/Xernerx/docs/git/trees/main?recursive=1', {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				...(ghToken ? { Authorization: `Bearer ${ghToken}` } : {}),
			},
			next: { revalidate: 300 },
		});
		if (!res.ok) return [];
		const data = await res.json();
		if (!Array.isArray(data?.tree)) return [];

		const docsPaths = data.tree.filter((item: any) => item.path.startsWith('packages/') && item.path.endsWith('/docs.json'));
		const packagesMap = new Map<string, string[]>();

		for (const item of docsPaths) {
			const pathParts = item.path.replace('packages/', '').replace('/docs.json', '').split('/');
			const version = pathParts.pop()!;
			const pkgName = pathParts.join('/');
			if (!pkgName || (pkgName !== 'xernerx' && !pkgName.startsWith('@xernerx/'))) continue;
			if (!packagesMap.has(pkgName)) packagesMap.set(pkgName, []);
			packagesMap.get(pkgName)!.push(version);
		}

		await Promise.all(
			Array.from(packagesMap.entries()).map(async ([pkgName, versions]) => {
				try {
					const latestVersion = versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))[0];
					const docRes = await fetch(`https://raw.githubusercontent.com/Xernerx/docs/main/packages/${pkgName}/${latestVersion}/docs.json`, {
						next: { revalidate: 300 },
					});
					if (!docRes.ok) return;
					const docData = await docRes.json();
					const clDoc = Array.isArray(docData?.documents) ? docData.documents.find((d: any) => d.name === 'CHANGELOG') : null;
					if (!clDoc || !Array.isArray(clDoc.content)) return;

					const content = clDoc.content
						.map((p: any) => p?.text || '')
						.join('')
						.replace(/<!--\s*@format\s*-->/g, '')
						.replace(/^#\s+[^\r\n]+\r?\n*/gm, '')
						.trim();

					const sections = content.split(/^##\s+/m).slice(1, 4);
					for (const sec of sections) {
						const lines = sec.trim().split(/\r?\n/);
						const version = lines[0]?.trim().replace(/[^a-zA-Z0-9.-]/g, '') || latestVersion;
						const body = lines.slice(1).join('\n').trim();
						pkgItems.push({
							title: `${pkgName} v${version}`,
							link: `https://info.xernerx.com/changelog?item=${encodeURIComponent(pkgName.toLowerCase())}#${version}`,
							guid: `xernerx-pkg-${pkgName}-${version}`,
							description: body || `Release notes for ${pkgName} v${version}`,
						});
					}
				} catch {}
			})
		);
	} catch {}
	return pkgItems;
}

export async function GET() {
	const baseDomain = process.env.NEXT_PUBLIC_DOMAIN && !/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(process.env.NEXT_PUBLIC_DOMAIN) ? process.env.NEXT_PUBLIC_DOMAIN : 'xernerx.com';
	const isDevEnv = process.env.ENVIRONMENT?.toLowerCase() === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase() === 'development';

	const items: Array<{ title: string; link: string; guid: string; description: string }> = [];

	const [, pkgItems] = await Promise.all([
		Promise.all(
			APPS.map(async (app) => {
				try {
					let content: string | null = readLocalAppChangelog(app.id);
					if (!content && isDevEnv) {
						content = await fetchChangelogFromUrl(`http://127.0.0.1:${app.devPort}/api/changelog?version=all`, 2000);
					}
					if (!content) {
						content = await fetchChangelogFromUrl(`https://${app.id}.canary.${baseDomain}/api/changelog?version=all`);
					}
					if (!content) {
						const prodHost = app.id === 'www' ? `www.${baseDomain}` : `${app.id}.${baseDomain}`;
						content = await fetchChangelogFromUrl(`https://${prodHost}/api/changelog?version=all`);
					}
					if (!content) return;

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
			})
		),
		fetchPackageChangelogItems(),
	]);

	items.push(...pkgItems);
	const seenGuids = new Set<string>();
	const uniqueItems = items.filter((item) => {
		if (seenGuids.has(item.guid)) return false;
		seenGuids.add(item.guid);
		return true;
	});

	const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>Xernerx Suite — Release Changelog</title>
		<link>https://info.xernerx.com/changelog</link>
		<description>Official release notes and version history across all Xernerx Studios applications, APIs, and NPM packages.</description>
		<language>en-gb</language>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		<atom:link href="https://api.xernerx.com/v1/changelog/rss.xml" rel="self" type="application/rss+xml" />
		${uniqueItems
			.slice(0, 45)
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
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=300',
		},
	});
}
