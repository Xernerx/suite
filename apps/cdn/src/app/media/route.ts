/** @format */
'use server';

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
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

export async function GET(req: Request) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	try {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;

		const { models } = await database('xernerx');
		const MediaModel = models.core.Media;
		const RoleModel = models.core.Role;

		const url = new URL(req.url);
		const reqAdmin = url.searchParams.get('admin') === 'true';

		let query: any = {};

		if (userId) {
			const UserModel = models.users.User;
			const user = await UserModel.findOne({ id: userId }).lean();
			const roleIds = user?.roles || [];

			const roles = await RoleModel.find({ id: { $in: roleIds } });
			const canManage = roles.some((r) => r.permissions?.manageMedia);

			if (canManage && reqAdmin) {
				query = {}; // Admin sees everything
			} else {
				query = { $or: [{ uploaderId: userId }, { shared: userId }] };
			}
		} else {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
		}
		const userMedia = await MediaModel.find(query).sort({ createdAt: -1 }).lean();

		const domain = process.env.DOMAIN || 'xernerx.com';
		const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
		const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;

		const mappedMedia = userMedia.map((m: any) => ({
			...m,
			url: `${baseUrl}/view/${m._id}`,
		}));

		return NextResponse.json({ media: mappedMedia }, { headers: corsHeaders });
	} catch (error: any) {
		console.error('Failed to fetch media:', error);
		return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500, headers: corsHeaders });
	}
}
