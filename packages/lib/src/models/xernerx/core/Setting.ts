/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Identifier for the setting key, e.g. 'maintenance_mode'
		value: { type: String, required: true }, // The stringified value of the setting
		valueType: { type: String, enum: ['boolean', 'string', 'number', 'json'], default: 'string' }, // The primitive type for parsing
		description: { type: String }, // Optional description of what the setting does
	},
	{ timestamps: true }
);

export default schema;
