/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { database, sendWebhook } from '@xernerx/lib/server';
import { syncUserRoles } from '@/lib/sync/users';
import { normalizeVanitySlug, unlockVanityWithUserCredits, VANITY_SLUG_REGEX } from '@/lib/vanityUnlock';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
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

		return NextResponse.json({
			...user,
			vanityUnlocked: Boolean(user.vanityUnlocked || user.vanitySlug || user.verified),
			appearance: appearance || {},
			credits: credits || { balance: 0, streak: 0 },
			level: (levels && levels[0]) || { level: 1, xp: 0 },
			levels: levels || [],
			subscriptions: subscriptions || [],
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

		const { appearance, credits, level, ...userBody } = body;
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
					credits: unlockRes.credits || {},
					usedSlot: unlockRes.usedSlot,
					cost: unlockRes.cost,
				});
			}
			return NextResponse.json({ ...existingDoc, vanityUnlocked: true });
		}

		if (userBody.vanitySlug !== undefined) {
			const rawSlug = normalizeVanitySlug(userBody.vanitySlug);
			if (rawSlug === '') {
				delete userBody.vanitySlug;
				if (existingDoc?.vanitySlug) {
					unsetFields.vanitySlug = 1;
				}
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

		if (appearance) {
			const { uiPreferences, ...restAppearance } = appearance;
			const appearanceUpdate: Record<string, any> = { ...restAppearance };
			if (uiPreferences && typeof uiPreferences === 'object') {
				for (const [k, v] of Object.entries(uiPreferences)) {
					appearanceUpdate[`uiPreferences.${k}`] = v;
				}
			}
			await models.users.Appearance.findOneAndUpdate({ ownerId: resolvedId }, { $set: appearanceUpdate }, { upsert: true, runValidators: true });
		}

		if (credits) {
			await models.users.Credit.findOneAndUpdate({ ownerId: resolvedId }, { $set: credits }, { upsert: true, runValidators: true });
		}

		if (level) {
			await models.users.Level.findOneAndUpdate({ ownerId: resolvedId }, { $set: level }, { upsert: true, runValidators: true });
		}

		return NextResponse.json({
			...updatedUser,
			appearance: appearance || {},
			credits: credits || {},
			level: level || {},
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
