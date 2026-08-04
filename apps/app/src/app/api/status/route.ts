/** @format */

'use server';

import { NextResponse } from 'next/server';
import database from '@/lib/database';

export async function GET() {
	return NextResponse.json({ message: 'hi' });
}
