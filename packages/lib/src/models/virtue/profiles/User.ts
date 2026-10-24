/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // User ID
		language: { type: String, default: 'en-GB' },
		locale: { type: String, default: 'en-GB' },
		preferences: {
			locale: { type: String, default: 'en-GB' },
			language: { type: String, default: 'en-GB' },
		},
	},
	{ timestamps: true, strict: false }
);

export default schema;
