/** @format */
// Force recompile

import type { Metadata } from 'next';
import { PackageDetailsClient } from '@/components/packages/PackageDetailsClient';

export async function generateMetadata({ params }: { params: Promise<{ package: string[] }> }): Promise<Metadata> {
	const resolvedParams = await params;
	const pkgParts = [...resolvedParams.package];
	const version = pkgParts.pop() || 'latest';
	const pkgName = decodeURIComponent(pkgParts.join('/'));
	const canonicalPath = `/packages/${pkgParts.join('/')}/${version}`;
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
			headers: {
				Accept: 'application/vnd.github.v3+json',
				...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
			},
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
