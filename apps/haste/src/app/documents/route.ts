/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

const MAX_HASTE_BYTES = 512 * 1024;

const LANGUAGE_ALIASES: Record<string, string> = {
	ts: 'typescript',
	tsx: 'typescript',
	js: 'javascript',
	jsx: 'javascript',
	mjs: 'javascript',
	cjs: 'javascript',
	py: 'python',
	sh: 'bash',
	shell: 'bash',
	md: 'markdown',
	yml: 'yaml',
	rs: 'rust',
	cs: 'csharp',
	txt: 'plaintext',
};

function normalizeLanguage(raw?: string | null): string {
	if (!raw) return 'plaintext';
	const clean = String(raw).trim().toLowerCase();
	return LANGUAGE_ALIASES[clean] || clean || 'plaintext';
}

function unwrapFence(raw: string): { content: string; detectedLanguage?: string } {
	const trimmed = raw.trim();
	const match = trimmed.match(/^```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)\r?\n?```$/);
	if (match) {
		return {
			content: match[2],
			detectedLanguage: match[1] ? normalizeLanguage(match[1]) : undefined,
		};
	}
	return { content: raw };
}

function computeExpiresAt(expiresIn: string): Date | null {
	const now = Date.now();
	if (expiresIn === '1h') return new Date(now + 60 * 60 * 1000);
	if (expiresIn === '24h') return new Date(now + 24 * 60 * 60 * 1000);
	if (expiresIn === '30d') return new Date(now + 30 * 24 * 60 * 60 * 1000);
	if (expiresIn === 'never') return null;
	return new Date(now + 7 * 24 * 60 * 60 * 1000);
}

function generateId(length = 10): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = crypto.randomBytes(length);
	let id = '';
	for (let i = 0; i < length; i++) id += alphabet[bytes[i] % alphabet.length];
	return id;
}

export async function createHasteFromRequest(req: Request, pathUserId?: string) {
	const contentType = (req.headers.get('content-type') || '').toLowerCase();
	const rawText = await req.text();

	let bodyUserId: string | null = pathUserId || null;
	let rawContent = rawText;
	let title = '';
	let explicitLang: string | null = null;
	let explicitPrivacy: string | null = null;
	let explicitExpiresIn: string | null = null;

	if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
		try {
			const parsed = JSON.parse(rawText);
			if (parsed && typeof parsed === 'object' && ('content' in parsed || 'code' in parsed || 'text' in parsed)) {
				rawContent = String(parsed.content ?? parsed.code ?? parsed.text ?? '');
				bodyUserId = bodyUserId || parsed.userId || parsed.user || parsed.owner || null;
				title = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 120) : '';
				explicitLang = parsed.language || parsed.lang || null;
				explicitPrivacy = parsed.privacy || null;
				explicitExpiresIn = parsed.expiresIn || parsed.expiration || null;
			}
		} catch {}
	}

	const url = new URL(req.url);
	const authHeader = req.headers.get('authorization');
	const bearerId = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

	let userId =
		bodyUserId ||
		url.searchParams.get('userId') ||
		url.searchParams.get('user') ||
		url.searchParams.get('owner') ||
		req.headers.get('x-user-id') ||
		(bearerId && /^\d{15,22}$/.test(bearerId) ? bearerId : null);

	if (!userId) {
		try {
			const session = (await getServerSession(auth)) as any;
			if (session?.user?.id) userId = String(session.user.id);
		} catch {}
	}

	if (!userId) {
		return NextResponse.json({ error: 'Missing userId. Pass your Xernerx user ID via ?userId=..., /documents/[userId], x-user-id header, or body.userId.' }, { status: 401 });
	}

	const cleanUserId = String(userId).trim();
	const xernerxDb = await database('xernerx');
	const userExists = await xernerxDb.models.users?.User?.exists({ id: cleanUserId }).catch(() => null);
	if (!userExists) {
		return NextResponse.json({ error: `User ID '${cleanUserId}' is not registered as a Xernerx user.` }, { status: 403 });
	}

	const { content, detectedLanguage } = unwrapFence(rawContent);
	if (!content || !content.trim()) {
		return NextResponse.json({ error: 'Haste content cannot be empty.' }, { status: 400 });
	}

	const byteSize = Buffer.byteLength(content, 'utf8');
	if (byteSize > MAX_HASTE_BYTES) {
		return NextResponse.json({ error: 'Haste content exceeds maximum allowed size of 512 KB.' }, { status: 413 });
	}

	const language = normalizeLanguage(explicitLang || url.searchParams.get('language') || detectedLanguage);
	const rawPriv = explicitPrivacy || url.searchParams.get('privacy');
	const privacy = rawPriv === 'public' || rawPriv === 'limited' || rawPriv === 'private' ? rawPriv : 'limited';
	const rawExp = explicitExpiresIn || url.searchParams.get('expiresIn');
	const expiresIn = rawExp === '1h' || rawExp === '24h' || rawExp === '7d' || rawExp === '30d' || rawExp === 'never' ? rawExp : '7d';
	const expiresAt = computeExpiresAt(expiresIn);

	const { models } = await database('haste');
	const DocumentModel = models.documents?.Document;
	if (!DocumentModel) {
		return NextResponse.json({ error: 'Haste database model unavailable' }, { status: 500 });
	}

	let id = generateId(10);
	for (let attempt = 0; attempt < 4; attempt++) {
		const exists = await DocumentModel.exists({ id });
		if (!exists) break;
		id = generateId(10);
	}

	const created = await DocumentModel.create({
		id,
		userId: cleanUserId,
		title: title || url.searchParams.get('title')?.trim().slice(0, 120) || '',
		content,
		language,
		privacy,
		views: 0,
		size: byteSize,
		expiresIn,
		expiresAt,
	});

	const origin = `${url.protocol}//${req.headers.get('x-forwarded-host') || req.headers.get('host') || 'haste.xernerx.com'}`;

	return NextResponse.json(
		{
			key: created.id,
			id: created.id,
			url: `${origin}/${created.id}`,
			rawUrl: `${origin}/raw/${created.id}`,
			userId: created.userId,
			title: created.title,
			language: created.language,
			privacy: created.privacy,
			expiresIn: created.expiresIn,
			expiresAt: created.expiresAt,
			createdAt: created.createdAt,
		},
		{ status: 201 }
	);
}

export async function POST(req: Request) {
	try {
		return await createHasteFromRequest(req);
	} catch (error: any) {
		console.error('Failed to create haste document via /documents:', error);
		return NextResponse.json({ error: error?.message || 'Failed to create haste document' }, { status: 500 });
	}
}
