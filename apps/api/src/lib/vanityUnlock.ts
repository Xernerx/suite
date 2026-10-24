/** @format */

import crypto from 'crypto';

export const VANITY_SLUG_REGEX = /^[a-z0-9-]{2,32}$/;
export const VANITY_UNLOCK_COST = 2000;

const MILESTONE_BADGES: Array<{ threshold: number; badgeId: string }> = [
	{ threshold: 2500, badgeId: 'credit_patron' },
	{ threshold: 10000, badgeId: 'high_roller' },
	{ threshold: 25000, badgeId: 'vault_sovereign' },
];

export function normalizeVanitySlug(input: unknown): string {
	if (input === null || input === undefined) return '';
	return String(input)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export async function unlockVanityWithUserCredits(models: any, userId: string, entityLabel: string): Promise<{ ok: boolean; error?: string; usedSlot?: boolean; cost?: number; credits?: any }> {
	if (!userId) {
		return { ok: false, error: 'Unauthorized: Please sign in to unlock a Custom Vanity URL.' };
	}

	const Credit = (models.users as any).Credit;
	let creditDoc = await Credit.findOne({ ownerId: userId });
	if (!creditDoc) {
		creditDoc = await Credit.create({ ownerId: userId, balance: 0, streak: 0 });
	}

	// 1. Prefer consuming an already-redeemed Vanity URL Slot from the Credit Store
	if ((creditDoc.extraVanitySlots || 0) > 0) {
		const updatedCredits = await Credit.findOneAndUpdate(
			{ ownerId: userId, extraVanitySlots: { $gte: 1 } },
			{
				$inc: { extraVanitySlots: -1 },
				$push: {
					transactions: {
						id: crypto.randomUUID(),
						type: 'spend',
						amount: 0,
						itemId: 'perk-vanity-slot-redeem',
						itemName: `Vanity URL Slot Applied — ${entityLabel}`,
						createdAt: new Date(),
					},
				},
			},
			{ returnDocument: 'after' }
		).lean();

		if (updatedCredits) {
			return { ok: true, usedSlot: true, cost: 0, credits: updatedCredits };
		}
	}

	// 2. Otherwise deduct 2,000 Credits directly
	const balance = Number(creditDoc.balance) || 0;
	if (balance < VANITY_UNLOCK_COST) {
		return {
			ok: false,
			error: `Insufficient credits to unlock Custom Vanity URL. Need ${VANITY_UNLOCK_COST.toLocaleString()} credits (or 1 Vanity URL Slot), but you have ${balance.toLocaleString()} credits.`,
		};
	}

	const newTotalSpent = (creditDoc.totalSpent || 0) + VANITY_UNLOCK_COST;
	const badgesToUnlock = new Set<string>(creditDoc.unlockedBadges || []);
	const badgesToActivate = new Set<string>(creditDoc.activeBadges || []);

	for (const m of MILESTONE_BADGES) {
		if (newTotalSpent >= m.threshold && !badgesToUnlock.has(m.badgeId)) {
			badgesToUnlock.add(m.badgeId);
			badgesToActivate.add(m.badgeId);
		}
	}

	const updatedCredits = await Credit.findOneAndUpdate(
		{ ownerId: userId, balance: { $gte: VANITY_UNLOCK_COST } },
		{
			$inc: {
				balance: -VANITY_UNLOCK_COST,
				totalSpent: VANITY_UNLOCK_COST,
			},
			$set: {
				unlockedBadges: Array.from(badgesToUnlock),
				activeBadges: Array.from(badgesToActivate),
			},
			$push: {
				transactions: {
					id: crypto.randomUUID(),
					type: 'spend',
					amount: -VANITY_UNLOCK_COST,
					itemId: 'perk-vanity-1',
					itemName: `Custom Vanity URL Unlock — ${entityLabel}`,
					createdAt: new Date(),
				},
			},
		},
		{ returnDocument: 'after' }
	).lean();

	if (!updatedCredits) {
		return { ok: false, error: 'Transaction failed due to insufficient credit balance.' };
	}

	return { ok: true, usedSlot: false, cost: VANITY_UNLOCK_COST, credits: updatedCredits };
}
