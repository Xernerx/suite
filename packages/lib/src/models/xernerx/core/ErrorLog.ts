/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		service: { type: String, required: true, index: true },
		environment: {
			type: String,
			enum: ['production', 'canary', 'development'],
			default: 'production',
			index: true,
		},
		level: {
			type: String,
			enum: ['error', 'warn', 'fatal'],
			default: 'error',
			index: true,
		},
		message: { type: String, required: true },
		stack: { type: String, default: null },
		filepath: { type: String, default: null },
		meta: { type: Schema.Types.Mixed, default: {} },
		fingerprint: { type: String, required: true, index: true },
		occurrences: { type: Number, default: 1 },
		resolved: { type: Boolean, default: false, index: true },
		resolvedAt: { type: Date, default: null },
		resolvedBy: { type: String, default: null },
		firstSeenAt: { type: Date, default: Date.now },
		lastSeenAt: { type: Date, default: Date.now, index: { expires: '30d' } },
	},
	{ timestamps: true }
);

export default schema;
