/** @format */

'use server';

import { NextResponse } from 'next/server';
import database from '@/lib/database';

export async function GET() {
	return NextResponse.json({ message: 'hi' });
}

// export async function POST() {
// 	const db = await database('status', 'status');

// 	console.log(db);

// 	return NextResponse.json({ message: 'hi' });
// }
