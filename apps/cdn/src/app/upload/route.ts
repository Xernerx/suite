/** @format */

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { getCdnCorsHeaders } from '@/lib/cors';

function getCorsHeaders(origin: string | null) {
	return getCdnCorsHeaders(origin, 'GET, POST, OPTIONS');
}

export async function OPTIONS(req: Request) {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(req.headers.get('origin')),
	});
}

export async function POST(req: Request) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	try {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
		}

		// 1. Parse form data
		const formData = await req.formData();
		const file = formData.get('file') as File;
		const folder = ((formData.get('folder') as string) || 'Uncategorized').trim() || 'Uncategorized';
		const rawPrivacy = ((formData.get('privacy') as string) || 'public').trim().toLowerCase();
		const privacy: 'public' | 'limited' | 'private' = rawPrivacy === 'private' ? 'private' : rawPrivacy === 'limited' ? 'limited' : 'public';
		const rawTags = formData.get('tags') as string;
		let tags: string[] = [];
		if (rawTags) {
			try {
				const parsed = JSON.parse(rawTags);
				tags = Array.isArray(parsed) ? parsed.map((t) => String(t).trim()).filter(Boolean) : [];
			} catch {
				tags = rawTags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean);
			}
		}

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
		}

		// Limit file size to 10MB to prevent abuse
		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400, headers: corsHeaders });
		}

		// 2. Upload to Vercel Blob
		const blob = await put(`anonymous/${file.name}`, file, {
			access: 'private',
			multipart: true,
			addRandomSuffix: true,
		});

		// 3. Save metadata to MongoDB as Anonymous System Upload
		const { models } = await database('xernerx');
		const MediaModel = models.core.Media;

		const mediaDoc = await MediaModel.create({
			url: blob.url,
			filename: file.name,
			mimeType: file.type,
			size: file.size,
			uploaderId: privacy === 'private' ? userId : 'system-anonymous',
			privacy,
			shared: [],
			folder,
			tags,
		});

		const domain = process.env.DOMAIN || 'xernerx.com';
		const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
		const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;

		return NextResponse.json(
			{
				success: true,
				url: `${baseUrl}/raw/${mediaDoc._id}`,
			},
			{ headers: corsHeaders }
		);
	} catch (error: any) {
		console.error('Anonymous Upload error:', error);
		return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500, headers: corsHeaders });
	}
}
