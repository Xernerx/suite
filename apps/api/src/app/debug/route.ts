import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const { models } = await database('xernerx');
		const Setting = models.core.Setting as any;

		await Setting.updateOne({ id: 'translator_app_config' }, { $set: { value: 'd869e93e-fee9-417d-b89e-7bfd4202d198', valueType: 'string' } }, { upsert: true });

		return NextResponse.json({ success: true, message: 'Updated translator config ID' });
	} catch (e: any) {
		return NextResponse.json({ success: false, error: e.message, stack: e.stack });
	}
}
