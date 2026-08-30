/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { syncSisterServers } from '../../sync';

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}));
		const targetGuildId = body.guildId;

		const db = (await database('xernerx')) as any;

		const sisterServersSetting = await db.models.core.Setting.findOne({ id: 'sister_servers' }).lean();
		let sisterServers: { id: string }[] = [];
		try {
			sisterServers = JSON.parse(sisterServersSetting?.value || '[]');
		} catch (e) {}

		let allGuildIds = sisterServers.map((s) => s.id).filter(Boolean);

		if (targetGuildId) {
			if (!allGuildIds.includes(targetGuildId)) {
				return NextResponse.json({ error: 'Provided guildId is not a configured sister server.' }, { status: 400 });
			}
			allGuildIds = [targetGuildId];
		}

		if (allGuildIds.length > 0) {
			// Fire and forget background task
			setTimeout(() => {
				syncSisterServers(allGuildIds, db).catch((err) => {
					console.error('Background force sync failed:', err);
				});
			}, 0);
		}

		return NextResponse.json({ success: true, message: `Force sync initiated for ${targetGuildId ? targetGuildId : 'all sister servers'}.` }, { status: 200 });
	} catch (error: any) {
		console.error('Failed to initiate force sync:', error);
		return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
	}
}
