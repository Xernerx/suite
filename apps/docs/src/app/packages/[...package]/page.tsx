/** @format */
// Force recompile

import { PackageDetailsClient } from './PackageDetailsClient';

async function getPackageData(pkgName: string, version: string) {
	try {
		const res = await fetch(`https://raw.githubusercontent.com/Xernerx/docs/main/packages/${pkgName}/${version}/docs.json`, {
			next: { revalidate: 3600 },
		});
		if (!res.ok) return null;
		return await res.json();
	} catch (e) {
		console.error('Failed to fetch package data:', e);
		return null;
	}
}

async function getAvailableVersions(pkgName: string) {
	try {
		const res = await fetch('https://api.github.com/repos/Xernerx/docs/git/trees/main?recursive=1', {
			next: { revalidate: 3600 },
		});
		const data = await res.json();
		if (!data.tree) return [];

		const versions = data.tree
			.filter((item: any) => item.path.startsWith(`packages/${pkgName}/`) && item.path.endsWith('/docs.json'))
			.map((item: any) => item.path.replace(`packages/${pkgName}/`, '').replace('/docs.json', ''));

		return versions.sort((a: string, b: string) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
	} catch {
		return [];
	}
}

export default async function PackageDetails({ params }: { params: Promise<{ package: string[] }> }) {
	const resolvedParams = await params;
	const pkgParts = [...resolvedParams.package];
	const version = pkgParts.pop()!;
	const pkgName = decodeURIComponent(pkgParts.join('/'));

	const [data, availableVersions] = await Promise.all([getPackageData(pkgName, version), getAvailableVersions(pkgName)]);

	return <PackageDetailsClient data={data} availableVersions={availableVersions} pkgName={pkgName} version={version} />;
}
