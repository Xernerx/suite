/** @format */

import { Metadata } from 'next';
import ChangelogClient from '@/components/changelog/ChangelogClient';
import SidebarTrigger from '@/components/changelog/SidebarTrigger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Platform Changelog & Release Notes',
	description: 'Explore the latest feature updates, version history, security patches, and release notes across the entire Xernerx Studios suite ecosystem.',
	alternates: { canonical: '/changelog' },
	openGraph: {
		title: 'Xernerx Support | Platform Changelog & Release Notes',
		description: 'Explore the latest feature updates, version history, security patches, and release notes across the entire Xernerx Studios suite ecosystem.',
		url: 'https://info.xernerx.com/changelog',
		siteName: 'Xernerx Support & Info',
		images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Xernerx Support — Changelog & Release Notes' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Xernerx Support | Platform Changelog & Release Notes',
		description: 'Explore the latest feature updates, version history, security patches, and release notes across the entire Xernerx Studios suite ecosystem.',
		images: ['/opengraph-image'],
	},
};

const APPS = [
	{ id: 'app', name: 'App', devPort: 4004 },
	{ id: 'account', name: 'Account', devPort: 4003 },
	{ id: 'admin', name: 'Admin', devPort: 4006 },
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

async function getChangelogs() {
	const baseDomain = process.env.NEXT_PUBLIC_DOMAIN && !/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(process.env.NEXT_PUBLIC_DOMAIN) ? process.env.NEXT_PUBLIC_DOMAIN : 'xernerx.com';
	const isDevEnv = process.env.ENVIRONMENT?.toLowerCase() === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase() === 'development';

	const results = await Promise.all(
		APPS.map(async (app) => {
			if (isDevEnv) {
				const localContent = await fetchChangelogFromUrl(`http://127.0.0.1:${app.devPort}/api/changelog?version=all`, 2000);
				if (localContent) return { appName: app.name, content: localContent };
			}
			const canaryContent = await fetchChangelogFromUrl(`https://${app.id}.canary.${baseDomain}/api/changelog?version=all`);
			if (canaryContent) return { appName: app.name, content: canaryContent };

			const prodHost = app.id === 'www' ? `www.${baseDomain}` : `${app.id}.${baseDomain}`;
			const prodContent = await fetchChangelogFromUrl(`https://${prodHost}/api/changelog?version=all`);
			if (prodContent) return { appName: app.name, content: prodContent };

			return null;
		})
	);

	return results.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
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
