/** @format */

import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import ChangelogClient, { type ChangelogEntry } from '@/components/changelog/ChangelogClient';
import SidebarTrigger from '@/components/changelog/SidebarTrigger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Platform & Package Changelog — Release Notes',
	description: 'Explore the latest feature updates, version history, security patches, and release notes across all Xernerx Studios web applications and open-source NPM packages.',
	alternates: { canonical: '/changelog' },
	openGraph: {
		title: 'Xernerx Support | Platform & Package Changelog',
		description: 'Explore the latest feature updates, version history, security patches, and release notes across all Xernerx Studios web applications and open-source NPM packages.',
		url: 'https://info.xernerx.com/changelog',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — Changelog & Release Notes' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Platform & Package Changelog',
		description: 'Explore the latest feature updates, version history, security patches, and release notes across all Xernerx Studios web applications and open-source NPM packages.',
		images: ['/opengraph-image'],
	},
};

const APPS = [
	{ id: 'app', name: 'App', devPort: 4004 },
	{ id: 'portal', name: 'Portal', devPort: 4009 },
	{ id: 'account', name: 'Account', devPort: 4003 },
	{ id: 'admin', name: 'Admin', devPort: 4006 },
	{ id: 'hosting', name: 'Hosting', devPort: 4010 },
	{ id: 'api', name: 'API', devPort: 4001 },
	{ id: 'cdn', name: 'CDN', devPort: 4002 },
	{ id: 'docs', name: 'Docs', devPort: 4005 },
	{ id: 'info', name: 'Info', devPort: 4007 },
	{ id: 'store', name: 'Store', devPort: 4008 },
	{ id: 'haste', name: 'Haste', devPort: 4011 },
	{ id: 'www', name: 'Website', devPort: 4000 },
] as const;

const FETCH_HEADERS: Record<string, string> = {
	Accept: 'application/json',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 XernerxSuite/1.0',
};

function cleanChangelogMarkdown(raw: string): string {
	const cleaned = raw
		.replace(/^([ \t]*[-*][ \t]*)<!--\s*@format\s*-->[ \t]*\r?\n+[ \t]+/gim, '$1')
		.replace(/^[ \t]*[-*][ \t]*<!--\s*@format\s*-->[ \t]*\r?\n*/gim, '')
		.replace(/<!--\s*@format\s*-->[ \t]*\r?\n*/gi, '')
		.replace(/^#\s+[^\r\n]+\r?\n*/gm, '')
		.replace(/^([ \t]*[-*][ \t]*)\r?\n+[ \t]+/gm, '$1')
		.replace(/^[ \t]*[-*][ \t]*$\r?\n?/gm, '')
		.replace(/^###[ \t]+(?:Major|Minor|Patch)[ \t]+Changes[ \t]*(?:\r?\n)*(?=#+|\s*$)/gim, '')
		.trim();

	const lines = cleaned.split(/\r?\n/);
	const sections: Array<{ heading: string; versionId: string; bodyLines: string[] }> = [];
	let current: { heading: string; versionId: string; bodyLines: string[] } | null = null;
	const preamble: string[] = [];

	for (const line of lines) {
		if (line.startsWith('## ')) {
			const versionId = line
				.replace(/^##\s+/, '')
				.replace(/[^a-zA-Z0-9.-]/g, '')
				.replace(/^v/i, '');
			current = { heading: line.trim(), versionId, bodyLines: [] };
			sections.push(current);
		} else if (current) {
			current.bodyLines.push(line);
		} else {
			preamble.push(line);
		}
	}

	if (sections.length === 0) return cleaned;

	const deduped = new Map<string, { heading: string; bodies: string[] }>();
	for (const sec of sections) {
		const body = sec.bodyLines.join('\n').trim();
		if (!body) continue;
		const key = sec.versionId || sec.heading;
		const existing = deduped.get(key);
		if (!existing) {
			deduped.set(key, { heading: sec.heading, bodies: [body] });
		} else if (!existing.bodies.includes(body)) {
			existing.bodies.push(body);
		}
	}

	return [...preamble.filter((l) => l.trim().length > 0), ...Array.from(deduped.values()).map((s) => `${s.heading}\n\n${s.bodies.join('\n\n')}`)].join('\n\n').trim();
}

function readLocalAppChangelog(appId: string): string | null {
	const cwd = process.cwd();
	const candidates = [
		path.resolve(cwd, '..', appId, 'CHANGELOG.md'),
		path.resolve(cwd, 'apps', appId, 'CHANGELOG.md'),
		path.resolve(cwd, '../../apps', appId, 'CHANGELOG.md'),
		...(appId === 'info' ? [path.resolve(cwd, 'CHANGELOG.md')] : []),
	];
	for (const filePath of candidates) {
		try {
			if (fs.existsSync(filePath)) {
				const raw = fs.readFileSync(filePath, 'utf8');
				const cleaned = cleanChangelogMarkdown(raw);
				if (cleaned) return cleaned;
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
		return typeof content === 'string' && content.trim().length > 0 ? cleanChangelogMarkdown(content) : null;
	} catch {
		return null;
	}
}

async function getPackageChangelogs(): Promise<ChangelogEntry[]> {
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

			if (!packagesMap.has(pkgName)) {
				packagesMap.set(pkgName, []);
			}
			packagesMap.get(pkgName)!.push(version);
		}

		const sortedPackages = Array.from(packagesMap.entries())
			.map(([name, versions]) => ({
				name,
				latestVersion: versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))[0],
			}))
			.sort((a, b) => {
				if (a.name === 'xernerx') return -1;
				if (b.name === 'xernerx') return 1;
				return a.name.localeCompare(b.name);
			});

		const pkgLogs = await Promise.all(
			sortedPackages.map(async (pkg): Promise<ChangelogEntry | null> => {
				try {
					const docRes = await fetch(`https://raw.githubusercontent.com/Xernerx/docs/main/packages/${pkg.name}/${pkg.latestVersion}/docs.json`, {
						next: { revalidate: 300 },
					});
					if (!docRes.ok) return null;
					const docData = await docRes.json();
					const changelogDoc = Array.isArray(docData?.documents) ? docData.documents.find((d: any) => d.name === 'CHANGELOG') : null;
					if (!changelogDoc || !Array.isArray(changelogDoc.content)) return null;

					const rawMarkdown = cleanChangelogMarkdown(changelogDoc.content.map((part: any) => part?.text || '').join(''));

					if (!rawMarkdown) return null;

					return {
						appName: pkg.name,
						content: rawMarkdown,
						group: 'packages',
						docsHref: `/packages/${pkg.name}/${pkg.latestVersion}`,
					};
				} catch {
					return null;
				}
			})
		);

		return pkgLogs.filter((entry): entry is ChangelogEntry => entry !== null);
	} catch {
		return [];
	}
}

async function getChangelogs(): Promise<ChangelogEntry[]> {
	const baseDomain = process.env.NEXT_PUBLIC_DOMAIN && !/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(process.env.NEXT_PUBLIC_DOMAIN) ? process.env.NEXT_PUBLIC_DOMAIN : 'xernerx.com';
	const isDevEnv = process.env.ENVIRONMENT?.toLowerCase() === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase() === 'development';

	const [appResults, pkgResults] = await Promise.all([
		Promise.all(
			APPS.map(async (app): Promise<ChangelogEntry | null> => {
				const fsContent = readLocalAppChangelog(app.id);
				if (fsContent) return { appName: app.name, content: fsContent, group: 'applications' };

				if (isDevEnv) {
					const localContent =
						(await fetchChangelogFromUrl(`http://localhost:${app.devPort}/api/changelog?version=all`, 2000)) ||
						(await fetchChangelogFromUrl(`http://127.0.0.1:${app.devPort}/api/changelog?version=all`, 2000));
					if (localContent) return { appName: app.name, content: localContent, group: 'applications' };
				}
				const canaryContent = await fetchChangelogFromUrl(`https://${app.id}.canary.${baseDomain}/api/changelog?version=all`);
				if (canaryContent) return { appName: app.name, content: canaryContent, group: 'applications' };

				const prodHost = app.id === 'www' ? `www.${baseDomain}` : `${app.id}.${baseDomain}`;
				const prodContent = await fetchChangelogFromUrl(`https://${prodHost}/api/changelog?version=all`);
				if (prodContent) return { appName: app.name, content: prodContent, group: 'applications' };

				return null;
			})
		),
		getPackageChangelogs(),
	]);

	return [...appResults.filter((entry): entry is ChangelogEntry => entry !== null), ...pkgResults];
}

export default async function ChangelogPage() {
	const changelogs = await getChangelogs();

	return (
		<>
			<SidebarTrigger />
			<ChangelogClient changelogs={changelogs} />
		</>
	);
}
