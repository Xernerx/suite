import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
	try {
		const invitesData = await (await database('xernerx')).models.core.AppInvite.find().sort({ createdAt: -1 });

		const invites = await Promise.all(
			invitesData.map(async (invite: any) => {
				let bot = null;
				if (process.env.DISCORD_CLIENT_TOKEN) {
					try {
						const res = await fetch(`https://discord.com/api/v10/users/${invite.clientId}`, {
							headers: { Authorization: `Bot ${process.env.DISCORD_CLIENT_TOKEN}` },
						});
						if (res.ok) {
							const data = await res.json();
							bot = {
								...data,
								avatarUrl: data.avatar ? `https://cdn.discordapp.com/avatars/${invite.clientId}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
							};
						}
					} catch (e) {}
				}

				return {
					...invite.toObject(),
					botName: bot?.global_name || bot?.username || invite.name,
					botAvatar: bot?.avatarUrl || null,
				};
			})
		);

		return NextResponse.json(invites);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const invite = await (await database('xernerx')).models.core.AppInvite.create(body);
		return NextResponse.json(invite);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
