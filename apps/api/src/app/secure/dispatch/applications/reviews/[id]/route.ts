/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { status, reviewedBy, reviewNote } = body;

		if (!['approved', 'denied', 'pending'].includes(status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const Application = models.dispatch.Application as any;
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;
		const Setting = models.core.Setting as any;

		// 1. Find and update the application
		const updatedApplication = await Application.findOneAndUpdate(
			{ id },
			{
				$set: {
					status,
					reviewedBy,
					reviewNote,
				},
			},
			{ new: true }
		);

		if (!updatedApplication) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		// 2. If approved, assign the reward role to the Xernerx user profile
		if (status === 'approved' && updatedApplication.ownerId !== 'anonymous') {
			const config = await ApplicationConfig.findOne({ id: updatedApplication.targetId }).lean();

			if (config && config.rewardRole) {
				const User = models.users.User as any;
				const Role = models.core.Role as any;

				await User.findOneAndUpdate({ id: updatedApplication.ownerId }, { $addToSet: { roles: config.rewardRole } }, { upsert: true, new: true });
				console.log(`Successfully assigned Xernerx role ${config.rewardRole} to user ${updatedApplication.ownerId}`);

				// Fetch the Xernerx role to see if it has a tied Discord role
				const xernerxRole = await Role.findOne({ id: config.rewardRole }).lean();
				if (xernerxRole && xernerxRole.role) {
					const adminServerSetting = await Setting.findOne({ id: 'admin_server_id' });
					const guildId = adminServerSetting?.value;

					if (guildId && process.env.DISCORD_CLIENT_TOKEN) {
						// Attempt to assign the tied Discord role via Discord API
						const roleUrl = `https://discord.com/api/v10/guilds/${guildId}/members/${updatedApplication.ownerId}/roles/${xernerxRole.role}`;

						const res = await fetch(roleUrl, {
							method: 'PUT',
							headers: {
								Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}`,
							},
						});

						if (!res.ok) {
							console.error(`Failed to assign tied Discord role ${xernerxRole.role} to user ${updatedApplication.ownerId}`, await res.text());
						} else {
							console.log(`Successfully assigned tied Discord role ${xernerxRole.role} to user ${updatedApplication.ownerId}`);
						}
					}
				}
			}
		}

		return NextResponse.json(updatedApplication);
	} catch (err: any) {
		console.error('[API] Failed to update application:', err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
