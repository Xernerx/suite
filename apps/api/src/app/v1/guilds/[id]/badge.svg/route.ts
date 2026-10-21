/** @format */

import { NextRequest } from 'next/server';
import { database } from '@xernerx/lib/server';
import { formatCompactNumber, renderBadgeSvg } from '@/lib/widgetRenderer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const type = (req.nextUrl.searchParams.get('type') || 'votes').toLowerCase();
	const theme = req.nextUrl.searchParams.get('theme') === 'light' ? 'light' : 'dark';
	const style = (req.nextUrl.searchParams.get('style') || 'rounded') as 'rounded' | 'pill' | 'flat';

	let label = 'Xernerx Votes';
	let value = '0';
	let color = '#6366f1';

	try {
		const db = await database('xernerx');
		const GuildModel = (db.models.guilds as any).Guild;
		const StatModel = (db.models.guilds as any).Stat;
		const VoteModel = (db.models.guilds as any).Vote;

		const [guild, latestStat, voteCount] = await Promise.all([
			GuildModel.findOne({ id }).lean() as Promise<any>,
			StatModel.findOne({ id }).sort({ timestamp: -1 }).lean() as Promise<any>,
			VoteModel.countDocuments({ guildId: id }) as Promise<number>,
		]);

		if (!guild || guild.privacy === 'private') {
			label = 'Xernerx';
			value = 'Private';
			color = '#71717a';
		} else {
			if (type === 'members' || type === 'users') {
				label = 'Xernerx Members';
				value = formatCompactNumber(latestStat?.members ?? guild.memberCount ?? 0);
			} else if (type === 'messages') {
				label = 'Xernerx Messages';
				value = formatCompactNumber(latestStat?.messages ?? guild.messages ?? 0);
			} else if (type === 'status' || type === 'verified') {
				label = 'Xernerx';
				value = guild?.verified ? 'Verified Server' : 'Listed Server';
				color = guild?.verified ? '#10b981' : '#6366f1';
			} else {
				label = 'Xernerx Votes';
				value = formatCompactNumber(voteCount ?? guild?.voteCount ?? 0);
			}
		}
	} catch {
		value = 'N/A';
	}

	return renderBadgeSvg(label, value, { color, theme, style });
}
