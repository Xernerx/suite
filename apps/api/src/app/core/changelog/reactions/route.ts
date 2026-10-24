/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

const ALLOWED_EMOJIS = ['🔥', '🚀', '❤️', '🎉'] as const;
const SETTING_ID = 'changelog_reactions';

type ReactionMap = Record<string, Record<string, number>>;

async function loadReactions(SettingModel: any): Promise<ReactionMap> {
	const doc = await SettingModel.findOne({ id: SETTING_ID })
		.lean()
		.catch(() => null);
	if (!doc?.value) return {};
	try {
		const parsed = JSON.parse(doc.value);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

export async function GET() {
	try {
		const { models } = await database('xernerx');
		const SettingModel = (models.core as any).Setting;
		const reactions = await loadReactions(SettingModel);
		return NextResponse.json({ reactions });
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const versionKey = String(body.versionKey || '').trim();
		const emoji = String(body.emoji || '').trim();

		if (!versionKey || !ALLOWED_EMOJIS.includes(emoji as any)) {
			return NextResponse.json({ error: 'Invalid versionKey or emoji' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const SettingModel = (models.core as any).Setting;
		const reactions = await loadReactions(SettingModel);

		if (!reactions[versionKey]) {
			reactions[versionKey] = {};
		}
		reactions[versionKey][emoji] = (Number(reactions[versionKey][emoji]) || 0) + 1;

		await SettingModel.findOneAndUpdate({ id: SETTING_ID }, { $set: { id: SETTING_ID, value: JSON.stringify(reactions) } }, { upsert: true });

		return NextResponse.json({
			success: true,
			versionKey,
			counts: reactions[versionKey],
			reactions,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
}
