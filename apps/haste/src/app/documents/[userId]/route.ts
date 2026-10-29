/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { createHasteFromRequest } from '../route';

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
	try {
		const { userId } = await params;
		return await createHasteFromRequest(req, userId);
	} catch (error: any) {
		console.error('Failed to create haste document via /documents/[userId]:', error);
		return NextResponse.json({ error: error?.message || 'Failed to create haste document' }, { status: 500 });
	}
}

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
	try {
		const { userId: rawId } = await params;
		const cleanId = String(rawId || '')
			.split('.')[0]
			.trim();
		const { models } = await database('haste');
		const DocumentModel = models.documents?.Document;

		const doc = (await DocumentModel?.findOne({ id: cleanId }).lean()) as any;
		if (!doc) {
			return NextResponse.json({ message: 'Document not found.' }, { status: 404 });
		}

		if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now()) {
			await DocumentModel.deleteOne({ id: cleanId }).catch(() => null);
			return NextResponse.json({ message: 'Document has expired.' }, { status: 404 });
		}

		if (doc.privacy === 'private') {
			const url = new URL(req.url);
			const session = (await getServerSession(auth).catch(() => null)) as any;
			const viewerId = url.searchParams.get('userId') || req.headers.get('x-user-id') || session?.user?.id;
			if (!viewerId || String(viewerId) !== String(doc.userId)) {
				return NextResponse.json({ message: 'Document is private.' }, { status: 403 });
			}
		}

		return NextResponse.json({
			key: doc.id,
			id: doc.id,
			data: doc.content,
			content: doc.content,
			language: doc.language,
			title: doc.title,
			privacy: doc.privacy,
			expiresAt: doc.expiresAt,
			createdAt: doc.createdAt,
		});
	} catch (error: any) {
		return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
	}
}
