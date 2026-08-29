/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { syncSisterServers } from '../sync';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = (await database('xernerx')).models.core as any;
		const SettingModel = db.Setting;

		const setting = await SettingModel.findOne({ id }).lean();

		if (!setting) {
			return NextResponse.json({ id, name: id.replace(/_/g, ' '), value: null }, { status: 200 });
		}

		return NextResponse.json(setting, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch setting:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = (await database('xernerx')).models.core as any;
		const SettingModel = db.Setting;

		const updateData = { ...body, id };
		// Make sure it has a name
		if (!updateData.name) {
			updateData.name = id.replace(/_/g, ' ');
		}

		let oldSisterServers: string[] = [];
		if (id === 'sister_servers') {
			const oldSetting = await SettingModel.findOne({ id }).lean();
			try {
				const parsed = JSON.parse(oldSetting?.value || '[]');
				oldSisterServers = parsed.map((s: any) => s.id);
			} catch {}
		}

		const updatedSetting = await SettingModel.findOneAndUpdate({ id }, { $set: updateData }, { returnDocument: 'after', upsert: true }).lean();

		if (id === 'sister_servers') {
			let newSisterServers: string[] = [];
			try {
				const parsed = JSON.parse(updatedSetting.value || '[]');
				newSisterServers = parsed.map((s: any) => s.id);
			} catch {}

			const addedServers = newSisterServers.filter((sId) => !oldSisterServers.includes(sId));
			console.log('[Sync] sister_servers PATCH detected');
			console.log('[Sync] Old:', oldSisterServers);
			console.log('[Sync] New:', newSisterServers);
			console.log('[Sync] Added:', addedServers);

			if (addedServers.length > 0) {
				console.log('[Sync] Firing background job for added servers...');
				// Fire and forget background task
				setTimeout(async () => {
					syncSisterServers(addedServers, await database('xernerx')).catch((err) => {
						console.error('Background sync failed:', err);
					});
				}, 0);
			}
		}

		return NextResponse.json(updatedSetting, { status: 200 });
	} catch (error) {
		console.error('Failed to update setting:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
