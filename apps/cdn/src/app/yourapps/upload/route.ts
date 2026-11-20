/** @format */

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { getCdnCorsHeaders, isTrustedXernerxOrigin, resolveCdnBaseUrl } from '@/lib/cors';

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB per attachment
const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_EXACT_MIMES = new Set([
	'application/pdf',
	'text/plain',
	'application/zip',
	'application/x-zip-compressed',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function getCorsHeaders(req: Request) {
	return getCdnCorsHeaders(req.headers.get('origin'), 'POST, OPTIONS', 'Content-Type, Authorization, Cookie', req.headers.get('access-control-request-headers'));
}

export async function OPTIONS(req: Request) {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(req),
	});
}

export async function POST(req: Request) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(req);

	try {
		if (!isTrustedXernerxOrigin(origin)) {
			return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403, headers: corsHeaders });
		}

		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id ? String((session?.user as any).id) : '';
		if (!userId) {
			return NextResponse.json({ error: 'Please sign in with Discord before uploading attachments.' }, { status: 401, headers: corsHeaders });
		}

		const { models } = await database('xernerx');
		const UserModel = models.users.User;
		const MediaModel = models.core.Media;

		const userDoc: any = await UserModel.findOne({ id: userId })
			.select('blacklisted services')
			.lean()
			.catch(() => null);
		if (userDoc?.blacklisted || userDoc?.services === false) {
			return NextResponse.json({ error: 'File uploads are unavailable for this account.' }, { status: 403, headers: corsHeaders });
		}

		const since24h = new Date(Date.now() - 24 * 3600 * 1000);
		const recentAttachmentCount = await MediaModel.countDocuments({
			uploaderId: userId,
			folder: 'YourApps Attachments',
			createdAt: { $gte: since24h },
		}).catch(() => 0);

		if (recentAttachmentCount >= 40) {
			return NextResponse.json({ error: 'Daily application attachment limit reached. Please try again later.' }, { status: 429, headers: corsHeaders });
		}

		const formData = await req.formData();
		const file = formData.get('file') as File | null;
		if (!file || typeof file.size !== 'number') {
			return NextResponse.json({ error: 'No file provided.' }, { status: 400, headers: corsHeaders });
		}

		if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
			return NextResponse.json({ error: 'Each attachment must be 8 MB or smaller.' }, { status: 400, headers: corsHeaders });
		}

		const mime = String(file.type || '').toLowerCase();
		const isAllowedMime = ALLOWED_EXACT_MIMES.has(mime) || ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
		if (!isAllowedMime) {
			return NextResponse.json({ error: 'Unsupported file type. Upload an image, PDF, TXT, DOC/DOCX, or ZIP file.' }, { status: 400, headers: corsHeaders });
		}

		const cleanName = String(file.name || 'attachment')
			.replace(/[^\w.\- ()]/g, '_')
			.slice(0, 120);

		const blob = await put(`yourapps/${userId}/${cleanName}`, file, {
			access: 'private',
			multipart: true,
			addRandomSuffix: true,
		});

		const mediaDoc = await MediaModel.create({
			url: blob.url,
			filename: cleanName,
			mimeType: mime,
			size: file.size,
			uploaderId: userId,
			privacy: 'limited',
			shared: [],
			folder: 'YourApps Attachments',
			tags: ['yourapps', 'attachment'],
		});

		const baseUrl = resolveCdnBaseUrl(req);
		const fileUrl = `${baseUrl}/raw/${mediaDoc._id}`;

		return NextResponse.json(
			{
				success: true,
				url: fileUrl,
				filename: cleanName,
				markdown: `[${cleanName}](${fileUrl})`,
			},
			{ status: 201, headers: corsHeaders }
		);
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || 'Failed to upload attachment.' }, { status: 500, headers: corsHeaders });
	}
}
