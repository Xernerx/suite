/** @format */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Cache-Control': 'no-store, max-age=0',
};

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const requestedVersion = url.searchParams.get('version');

		const filePath = path.join(process.cwd(), 'CHANGELOG.md');
		const content = fs.readFileSync(filePath, 'utf8');

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

		if (parsedSections.length === 0 || requestedVersion === 'all') {
			return NextResponse.json(
				{
					versions: versions.length > 0 ? versions : ['latest'],
					selectedVersion: requestedVersion === 'all' ? 'all' : 'latest',
					content: content.trim(),
					fullContent: content.trim(),
				},
				{ headers: CORS_HEADERS }
			);
		}

		if (requestedVersion) {
			const found = parsedSections.find((s) => s.version === requestedVersion);
			if (found) {
				return NextResponse.json(
					{
						versions,
						selectedVersion: found.version,
						content: found.content,
						fullContent: content.trim(),
					},
					{ headers: CORS_HEADERS }
				);
			}
		}

		return NextResponse.json(
			{
				versions,
				selectedVersion: parsedSections[0].version,
				content: parsedSections[0].content,
				fullContent: content.trim(),
			},
			{ headers: CORS_HEADERS }
		);
	} catch {
		return NextResponse.json({ versions: [], selectedVersion: null, content: '', fullContent: '' }, { headers: CORS_HEADERS });
	}
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
