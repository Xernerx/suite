/** @format */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@xernerx/lib';
import { enterGiveaway, leaveGiveaway } from '@xernerx/lib/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const session = (await getServerSession(auth).catch(() => null)) as any;
		const userId = session?.user?.id ? String(session.user.id) : null;

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized: Please sign in with your Xernerx account to enter giveaways.' }, { status: 401 });
		}

		const { id } = await params;
		const result = await enterGiveaway(id, userId, 'web', {
			username: session?.user?.name || '',
			avatar: session?.user?.image || '',
		});

		if (!result.ok) {
			return NextResponse.json(
				{
					ok: false,
					eligible: result.eligible ?? false,
					reasons: result.reasons || [],
					eligibility: result.eligibility || null,
					error: result.error || 'Unable to enter giveaway.',
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(result);
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const session = (await getServerSession(auth).catch(() => null)) as any;
		const userId = session?.user?.id ? String(session.user.id) : null;

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const result = await leaveGiveaway(id, userId);

		if (!result.ok) {
			return NextResponse.json({ error: result.error || 'Failed to leave giveaway' }, { status: 400 });
		}

		return NextResponse.json(result);
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
