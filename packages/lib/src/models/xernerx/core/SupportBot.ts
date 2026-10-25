/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true },
		guild: { type: String, required: true },
		name: { type: String, default: null },
		avatar: { type: String, default: null },
		owners: { type: [String], default: [] },
	},
	{ timestamps: true }
);

schema.index({ id: 1, guild: 1 }, { unique: true });

export default schema;
