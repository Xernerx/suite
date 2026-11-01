/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@xernerx/lib';
import { database } from '@xernerx/lib/server';
import { getServerSession } from 'next-auth';
import { ensureStoreSeed } from '@/lib/storeSeed';

const MILESTONE_BADGES: Array<{ threshold: number; badgeId: string }> = [
	{ threshold: 2500, badgeId: 'credit_patron' },
	{ threshold: 10000, badgeId: 'high_roller' },
	{ threshold: 25000, badgeId: 'vault_sovereign' },
];

export async function POST(req: Request) {
	try {
		const session = await getServerSession(auth);
		const userId = (session?.user as any)?.id;

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized: Please sign in to redeem credits.' }, { status: 401 });
		}

		const body = await req.json().catch(() => ({}));
		const { itemId } = body;

		if (!itemId) {
			return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
		}

		await ensureStoreSeed();

		const { models } = await database('xernerx');
		const Item = models.store.Item as any;
		const Credit = (models.users as any).Credit;
		const Subscription = (models.users as any).Subscription;
		const User = models.users.User as any;

		const item = await Item.findOne({ id: itemId, enabled: true }).lean();
		if (!item || item.itemType !== 'credit_perk') {
			return NextResponse.json({ error: 'Credit perk not found or unavailable' }, { status: 404 });
		}

		const baseCost = Math.max(0, Number(item.creditCost) || 0);
		const discountPercent = Math.max(0, Math.min(100, Number(item.discountPercent) || 0));
		const effectiveCost = discountPercent > 0 ? Math.round(baseCost * (1 - discountPercent / 100)) : baseCost;

		let creditDoc = await Credit.findOne({ ownerId: userId });
		if (!creditDoc) {
			creditDoc = await Credit.create({ ownerId: userId, balance: 0, streak: 0 });
		}

		const ONE_TIME_UNLOCK_PERK_TYPES = new Set(['vanity_badge', 'stage_style', 'icon_pack', 'window_style', 'ambient_scene', 'surface_style', 'profile_cosmetic', 'cursor_fx', 'overlay_skin']);

		const BUNDLE_CHILD_UNLOCKS: Record<string, string[]> = {
			ambient_scenes_pack: ['ambient_mesh_lava', 'ambient_cyber_grid', 'ambient_topography', 'ambient_nebula_cosmos', 'ambient_prism_caustics'],
			surface_styles_pack: ['surface_crystal', 'surface_holographic', 'surface_neon', 'surface_obsidian'],
			profile_frames_pack: ['frame_plasma_ring', 'frame_holo_crown', 'frame_cyber_hex', 'frame_solar_flare'],
			profile_nameplates_pack: ['nameplate_aurora_wave', 'nameplate_synth_horizon', 'nameplate_nebula_shimmer', 'nameplate_cyber_circuit'],
			cursor_fx_bundle: ['cursor_starlight_trail', 'cursor_plasma_sparks', 'cursor_cyber_reticle', 'cursor_sonic_rings', 'cursor_aurora_ribbon'],
			overlay_skins_bundle: ['skin_hud_tactical', 'skin_frosted_prism', 'skin_neon_arcade', 'skin_minimal_pill'],
		};
		const CHILD_TO_BUNDLE: Record<string, string> = {};
		for (const [bundleId, children] of Object.entries(BUNDLE_CHILD_UNLOCKS)) {
			for (const childId of children) {
				CHILD_TO_BUNDLE[childId] = bundleId;
			}
		}

		if (ONE_TIME_UNLOCK_PERK_TYPES.has(item.perkType)) {
			const badgeId = String(item.perkValue || item.id);
			const parentBundle = CHILD_TO_BUNDLE[badgeId];
			const ownedList = Array.isArray(creditDoc.unlockedBadges) ? creditDoc.unlockedBadges : [];
			if (ownedList.includes(badgeId) || (parentBundle && ownedList.includes(parentBundle))) {
				return NextResponse.json({ error: 'You already own this cosmetic unlock.' }, { status: 409 });
			}
		} else if (item.perkType === 'streak_shield') {
			if ((creditDoc.streakShields || 0) >= 3) {
				return NextResponse.json({ error: 'You already have the maximum of 3 active Streak Shields.' }, { status: 409 });
			}
		}

		if ((creditDoc.balance || 0) < effectiveCost) {
			return NextResponse.json(
				{
					error: `Insufficient credits. Need ${effectiveCost.toLocaleString()} credits, but you have ${(creditDoc.balance || 0).toLocaleString()}.`,
				},
				{ status: 400 }
			);
		}

		const newTotalSpent = (creditDoc.totalSpent || 0) + effectiveCost;
		const updateInc: Record<string, number> = {
			balance: -effectiveCost,
			totalSpent: effectiveCost,
		};
		const badgesToUnlock = new Set<string>(creditDoc.unlockedBadges || []);
		const badgesToActivate = new Set<string>(creditDoc.activeBadges || []);

		// Auto-unlock lifetime spender milestone badges
		for (const m of MILESTONE_BADGES) {
			if (newTotalSpent >= m.threshold && !badgesToUnlock.has(m.badgeId)) {
				badgesToUnlock.add(m.badgeId);
				badgesToActivate.add(m.badgeId);
			}
		}

		if (item.perkType === 'cdn_slots') {
			const slots = Math.max(1, Number(item.perkValue) || 1);
			updateInc.extraCdnSlots = slots;
		} else if (item.perkType === 'showcase_slots') {
			const slots = Math.max(1, Number(item.perkValue) || 1);
			updateInc.extraShowcaseSlots = slots;
		} else if (item.perkType === 'vanity_url') {
			const slots = Math.max(1, Number(item.perkValue) || 1);
			updateInc.extraVanitySlots = slots;
		} else if (item.perkType === 'bot_slots') {
			const slots = Math.max(1, Number(item.perkValue) || 1);
			updateInc.extraBotSlots = slots;
		} else if (ONE_TIME_UNLOCK_PERK_TYPES.has(item.perkType)) {
			const badgeId = String(item.perkValue || item.id);
			badgesToUnlock.add(badgeId);
			if (BUNDLE_CHILD_UNLOCKS[badgeId]) {
				for (const childId of BUNDLE_CHILD_UNLOCKS[badgeId]) {
					badgesToUnlock.add(childId);
				}
			}
			const parentBundle = CHILD_TO_BUNDLE[badgeId];
			if (parentBundle && BUNDLE_CHILD_UNLOCKS[parentBundle]?.every((c) => badgesToUnlock.has(c))) {
				badgesToUnlock.add(parentBundle);
			}
			if (item.perkType === 'vanity_badge') {
				badgesToActivate.add(badgeId);
			}
		} else if (item.perkType === 'streak_shield') {
			const currentShields = creditDoc.streakShields || 0;
			const toAdd = Math.min(3 - currentShields, Math.max(1, Number(item.perkValue) || 1));
			updateInc.streakShields = toAdd;
		} else if (item.perkType === 'trial_pass') {
			const targetItemId = String(item.perkValue || 'ultra');
			const durationDays = Math.max(1, Number(item.durationDays) || 3);
			const durationMs = durationDays * 24 * 60 * 60 * 1000;
			const targetItem = await Item.findOne({ id: targetItemId }).lean();
			const priceIdentifier = targetItem?.skuId || `credit_trial_${targetItemId}`;

			// Check if user already has an active trial for this target to extend it
			const existingSub = await Subscription.findOne({
				ownerId: userId,
				priceId: priceIdentifier,
				status: { $in: ['active', 'trialing'] },
			});

			const baseTime =
				existingSub && existingSub.currentPeriodEnd && new Date(existingSub.currentPeriodEnd).getTime() > Date.now() ? new Date(existingSub.currentPeriodEnd).getTime() : Date.now();
			const nextEnd = new Date(baseTime + durationMs);
			const subId = existingSub?.stripeSubscriptionId || `credit_trial_${targetItemId}_${crypto.randomBytes(4).toString('hex')}`;

			if (existingSub) {
				existingSub.currentPeriodEnd = nextEnd;
				await existingSub.save();
			} else {
				await Subscription.create({
					ownerId: userId,
					stripeSubscriptionId: subId,
					priceId: priceIdentifier,
					status: 'trialing',
					currentPeriodEnd: nextEnd,
				});
			}

			// Mirror onto User.billing.subscriptions if present
			await User.findOneAndUpdate(
				{ id: userId },
				{
					$push: {
						'billing.subscriptions': {
							stripeSubscriptionId: subId,
							priceId: priceIdentifier,
							status: 'trialing',
							currentPeriodEnd: nextEnd,
						},
					},
				}
			).catch(() => null);
		}

		const updatedCredits = await Credit.findOneAndUpdate(
			{ ownerId: userId, balance: { $gte: effectiveCost } },
			{
				$inc: updateInc,
				$set: {
					unlockedBadges: Array.from(badgesToUnlock),
					activeBadges: Array.from(badgesToActivate),
				},
				$push: {
					transactions: {
						id: crypto.randomUUID(),
						type: 'spend',
						amount: -effectiveCost,
						itemId: item.id,
						itemName: item.name,
						createdAt: new Date(),
					},
				},
			},
			{ returnDocument: 'after' }
		).lean();

		if (!updatedCredits) {
			return NextResponse.json({ error: 'Transaction failed due to insufficient balance.' }, { status: 400 });
		}

		return NextResponse.json({
			success: true,
			item,
			cost: effectiveCost,
			credits: updatedCredits,
		});
	} catch (err: any) {
		console.error('Credit redemption error:', err);
		return NextResponse.json({ error: err.message || 'Failed to redeem credits' }, { status: 500 });
	}
}
