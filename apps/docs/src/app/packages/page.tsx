/** @format */
// Force recompile
import { PackagesPageClient } from '@/components/packages/PackagesPageClient';
import { SearchIndexItem } from '@/components/packages/PackagesSearch';

const FALLBACK_PACKAGE_DESCRIPTIONS: Record<string, string> = {
	xernerx: 'The official all-in-one Xernerx Suite SDK, CLI (create-xernerx-app), and bot framework bundling and re-exporting all @xernerx/* packages.',
	'@xernerx/framework': 'A modular, high-performance Discord.js v14 application framework with built-in command handlers, engagement validators, inhibitors, and multi-shard coordination.',
	'@xernerx/commands': 'Built-in developer message command suite and automated slash/context command synchronization client for Discord bots on the Xernerx Suite API.',
	'@xernerx/hooks': 'First-party webhook receiver and user engagement cache (voted, reviewed, tipped) with HMAC-SHA256 verification and @xernerx/framework extension support.',
	'@xernerx/stats': 'Lightweight daemon and REST client for real-time Discord bot statistics collection, automated telemetry snapshotting, and synchronization to the Xernerx API.',
	'@xernerx/terminal': 'Structured ANSI terminal logger, child-scope formatters, and interactive CLI spinners for Xernerx services and Discord bots.',
	'@xernerx/websocket': 'Universal client library for connecting, authenticating, and making RPC queries against the Xernerx WebSocket microservice router.',
	'@xernerx/extension-builder': 'Base ExtensionBuilder lifecycle and EventEmitter architecture for building modular @xernerx/framework extensions.',
};

// Recursively extract all items of a specific kind (reusing logic from package renderer)
const extractItems = (node: any, targetKind: number): any[] => {
	let items: any[] = [];
	if (node.kind === targetKind) items.push(node);
	if (node.children && Array.isArray(node.children)) {
		for (const child of node.children) {
			items = items.concat(extractItems(child, targetKind));
		}
	}
	return items;
};

async function getPackages() {
	try {
		const ghToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
		const res = await fetch('https://api.github.com/repos/Xernerx/docs/git/trees/main?recursive=1', {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				...(ghToken ? { Authorization: `Bearer ${ghToken}` } : {}),
			},
			next: { revalidate: 300 },
		});
		const data = await res.json();

		if (!data.tree) return { packages: [], index: [] };

		const docsPaths = data.tree.filter((item: any) => item.path.startsWith('packages/') && item.path.endsWith('/docs.json'));

		// Parse packages and versions (supporting both unscoped `xernerx` and scoped `@xernerx/*`)
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

		const packages = Array.from(packagesMap.entries())
			.map(([name, versions]) => ({
				name,
				isCollection: name === 'xernerx',
				bundledPackages:
					name === 'xernerx' ? ['@xernerx/framework', '@xernerx/commands', '@xernerx/hooks', '@xernerx/stats', '@xernerx/terminal', '@xernerx/websocket', '@xernerx/extension-builder'] : [],
				versions: versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' })),
			}))
			.sort((a, b) => {
				if (a.name === 'xernerx') return -1;
				if (b.name === 'xernerx') return 1;
				return a.name.localeCompare(b.name);
			});

		// Build search index from latest versions
		const searchIndex: SearchIndexItem[] = [];

		const packagesWithMeta = await Promise.all(
			packages.map(async (pkg) => {
				const latestVersion = pkg.versions[0];
				let description = FALLBACK_PACKAGE_DESCRIPTIONS[pkg.name] || 'Official documentation and references for this NPM package.';
				let hasChangelog = false;

				if (pkg.name !== 'xernerx') {
					try {
						const npmRes = await fetch(`https://registry.npmjs.org/${pkg.name}`, { next: { revalidate: 3600 } });
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
								description = parsedDesc;
							}
						}
					} catch {
						// ignore
					}
				}

				try {
					const docRes = await fetch(`https://raw.githubusercontent.com/Xernerx/docs/main/packages/${pkg.name}/${latestVersion}/docs.json`, {
						next: { revalidate: 300 },
					});
					if (!docRes.ok) return { ...pkg, description, hasChangelog };
					const docData = await docRes.json();

					hasChangelog = Array.isArray(docData.documents) && docData.documents.some((d: any) => d.name === 'CHANGELOG');

					const classes = extractItems(docData, 128); // 128 = Class
					const interfaces = extractItems(docData, 256); // 256 = Interface
					const functions = extractItems(docData, 64); // 64 = Function

					classes.forEach((c) =>
						searchIndex.push({ name: c.name, kind: 'Class', packageName: pkg.name, version: latestVersion, href: `/packages/${pkg.name}/${latestVersion}#class-${c.name}` })
					);
					interfaces.forEach((i) =>
						searchIndex.push({ name: i.name, kind: 'Interface', packageName: pkg.name, version: latestVersion, href: `/packages/${pkg.name}/${latestVersion}#interface-${i.name}` })
					);
					functions.forEach((f) =>
						searchIndex.push({ name: f.name, kind: 'Function', packageName: pkg.name, version: latestVersion, href: `/packages/${pkg.name}/${latestVersion}#function-${f.name}` })
					);
				} catch (e) {
					console.error(`Failed to build index for ${pkg.name}`, e);
				}
				return { ...pkg, description, hasChangelog };
			})
		);

		return { packages: packagesWithMeta, index: searchIndex };
	} catch (e) {
		console.error('Failed to get packages', e);
		return { packages: [], index: [] };
	}
}

export default async function PackagesPage() {
	const { packages, index } = await getPackages();
	return <PackagesPageClient packages={packages} index={index} />;
}
