/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		url: { type: String, required: true },
		filename: { type: String, required: true },
		mimeType: { type: String, required: true },
		size: { type: Number, required: true },
		uploaderId: { type: String, required: true },
		privacy: { type: String, enum: ['public', 'limited', 'private'], default: 'private' },
		shared: [{ type: String }],
		folder: { type: String, default: 'Uncategorized' },
		tags: { type: [String], default: [] },
	},
	{ timestamps: true }
);

export default schema;
