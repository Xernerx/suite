/** @format */

import { Schema } from 'mongoose';

const optionTierSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		permissions: { type: String, default: '0' },
	},
	{ _id: false }
);

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		clientId: { type: String, required: true },
		name: { type: String, required: true },
		permissions: { type: String, required: true },
		scopes: { type: Array, default: ['bot', 'applications.commands'] },
		redirect: { type: Boolean, default: false },
		options: {
			essential: {
				enabled: { type: Boolean, default: true },
				permissions: { type: String, default: '0' },
			},
			optional: { type: optionTierSchema, default: () => ({ enabled: false, permissions: '0' }) },
			advanced: { type: optionTierSchema, default: () => ({ enabled: false, permissions: '0' }) },
		},
	},
	{ timestamps: true }
);
export default schema;
