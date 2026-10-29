/** @format */

import HomeClient, { ShowcasePackage } from '@/components/HomeClient';

const FALLBACK_SHOWCASE_PACKAGES: ShowcasePackage[] = [
	{
		name: 'xernerx',
		desc: 'The official all-in-one Xernerx Suite SDK, CLI (create-xernerx-app), and bot framework bundling and re-exporting all @xernerx/* packages.',
		link: 'https://docs.xernerx.com/packages/xernerx',
	},
	{
		name: '@xernerx/framework',
		desc: 'A modular, high-performance Discord.js v14 application framework with built-in command handlers, engagement validators, inhibitors, and multi-shard coordination.',
		link: 'https://docs.xernerx.com/packages/@xernerx/framework',
	},
	{
		name: '@xernerx/commands',
		desc: 'Extension for @xernerx/framework containing Jishaku-inspired developer commands (xc!, evaluate, ping, shell, git, source, debug, repeat, su/sudo, transpile, haste, documentation) and automatic command synchronization.',
		link: 'https://docs.xernerx.com/packages/@xernerx/commands',
	},
	{
		name: '@xernerx/hooks',
		desc: 'First-party webhook receiver and user engagement cache (voted, reviewed, tipped) with HMAC-SHA256 verification and @xernerx/framework extension support.',
		link: 'https://docs.xernerx.com/packages/@xernerx/hooks',
	},
	{
		name: '@xernerx/stats',
		desc: 'Official SDK for real-time Discord bot statistics collection, automated telemetry snapshotting, and synchronization to the Xernerx API.',
		link: 'https://docs.xernerx.com/packages/@xernerx/stats',
	},
	{
		name: '@xernerx/websocket',
		desc: 'Universal client library for connecting, authenticating, and making RPC queries against the Xernerx WebSocket microservice router.',
		link: 'https://docs.xernerx.com/packages/@xernerx/websocket',
	},
	{
		name: '@xernerx/terminal',
		desc: 'Structured ANSI terminal logger, child-scope formatters, and interactive CLI spinners for Xernerx services and Discord bots.',
		link: 'https://docs.xernerx.com/packages/@xernerx/terminal',
	},
	{
		name: '@xernerx/extension-builder',
		desc: 'Base ExtensionBuilder lifecycle and EventEmitter architecture for building modular @xernerx/framework extensions.',
		link: 'https://docs.xernerx.com/packages/@xernerx/extension-builder',
	},
];

const FALLBACK_PACKAGE_DESC_MAP = new Map<string, string>(FALLBACK_SHOWCASE_PACKAGES.filter((p) => p.desc).map((p) => [p.name, p.desc!]));

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
		const packagesMap = new Set<string>(FALLBACK_SHOWCASE_PACKAGES.map((p) => p.name));
		for (const item of docsPaths) {
			const pathParts = item.path.replace('packages/', '').replace('/docs.json', '').split('/');
			pathParts.pop(); // remove version
			const pkgName = pathParts.join('/');
			if (pkgName && (pkgName === 'xernerx' || pkgName.startsWith('@xernerx/'))) {
				packagesMap.add(pkgName);
			}
		}

		const pkgs = await Promise.all(
			Array.from(packagesMap).map(async (name) => {
				let desc: string | undefined = FALLBACK_PACKAGE_DESC_MAP.get(name);

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

						if (parsedDesc && !parsedDesc.includes('<!-- @format -->') && parsedDesc.length > 25) {
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
