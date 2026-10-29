/** @format */

import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export type HastePrivacy = 'public' | 'limited' | 'private';
export type HasteExpiresIn = '1h' | '24h' | '7d' | '30d' | 'never';

export const VALID_HASTE_LANGUAGES = ['plaintext', 'typescript', 'javascript', 'json', 'python', 'bash', 'markdown', 'html', 'css', 'sql', 'rust', 'go', 'yaml', 'java', 'csharp', 'cpp'] as const;

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
	zsh: 'bash',
	ps1: 'bash',
	md: 'markdown',
	yml: 'yaml',
	rs: 'rust',
	cs: 'csharp',
	c: 'cpp',
	cc: 'cpp',
	txt: 'plaintext',
	text: 'plaintext',
};

export function normalizeHasteLanguage(raw?: string | null): string {
	if (!raw) return 'plaintext';
	const clean = String(raw).trim().toLowerCase();
	if (LANGUAGE_ALIASES[clean]) return LANGUAGE_ALIASES[clean];
	if ((VALID_HASTE_LANGUAGES as readonly string[]).includes(clean)) return clean;
	return 'plaintext';
}

export function normalizeHastePrivacy(raw?: string | null, fallback: HastePrivacy = 'limited'): HastePrivacy {
	if (raw === 'public' || raw === 'limited' || raw === 'private') return raw;
	return fallback;
}

export function normalizeHasteExpiresIn(raw?: string | null, fallback: HasteExpiresIn = '7d'): HasteExpiresIn {
	if (raw === '1h' || raw === '24h' || raw === '7d' || raw === '30d' || raw === 'never') return raw;
	return fallback;
}

export function computeExpiresAt(expiresIn: HasteExpiresIn): Date | null {
	const now = Date.now();
	switch (expiresIn) {
		case '1h':
			return new Date(now + 60 * 60 * 1000);
		case '24h':
			return new Date(now + 24 * 60 * 60 * 1000);
		case '7d':
			return new Date(now + 7 * 24 * 60 * 60 * 1000);
		case '30d':
			return new Date(now + 30 * 24 * 60 * 60 * 1000);
		case 'never':
			return null;
	}
}

export function unwrapCodeFence(rawContent: string): { content: string; detectedLanguage?: string } {
	const trimmed = rawContent.trim();
	const fenceMatch = trimmed.match(/^```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)\r?\n?```$/);
	if (fenceMatch) {
		const langTag = fenceMatch[1]?.trim();
		return {
			content: fenceMatch[2],
			detectedLanguage: langTag ? normalizeHasteLanguage(langTag) : undefined,
		};
	}
	return { content: rawContent };
}

export function generateHasteId(length = 10): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = crypto.randomBytes(length);
	let id = '';
	for (let i = 0; i < length; i++) {
		id += alphabet[bytes[i] % alphabet.length];
	}
	return id;
}

export function resolveHasteBaseUrl(req?: Request): string {
	const domain = process.env.NEXT_PUBLIC_DOMAIN || 'xernerx.com';
	if (req) {
		const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
		if (host.includes('localhost') || host.includes('127.0.0.1') || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]+)?$/.test(host)) {
			const hostname = host.split(':')[0];
			return `http://${hostname}:4011`;
		}
		if (host.includes('.dev.')) {
			return `https://haste.dev.${domain}`;
		}
		if (host.includes('.canary.')) {
			return `https://haste.canary.${domain}`;
		}
	}
	return `https://haste.${domain}`;
}

export async function extractViewerUserId(req: Request, explicitUserId?: string | null): Promise<string | null> {
	const url = new URL(req.url);
	const queryUserId = url.searchParams.get('userId') || url.searchParams.get('user') || url.searchParams.get('owner');
	const headerUserId = req.headers.get('x-user-id');
	const authHeader = req.headers.get('authorization');

	let candidateId = explicitUserId || queryUserId || headerUserId || null;

	if (!candidateId && authHeader) {
		const tokenOrId = authHeader.replace(/^Bearer\s+/i, '').trim();
		if (/^\d{15,22}$/.test(tokenOrId)) {
			candidateId = tokenOrId;
		} else if (tokenOrId) {
			try {
				const { models } = await database('xernerx');
				const tokenDoc = (await models.users?.Token?.findOne({ token: tokenOrId })
					.lean()
					.catch(() => null)) as any;
				if (tokenDoc?.userId || tokenDoc?.id) {
					candidateId = String(tokenDoc.userId || tokenDoc.id);
				}
			} catch {}
		}
	}

	if (!candidateId) {
		try {
			const session = (await getServerSession(auth)) as any;
			if (session?.user?.id) {
				candidateId = String(session.user.id);
			}
		} catch {}
	}

	return candidateId ? String(candidateId).trim() : null;
}

export async function verifyXernerxUser(userId: string | null): Promise<{ ok: true; userId: string; user: any } | { ok: false; status: number; error: string }> {
	if (!userId) {
		return {
			ok: false,
			status: 401,
			error: 'Missing userId. Pass your Xernerx/Discord user ID via body.userId, ?userId=..., or the x-user-id header.',
		};
	}

	const cleanId = String(userId).trim();
	const { models } = await database('xernerx');
	const user = (await models.users?.User?.findOne({ id: cleanId })
		.lean()
		.catch(() => null)) as any;

	if (!user) {
		return {
			ok: false,
			status: 403,
			error: `User ID '${cleanId}' is not registered as a Xernerx user.`,
		};
	}

	return { ok: true, userId: cleanId, user };
}
