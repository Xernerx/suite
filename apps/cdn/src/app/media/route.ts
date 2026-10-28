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
		const folderParam = url.searchParams.get('folder');
		const tagParam = url.searchParams.get('tag');

		let query: any = {};
		let isStaffSubscribed = false;
		let canManage = false;

		if (userId) {
			const UserModel = models.users.User;
			const user = await UserModel.findOne({ id: userId }).lean();
			isStaffSubscribed = Boolean((user as any)?.staffSubscription);
			const roleIds = user?.roles || [];

			const roles = await RoleModel.find({ id: { $in: roleIds } });
			canManage = roles.some((r) => r.permissions?.manageMedia);

			if (canManage && reqAdmin) {
				query = {}; // Admin sees everything
			} else {
				query = { $or: [{ uploaderId: userId }, { shared: userId }] };
			}
		} else {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
		}

		if (folderParam && folderParam !== 'all') {
			query.folder = folderParam;
		}
		if (tagParam) {
			query.tags = tagParam;
		}
		const [userMedia, activeSubscriptions, creditDoc] = await Promise.all([
			MediaModel.find(query).sort({ createdAt: -1 }).lean(),
			models.users.Subscription
				? models.users.Subscription.find({
						ownerId: userId,
						status: { $in: ['active', 'trialing'] },
						$or: [{ currentPeriodEnd: { $exists: false } }, { currentPeriodEnd: { $gt: new Date() } }],
					})
						.lean()
						.catch(() => [])
				: Promise.resolve([]),
			(models.users as any).Credit
				? (models.users as any).Credit.findOne({ ownerId: userId })
						.lean()
						.catch(() => null)
				: Promise.resolve(null),
		]);

		const extraCdnSlots = Math.max(0, Number((creditDoc as any)?.extraCdnSlots) || 0);
		const maxUploads = (isStaffSubscribed || canManage || activeSubscriptions.length > 0 ? 1000 : 10) + extraCdnSlots;
		const selfUploadCount = userMedia.filter((m: any) => m.uploaderId === userId).length;

		const domain = process.env.DOMAIN || 'xernerx.com';
		const isDev = process.env.ENVIRONMENT === 'DEVELOPMENT';
		const baseUrl = isDev ? `https://cdn.dev.${domain}` : `https://cdn.${domain}`;

		const mappedMedia = userMedia.map((m: any) => ({
			...m,
			url: `${baseUrl}/view/${m._id}`,
		}));

		return NextResponse.json(
			{
				media: mappedMedia,
				quota: {
					used: selfUploadCount,
					max: maxUploads,
					extraSlots: extraCdnSlots,
				},
			},
			{ headers: corsHeaders }
		);
	} catch (error: any) {
		console.error('Failed to fetch media:', error);
		return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500, headers: corsHeaders });
	}
}

export async function PATCH(req: Request) {
	const origin = req.headers.get('origin');
	const corsHeaders = getCorsHeaders(origin);

	try {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
		}

		const body = await req.json().catch(() => ({}));
		const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
		if (ids.length === 0) {
			return NextResponse.json({ error: 'No media IDs provided' }, { status: 400, headers: corsHeaders });
		}

		const { models } = await database('xernerx');
		const user = await models.users.User.findOne({ id: userId }).lean();
		const roles = await models.core.Role.find({ id: { $in: user?.roles || [] } });
		const canManage = roles.some((r) => r.permissions?.manageMedia);

		const updateFields: Record<string, any> = {};
		if (body.privacy !== undefined) updateFields.privacy = body.privacy;
		if (body.folder !== undefined) updateFields.folder = String(body.folder).trim() || 'Uncategorized';
		if (body.tags !== undefined) updateFields.tags = Array.isArray(body.tags) ? body.tags : [];

		const filter: any = { _id: { $in: ids } };
		if (!canManage) filter.uploaderId = userId;

		await models.core.Media.updateMany(filter, { $set: updateFields });
		return NextResponse.json({ success: true }, { headers: corsHeaders });
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Bulk update failed' }, { status: 500, headers: corsHeaders });
	}
}
