/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true, index: true },
		userId: { type: String, required: true, index: true },
		title: { type: String, default: '' },
		content: { type: String, required: true },
		language: { type: String, default: 'plaintext' },
		privacy: {
			type: String,
			enum: ['public', 'limited', 'private'],
			default: 'limited',
			index: true,
		},
		views: { type: Number, default: 0 },
		size: { type: Number, default: 0 },
		expiresIn: {
			type: String,
			enum: ['1h', '24h', '7d', '30d', 'never'],
			default: '7d',
		},
		expiresAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

// MongoDB TTL index: automatically deletes documents once `expiresAt` is reached (ignored when `expiresAt` is null)
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ privacy: 1, createdAt: -1 });

export default schema;
