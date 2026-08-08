/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');

		const { models } = await database('xernerx');
		const Notification = models.content.notifications;

		// If a userId is provided, filter by it. Otherwise, return all (useful for admin).
		const query = userId ? { userId } : {};

		// Fetch notifications, newest first, excluding the internal Mongoose _id
		const notifications = await Notification.find(query, '-_id').sort({ createdAt: -1 });

		return NextResponse.json(notifications);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Notification = models.content.notifications;

		const newNotification = await Notification.create({
			id: crypto.randomUUID(), // Generate standard UUID
			...body,
		});

		return NextResponse.json(newNotification, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
