/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

function getCorsHeaders(origin: string | null) {
	const isLocal = origin?.includes('localhost');
	const isXernerx = origin?.endsWith('.xernerx.com');

	const allowedOrigin = isLocal || isXernerx ? origin : 'https://xernerx.com';

	return {
		'Access-Control-Allow-Origin': allowedOrigin || '*',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
	};
}

export async function OPTIONS(req: Request) {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(req.headers.get('origin')),
	});
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	try {
		const { id } = await params;

		const { models } = await database('xernerx');
		const MediaModel = models.core.Media;
		const RoleModel = models.core.Role;

		const media = await MediaModel.findById(id);
		if (!media) {
			return new Response('Not Found', { status: 404 });
		}

		// Privacy checks
		if (media.privacy === 'private') {
			const session = await getServerSession(auth);
			const userId = (session?.user as any)?.id;

			if (!userId) {
				return new Response('Not Found', { status: 404 });
			}

			const UserModel = models.users.User;
			const user = await UserModel.findOne({ id: userId }).lean();
			const roleIds = user?.roles || [];

			const roles = await RoleModel.find({ id: { $in: roleIds } });
			const canManage = roles.some((r) => r.permissions?.manageMedia);

			if (media.uploaderId !== userId && !media.shared?.includes(userId) && !canManage) {
				return new Response('Not Found', { status: 404 });
			}
		}

		// Fetch the actual file from Vercel Blobs using the Vercel Blob SDK
		// This automatically resolves VERCEL_OIDC_TOKEN in production!
		const { get } = await import('@vercel/blob');
		let stream;
		try {
			const res = await get(media.url, { access: 'private' });
			if (!res) {
				console.error(`DEBUG RAW - SDK get() returned null (blob not found):`, media.url);
				return new Response('Failed to retrieve media from storage', { status: 404 });
			}
			stream = res.stream;
		} catch (e: any) {
			console.error(`DEBUG RAW - SDK get() failed:`, e);
			return new Response('Failed to retrieve media from storage', { status: 502 });
		}

		if (!stream) {
			return new Response('Failed to retrieve media from storage', { status: 502 });
		}

		// Stream the response directly to the client
		const headers = new Headers(corsHeaders);
		headers.set('Content-Type', media.mimeType || 'application/octet-stream');
		headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // heavily cache since it's immutable

		return new Response(stream as any, {
			status: 200,
			headers,
		});
	} catch (error: any) {
		console.error('Failed to view media:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
