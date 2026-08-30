/** @format */

'use server';

import { NextRequest, NextResponse } from 'next/server';

import { database, sendWebhook } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const user = await models.users.User.findOne({ id }).lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Fetch separated domain models
		const appearance = await models.users.Appearance.findOne({ ownerId: id }).lean();
		const credits = await models.users.Credit.findOne({ ownerId: id }).lean();
		const levels = await models.users.Level.find({ ownerId: id }).lean();
		const subscriptions = await models.users.Subscription.find({ ownerId: id }).lean();

		// Fetch organizations from the organization members collection instead of nesting
		const organizations = await models.organizations.Member.find({ userId: id }).lean();

		return NextResponse.json({
			...user,
			appearance: appearance || {},
			credits: credits || { balance: 0, streak: 0 },
			levels: levels || [],
			subscriptions: subscriptions || [],
			organizations: organizations || [],
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

		const { appearance, credits, ...userBody } = body;

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
			await models.users.Appearance.create({ ...appearance, ownerId: id, id: require('crypto').randomUUID() });
		}
		if (credits) {
			await models.users.Credit.create({ ...credits, ownerId: id, id: require('crypto').randomUUID() });
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

		const { appearance, credits, ...userBody } = body;

		let oldUser = null;
		if (userBody.roles) {
			oldUser = await models.users.User.findOne({ id }).lean();
		}

		// findOneAndUpdate with { returnDocument: 'after' } returns the updated document rather than the old one
		let updatedUser = await models.users.User.findOneAndUpdate({ id }, { $set: userBody }, { returnDocument: 'after', runValidators: true }).lean();

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
								description: `Roles for user <@${id}> (\`${id}\`) were updated.`,
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
				const { syncUserRoles } = require('../../core/users/sync');
				setTimeout(async () => {
					try {
						const db = await database('xernerx');
						await syncUserRoles(id, db);
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
			await models.users.Appearance.findOneAndUpdate({ ownerId: id }, { $set: appearance }, { upsert: true, runValidators: true });
		}

		if (credits) {
			await models.users.Credit.findOneAndUpdate({ ownerId: id }, { $set: credits }, { upsert: true, runValidators: true });
		}

		return NextResponse.json({
			...updatedUser,
			appearance: appearance || {},
			credits: credits || {},
		});
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');

		const deletedUser = await models.users.User.findOneAndDelete({ id });

		if (!deletedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		await models.users.Appearance.findOneAndDelete({ ownerId: id });
		await models.users.Credit.findOneAndDelete({ ownerId: id });
		await models.users.Level.deleteMany({ ownerId: id });
		await models.users.Subscription.deleteMany({ ownerId: id });

		return NextResponse.json({ success: true, deletedId: id });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
