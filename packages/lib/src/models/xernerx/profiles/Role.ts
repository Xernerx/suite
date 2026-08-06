/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Role ID (Discord Role ID)
		name: { type: String }, // Role name
		permissions: {
			type: Schema.Types.Mixed,
			default: {},
		},
		role: { type: String }, // Optional link to a Xernerx role
		sync: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

export default schema;
