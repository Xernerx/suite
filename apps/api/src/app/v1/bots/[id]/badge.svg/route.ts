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
		const BotModel = (db.models.bots as any).Bot;
		const StatModel = (db.models.bots as any).Stat;
		const VoteModel = (db.models.bots as any).Vote;

		const [bot, latestStat, voteCount] = await Promise.all([
			BotModel.findOne({ id }).lean() as Promise<any>,
			StatModel.findOne({ id }).sort({ timestamp: -1 }).lean() as Promise<any>,
			VoteModel.countDocuments({ botId: id }) as Promise<number>,
		]);

		if (!bot || bot.privacy === 'private') {
			label = 'Xernerx';
			value = 'Private';
			color = '#71717a';
		} else {
			const stat = latestStat || bot?.stats || {};

			if (type === 'servers' || type === 'guilds') {
				label = 'Xernerx Servers';
				value = formatCompactNumber(stat.guildCount ?? 0);
			} else if (type === 'users') {
				label = 'Xernerx Users';
				value = formatCompactNumber(stat.userCount ?? 0);
			} else if (type === 'status' || type === 'verified') {
				label = 'Xernerx';
				value = bot?.verified ? 'Verified Bot' : 'Listed Bot';
				color = bot?.verified ? '#10b981' : '#6366f1';
			} else {
				label = 'Xernerx Votes';
				value = formatCompactNumber(voteCount ?? bot?.voteCount ?? 0);
			}
		}
	} catch {
		value = 'N/A';
	}

	return renderBadgeSvg(label, value, { color, theme, style });
}
