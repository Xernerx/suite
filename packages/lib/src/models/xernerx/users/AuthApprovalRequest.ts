/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true, index: true },
		userId: { type: String, required: true, index: true },
		status: {
			type: String,
			enum: ['pending', 'approved', 'denied', 'expired'],
			default: 'pending',
			index: true,
		},
		correctNumber: { type: String, required: true },
		numberChoices: { type: [String], required: true },
		deviceInfo: { type: String, default: 'Web Browser' },
		ipAddress: { type: String, default: null },
		location: { type: String, default: null },
		userAgent: { type: String, default: '' },
		approvedBySessionId: { type: String, default: null },
		handoffTicket: { type: String, default: null },
		attempts: { type: Number, default: 0 },
		expiresAt: { type: Date, required: true, index: true },
	},
	{ timestamps: true }
);

schema.index({ userId: 1, status: 1, expiresAt: 1 });

export default schema;
