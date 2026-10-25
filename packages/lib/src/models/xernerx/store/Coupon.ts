/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		code: { type: String, required: true, unique: true, uppercase: true, trim: true },
		name: { type: String, required: true },
		description: { type: String, default: '' },
		discountType: { type: String, enum: ['percent', 'amount'], default: 'percent' },
		percentOff: { type: Number, default: 0 },
		amountOff: { type: Number, default: 0 },
		currency: { type: String, default: 'usd', lowercase: true },
		duration: { type: String, enum: ['once', 'repeating', 'forever'], default: 'once' },
		durationInMonths: { type: Number, default: null },
		maxRedemptions: { type: Number, default: null },
		timesRedeemed: { type: Number, default: 0 },
		expiresAt: { type: Date, default: null },
		appliesToProducts: { type: [String], default: [] },
		stripeCouponId: { type: String, default: null },
		stripePromotionCodeId: { type: String, default: null },
		enabled: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

export default schema;
