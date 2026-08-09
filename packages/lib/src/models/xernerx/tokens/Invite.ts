/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		name: { type: String, required: true },
		shortName: { type: String },
		botId: { type: String },
		permissions: { type: String, required: true },
	},
	{ timestamps: true }
);

export default schema;
