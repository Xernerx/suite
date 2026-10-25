/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		guild: { type: String, required: true },
		name: { type: String, default: null },
		role: { type: String, default: null },
		type: { type: String, enum: ['support', 'status'], default: 'support' },
	},
	{ timestamps: true }
);

export default schema;
