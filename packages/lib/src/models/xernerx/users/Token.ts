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
	},
	{ timestamps: true }
);

export default schema;
