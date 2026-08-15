/** @format */
import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		name: { type: String, required: true },
		role: { type: String },
		sync: { type: Boolean, default: false },
		position: { type: Number, default: 0 },
		mappings: { type: Schema.Types.Mixed, default: {} }, // Guild ID -> Discord Role ID
		permissions: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);

export default schema;
