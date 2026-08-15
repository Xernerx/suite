/** @format */
import { Schema } from 'mongoose';
const schema = new Schema(
	{
		ownerId: { type: String, required: true }, // user id
		stripeSubscriptionId: { type: String, required: true },
		priceId: { type: String, required: true },
		status: { type: String, required: true },
		currentPeriodEnd: { type: Date, required: true },
	},
	{ timestamps: true }
);
schema.index({ ownerId: 1 });
export default schema;
