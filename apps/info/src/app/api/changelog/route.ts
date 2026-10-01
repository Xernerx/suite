/** @format */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const requestedVersion = url.searchParams.get('version');

		const filePath = path.join(process.cwd(), 'CHANGELOG.md');
		const content = fs.readFileSync(filePath, 'utf8');

		// Split file by version headers (e.g., # 0.2.27 or ## 0.2.27)
		const versionRegex = /^#{1,3}\s+(?:\[?v?([\d.-]+\w*)\]?|([\d.-]+\w*))/gm;
		const matches = [...content.matchAll(versionRegex)];

		const versions: string[] = [];
		const parsedSections: { version: string; content: string }[] = [];

		for (let i = 0; i < matches.length; i++) {
			const currentMatch = matches[i];
			const version = currentMatch[1] || currentMatch[2];
			versions.push(version);

			const startIndex = currentMatch.index!;
			const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
			const sectionContent = content.slice(startIndex, endIndex).trim();

			parsedSections.push({ version, content: sectionContent });
		}

		if (parsedSections.length === 0) {
			return NextResponse.json({
				versions: ['latest'],
				selectedVersion: 'latest',
				content: content.trim(),
			});
		}

		if (requestedVersion) {
			const found = parsedSections.find((s) => s.version === requestedVersion);
			if (found) {
				return NextResponse.json({
					versions,
					selectedVersion: found.version,
					content: found.content,
				});
			}
		}

		// Default to the latest version
		return NextResponse.json({
			versions,
			selectedVersion: parsedSections[0].version,
			content: parsedSections[0].content,
		});
	} catch {
		return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
	}
}
