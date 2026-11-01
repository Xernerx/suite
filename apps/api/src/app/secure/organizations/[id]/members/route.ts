/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';

async function resolveOrg(db: any, id: string): Promise<{ orgId: string; org: any | null }> {
	const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
	const query = isObjectId ? { $or: [{ _id: id }, { vanitySlug: id.toLowerCase() }] } : { vanitySlug: id.toLowerCase() };
	const org = await db.Organization?.findOne(query)
		.lean()
		.catch(() => null);
	return { orgId: org?._id ? String(org._id) : id, org };
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await props.params;
		const db = (await database('xernerx')).models.organizations as any;
		const { orgId, org } = await resolveOrg(db, id);
		if (!org) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		const orgPrivacy = org.privacy || org.config?.privacy || 'private';
		if (orgPrivacy === 'private') {
			const isSystemToken = Boolean(req.headers.get('x-token-id'));
			const session = (await getServerSession(auth)) as any;
			const viewerId = session?.user?.id ? String(session.user.id) : null;
			const isMember =
				isSystemToken ||
				Boolean(viewerId && (org.owner === viewerId || (Array.isArray(org.members) && org.members.includes(viewerId)) || (await db.Member?.exists({ ownerId: orgId, userId: viewerId }))));
			if (!isMember) {
				return NextResponse.json({ error: 'This organization is private.' }, { status: 403 });
			}
		}

		const members = await db.Member.find({ ownerId: orgId }).lean();
		return NextResponse.json(members, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch members:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await props.params;
		const body = await req.json();
		const db = (await database('xernerx')).models.organizations as any;
		const { orgId, org } = await resolveOrg(db, id);

		if (!org) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		const isSystemToken = Boolean(req.headers.get('x-token-id'));
		const session = (await getServerSession(auth)) as any;
		const viewerId = session?.user?.id ? String(session.user.id) : null;

		if (!isSystemToken && (!viewerId || org.owner !== viewerId)) {
			return NextResponse.json({ error: 'Forbidden: Only the organization owner can manage member roles.' }, { status: 403 });
		}

		if (!body.userId) {
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
		}

		const updatedMember = await db.Member.findOneAndUpdate({ ownerId: orgId, userId: body.userId }, { $set: { roles: body.roles || [] } }, { returnDocument: 'after', upsert: true }).lean();

		return NextResponse.json(updatedMember, { status: 200 });
	} catch (error) {
		console.error('Failed to update member:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
