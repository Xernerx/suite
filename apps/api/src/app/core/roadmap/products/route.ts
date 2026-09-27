import { database } from '@xernerx/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	try {
		const { models } = await database('xernerx');
		const setting = await models.core.Setting.findOne({ id: 'roadmap_products' }).lean();

		let products = ['Dashboard', 'API', 'CDN', 'Bots']; // defaults
		if (setting && setting.value) {
			try {
				products = JSON.parse(setting.value);
			} catch (e) {}
		}

		return NextResponse.json({ data: products });
	} catch (err) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
