/** @format */
'use server';

import { dictionary, locales } from '@xernerx/lib/server';

import { NextResponse } from 'next/server';

type Locale = (typeof locales)[number];

export async function GET(req: Request, { params }: { params: Promise<{ language: string }> }) {
	const { language } = await params;

	if (!language) {
		return NextResponse.json({ error: 'Language parameter is required' }, { status: 400 });
	}

	if (!(locales as readonly string[]).includes(language)) {
		return NextResponse.json({ error: `Language '${language}' is not supported` }, { status: 400 });
	}

	const validLanguage = language as Locale;

	try {
		const data = await dictionary(validLanguage);
		return NextResponse.json(data);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ language: string }> }) {
	const { language } = await params;

	if (!language) {
		return NextResponse.json({ error: 'Language parameter is required' }, { status: 400 });
	}

	if (!(locales as readonly string[]).includes(language)) {
		return NextResponse.json({ error: `Language '${language}' is not supported` }, { status: 400 });
	}

	const validLanguage = language as Locale;

	try {
		const body = await req.json();
		const updatedDictionary = body.dictionary || body;

		const owner = process.env.GITHUB_REPO_OWNER; // e.g. your GitHub username or org
		const repo = process.env.GITHUB_REPO_NAME; // e.g. your repository name
		const token = process.env.GITHUB_PAT; // GitHub Personal Access Token with repo scope
		const branch = 'dictionary'; // Target branch

		const filePath = `packages/lib/src/dictionaries/${validLanguage}.json`;
		const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

		// 1. Get the current file SHA from GitHub (required for updates)
		const existingFileRes = await fetch(`${url}?ref=${branch}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'vnd.github+json',
			},
		});

		let fileSha: string | undefined;
		if (existingFileRes.ok) {
			const fileData = await existingFileRes.json();
			fileSha = fileData.sha;
		}

		// 2. Format JSON string and encode to Base64
		const fileContent = JSON.stringify(updatedDictionary, null, 4) + '\n';
		const encodedContent = Buffer.from(fileContent).toString('base64');

		// 3. Push commit via GitHub Contents API
		const updateRes = await fetch(url, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'vnd.github+json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				message: `chore(i18n): update translations for ${validLanguage}`,
				content: encodedContent,
				sha: fileSha,
				branch: branch,
			}),
		});

		if (!updateRes.ok) {
			const errData = await updateRes.json();
			throw new Error(errData.message || 'Failed to commit to GitHub');
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
