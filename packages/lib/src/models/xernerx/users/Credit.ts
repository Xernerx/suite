/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		ownerId: { type: String, required: true, unique: true }, // user id
		balance: { type: Number, default: 0, min: 0 },
		streak: { type: Number, default: 0, min: 0 },
		giftIn: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);
export default schema;
