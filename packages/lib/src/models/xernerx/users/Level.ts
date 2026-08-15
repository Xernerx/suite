/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		ownerId: { type: String, required: true, unique: true }, // user id
		xp: { type: Number, default: 0 },
		level: { type: Number, default: 1 },
	},
	{ timestamps: true }
);
export default schema;
