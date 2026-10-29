/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { database, sendWebhook } from '@xernerx/lib/server';
import { syncUserRoles } from '@/lib/sync/users';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const includeSecrets = req.nextUrl.searchParams.get('includeSecrets') === 'true';
		const { models } = await database('xernerx');

		const user = await models.users.User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const resolvedId = user.id;

		// Fetch separated domain models in parallel
		const [appearance, credits, levels, subscriptions, organizations, verifiedIssuesCount, approvedSuggestionsCount] = await Promise.all([
			models.users.Appearance.findOne({ ownerId: resolvedId }).lean(),
			models.users.Credit.findOne({ ownerId: resolvedId }).lean(),
			models.users.Level.find({ ownerId: resolvedId }).lean(),
			models.users.Subscription.find({ ownerId: resolvedId }).lean(),
			models.organizations.Member.find({ userId: resolvedId }).lean(),
			(models.core.Issue as any).countDocuments({ authorId: resolvedId, acknowledged: true }).catch(() => 0),
			(models.core.Suggestion as any)
				.countDocuments({
					$or: [{ authorId: resolvedId }, { 'author.id': resolvedId }],
					status: { $in: ['approved', 'implemented', 'completed'] },
				})
				.catch(() => 0),
		]);

		const sanitizedConnections = Array.isArray((user as any).connections)
			? (user as any).connections.map((conn: any) => {
					if (includeSecrets) {
						return {
							...conn,
							hasSecret: Boolean(conn.secret),
							hasToken: Boolean(conn.token),
						};
					}
					const { secret, token, ...rest } = conn;
					return {
						...rest,
						hasSecret: Boolean(secret),
						hasToken: Boolean(token),
					};
				})
			: [];

		const resolvedSubscriptions = Array.isArray(subscriptions) ? [...subscriptions] : [];
		const hasStaffSubRecord = resolvedSubscriptions.some((s: any) => s.stripeSubscriptionId === 'staff_infinite_sub');
		const isStaffSubActive = Boolean((user as any).staffSubscription || hasStaffSubRecord);
		if (isStaffSubActive && !resolvedSubscriptions.some((s: any) => s.status === 'active' || s.status === 'trialing')) {
			resolvedSubscriptions.push({
				ownerId: resolvedId,
				stripeSubscriptionId: 'staff_infinite_sub',
				priceId: 'ultra',
				status: 'active',
				currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
			} as any);
		}

		return NextResponse.json({
			...user,
			staffSubscription: isStaffSubActive,
			connections: sanitizedConnections,
			vanityUnlocked: Boolean(user.vanityUnlocked || user.vanitySlug || user.verified || isStaffSubActive),
			appearance: appearance || {},
			credits: credits || { balance: 0, streak: 0 },
			level: (levels && levels[0]) || { level: 1, xp: 0 },
			levels: levels || [],
			subscriptions: resolvedSubscriptions,
			organizations: organizations || [],
			communityStats: {
				verifiedIssuesCount: verifiedIssuesCount || 0,
				approvedSuggestionsCount: approvedSuggestionsCount || 0,
			},
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json().catch(() => ({}));
		const { models } = await database('xernerx');

		// Check if user already exists to prevent duplicate key errors
		const existingUser = await models.users.User.findOne({ id });
		if (existingUser) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

		const { appearance, credits, level, ...userBody } = body;

		// Fetch default join roles
		const joinRolesSetting = await models.core.Setting.findOne({ id: 'join_roles' }).lean();
		let joinRoles = [];
		try {
			joinRoles = JSON.parse(joinRolesSetting?.value || '[]');
		} catch {}
		const mergedRoles = Array.from(new Set([...(userBody.roles || []), ...joinRoles]));

		// Create new user, enforcing the ID from the URL and injecting the default roles
		const newUser = await models.users.User.create({ ...userBody, roles: mergedRoles, id });

		if (mergedRoles.length > 0) {
			const webhookSetting = await models.core.Setting.findOne({ id: 'app_webhook_url' }).lean();
			if (webhookSetting?.value) {
				await sendWebhook({
					url: webhookSetting.value,
					embeds: [
						{
							title: '🛡️ Join Roles Granted',
							description: `New user <@${id}> (\`${id}\`) has been granted join roles.`,
							color: 0x8b5cf6,
							fields: [{ name: 'Roles Added', value: mergedRoles.join(', '), inline: false }],
							timestamp: new Date().toISOString(),
						},
					],
				}).catch(console.error);
			}
		}

		if (appearance) {
			await models.users.Appearance.create({ ...appearance, ownerId: id, id: crypto.randomUUID() });
		}
		if (credits) {
			await models.users.Credit.create({ ...credits, ownerId: id, id: crypto.randomUUID() });
		}
		if (level) {
			await models.users.Level.create({ ...level, ownerId: id, id: crypto.randomUUID() });
		}

		return NextResponse.json(newUser, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');

		const existingDoc = await models.users.User.findOne({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] }).lean();
		const resolvedId = existingDoc?.id || id;

		const { appearance, credits, level, _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, ...userBody } = body || {};
		const unsetFields: Record<string, 1> = {};
		const isVanityAlreadyUnlocked = Boolean(existingDoc?.vanityUnlocked || existingDoc?.vanitySlug || existingDoc?.verified);

		if (userBody.action === 'unlock_vanity') {
			delete userBody.action;
			if (!isVanityAlreadyUnlocked) {
				const unlockRes = await unlockVanityWithUserCredits(models, resolvedId, existingDoc?.name || `User ${resolvedId}`);
				if (!unlockRes.ok) {
					return NextResponse.json({ error: unlockRes.error }, { status: 403 });
				}
				const unlockedUser = await models.users.User.findOneAndUpdate({ id: resolvedId }, { $set: { vanityUnlocked: true } }, { returnDocument: 'after', runValidators: true }).lean();
				return NextResponse.json({
					...unlockedUser,
					vanityUnlocked: true,
					vanitySlug: unlockedUser?.vanitySlug || '',
					credits: unlockRes.credits || {},
					usedSlot: unlockRes.usedSlot,
					cost: unlockRes.cost,
				});
			}
			return NextResponse.json({ ...existingDoc, vanityUnlocked: true, vanitySlug: existingDoc?.vanitySlug || '' });
		}

		delete userBody.action;

		if (userBody.birthday === '' || userBody.birthday === null) {
			delete userBody.birthday;
			unsetFields.birthday = 1;
		}

		if (userBody.vanitySlug !== undefined) {
			const rawSlug = normalizeVanitySlug(userBody.vanitySlug);
			if (rawSlug === '') {
				delete userBody.vanitySlug;
				unsetFields.vanitySlug = 1;
			} else {
				if (!VANITY_SLUG_REGEX.test(rawSlug)) {
					return NextResponse.json({ error: 'Vanity slug must be 2-32 characters (lowercase letters, numbers, and hyphens).' }, { status: 400 });
				}
				const slugTaken = await models.users.User.findOne({ vanitySlug: rawSlug, id: { $ne: resolvedId } }).lean();
				if (slugTaken) {
					return NextResponse.json({ error: 'This vanity slug is already taken.' }, { status: 409 });
				}
				if (!isVanityAlreadyUnlocked) {
					const unlockRes = await unlockVanityWithUserCredits(models, resolvedId, existingDoc?.name || `User ${resolvedId}`);
					if (!unlockRes.ok) {
						return NextResponse.json({ error: unlockRes.error }, { status: 403 });
					}
					userBody.vanityUnlocked = true;
				}
				userBody.vanitySlug = rawSlug;
			}
		}

		let oldUser = null;
		if (userBody.roles) {
			oldUser = existingDoc || (await models.users.User.findOne({ id: resolvedId }).lean());
		}

		const mongoUpdate: Record<string, any> = {};
		if (Object.keys(userBody).length > 0) mongoUpdate.$set = userBody;
		if (Object.keys(unsetFields).length > 0) mongoUpdate.$unset = unsetFields;

		// findOneAndUpdate with { returnDocument: 'after' } returns the updated document rather than the old one
		const updatedUser =
			Object.keys(mongoUpdate).length > 0 ? await models.users.User.findOneAndUpdate({ id: resolvedId }, mongoUpdate, { returnDocument: 'after', runValidators: true }).lean() : existingDoc;

		if (typeof userBody.staffSubscription === 'boolean' && models.users.Subscription) {
			if (userBody.staffSubscription) {
				const existingStaffSub = await models.users.Subscription.findOne({ ownerId: resolvedId, stripeSubscriptionId: 'staff_infinite_sub' }).lean();
				if (!existingStaffSub) {
					await models.users.Subscription.create({
						ownerId: resolvedId,
						stripeSubscriptionId: 'staff_infinite_sub',
						priceId: 'ultra',
						status: 'active',
						currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
					});
				}
			} else {
				await models.users.Subscription.deleteMany({ ownerId: resolvedId, stripeSubscriptionId: 'staff_infinite_sub' });
			}
		}

		if (userBody.roles && oldUser && updatedUser) {
			const oldRoles = new Set(oldUser.roles || []);
			const newRoles = new Set(updatedUser.roles || []);
			const addedRoles = [...newRoles].filter((r) => !oldRoles.has(r));
			const removedRoles = [...oldRoles].filter((r) => !newRoles.has(r));

			if (addedRoles.length > 0 || removedRoles.length > 0) {
				const webhookSetting = await models.core.Setting.findOne({ id: 'app_webhook_url' }).lean();
				if (webhookSetting?.value) {
					await sendWebhook({
						url: webhookSetting.value,
						embeds: [
							{
								title: '🛡️ User Roles Updated',
								description: `Roles for user <@${resolvedId}> (\`${resolvedId}\`) were updated.`,
								color: 0x8b5cf6,
								fields: [
									...(addedRoles.length > 0 ? [{ name: 'Roles Added', value: addedRoles.join(', '), inline: false }] : []),
									...(removedRoles.length > 0 ? [{ name: 'Roles Removed', value: removedRoles.join(', '), inline: false }] : []),
								],
								timestamp: new Date().toISOString(),
							},
						],
					}).catch(console.error);
				}

				// Trigger background sync across Discord servers
				setTimeout(async () => {
					try {
						const db = await database('xernerx');
						await syncUserRoles(resolvedId, db);
					} catch (err) {
						console.error('[UserSync]', err);
					}
				}, 0);
			}
		}

		if (!updatedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		let updatedAppearance: any = null;
		if (appearance) {
			const { uiPreferences, _id: _aId, __v: _aV, createdAt: _aCreated, updatedAt: _aUpdated, ownerId: _aOwner, ...restAppearance } = appearance;
			const appearanceUpdate: Record<string, any> = { ...restAppearance };
			if (uiPreferences && typeof uiPreferences === 'object') {
				for (const [k, v] of Object.entries(uiPreferences)) {
					appearanceUpdate[`uiPreferences.${k}`] = v;
				}
			}
			updatedAppearance = await models.users.Appearance.findOneAndUpdate(
				{ ownerId: resolvedId },
				{ $set: appearanceUpdate },
				{ upsert: true, returnDocument: 'after', runValidators: true }
			).lean();
		} else {
			updatedAppearance = await models.users.Appearance.findOne({ ownerId: resolvedId }).lean();
		}

		let updatedCredits: any = null;
		if (credits) {
			const { _id: _cId, __v: _cV, createdAt: _cCreated, updatedAt: _cUpdated, ownerId: _cOwner, ...cleanCredits } = credits;
			updatedCredits = await models.users.Credit.findOneAndUpdate({ ownerId: resolvedId }, { $set: cleanCredits }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
		} else {
			updatedCredits = await models.users.Credit.findOne({ ownerId: resolvedId }).lean();
		}

		let updatedLevel: any = null;
		if (level) {
			const { _id: _lId, __v: _lV, createdAt: _lCreated, updatedAt: _lUpdated, ownerId: _lOwner, ...cleanLevel } = level;
			updatedLevel = await models.users.Level.findOneAndUpdate({ ownerId: resolvedId }, { $set: cleanLevel }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
		} else {
			updatedLevel = await models.users.Level.findOne({ ownerId: resolvedId }).lean();
		}

		return NextResponse.json({
			...updatedUser,
			vanitySlug: updatedUser.vanitySlug || '',
			appearance: updatedAppearance || {},
			credits: updatedCredits || {},
			level: updatedLevel || {},
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const deletedUser = await models.users.User.findOneAndDelete({ $or: [{ id }, { vanitySlug: id.toLowerCase() }] });

		if (!deletedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const resolvedId = deletedUser.id;

		await models.users.Appearance.findOneAndDelete({ ownerId: resolvedId });
		await models.users.Credit.findOneAndDelete({ ownerId: resolvedId });
		await models.users.Level.deleteMany({ ownerId: resolvedId });
		await models.users.Subscription.deleteMany({ ownerId: resolvedId });

		return NextResponse.json({ success: true, deletedId: resolvedId });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
