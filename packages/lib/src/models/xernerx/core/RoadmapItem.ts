import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		productId: { type: String, required: true }, // Open string for autocomplete
		status: { type: String, enum: ['idea', 'planned', 'active', 'released'], default: 'idea' },
		targetQuarter: { type: String, default: null }, // e.g., 'Q4 2026'
		suggestionId: { type: String, default: null }, // Links back to a Suggestion if it came from one
		changelogUrl: { type: String, default: null }, // Links to the changelog once released
	},
	{ timestamps: true }
);

export default schema;
