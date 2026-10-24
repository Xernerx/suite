/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { models } = await database('xernerx');
		const Credit = (models.users as any).Credit;

		const creditDoc = await Credit.findOne({ ownerId: id }).lean();
		if (!creditDoc) {
			return NextResponse.json({
				ownerId: id,
				balance: 0,
				streak: 0,
				streakShields: 0,
				totalSpent: 0,
				transactions: [],
			});
		}

		const rawTx = Array.isArray(creditDoc.transactions) ? creditDoc.transactions : [];
		const sortedTx = [...rawTx].sort((a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()).slice(0, 50);

		return NextResponse.json({
			ownerId: id,
			balance: creditDoc.balance || 0,
			streak: creditDoc.streak || 0,
			streakShields: creditDoc.streakShields || 0,
			totalSpent: creditDoc.totalSpent || 0,
			transactions: sortedTx,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
	}
}
