/** @format */
'use server';

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';
import { del } from '@vercel/blob';

function getCorsHeaders(origin: string | null) {
	const isLocal = origin?.includes('localhost');
	const isXernerx = origin?.endsWith('.xernerx.com');

	const allowedOrigin = isLocal || isXernerx ? origin : 'https://xernerx.com';

	return {
		'Access-Control-Allow-Origin': allowedOrigin || '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	try {
		const { id } = await params;
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
		}

		const { models } = await database('xernerx');
		const UserModel = models.users.User;
		const user = await UserModel.findOne({ id: userId }).lean();
		const roleIds = user?.roles || [];

		const MediaModel = models.core.Media;

		// Verify if user has manageMedia
		const roles = await models.core.Role.find({ id: { $in: roleIds } });
		const canManage = roles.some((r) => r.permissions?.manageMedia);

		const media = await MediaModel.findById(id);
		if (!media) {
			return NextResponse.json({ error: 'Media not found' }, { status: 404, headers: corsHeaders });
		}

		if (media.uploaderId !== userId && !canManage) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
		}

		// Delete from Vercel Blob
		if (media.url) {
			await del(media.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
		}

		// Delete from DB
		await MediaModel.findByIdAndDelete(id);

		return NextResponse.json({ success: true }, { headers: corsHeaders });
	} catch (error: any) {
		console.error('Failed to delete media:', error);
		return NextResponse.json({ error: 'Failed to delete media' }, { status: 500, headers: corsHeaders });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	try {
		const { id } = await params;
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
		}

		const body = await req.json();
		const { privacy, shared } = body;

		const { models } = await database('xernerx');
		const UserModel = models.users.User;
		const user = await UserModel.findOne({ id: userId }).lean();
		const roleIds = user?.roles || [];

		const MediaModel = models.core.Media;

		// Verify if user has manageMedia
		const roles = await models.core.Role.find({ id: { $in: roleIds } });
		const canManage = roles.some((r) => r.permissions?.manageMedia);

		const media = await MediaModel.findById(id);
		if (!media) {
			return NextResponse.json({ error: 'Media not found' }, { status: 404, headers: corsHeaders });
		}

		if (media.uploaderId !== userId && !canManage) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
		}

		const updateFields: any = {};
		if (privacy !== undefined) updateFields.privacy = privacy;
		if (shared !== undefined) updateFields.shared = Array.isArray(shared) ? shared : [];

		const updated = await MediaModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

		return NextResponse.json({ success: true, media: updated }, { headers: corsHeaders });
	} catch (error: any) {
		console.error('Failed to update media:', error);
		return NextResponse.json({ error: 'Failed to update media' }, { status: 500, headers: corsHeaders });
	}
}
