/** @format */

import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Notification = models.content.notifications;

		const notification = await Notification.findOne({ id }, '-_id');

		if (!notification) {
			return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
		}

		return NextResponse.json(notification);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { models } = await database('xernerx');
		const Notification = models.content.notifications;

		// Find by custom 'id', apply updates (like marking as read), and return the new document
		const updatedNotification = await Notification.findOneAndUpdate({ id }, body, {
			after: true,
			select: '-_id',
		});

		if (!updatedNotification) {
			return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
		}

		return NextResponse.json(updatedNotification);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Notification = models.content.notifications;

		const deletedNotification = await Notification.findOneAndDelete({ id });

		if (!deletedNotification) {
			return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
