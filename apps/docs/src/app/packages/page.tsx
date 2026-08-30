/** @format */
// Force recompile
import { PackagesPageClient } from './PackagesPageClient';
import { SearchIndexItem } from './PackagesSearch';

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
		const res = await fetch('https://api.github.com/repos/Xernerx/docs/git/trees/main?recursive=1', {
			next: { revalidate: 3600 },
		});
		const data = await res.json();

		if (!data.tree) return { packages: [], index: [] };

		const docsPaths = data.tree.filter((item: any) => item.path.startsWith('packages/') && item.path.endsWith('/docs.json'));

		// Parse packages and versions
		const packagesMap = new Map<string, string[]>();

		for (const item of docsPaths) {
			const pathParts = item.path.replace('packages/', '').replace('/docs.json', '').split('/');
			const version = pathParts.pop()!;
			const pkgName = pathParts.join('/');

			if (!packagesMap.has(pkgName)) {
				packagesMap.set(pkgName, []);
			}
			packagesMap.get(pkgName)!.push(version);
		}

		const packages = Array.from(packagesMap.entries()).map(([name, versions]) => ({
			name,
			versions: versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' })),
		}));

		// Build search index from latest versions
		const searchIndex: SearchIndexItem[] = [];

		const packagesWithMeta = await Promise.all(
			packages.map(async (pkg) => {
				const latestVersion = pkg.versions[0];
				let description = 'Official documentation and references for this NPM package.';

				try {
					const npmRes = await fetch(`https://registry.npmjs.org/${pkg.name}`, { next: { revalidate: 3600 } });
					if (npmRes.ok) {
						const npmData = await npmRes.json();
						let parsedDesc = npmData.description;

						// Fallback to extracting the first real text line from the README
						if (npmData.readme) {
							const lines = npmData.readme.split('\n').map((l: string) => l.trim());
							// Try to find the line after `# About`, otherwise just find the first text paragraph
							const aboutIndex = lines.findIndex((l: string) => l.toLowerCase() === '# about');
							const searchLines = aboutIndex !== -1 ? lines.slice(aboutIndex + 1) : lines;

							const firstRealLine = searchLines.find(
								(l: string) => l.length > 0 && !l.startsWith('#') && !l.startsWith('<') && !l.startsWith('!') && !l.startsWith('[') && !l.startsWith('>') && !l.startsWith('<!--')
							);

							if (firstRealLine) {
								parsedDesc = firstRealLine.replace(/\*|\_|\`/g, ''); // strip basic markdown
							}
						}

						if (parsedDesc && !parsedDesc.includes('<!-- @format -->')) {
							description = parsedDesc;
						}
					}
				} catch (e) {
					// ignore
				}

				try {
					const docRes = await fetch(`https://raw.githubusercontent.com/Xernerx/docs/main/packages/${pkg.name}/${latestVersion}/docs.json`, {
						next: { revalidate: 3600 },
					});
					if (!docRes.ok) return { ...pkg, description };
					const docData = await docRes.json();

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
				return { ...pkg, description };
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
