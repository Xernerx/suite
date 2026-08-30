/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET() {
	try {
		const db = await database('xernerx');
		const BotModel = (db.models.bots as any).Bot;

		const tags = await BotModel.distinct('profile.tags');

		const validTags = tags.filter((tag: any) => typeof tag === 'string' && tag.trim() !== '').sort((a: string, b: string) => a.localeCompare(b));

		return NextResponse.json(validTags, { status: 200 });
	} catch (error) {
		console.error('Failed to fetch bot tags:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
