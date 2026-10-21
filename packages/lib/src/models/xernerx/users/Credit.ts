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
		unlockedBadges: { type: [String], default: [] },
		activeBadges: { type: [String], default: [] },
		transactions: {
			type: [
				{
					id: { type: String },
					type: { type: String, enum: ['earn', 'spend', 'topup'], default: 'spend' },
					amount: { type: Number, default: 0 },
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
