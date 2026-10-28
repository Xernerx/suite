/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import {
	computeExpiresAt,
	extractViewerUserId,
	generateHasteId,
	normalizeHasteExpiresIn,
	normalizeHasteLanguage,
	normalizeHastePrivacy,
	resolveHasteBaseUrl,
	unwrapCodeFence,
	verifyXernerxUser,
} from '@/lib/hasteService';

const MAX_HASTE_BYTES = 512 * 1024; // 512 KB max per document

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const search = (url.searchParams.get('search') || '').trim();
		const language = (url.searchParams.get('language') || '').trim().toLowerCase();
		const mine = url.searchParams.get('mine') === 'true' || url.searchParams.get('mine') === '1';
		const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30));

		const viewerUserId = await extractViewerUserId(req);
		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;
		if (!DocumentModel) {
			return NextResponse.json({ error: 'Haste database model unavailable' }, { status: 500 });
		}

		const now = new Date();
		const expiryFilter = { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };

		let query: Record<string, any> = { ...expiryFilter };

		if (mine) {
			if (!viewerUserId) {
				return NextResponse.json({ error: 'Authentication or userId required for mine=true' }, { status: 401 });
			}
			query.userId = viewerUserId;
		} else {
			query.privacy = 'public';
		}

		if (language && language !== 'all') {
			query.language = normalizeHasteLanguage(language);
		}

		if (search) {
			const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			query.$and = [
				expiryFilter,
				{
					$or: [{ id: { $regex: escaped, $options: 'i' } }, { title: { $regex: escaped, $options: 'i' } }, { content: { $regex: escaped, $options: 'i' } }],
				},
			];
			delete query.$or;
		}

		const docs = (await DocumentModel.find(query).sort({ createdAt: -1 }).limit(limit).lean()) as any[];
		const baseUrl = resolveHasteBaseUrl(req);

		const items = docs.map((doc) => ({
			key: doc.id,
			id: doc.id,
			userId: doc.userId,
			title: doc.title || '',
			language: doc.language || 'plaintext',
			privacy: doc.privacy || 'limited',
			views: doc.views || 0,
			size: doc.size || Buffer.byteLength(doc.content || '', 'utf8'),
			expiresIn: doc.expiresIn || '7d',
			expiresAt: doc.expiresAt || null,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt,
			preview: String(doc.content || '').slice(0, 320),
			url: `${baseUrl}/${doc.id}`,
			rawUrl: `${baseUrl}/raw/${doc.id}`,
		}));

		return NextResponse.json({ data: items }, { status: 200 });
	} catch (error: any) {
		console.error('Failed to list haste documents:', error);
		return NextResponse.json({ error: error?.message || 'Failed to fetch haste documents' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const contentType = (req.headers.get('content-type') || '').toLowerCase();
		const rawText = await req.text();

		let bodyUserId: string | null = null;
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
					bodyUserId = parsed.userId || parsed.user || parsed.owner || null;
					title = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 120) : '';
					explicitLang = parsed.language || parsed.lang || null;
					explicitPrivacy = parsed.privacy || null;
					explicitExpiresIn = parsed.expiresIn || parsed.expiration || null;
				}
			} catch {
				// Treat as raw plain text paste if not a JSON envelope
			}
		}

		const candidateUserId = await extractViewerUserId(req, bodyUserId);
		const verified = await verifyXernerxUser(candidateUserId);
		if (!verified.ok) {
			return NextResponse.json({ error: verified.error }, { status: verified.status });
		}

		const { content, detectedLanguage } = unwrapCodeFence(rawContent);
		if (!content || !content.trim()) {
			return NextResponse.json({ error: 'Haste content cannot be empty.' }, { status: 400 });
		}

		const byteSize = Buffer.byteLength(content, 'utf8');
		if (byteSize > MAX_HASTE_BYTES) {
			return NextResponse.json({ error: 'Haste content exceeds maximum allowed size of 512 KB.' }, { status: 413 });
		}

		const url = new URL(req.url);
		const language = normalizeHasteLanguage(explicitLang || url.searchParams.get('language') || detectedLanguage);
		const privacy = normalizeHastePrivacy(explicitPrivacy || url.searchParams.get('privacy'), 'limited');
		const expiresIn = normalizeHasteExpiresIn(explicitExpiresIn || url.searchParams.get('expiresIn'), '7d');
		const expiresAt = computeExpiresAt(expiresIn);

		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;
		if (!DocumentModel) {
			return NextResponse.json({ error: 'Haste database model unavailable' }, { status: 500 });
		}

		let id = generateHasteId(10);
		for (let attempt = 0; attempt < 4; attempt++) {
			const exists = await DocumentModel.exists({ id });
			if (!exists) break;
			id = generateHasteId(10);
		}

		const created = await DocumentModel.create({
			id,
			userId: verified.userId,
			title: title || url.searchParams.get('title')?.trim().slice(0, 120) || '',
			content,
			language,
			privacy,
			views: 0,
			size: byteSize,
			expiresIn,
			expiresAt,
		});

		const baseUrl = resolveHasteBaseUrl(req);

		return NextResponse.json(
			{
				key: created.id,
				id: created.id,
				url: `${baseUrl}/${created.id}`,
				rawUrl: `${baseUrl}/raw/${created.id}`,
				userId: created.userId,
				title: created.title,
				language: created.language,
				privacy: created.privacy,
				size: created.size,
				expiresIn: created.expiresIn,
				expiresAt: created.expiresAt,
				createdAt: created.createdAt,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error('Failed to create haste document:', error);
		return NextResponse.json({ error: error?.message || 'Failed to create haste document' }, { status: 500 });
	}
}
