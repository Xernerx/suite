/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		description: { type: String, default: '' },
		icon: { type: String, default: 'ShoppingBag' },
		order: { type: Number, default: 0 },
		enabled: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

export default schema;
