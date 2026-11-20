/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true, index: true },
		tokenHash: { type: String, unique: true, required: true, index: true },
		userId: { type: String, required: true, index: true },
		deviceId: { type: String, required: true },
		deviceName: { type: String, default: 'Xernerx Mobile' },
		platform: { type: String, enum: ['ios', 'android'], required: true },
		osVersion: { type: String, default: '' },
		appVersion: { type: String, default: '1.0.0' },
		pushToken: { type: String, default: null },
		biometricsEnabled: { type: Boolean, default: true },
		sessionVersion: { type: Number, default: 1 },
		encryptedOAuthPayload: { type: String, default: null },
		lastActiveAt: { type: Date, default: Date.now },
		revokedAt: { type: Date, default: null },
		expiresAt: { type: Date, required: true, index: true },
	},
	{ timestamps: true }
);

schema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export default schema;
