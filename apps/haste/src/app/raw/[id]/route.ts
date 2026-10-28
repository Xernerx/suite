/** @format */

import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const cleanId = String(rawId || '')
			.split('.')[0]
			.trim();
		if (!cleanId) {
			return new Response('Missing haste document ID', { status: 400 });
		}

		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;
		if (!DocumentModel) {
			return new Response('Haste database unavailable', { status: 500 });
		}

		const doc = (await DocumentModel.findOne({ id: cleanId }).lean()) as any;
		if (!doc) {
			return new Response('Haste document not found', { status: 404 });
		}

		if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now()) {
			await DocumentModel.deleteOne({ id: cleanId }).catch(() => null);
			return new Response('Haste document has expired', { status: 404 });
		}

		if (doc.privacy === 'private') {
			const url = new URL(req.url);
			const session = (await getServerSession(auth).catch(() => null)) as any;
			const viewerId = url.searchParams.get('userId') || req.headers.get('x-user-id') || session?.user?.id;
			if (!viewerId || String(viewerId) !== String(doc.userId)) {
				return new Response('Forbidden: This haste document is private.', { status: 403 });
			}
		}

		await DocumentModel.updateOne({ id: cleanId }, { $inc: { views: 1 } }).catch(() => null);

		return new Response(String(doc.content || ''), {
			status: 200,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': doc.privacy === 'private' ? 'private, no-store' : 'public, max-age=60',
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		console.error('Failed to stream raw haste document:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
