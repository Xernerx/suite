/** @format */

import HomeClient, { ShowcasePackage } from '@/components/HomeClient';

async function getShowcasePackages(): Promise<ShowcasePackage[]> {
	try {
		const res = await fetch('https://api.github.com/repos/Xernerx/docs/git/trees/main?recursive=1', {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
			},
			next: { revalidate: 3600 },
		});

		if (!res.ok) return [];
		const data = await res.json();
		if (!data.tree) return [];

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

		return pkgs;
	} catch {
		return [];
	}
}

export default async function Home() {
	const initialPackages = await getShowcasePackages();
	return <HomeClient initialPackages={initialPackages} />;
}
