/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true }, // User ID
		guild: { type: String }, // Guild ID
		textLevel: { type: Number, default: 0 },
		textExperience: { type: Number, default: 0 },
		voiceLevel: { type: Number, default: 0 },
		voiceExperience: { type: Number, default: 0 },
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
