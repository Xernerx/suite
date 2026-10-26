/** @format */
// Force recompile

import type { Metadata } from 'next';
import { PackageDetailsClient } from '@/components/packages/PackageDetailsClient';

function parsePackageRouteSegments(segments: string[]): { pkgName: string; version: string | null } {
	const decoded = segments.map((s) => decodeURIComponent(s));
	if (decoded.length === 0) return { pkgName: '', version: null };

	const last = decoded[decoded.length - 1];
	const isVersionSegment = /^\d+\.\d+/.test(last) || last === 'latest';

	if (isVersionSegment && decoded.length >= 2) {
		return {
			pkgName: decoded.slice(0, -1).join('/'),
			version: last === 'latest' ? null : last,
		};
	}

	return {
		pkgName: decoded.join('/'),
		version: null,
	};
}

async function getAvailableVersions(pkgName: string): Promise<string[]> {
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
		if (!data.tree) return [];

		const versions = data.tree
			.filter((item: any) => item.path.startsWith(`packages/${pkgName}/`) && item.path.endsWith('/docs.json'))
			.map((item: any) => item.path.replace(`packages/${pkgName}/`, '').replace('/docs.json', ''));

		return versions.sort((a: string, b: string) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
	} catch {
		return [];
	}
}

async function getPackageData(pkgName: string, version: string) {
	try {
		const res = await fetch(`https://raw.githubusercontent.com/Xernerx/docs/main/packages/${pkgName}/${version}/docs.json`, {
			next: { revalidate: 300 },
		});
		if (!res.ok) return null;
		return await res.json();
	} catch (e) {
		console.error('Failed to fetch package data:', e);
		return null;
	}
}

export async function generateMetadata({ params }: { params: Promise<{ package: string[] }> }): Promise<Metadata> {
	const resolvedParams = await params;
	const { pkgName, version: parsedVersion } = parsePackageRouteSegments(resolvedParams.package || []);
	const version = parsedVersion || 'latest';
	const canonicalPath = `/packages/${pkgName}/${version}`;
	const title = `${pkgName} (${version}) — Package Reference`;
	const description = `Official TypeScript API documentation, classes, methods, and usage examples for ${pkgName} version ${version} by Xernerx Studios.`;

	return {
		title,
		description,
		alternates: { canonical: canonicalPath },
		openGraph: {
			title: `Xernerx Docs | ${title}`,
			description,
			url: `https://docs.xernerx.com${canonicalPath}`,
			siteName: 'Xernerx Docs',
			images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${pkgName} Documentation` }],
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: `Xernerx Docs | ${title}`,
			description,
			images: ['/opengraph-image'],
		},
	};
}

export default async function PackageDetails({ params }: { params: Promise<{ package: string[] }> }) {
	const resolvedParams = await params;
	const { pkgName, version: parsedVersion } = parsePackageRouteSegments(resolvedParams.package || []);
	const availableVersions = await getAvailableVersions(pkgName);
	const resolvedVersion = parsedVersion || availableVersions[0] || 'latest';
	const data = await getPackageData(pkgName, resolvedVersion);

	return <PackageDetailsClient data={data} availableVersions={availableVersions} pkgName={pkgName} version={resolvedVersion} />;
}
