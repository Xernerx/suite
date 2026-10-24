/** @format */

import HomeClient, { ShowcasePackage } from '@/components/HomeClient';

const FALLBACK_SHOWCASE_PACKAGES: ShowcasePackage[] = [
	{
		name: 'xernerx',
		desc: 'Core command-line orchestration and ecosystem utilities for the Xernerx Suite.',
		link: 'https://docs.xernerx.com/packages/xernerx',
	},
	{
		name: '@xernerx/framework',
		desc: 'A modular, high-performance Discord.js v14 application framework with built-in command handlers, inhibitors, and multi-shard coordination.',
		link: 'https://docs.xernerx.com/packages/@xernerx/framework',
	},
	{
		name: '@xernerx/stats',
		desc: 'Lightweight daemon for real-time Discord bot statistics collection, automated telemetry snapshotting, and synchronization to the Xernerx API.',
		link: 'https://docs.xernerx.com/packages/@xernerx/stats',
	},
];

let cachedPackages: { data: ShowcasePackage[]; expiresAt: number } | null = null;
let inflightRefresh: Promise<ShowcasePackage[]> | null = null;

async function fetchShowcasePackagesFromRemote(): Promise<ShowcasePackage[]> {
	try {
		const res = await fetch('https://api.github.com/repos/Xernerx/docs/git/trees/main?recursive=1', {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
			},
			signal: AbortSignal.timeout(1500),
			next: { revalidate: 3600 },
		});

		if (!res.ok) return FALLBACK_SHOWCASE_PACKAGES;
		const data = await res.json();
		if (!data.tree) return FALLBACK_SHOWCASE_PACKAGES;

		const docsPaths = data.tree.filter((item: any) => item.path.startsWith('packages/') && item.path.endsWith('/docs.json'));
		const packagesMap = new Set<string>();
		for (const item of docsPaths) {
			const pathParts = item.path.replace('packages/', '').replace('/docs.json', '').split('/');
			pathParts.pop(); // remove version
			packagesMap.add(pathParts.join('/'));
		}

		const pkgs = await Promise.all(
			Array.from(packagesMap).map(async (name) => {
				let desc: string | undefined;

				try {
					const npmRes = await fetch(`https://registry.npmjs.org/${name}`, {
						signal: AbortSignal.timeout(1200),
						next: { revalidate: 3600 },
					});
					if (npmRes.ok) {
						const npmData = await npmRes.json();
						let parsedDesc = npmData.description;

						if (npmData.readme) {
							const lines = npmData.readme.split('\n').map((l: string) => l.trim());
							const aboutIndex = lines.findIndex((l: string) => l.toLowerCase() === '# about');
							const searchLines = aboutIndex !== -1 ? lines.slice(aboutIndex + 1) : lines;

							const firstRealLine = searchLines.find(
								(l: string) => l.length > 0 && !l.startsWith('#') && !l.startsWith('<') && !l.startsWith('!') && !l.startsWith('[') && !l.startsWith('>') && !l.startsWith('<!--')
							);

							if (firstRealLine) {
								parsedDesc = firstRealLine.replace(/\*|\_|\`/g, '');
							}
						}

						if (parsedDesc && !parsedDesc.includes('<!-- @format -->')) {
							desc = parsedDesc;
						}
					}
				} catch {
					// ignore
				}

				return {
					name,
					desc,
					link: `https://docs.xernerx.com/packages/${name}`,
				};
			})
		);

		const finalPkgs = pkgs.length > 0 ? pkgs : FALLBACK_SHOWCASE_PACKAGES;
		cachedPackages = { data: finalPkgs, expiresAt: Date.now() + 3600_000 };
		return finalPkgs;
	} catch {
		return cachedPackages?.data || FALLBACK_SHOWCASE_PACKAGES;
	}
}

async function getShowcasePackages(): Promise<ShowcasePackage[]> {
	const now = Date.now();
	if (cachedPackages && now < cachedPackages.expiresAt) {
		return cachedPackages.data;
	}

	if (!inflightRefresh) {
		inflightRefresh = fetchShowcasePackagesFromRemote().finally(() => {
			inflightRefresh = null;
		});
	}

	if (cachedPackages) {
		return cachedPackages.data;
	}

	return Promise.race([inflightRefresh, new Promise<ShowcasePackage[]>((resolve) => setTimeout(() => resolve(FALLBACK_SHOWCASE_PACKAGES), 150))]);
}

export default async function Home() {
	const initialPackages = await getShowcasePackages();
	return <HomeClient initialPackages={initialPackages} />;
}
