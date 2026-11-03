/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		name: { type: String, required: true },
		owners: { type: [String] },
		status: { type: String, required: true, default: 'active', enum: ['active', 'inactive', 'suspended', 'pending'] },
		permissions: {
			secure: Boolean, // can fetch data from /secure
			websocket: Boolean, // can connect to the websocket gateway directly
		},
		botId: { type: String },
		lastUsedAt: { type: Date, default: null },
		requestCount: { type: Number, default: 0 },
		expiresAt: { type: Date, default: null }, // Optional TTL expiration date (null = long-lived / never expires)
		allowedIps: { type: [String], default: [] }, // Optional IP allowlist (empty = allow from any IP)
	},
	{ timestamps: true }
);

export default schema;
