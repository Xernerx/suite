/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		ownerId: { type: String, required: true, unique: true }, // user id
		balance: { type: Number, default: 0, min: 0 },
		streak: { type: Number, default: 0, min: 0 },
		giftIn: { type: Date, default: Date.now },
		totalSpent: { type: Number, default: 0, min: 0 },
		extraCdnSlots: { type: Number, default: 0, min: 0 },
		extraShowcaseSlots: { type: Number, default: 0, min: 0 },
		extraVanitySlots: { type: Number, default: 0, min: 0 },
		extraBotSlots: { type: Number, default: 0, min: 0 },
		streakShields: { type: Number, default: 0, min: 0, max: 3 },
		referredBy: { type: String, default: null },
		referralBonusClaimed: { type: Boolean, default: false },
		claimedAchievements: { type: [String], default: [] },
		unlockedBadges: { type: [String], default: [] },
		activeBadges: { type: [String], default: [] },
		dotMatrixVariant: {
			type: String,
			enum: ['full', 'icon', 'orbit', 'vortex', 'helix', 'prism', 'infinity', 'wavegrid'],
			default: 'orbit',
		},
		transactions: {
			type: [
				{
					id: { type: String },
					type: {
						type: String,
						enum: ['earn', 'spend', 'topup', 'tip_in', 'tip_out', 'tip_sent', 'tip_received', 'bounty', 'achievement', 'referral', 'admin_adjust', 'org_treasury'],
						default: 'spend',
					},
					amount: { type: Number, default: 0 },
					multiplierPercent: { type: Number, default: 100 },
					itemId: { type: String, default: null },
					itemName: { type: String, default: null },
					createdAt: { type: Date, default: Date.now },
				},
			],
			default: [],
		},
	},
	{ timestamps: true }
);

export default schema;
