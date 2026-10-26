/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';

function buildOrgQuery(id: string) {
	const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
	return isObjectId ? { $or: [{ _id: id }, { vanitySlug: id.toLowerCase() }] } : { vanitySlug: id.toLowerCase() };
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
	try {
		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const { id } = await props.params;
		const organization = await OrganizationModel.findOne(buildOrgQuery(id)).lean();

		if (!organization) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		// Map to flat object so the frontend receives the correct structure
		const flatOrg = {
			...organization,
			name: organization.name,
			description: organization.description,
			icon: organization.icon,
			verified: organization.verified,
			privacy: organization.config?.privacy || organization.privacy,
			widgets: Boolean(organization.widgets),
			vanityUnlocked: Boolean(organization.vanityUnlocked || organization.vanitySlug || organization.verified),
			vanitySlug: organization.vanitySlug,
		};

		return NextResponse.json(flatOrg, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const body = await req.json();
		const fullDb = await database('xernerx');
		const db = fullDb.models.organizations as any;
		const OrganizationModel = db.Organization;

		const { id } = await params;
		const existingOrg = await OrganizationModel.findOne(buildOrgQuery(id)).lean();
		if (!existingOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}
		const orgId = existingOrg._id;

		const session = (await getServerSession(auth).catch(() => null)) as any;
		const actorUserId = session?.user?.id || existingOrg.owner;
		const isVanityAlreadyUnlocked = Boolean(existingOrg.vanityUnlocked || existingOrg.vanitySlug || existingOrg.verified);

		if (body.action === 'unlock_vanity') {
			if (!isVanityAlreadyUnlocked) {
				const unlockRes = await unlockVanityWithUserCredits(fullDb.models, actorUserId, existingOrg.name || `Organization ${orgId}`);
				if (!unlockRes.ok) {
					return NextResponse.json({ error: unlockRes.error }, { status: 403 });
				}
				const unlockedOrg = await OrganizationModel.findOneAndUpdate({ _id: orgId }, { $set: { vanityUnlocked: true } }, { returnDocument: 'after', runValidators: true }).lean();
				return NextResponse.json(
					{
						...unlockedOrg,
						widgets: Boolean(unlockedOrg?.widgets),
						vanityUnlocked: true,
						vanitySlug: unlockedOrg?.vanitySlug,
						usedSlot: unlockRes.usedSlot,
						cost: unlockRes.cost,
					},
					{ status: 200 }
				);
			}
			return NextResponse.json({ ...existingOrg, vanityUnlocked: true }, { status: 200 });
		}

		const updateData: any = {};
		const unsetData: any = {};

		if (body.vanitySlug !== undefined) {
			const rawSlug = normalizeVanitySlug(body.vanitySlug);
			if (rawSlug === '') {
				unsetData['vanitySlug'] = 1;
				delete body.vanitySlug;
			} else {
				if (!VANITY_SLUG_REGEX.test(rawSlug)) {
					return NextResponse.json({ error: 'Vanity slug must be 2-32 characters (lowercase letters, numbers, and hyphens).' }, { status: 400 });
				}
				const slugTaken = await OrganizationModel.findOne({ vanitySlug: rawSlug, _id: { $ne: orgId } }).lean();
				if (slugTaken) {
					return NextResponse.json({ error: 'This vanity slug is already taken.' }, { status: 409 });
				}
				if (!isVanityAlreadyUnlocked) {
					const unlockRes = await unlockVanityWithUserCredits(fullDb.models, actorUserId, existingOrg.name || `Organization ${orgId}`);
					if (!unlockRes.ok) {
						return NextResponse.json({ error: unlockRes.error }, { status: 403 });
					}
					updateData['vanityUnlocked'] = true;
				}
				updateData['vanitySlug'] = rawSlug;
				body.vanitySlug = rawSlug;
			}
		}

		if (body.name !== undefined) updateData['name'] = body.name;
		if (body.description !== undefined) updateData['description'] = body.description;
		if (body.icon !== undefined) updateData['icon'] = body.icon;
		if (body.iconUrl !== undefined) updateData['iconUrl'] = body.iconUrl;
		if (body.bannerUrl !== undefined) updateData['bannerUrl'] = body.bannerUrl;
		if (body.info !== undefined) updateData['info'] = body.info;
		if (body.locale !== undefined) updateData['locale'] = body.locale;
		if (body.guild !== undefined) updateData['guild'] = body.guild;
		if (body.links !== undefined) updateData['links'] = body.links;
		if (body.roles !== undefined) updateData['roles'] = body.roles;
		if (body.verified !== undefined) updateData['verified'] = body.verified;
		if (body.privacy !== undefined) updateData['privacy'] = body.privacy;
		if (body.widgets !== undefined) updateData['widgets'] = Boolean(body.widgets);

		if (body.action === 'remove_member' && body.targetId) {
			const updatedOrg = await OrganizationModel.findOneAndUpdate({ _id: orgId }, { $pull: { members: body.targetId } }, { returnDocument: 'after', runValidators: true }).lean();

			if (!updatedOrg) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

			await db.Member?.deleteMany({ organizationId: String(orgId), userId: body.targetId }).catch(() => null);

			try {
				const Dispatch = (await database('xernerx')).models.dispatch as any;
				await Dispatch.create({
					id: crypto.randomUUID(),
					targetId: body.targetId,
					senderId: String(orgId),
					type: 'organization_kick',
					category: 'notification',
					status: 'unread',
					data: {
						title: 'Removed from Organization',
						message: `You are no longer a member of ${updatedOrg.name}.`,
						type: 'warning',
					},
				});
			} catch (e) {
				console.error('Failed to dispatch kick notification', e);
			}

			const flatOrg = {
				...updatedOrg,
				name: updatedOrg.name,
				description: updatedOrg.description,
				icon: updatedOrg.icon,
				verified: updatedOrg.verified,
				privacy: updatedOrg.config?.privacy || updatedOrg.privacy,
				widgets: Boolean(updatedOrg.widgets),
				vanitySlug: updatedOrg.vanitySlug || '',
			};
			return NextResponse.json(flatOrg, { status: 200 });
		}

		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, action: _omitAction, ...cleanBody } = body || {};
		const finalSet = Object.keys(updateData).length > 0 ? updateData : cleanBody;
		const mongoUpdate: any = {};
		if (Object.keys(finalSet).length > 0) mongoUpdate.$set = finalSet;
		if (Object.keys(unsetData).length > 0) mongoUpdate.$unset = unsetData;

		const updatedOrg =
			Object.keys(mongoUpdate).length > 0 ? await OrganizationModel.findOneAndUpdate({ _id: orgId }, mongoUpdate, { returnDocument: 'after', runValidators: true }).lean() : existingOrg;

		if (!updatedOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		// Map to flat object so the frontend receives the correct structure
		const flatOrg = {
			...updatedOrg,
			name: updatedOrg.name,
			description: updatedOrg.description,
			icon: updatedOrg.icon,
			verified: updatedOrg.verified,
			privacy: updatedOrg.config?.privacy || updatedOrg.privacy,
			widgets: Boolean(organizationPrivacyFallback(updatedOrg)),
			vanityUnlocked: Boolean(updatedOrg.vanityUnlocked || updatedOrg.vanitySlug || updatedOrg.verified),
			vanitySlug: updatedOrg.vanitySlug || '',
		};

		return NextResponse.json(flatOrg, { status: 200 });
	} catch (error) {
		console.error('Failed to update organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

function organizationPrivacyFallback(org: any) {
	return org?.widgets;
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const db = (await database('xernerx')).models.organizations as any;
		const OrganizationModel = db.Organization;

		const { id } = await params;
		const deletedOrg = await OrganizationModel.findOneAndDelete(buildOrgQuery(id));

		if (!deletedOrg) {
			return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Failed to delete organization:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
