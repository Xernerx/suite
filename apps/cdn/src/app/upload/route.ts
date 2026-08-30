/** @format */
'use server';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
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
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-upload-name',
		'Access-Control-Allow-Credentials': 'true',
	};
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
			console.log('Upload rejected: Unauthorized. Session object:', session);
			return NextResponse.json({ error: 'Unauthorized', session: session }, { status: 401, headers: corsHeaders });
		}

		const { models } = await database('xernerx');
		const UserModel = models.users.User;
		const user = await UserModel.findOne({ id: userId }).lean();
		const roleIds = user?.roles || [];

		const RoleModel = models.core.Role;
		const roles = await RoleModel.find({ id: { $in: roleIds } });

		console.log('DEBUG UPLOAD - session user:', session?.user);
		console.log('DEBUG UPLOAD - roleIds:', roleIds);
		console.log('DEBUG UPLOAD - fetched roles:', roles);

		const canUpload = roles.some((r) => r.permissions?.uploadMedia);
		const canManage = roles.some((r) => r.permissions?.manageMedia);

		console.log('DEBUG UPLOAD - canUpload:', canUpload, 'canManage:', canManage);

		if (!canUpload && !canManage) {
			return NextResponse.json({ error: `Forbidden. You do not have permission to upload media. roles: ${JSON.stringify(roles)}` }, { status: 403, headers: corsHeaders });
		}

		// 1.5. Storage Limits Check
		const SubscriptionModel = models.users.Subscription;
		const activeSubscriptions = await SubscriptionModel.find({
			ownerId: userId,
			status: { $in: ['active', 'trialing'] },
		}).lean();

		const MediaModel = models.core.Media;
		const currentUploadCount = await MediaModel.countDocuments({ uploaderId: userId });

		// If they have any active subscription (like the Ultra plan), they get 1000. Otherwise 10.
		const maxUploads = activeSubscriptions.length > 0 ? 1000 : 10;

		// Admins (canManage) bypass the quota limits entirely
		if (currentUploadCount >= maxUploads && !canManage) {
			return NextResponse.json(
				{
					error: `Storage limit reached. You have used ${currentUploadCount}/${maxUploads} uploads. Upgrade to Ultra to increase your limit!`,
				},
				{ status: 403, headers: corsHeaders }
			);
		}

		// 2. Parse form data
		const formData = await req.formData();
		const file = formData.get('file') as File;
		const privacy = (formData.get('privacy') as string) || 'private';
		const rawShared = formData.get('shared') as string;
		const shared = rawShared ? JSON.parse(rawShared) : [];

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
		}

		// 3. Upload to Vercel Blob
		const blob = await put(file.name, file, {
			access: 'private', // User is using a private store, so we must proxy requests
			multipart: true,
		});

		// 4. Save metadata to MongoDB

		const mediaDoc = await MediaModel.create({
			url: blob.url,
			filename: file.name,
			mimeType: file.type,
			size: file.size,
			uploaderId: userId,
			privacy: ['public', 'limited', 'private'].includes(privacy) ? privacy : 'private',
			shared: Array.isArray(shared) ? shared : [],
		});

		const domain = process.env.DOMAIN || 'xernerx.com';
		const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
		const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;

		return NextResponse.json(
			{
				success: true,
				url: `${baseUrl}/view/${mediaDoc._id}`,
				media: { ...mediaDoc.toObject(), url: `${baseUrl}/view/${mediaDoc._id}` },
			},
			{ headers: corsHeaders }
		);
	} catch (error: any) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500, headers: corsHeaders });
	}
}
