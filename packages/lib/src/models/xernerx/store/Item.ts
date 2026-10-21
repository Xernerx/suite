/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		description: { type: String, default: '' },
		categoryId: { type: String, required: true, index: true },
		skuId: { type: String, default: '', index: true },
		itemType: {
			type: String,
			enum: ['subscription', 'credit_pack', 'credit_perk'],
			default: 'subscription',
		},
		creditCost: { type: Number, default: 0, min: 0 },
		creditAmount: { type: Number, default: 0, min: 0 },
		perkType: {
			type: String,
			enum: ['none', 'cdn_slots', 'showcase_slots', 'trial_pass', 'vanity_badge'],
			default: 'none',
		},
		perkValue: { type: Schema.Types.Mixed, default: null },
		durationDays: { type: Number, default: 0, min: 0 },
		features: { type: [String], default: [] },
		badge: { type: String, default: null },
		discountPercent: { type: Number, default: 0, min: 0, max: 100 },
		isFeatured: { type: Boolean, default: false },
		enabled: { type: Boolean, default: true },
		order: { type: Number, default: 0 },
		metadata: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);

export default schema;
