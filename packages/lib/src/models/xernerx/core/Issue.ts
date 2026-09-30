import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		productId: { type: String, required: true }, // Open string for autocomplete
		status: { type: String, enum: ['open', 'resolved'], default: 'open' },
		resolvedAt: { type: Date, default: null }, // Used to calculate Time-to-Resolution
		acknowledged: { type: Boolean, default: false }, // If false, it stays in the admin review queue and does not appear on the roadmap Known Issues tracker
	},
	{ timestamps: true } // Provides createdAt automatically
);

export default schema;
