/** @format */

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { database } from '@xernerx/lib/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

function getCorsHeaders(origin: string | null) {
	const isLocal = origin?.includes('localhost') || origin?.includes('127.0.0.1') || (origin ? /^https?:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::\d+)?$/.test(origin) : false);
	const isXernerx = origin?.endsWith('.xernerx.com') || (origin ? origin.includes('.dev.') : false);

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

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
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

		const params = await props.params;
		const targetUserId = params.id;
		if (!targetUserId) {
			return NextResponse.json({ error: 'Target User ID required in URL' }, { status: 400, headers: corsHeaders });
		}

		if (userId !== targetUserId && !canManage) {
			return NextResponse.json({ error: 'Forbidden. You can only upload files to your own account.' }, { status: 403, headers: corsHeaders });
		}

		if (!canUpload && !canManage) {
			return NextResponse.json({ error: `Forbidden. You do not have permission to upload media. roles: ${JSON.stringify(roles)}` }, { status: 403, headers: corsHeaders });
		}

		// 1.5. Storage Limits Check
		const SubscriptionModel = models.users.Subscription;
		const CreditModel = (models.users as any).Credit;
		const targetUserDoc =
			targetUserId === userId
				? user
				: await UserModel.findOne({ id: targetUserId })
						.lean()
						.catch(() => null);
		const isStaffSubscribed = Boolean((targetUserDoc as any)?.staffSubscription);
		const [activeSubscriptions, creditDoc] = await Promise.all([
			SubscriptionModel.find({
				ownerId: targetUserId,
				status: { $in: ['active', 'trialing'] },
				$or: [{ currentPeriodEnd: { $exists: false } }, { currentPeriodEnd: { $gt: new Date() } }],
			}).lean(),
			CreditModel
				? CreditModel.findOne({ ownerId: targetUserId })
						.lean()
						.catch(() => null)
				: Promise.resolve(null),
		]);

		const MediaModel = models.core.Media;
		const currentUploadCount = await MediaModel.countDocuments({ uploaderId: targetUserId });

		// Base 10 free slots (or 1000 with active subscription / staffSubscription / manageMedia) + permanent extraCdnSlots bought in the Credit Store
		const extraCdnSlots = Math.max(0, Number((creditDoc as any)?.extraCdnSlots) || 0);
		const maxUploads = (isStaffSubscribed || canManage || activeSubscriptions.length > 0 ? 1000 : 10) + extraCdnSlots;

		// Admins (canManage) bypass the quota limits entirely
		if (currentUploadCount >= maxUploads && !canManage) {
			return NextResponse.json(
				{
					error: `Storage limit reached (${currentUploadCount}/${maxUploads} slots). Redeem extra CDN slots in the Credit Store or upgrade to Ultra!`,
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
		const folder = ((formData.get('folder') as string) || 'Uncategorized').trim() || 'Uncategorized';
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

		// 3. Upload to Vercel Blob
		const blob = await put(file.name, file, {
			access: 'private', // User is using a private store, so we must proxy requests
			multipart: true,
			addRandomSuffix: true,
		});

		// 4. Save metadata to MongoDB

		const mediaDoc = await MediaModel.create({
			url: blob.url,
			filename: file.name,
			mimeType: file.type,
			size: file.size,
			uploaderId: targetUserId,
			privacy: ['public', 'limited', 'private'].includes(privacy) ? privacy : 'private',
			shared: Array.isArray(shared) ? shared : [],
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
				media: { ...mediaDoc.toObject(), url: `${baseUrl}/raw/${mediaDoc._id}` },
			},
			{ headers: corsHeaders }
		);
	} catch (error: any) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500, headers: corsHeaders });
	}
}
