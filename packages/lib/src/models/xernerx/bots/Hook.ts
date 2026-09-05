/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		botId: { type: String, required: true },
		url: { type: String, required: true },
		events: { type: [String], default: [] },
	},
	{ timestamps: true }
);

export default schema;
