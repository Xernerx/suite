import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true },
		authorId: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		productId: { type: String, required: true }, // Open string for autocomplete (e.g. 'bot', 'dashboard')
		upvotes: { type: [String], default: [] }, // Array of user IDs who upvoted
		downvotes: { type: [String], default: [] }, // Array of user IDs who downvoted
		status: { type: String, enum: ['pending', 'accepted', 'declined', 'implemented'], default: 'pending' },
	},
	{ timestamps: true }
);

export default schema;
