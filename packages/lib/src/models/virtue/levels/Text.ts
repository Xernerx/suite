/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true }, // User ID
		guild: { type: String, required: true }, // Guild ID
		level: { type: Number, default: 0 },
		xp: { type: Number, default: 0 },
		messages: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

schema.index(
	{
		id: 1,
		guild: 1,
	},
	{
		unique: true,
	}
);

export default schema;
