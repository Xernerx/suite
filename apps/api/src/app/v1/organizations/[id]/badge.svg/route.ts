/** @format */

import { NextRequest } from 'next/server';
import { database } from '@xernerx/lib/server';
import { formatCompactNumber, renderBadgeSvg } from '@/lib/widgetRenderer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const type = (req.nextUrl.searchParams.get('type') || 'members').toLowerCase();
	const theme = req.nextUrl.searchParams.get('theme') === 'light' ? 'light' : 'dark';
	const style = (req.nextUrl.searchParams.get('style') || 'rounded') as 'rounded' | 'pill' | 'flat';

	let label = 'Xernerx Members';
	let value = '0';
	let color = '#6366f1';

	try {
		const db = await database('xernerx');
		const OrganizationModel = (db.models.organizations as any).Organization;
		const BotModel = (db.models.bots as any).Bot;
		const GuildModel = (db.models.guilds as any).Guild;

		const organization = (await OrganizationModel.findOne({ _id: id }).lean()) as any;
		const privacy = organization?.config?.privacy || organization?.privacy;

		if (!organization || privacy === 'private') {
			label = 'Xernerx';
			value = 'Private';
			color = '#71717a';
		} else {
			if (type === 'bots') {
				const botCount = await BotModel.countDocuments({ organization: id, privacy: { $ne: 'private' } });
				label = 'Xernerx Bots';
				value = formatCompactNumber(botCount);
			} else if (type === 'servers' || type === 'guilds') {
				const serverCount = await GuildModel.countDocuments({ organization: id, privacy: { $ne: 'private' } });
				label = 'Xernerx Servers';
				value = formatCompactNumber(serverCount);
			} else if (type === 'status' || type === 'verified') {
				label = 'Xernerx';
				value = organization?.verified ? 'Verified Org' : 'Listed Org';
				color = organization?.verified ? '#10b981' : '#6366f1';
			} else {
				const memberCount = new Set([organization.owner, ...(organization.members || [])].filter(Boolean)).size;
				label = 'Xernerx Members';
				value = formatCompactNumber(memberCount);
			}
		}
	} catch {
		value = 'N/A';
	}

	return renderBadgeSvg(label, value, { color, theme, style });
}
