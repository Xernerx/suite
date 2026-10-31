/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { computeExpiresAt, extractViewerUserId, normalizeHasteExpiresIn, normalizeHasteLanguage, normalizeHastePrivacy, resolveHasteBaseUrl, verifyXernerxUser } from '@/lib/hasteService';

const MAX_HASTE_BYTES = 512 * 1024;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const cleanId = String(rawId || '')
			.split('.')[0]
			.trim();
		if (!cleanId) {
			return NextResponse.json({ error: 'Missing haste document ID' }, { status: 400 });
		}

		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;
		if (!DocumentModel) {
			return NextResponse.json({ error: 'Haste database model unavailable' }, { status: 500 });
		}

		const doc = (await DocumentModel.findOne({ id: cleanId }).lean()) as any;
		if (!doc) {
			return NextResponse.json({ error: 'Haste document not found' }, { status: 404 });
		}

		if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now()) {
			await DocumentModel.deleteOne({ id: cleanId }).catch(() => null);
			return NextResponse.json({ error: 'Haste document has expired' }, { status: 404 });
		}

		const viewerUserId = await extractViewerUserId(req);
		if (doc.privacy === 'private' && (!viewerUserId || viewerUserId !== String(doc.userId))) {
			return NextResponse.json({ error: 'This haste document is private.' }, { status: 403 });
		}

		await DocumentModel.updateOne({ id: cleanId }, { $inc: { views: 1 } }).catch(() => null);

		let author: { id: string; username?: string; globalName?: string; avatarUrl?: string | null } = { id: doc.userId };
		try {
			const xernerxDb = await database('xernerx');
			const userDoc = (await xernerxDb.models.users?.User?.findOne({ id: doc.userId })
				.lean()
				.catch(() => null)) as any;
			if (userDoc) {
				author = {
					id: doc.userId,
					username: userDoc.username || userDoc.name,
					globalName: userDoc.globalName || userDoc.global_name || userDoc.username || userDoc.name,
					avatarUrl: userDoc.avatarUrl || userDoc.image || null,
				};
			}
		} catch {}

		const baseUrl = resolveHasteBaseUrl(req);

		return NextResponse.json(
			{
				key: doc.id,
				id: doc.id,
				userId: doc.userId,
				author,
				title: doc.title || '',
				content: doc.content,
				language: doc.language || 'plaintext',
				privacy: doc.privacy || 'limited',
				views: (doc.views || 0) + 1,
				size: doc.size || Buffer.byteLength(doc.content || '', 'utf8'),
				expiresIn: doc.expiresIn || '7d',
				expiresAt: doc.expiresAt || null,
				createdAt: doc.createdAt,
				updatedAt: doc.updatedAt,
				url: `${baseUrl}/${doc.id}`,
				rawUrl: `${baseUrl}/raw/${doc.id}`,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Failed to fetch haste document:', error);
		return NextResponse.json({ error: error?.message || 'Failed to fetch haste document' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const cleanId = String(rawId || '')
			.split('.')[0]
			.trim();
		const body = await req.json().catch(() => ({}));

		const candidateUserId = await extractViewerUserId(req, body?.userId);
		const verified = await verifyXernerxUser(candidateUserId);
		if (!verified.ok) {
			return NextResponse.json({ error: verified.error }, { status: verified.status });
		}

		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;
		const existing = (await DocumentModel?.findOne({ id: cleanId }).lean()) as any;
		if (!existing) {
			return NextResponse.json({ error: 'Haste document not found' }, { status: 404 });
		}

		if (String(existing.userId) !== verified.userId) {
			return NextResponse.json({ error: 'Only the document owner can update this haste.' }, { status: 403 });
		}

		const updates: Record<string, any> = {};
		if (typeof body.title === 'string') {
			updates.title = body.title.trim().slice(0, 120);
		}
		if (typeof body.content === 'string') {
			if (!body.content.trim()) {
				return NextResponse.json({ error: 'Haste content cannot be empty.' }, { status: 400 });
			}
			const byteSize = Buffer.byteLength(body.content, 'utf8');
			if (byteSize > MAX_HASTE_BYTES) {
				return NextResponse.json({ error: 'Haste content exceeds 512 KB limit.' }, { status: 413 });
			}
			updates.content = body.content;
			updates.size = byteSize;
		}
		if (typeof body.language === 'string') {
			updates.language = normalizeHasteLanguage(body.language);
		}
		if (typeof body.privacy === 'string') {
			updates.privacy = normalizeHastePrivacy(body.privacy, existing.privacy);
		}
		if (typeof body.expiresIn === 'string') {
			const nextExpiresIn = normalizeHasteExpiresIn(body.expiresIn, existing.expiresIn);
			updates.expiresIn = nextExpiresIn;
			updates.expiresAt = computeExpiresAt(nextExpiresIn);
		}

		const updated = (await DocumentModel.findOneAndUpdate({ id: cleanId }, { $set: updates }, { returnDocument: 'after' }).lean()) as any;
		const baseUrl = resolveHasteBaseUrl(req);

		return NextResponse.json(
			{
				key: updated.id,
				id: updated.id,
				userId: updated.userId,
				title: updated.title,
				content: updated.content,
				language: updated.language,
				privacy: updated.privacy,
				views: updated.views,
				size: updated.size,
				expiresIn: updated.expiresIn,
				expiresAt: updated.expiresAt,
				createdAt: updated.createdAt,
				updatedAt: updated.updatedAt,
				url: `${baseUrl}/${updated.id}`,
				rawUrl: `${baseUrl}/raw/${updated.id}`,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Failed to update haste document:', error);
		return NextResponse.json({ error: error?.message || 'Failed to update haste document' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const cleanId = String(rawId || '')
			.split('.')[0]
			.trim();
		const body = await req.json().catch(() => ({}));

		const candidateUserId = await extractViewerUserId(req, body?.userId);
		const verified = await verifyXernerxUser(candidateUserId);
		if (!verified.ok) {
			return NextResponse.json({ error: verified.error }, { status: verified.status });
		}

		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;
		const existing = (await DocumentModel?.findOne({ id: cleanId }).lean()) as any;
		if (!existing) {
			return NextResponse.json({ error: 'Haste document not found' }, { status: 404 });
		}

		if (String(existing.userId) !== verified.userId) {
			return NextResponse.json({ error: 'Only the document owner can delete this haste.' }, { status: 403 });
		}

		await DocumentModel.deleteOne({ id: cleanId });
		return NextResponse.json({ deleted: true, id: cleanId }, { status: 200 });
	} catch (error: any) {
		console.error('Failed to delete haste document:', error);
		return NextResponse.json({ error: error?.message || 'Failed to delete haste document' }, { status: 500 });
	}
}
