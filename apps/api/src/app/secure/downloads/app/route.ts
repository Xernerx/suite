/** @format */

import { NextResponse } from 'next/server';

export async function GET() {
	try {
		// Fetch the latest release from the GitHub repository
		const response = await fetch('https://api.github.com/repos/Xernerx/suite/releases/latest', {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				// Optional: If you hit GitHub rate limits, add a GITHUB_TOKEN to your environment variables
				...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
			},
			next: { revalidate: 3600 }, // Cache the release data for 1 hour to prevent hitting GitHub rate limits
		});

		if (!response.ok) {
			return NextResponse.json({ error: 'Failed to fetch latest release from GitHub' }, { status: response.status });
		}

		const release = await response.json();

		console.log(release);

		const assets = release.assets || [];

		let windows: Record<string, string> | null = null;
		let macos: Record<string, string> | null = null;
		let linux: Record<string, string> | null = null;

		// Loop through the assets to match platforms, ignoring blockmaps
		for (const asset of assets) {
			const name = asset.name.toLowerCase();
			const browser_download_url = asset.browser_download_url;

			if (name.includes('blockmap')) continue;

			// Match Windows (e.g., .exe, .msi)
			if (name.endsWith('.exe') || name.endsWith('.msi') || name.includes('win')) {
				windows = { browser_download_url, name: asset.name };
			}
			// Match macOS (e.g., .dmg, .pkg, or mac zips)
			else if (name.endsWith('.dmg') || name.endsWith('.pkg') || name.includes('mac') || name.includes('darwin')) {
				macos = { browser_download_url, name: asset.name };
			}
			// Match Linux (e.g., .AppImage, .deb, .rpm)
			else if (name.endsWith('.appimage') || name.endsWith('.deb') || name.endsWith('.rpm') || name.includes('linux')) {
				linux = { browser_download_url, name: asset.name };
			}
		}

		return NextResponse.json({
			windows,
			macos,
			linux,
		});
	} catch (error) {
		console.error('Error fetching release assets:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
