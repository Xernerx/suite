/** @format */

import { NextRequest } from 'next/server';
import { database } from '@xernerx/lib/server';
import { formatCompactNumber, renderBadgeSvg } from '@/lib/widgetRenderer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const type = (req.nextUrl.searchParams.get('type') || 'streak').toLowerCase();
	const theme = req.nextUrl.searchParams.get('theme') === 'light' ? 'light' : 'dark';
	const style = (req.nextUrl.searchParams.get('style') || 'rounded') as 'rounded' | 'pill' | 'flat';

	let label = 'Xernerx Streak';
	let value = '0d';
	let color = '#6366f1';

	try {
		const db = await database('xernerx');
		const UserModel = (db.models.users as any).User;
		const CreditModel = (db.models.users as any).Credit;
		const BotModel = (db.models.bots as any).Bot;
		const OrganizationModel = (db.models.organizations as any).Organization;

		const user = (await UserModel.findOne({ id }).lean()) as any;

		if (user?.privacy === 'private') {
			label = 'Xernerx';
			value = 'Private';
			color = '#71717a';
		} else if (type === 'bots') {
			const botCount = await BotModel.countDocuments({ owners: id, privacy: 'public' });
			label = 'Xernerx Bots';
			value = formatCompactNumber(botCount);
		} else if (type === 'orgs' || type === 'organizations') {
			const orgCount = await OrganizationModel.countDocuments({
				$or: [{ owner: id }, { members: id }],
				$and: [{ $or: [{ 'config.privacy': 'public' }, { privacy: 'public' }] }],
			});
			label = 'Xernerx Orgs';
			value = formatCompactNumber(orgCount);
		} else if (type === 'status' || type === 'verified') {
			label = 'Xernerx';
			value = user?.verified ? 'Verified User' : 'Xernerx User';
			color = user?.verified ? '#10b981' : '#6366f1';
		} else {
			const creditDoc = (await CreditModel.findOne({ ownerId: id }).select('streak').lean()) as any;
			label = 'Xernerx Streak';
			value = `${creditDoc?.streak ?? 0}d`;
		}
	} catch {
		value = 'N/A';
	}

	return renderBadgeSvg(label, value, { color, theme, style });
}
