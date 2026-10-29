/** @format */

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const channel = searchParams.get('channel');

		// Use the canary tag release if requested, otherwise default to latest stable
		const githubUrl = channel === 'canary' ? 'https://api.github.com/repos/Xernerx/suite/releases/tags/canary' : 'https://api.github.com/repos/Xernerx/suite/releases/latest';
		const githubToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;

		// Fetch the release from the GitHub repository
		const response = await fetch(githubUrl, {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
			},
			next: { revalidate: 60 }, // Cache release data
		});

		if (!response.ok) {
			return NextResponse.json({ error: 'Failed to fetch release from GitHub' }, { status: response.status });
		}

		const release = await response.json();

		const assets = release.assets || [];

		let windows: Record<string, string | number> | null = null;
		let macos: Record<string, string | number> | null = null;
		let linux: Record<string, string | number> | null = null;
		let extractedVersion: string | null = null;

		// Loop through the assets to match platforms, ignoring blockmaps and metadata yml files
		for (const asset of assets) {
			const name = asset.name.toLowerCase();
			const browser_download_url = asset.browser_download_url;
			const size = typeof asset.size === 'number' ? asset.size : 0;

			if (!extractedVersion && typeof asset.name === 'string') {
				const verMatch = asset.name.match(/Xernerx[\s_-]*App-(.+)-setup\./i);
				if (verMatch?.[1]) {
					extractedVersion = verMatch[1].trim();
				}
			}

			if (name.includes('blockmap') || name.endsWith('.yml')) continue;

			// Match Windows (e.g., .exe, .msi)
			if (name.endsWith('.exe') || name.endsWith('.msi') || name.includes('win')) {
				windows = { browser_download_url, url: browser_download_url, name: asset.name, size };
			}
			// Match macOS (e.g., .dmg, .pkg, or mac zips)
			else if (name.endsWith('.dmg') || name.endsWith('.pkg') || name.includes('mac') || name.includes('darwin')) {
				macos = { browser_download_url, url: browser_download_url, name: asset.name, size };
			}
			// Match Linux (e.g., .AppImage, .deb, .rpm)
			else if (name.endsWith('.appimage') || name.endsWith('.deb') || name.includes('rpm') || name.includes('linux')) {
				linux = { browser_download_url, url: browser_download_url, name: asset.name, size };
			}
		}

		if (!extractedVersion) {
			const rawTag = String(release.tag_name || release.name || '').trim();
			const cleaned = rawTag
				.replace(/^Desktop\s+/i, '')
				.replace(/^desktop@/i, '')
				.replace(/^v/i, '')
				.trim();
			if (cleaned && cleaned !== 'canary') {
				extractedVersion = cleaned;
			}
		}

		return NextResponse.json({
			version: extractedVersion,
			tagName: release.tag_name || null,
			publishedAt: release.published_at || null,
			windows,
			macos,
			linux,
		});
	} catch (error) {
		console.error('Error fetching release assets:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
