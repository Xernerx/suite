/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		name: { type: String, required: true },
		owners: { type: [String] },
		status: { type: String, required: true, default: 'active', enum: ['active', 'inactive', 'suspended', 'pending'] },
		permissions: {
			isXernerx: Boolean, // can fetch data from /secure
		},
		botId: { type: String },
	},
	{ timestamps: true }
);

export default schema;
